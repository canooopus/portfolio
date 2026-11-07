import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { optimizeImages } from "./optimize-images.mjs";
import {
  createR2Client,
  encodeKey,
  listRemoteKeys,
} from "./r2.mjs";
import { loadEnvLocal } from "./env.mjs";

const PUBLIC_DIR = "public";
const OPTIMIZED_DIR = path.join(PUBLIC_DIR, "images", "optimized");
const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
const OPTIMIZED_KEY_PREFIX = "images/optimized/";
const ORIGINALS_KEY_PREFIX = "originals/";
const CONCURRENCY = 4;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const PRUNE = args.has("--prune");
const WITH_ORIGINALS = args.has("--with-originals");
const SKIP_OPTIMIZE = args.has("--no-optimize");
const FORCE = args.has("--force");

if (args.has("--help") || args.has("-h")) {
  console.log(`使い方: npm run images:publish -- [options]

  --dry-run          R2 へ接続せず、アップロード対象を表示
  --prune            リモートに残っている不要な images/optimized/** を削除
                     （元画像がローカルに無いものは削除せず保護します）
  --with-originals   元画像も originals/** にバックアップ（Worker からは配信されない）
  --no-optimize      最適化をスキップしてアップロードだけ行う
  --force            既存ファイルでも強制的にアップロード

必要な環境変数（.env.local）:
  R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET
`);
  process.exit(0);
}

/**
 * .env.local を読み込む（Node スクリプトでは自動で読み込まれないため）
 */
loadEnvLocal();

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function toKey(fullPath, baseDir) {
  return path
    .relative(baseDir, fullPath)
    .split(path.sep)
    .join("/");
}

function contentTypeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

function md5(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

function normalizeEtag(etag) {
  if (!etag) return null;
  const value = etag.replace(/^W\//, "").replace(/^"|"$/g, "");
  return /^[a-f0-9]{32}$/i.test(value) ? value.toLowerCase() : null;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= items.length) return;
        results[index] = await fn(items[index], index);
      }
    }
  );

  await Promise.all(runners);
  return results;
}

async function objectUrl(r2, key) {
  return `${r2.endpoint}/${encodeKey(key)}`;
}

async function getRemoteEtag(r2, key) {
  const response = await r2.client.fetch(await objectUrl(r2, key), {
    method: "HEAD",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `HEAD ${key} に失敗しました: ${response.status} ${response.statusText}`
    );
  }
  return normalizeEtag(response.headers.get("etag"));
}

async function putObject(r2, key, body, contentType, cacheControl) {
  const response = await r2.client.fetch(await objectUrl(r2, key), {
    method: "PUT",
    body,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });

  if (!response.ok) {
    throw new Error(
      `PUT ${key} に失敗しました: ${response.status} ${await response.text()}`
    );
  }
}

async function deleteObject(r2, key) {
  const response = await r2.client.fetch(await objectUrl(r2, key), {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `DELETE ${key} に失敗しました: ${response.status} ${await response.text()}`
    );
  }
}

/**
 * ローカルのファイルを R2 に同期する。
 * ETag（単一 PUT は MD5）が一致するファイルはスキップする。
 */
