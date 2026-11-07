import fs from "fs";
import path from "path";
import {
  createR2Client,
  listRemoteKeys,
  encodeKey,
} from "./r2.mjs";
import { loadEnvLocal } from "./env.mjs";

const ORIGINALS_KEY_PREFIX = "originals/";
const DEST_DIR = path.join("public", "images");
const CONCURRENCY = 4;

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`使い方: npm run images:pull -- [options]

  R2 の originals/** を public/images/** にダウンロードして元画像を復元する。

  --dry-run          ダウンロードせず対象だけ表示
  --force            ローカルに既にあるファイルも上書き
  --prefix <path>    originals/ 配下の指定パスだけ取得（例: --prefix blog/my-post/）

  ※ 元画像を R2 にバックアップしている場合のみ復元できます
    （npm run images:publish -- --with-originals で作成）
`);
  process.exit(0);
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const PREFIX = readOption("--prefix");

if (PREFIX !== undefined && (!PREFIX || PREFIX.startsWith("--"))) {
  throw new Error("--prefix には originals/ 配下のパスを指定してください");
}

function normalizePrefix(prefix) {
  const trimmed = prefix.replace(/^\/+|\/+$/g, "");
  return trimmed ? `${ORIGINALS_KEY_PREFIX}${trimmed}/` : ORIGINALS_KEY_PREFIX;
}

async function mapWithConcurrency(items, limit, fn) {
  let nextIndex = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= items.length) return;
        await fn(items[index], index);
      }
    }
  );
  await Promise.all(runners);
}

function toDestPath(key) {
  const relative = key.slice(ORIGINALS_KEY_PREFIX.length);
  const destPath = path.resolve(DEST_DIR, relative);
  const root = path.resolve(DEST_DIR);

  // キーに ../ などが含まれていても public/images の外へは書き込まない
  if (destPath !== root && !destPath.startsWith(root + path.sep)) {
    throw new Error(`不正なキーのためスキップします: ${key}`);
  }
  return destPath;
}

async function download(r2, key, destPath) {
  const response = await r2.client.fetch(
    `${r2.endpoint}/${encodeKey(key)}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(
      `GET ${key} に失敗しました: ${response.status} ${response.statusText}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

async function main() {
  loadEnvLocal();

  const r2 = createR2Client();
  const prefix = PREFIX ? normalizePrefix(PREFIX) : ORIGINALS_KEY_PREFIX;
  const keys = await listRemoteKeys(r2, prefix);

  if (keys.length === 0) {
    console.log(
      `ℹ️  R2 の ${prefix} に元画像が見つかりませんでした。\n` +
        "   npm run images:publish -- --with-originals でバックアップした画像だけが復元できます。"
    );
    return;
  }

  const targets = keys.map((key) => ({ key, destPath: toDestPath(key) }));
  const existing = targets.filter(({ destPath }) => fs.existsSync(destPath));
  const pending = FORCE
    ? targets
    : targets.filter(({ destPath }) => !fs.existsSync(destPath));

  console.log(
    `📥 復元対象: ${targets.length} 件（既存 ${existing.length} 件 / 取得 ${pending.length} 件）` +
      (DRY_RUN ? " (dry-run)" : "")
  );

  if (DRY_RUN) {
    for (const { key, destPath } of pending) {
      console.log(`  [dry-run] ${key} -> ${path.relative(".", destPath)}`);
    }
    return;
  }

  let downloaded = 0;
  await mapWithConcurrency(pending, CONCURRENCY, async ({ key, destPath }) => {
    const size = await download(r2, key, destPath);
    downloaded++;
    console.log(
      `  ⬇️  ${key} (${(size / 1024).toFixed(1)} KB) -> ${path.relative(".", destPath)}`
    );
  });

  console.log(
    `\n✨ 完了: 復元 ${downloaded} 件 / スキップ ${targets.length - pending.length} 件`
  );
  console.log(
    "  続けて npm run dev または npm run images:publish で最適化できます。"
  );
}

main().catch((error) => {
  console.error("\n❌ 元画像の復元に失敗しました:", error);
  process.exit(1);
});
