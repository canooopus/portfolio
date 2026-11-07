import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { syncBlogFolders } from "./sync-blog-folders.mjs";

const BASE_IMAGE_DIR = "public/images";
const OUTPUT_DIR = "public/images/optimized";

// 生成した画像の実寸を記録するマニフェスト（srcset の幅記述子に使用）
const MANIFEST_PATH = path.join("src", "generated", "image-manifest.json");

// 最適化する幅のバリエーション
const SIZES = [
  { name: "thumb", width: 480, quality: 80 },
  { name: "medium", width: 800, quality: 82 },
  { name: "large", width: 1280, quality: 85 },
];

const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Git 管理下に置く共通アセットは最適化対象外。
// これらを対象にすると、元画像が無い新規クローンでも「元画像あり」と
// 判定されてしまい、manifest を縮小してしまうため。
const EXCLUDED_SOURCE_DIRS = new Set(["brand"]);

/**
 * ディレクトリ内を再帰的に走査し、画像ファイルの一覧を取得
 */
function getAllImageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // optimized ディレクトリ自体はスキップ
      if (path.resolve(fullPath) === path.resolve(OUTPUT_DIR)) {
        continue;
      }

      const relativeDir = path
        .relative(BASE_IMAGE_DIR, fullPath)
        .split(path.sep)[0]
        .toLowerCase();
      if (EXCLUDED_SOURCE_DIRS.has(relativeDir)) {
        continue;
      }

      getAllImageFiles(fullPath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (EXTENSIONS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

/**
 * 元画像が削除された不要な WebP ファイルや空フォルダをクリーンアップ
 */
export function cleanupOrphanOptimizedFiles(dir = OUTPUT_DIR) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      cleanupOrphanOptimizedFiles(fullPath);
      // サブディレクトリ内を削除した結果、空になったらフォルダも削除
      if (fs.existsSync(fullPath) && fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
        console.log(`🧹 [Clean] 空ディレクトリを削除: ${path.relative(".", fullPath)}`);
      }
    } else if (entry.isFile()) {
      const match = entry.name.match(/^(.+)-(thumb|medium|large)\.webp$/i);
      if (match) {
        const baseName = match[1];
        const relativeDir = path.relative(OUTPUT_DIR, dir);
        const originalDir = relativeDir
          ? path.join(BASE_IMAGE_DIR, relativeDir)
          : BASE_IMAGE_DIR;

        // 元画像が存在するか確認
        // （大文字拡張子のファイルでも一致するよう、ファイル名を小文字化して比較する）
        const sourceFileNames = fs.existsSync(originalDir)
          ? fs.readdirSync(originalDir).map((name) => name.toLowerCase())
          : [];
        const originalExists = EXTENSIONS.some((ext) =>
          sourceFileNames.includes(`${baseName}${ext}`.toLowerCase())
        );

        if (!originalExists) {
          fs.unlinkSync(fullPath);
          console.log(`🗑️  [Clean] 最適化ファイルを削除: ${path.relative(".", fullPath)}`);
        }
      }
    }
  }
}

/**
 * 画像の実寸マニフェストを書き出す。
 *
 * `withoutEnlargement: true` により元画像が小さい場合は拡張されないため、
 * srcset の幅記述子（480w / 800w / 1280w 固定）と実ファイルの幅がずれる。
 * そのずれがスマホ（高 DPR）で画像が小さく表示される原因になるので、
 * 実際に生成された幅を JSON に保存して srcset 生成側で参照する。
 */
function writeImageManifest(manifest) {
  const sorted = Object.fromEntries(
    Object.keys(manifest)
      .sort()
      .map((key) => [key, manifest[key]])
  );
  const content = JSON.stringify(sorted, null, 2) + "\n";

  if (
    fs.existsSync(MANIFEST_PATH) &&
    fs.readFileSync(MANIFEST_PATH, "utf8") === content
  ) {
    return;
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, content);
  console.log(
    `📝 [Manifest] 実寸を書き出し: ${MANIFEST_PATH} (${Object.keys(sorted).length} images)`
  );
}

/**
 * 画像最適化メイン処理
 */