async function syncFiles(files, r2, cacheControl) {
  let uploaded = 0;
  let skipped = 0;

  await mapWithConcurrency(files, CONCURRENCY, async ({ fullPath, key }) => {
    const buffer = fs.readFileSync(fullPath);

    if (DRY_RUN) {
      console.log(`  [dry-run] ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
      uploaded++;
      return;
    }

    if (!FORCE) {
      const remoteEtag = await getRemoteEtag(r2, key);
      if (remoteEtag && remoteEtag === md5(buffer)) {
        skipped++;
        return;
      }
    }

    await putObject(r2, key, buffer, contentTypeFor(fullPath), cacheControl);
    uploaded++;
    console.log(`  ⬆️  ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
  });

  return { uploaded, skipped };
}

const MANIFEST_PATH = path.join("src", "generated", "image-manifest.json");

/** manifest に記録されている画像の相対パス一覧 */
function readManifestKeys() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  try {
    return Object.keys(JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")));
  } catch {
    return [];
  }
}

/**
 * manifest のキーに対応する元画像がローカルにあるか。
 * 拡張子の大文字・小文字や jpg/jpeg の違いも吸収する。
 */
function originalExists(relativePath) {
  const fullPath = path.join(IMAGES_DIR, relativePath);
  if (fs.existsSync(fullPath)) return true;

  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) return false;

  const baseName = path
    .basename(fullPath, path.extname(fullPath))
    .toLowerCase();

  return fs.readdirSync(dir).some((name) => {
    const ext = path.extname(name).toLowerCase();
    return (
      [".jpg", ".jpeg", ".png", ".webp"].includes(ext) &&
      path.basename(name, path.extname(name)).toLowerCase() === baseName
    );
  });
}

/**
 * 元画像がローカルに無い画像の optimized キー。
 * --prune で R2 から消してしまうと記事が 404 になるため保護する。
 */
function protectedOptimizedKeys() {
  const keys = new Set();

  for (const relativePath of readManifestKeys()) {
    if (originalExists(relativePath)) continue;

    const ext = path.extname(relativePath);
    const withoutExt = relativePath
      .slice(0, relativePath.length - ext.length)
      .replace(/\\/g, "/");

    for (const variant of ["thumb", "medium", "large"]) {
      keys.add(`${OPTIMIZED_KEY_PREFIX}${withoutExt}-${variant}.webp`);
    }
  }

  return keys;
}

/** 元画像がローカルに無い画像の originals キー（バックアップを消さない） */
function protectedOriginalKeys() {
  const keys = new Set();

  for (const relativePath of readManifestKeys()) {
    if (originalExists(relativePath)) continue;
    keys.add(
      `${ORIGINALS_KEY_PREFIX}${relativePath.replace(/\\/g, "/")}`
    );
  }

  return keys;
}

async function pruneRemote(r2, prefix, localKeys, protectedKeys = new Set()) {
  if (DRY_RUN) {
    console.log(
      `  [dry-run] ${prefix} 配下の不要ファイルを削除（ローカルに ${localKeys.size} 件 / 保護 ${protectedKeys.size} 件）`
    );
    return 0;
  }

  const remoteKeys = await listRemoteKeys(r2, prefix);
  const orphans = [];
  let kept = 0;

  for (const key of remoteKeys) {
    if (localKeys.has(key)) continue;
    if (protectedKeys.has(key)) {
      kept++;
      continue;
    }
    orphans.push(key);
  }

  if (kept > 0) {
    console.log(
      `  🛡️  元画像がローカルに無いため保持: ${kept} 件（削除するには元画像を npm run images:pull で復元）`
    );
  }

  for (const key of orphans) {
    await deleteObject(r2, key);
    console.log(`  🗑️  ${key}`);
  }

  return orphans.length;
}

async function main() {
  if (!SKIP_OPTIMIZE) {
    console.log("🖼️  画像を最適化しています...");
    await optimizeImages();
  }

  if (!fs.existsSync(OPTIMIZED_DIR)) {
    throw new Error(
      `${OPTIMIZED_DIR} が存在しません。元画像を配置して npm run optimize-images を実行してください。`
    );
  }

  const optimizedFiles = walkFiles(OPTIMIZED_DIR).map((fullPath) => ({
    fullPath,
    key: `${OPTIMIZED_KEY_PREFIX}${toKey(fullPath, OPTIMIZED_DIR)}`,
  }));

  if (optimizedFiles.length === 0) {
    throw new Error(
      `${OPTIMIZED_DIR} に画像がありません。元画像を配置して最適化を実行してください。`
    );
  }

  const originalFiles = WITH_ORIGINALS
    ? walkFiles(IMAGES_DIR)
        .filter(
          (fullPath) =>
            !path
              .relative(IMAGES_DIR, fullPath)
              .split(path.sep)[0]
              ?.toLowerCase()
              .startsWith("optimized")
        )
        .map((fullPath) => ({
          fullPath,
          key: `${ORIGINALS_KEY_PREFIX}${toKey(fullPath, IMAGES_DIR)}`,
        }))
    : [];

  const r2 = createR2Client({ dryRun: DRY_RUN });
  const publicBaseUrl = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "").replace(
    /\/+$/,
    ""
  );

  if (!DRY_RUN && !publicBaseUrl) {
    console.warn(
      "⚠️  NEXT_PUBLIC_IMAGE_BASE_URL が未設定です。Vercel / .env.local に公開URLを設定してください。"
    );
  }

  console.log(
    `\n📦 アップロード: optimized ${optimizedFiles.length} 件` +
      (WITH_ORIGINALS ? ` / originals ${originalFiles.length} 件` : "") +
      (DRY_RUN ? " (dry-run)" : "")
  );

  const optimizedResult = await syncFiles(
    optimizedFiles,
    r2,
    "public, max-age=604800, stale-while-revalidate=86400"
  );

  let originalResult = { uploaded: 0, skipped: 0 };
  if (WITH_ORIGINALS) {
    originalResult = await syncFiles(originalFiles, r2, "no-store");
  }

  let pruned = 0;
  if (PRUNE) {
    pruned += await pruneRemote(
      r2,
      OPTIMIZED_KEY_PREFIX,
      new Set(optimizedFiles.map((file) => file.key)),
      protectedOptimizedKeys()
    );

    if (WITH_ORIGINALS) {
      pruned += await pruneRemote(
        r2,
        ORIGINALS_KEY_PREFIX,
        new Set(originalFiles.map((file) => file.key)),
        protectedOriginalKeys()
      );
    }
  }

  console.log(
    `\n✨ 完了: アップロード ${optimizedResult.uploaded + originalResult.uploaded} 件 / ` +
      `スキップ ${optimizedResult.skipped + originalResult.skipped} 件 / ` +
      `削除 ${pruned} 件`
  );

  if (publicBaseUrl) {
    console.log(`🌐 公開URL: ${publicBaseUrl}/${OPTIMIZED_KEY_PREFIX}`);
  } else {
    console.log(
      "💡 NEXT_PUBLIC_IMAGE_BASE_URL を設定すると、このURLから画像が配信されます。"
    );
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error("\n❌ 画像の公開に失敗しました:", error);
    process.exit(1);
  });
}