export async function optimizeImages({ allowEmpty = false } = {}) {
  // 1. ブログ画像用フォルダを md ファイルと同期
  syncBlogFolders();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const imageFiles = getAllImageFiles(BASE_IMAGE_DIR);

  // 元画像は Git 管理外（ローカルのみ）なので、新規クローンや CI では
  // 1 枚も存在しないことがある。その状態で cleanup や manifest の書き出しを
  // 行うと、コミット済みの manifest と optimized を消してしまうため何もしない。
  if (imageFiles.length === 0 && !allowEmpty) {
    console.log(
      "ℹ️  元画像が見つからないため画像最適化をスキップしました（manifest / optimized はそのまま保持）"
    );
    return { processedCount: 0, skipped: true };
  }

  // 2. 元画像が削除された WebP をクリーンアップ
  cleanupOrphanOptimizedFiles();

  console.log("🚀 Starting image optimization with sharp...");
  let processedCount = 0;
  const manifest = {};

  for (const inputPath of imageFiles) {
    // ファイル名からは元の拡張子で取り除く
    // （`IMG_1234.JPG` を `IMG_1234.JPG-thumb.webp` にしてしまわないため）
    const originalExt = path.extname(inputPath);
    const fileName = path.basename(inputPath);
    const baseName = path.basename(inputPath, originalExt);

    const relativeDir = path.relative(BASE_IMAGE_DIR, path.dirname(inputPath));
    const relativeImagePath = path
      .relative(BASE_IMAGE_DIR, inputPath)
      .split(path.sep)
      .join("/");
    const targetOutputDir = relativeDir
      ? path.join(OUTPUT_DIR, relativeDir)
      : OUTPUT_DIR;

    if (!fs.existsSync(targetOutputDir)) {
      fs.mkdirSync(targetOutputDir, { recursive: true });
    }

    const originalStat = fs.statSync(inputPath);
    const originalSize = originalStat.size;

    // 既に各サイズの最適化ファイルが存在し、更新日時が元画像以降ならスキップ（高速化）
    let needOptimization = false;
    for (const size of SIZES) {
      const outputFilePath = path.join(targetOutputDir, `${baseName}-${size.name}.webp`);
      if (!fs.existsSync(outputFilePath)) {
        needOptimization = true;
        break;
      }
      const outputStat = fs.statSync(outputFilePath);
      if (outputStat.mtimeMs < originalStat.mtimeMs) {
        needOptimization = true;
        break;
      }
    }

    let sourceWidth;

    if (needOptimization) {
      console.log(
        `\n📸 Processing: ${path.join(relativeDir, fileName)} (${(
          originalSize /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );

      const image = sharp(inputPath);
      const metadata = await image.metadata();
      sourceWidth = metadata.width;

      for (const size of SIZES) {
        const targetWidth = Math.min(size.width, metadata.width || size.width);
        const outputFileName = `${baseName}-${size.name}.webp`;
        const outputPath = path.join(targetOutputDir, outputFileName);

        await sharp(inputPath)
          .resize({ width: targetWidth, withoutEnlargement: true })
          .webp({ quality: size.quality, effort: 4 })
          .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;
        console.log(
          `  -> Generated ${path.join(relativeDir, outputFileName)}: ${(
            newSize / 1024
          ).toFixed(1)} KB (w: ${targetWidth}px)`
        );
      }

      processedCount++;
    } else {
      // 生成済みでも実寸を記録するために元画像の幅だけ取得
      const metadata = await sharp(inputPath).metadata();
      sourceWidth = metadata.width;
    }

    // withoutEnlargement により元画像より大きくはならないため、実寸を記録する
    manifest[relativeImagePath] = Object.fromEntries(
      SIZES.map((size) => [
        size.name,
        Math.min(size.width, sourceWidth || size.width),
      ])
    );
  }

  // 終了後に空ディレクトリを再クリーンアップ
  cleanupOrphanOptimizedFiles();

  writeImageManifest(manifest);

  if (processedCount > 0) {
    console.log(`\n✨ Finished optimizing ${processedCount} images!`);
  } else {
    console.log("✨ All images are already up-to-date.");
  }

  return { processedCount, skipped: false };
}

// スクリプト直接実行時
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  optimizeImages({ allowEmpty: process.argv.includes("--allow-empty") }).catch(
    (err) => {
      console.error("Error optimizing images:", err);
      process.exit(1);
    }
  );
}
