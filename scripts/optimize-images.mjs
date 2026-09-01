import fs from "fs";
import path from "path";
import sharp from "sharp";
import { syncBlogFolders } from "./sync-blog-folders.mjs";

const BASE_IMAGE_DIR = "public/images";
const OUTPUT_DIR = "public/images/optimized";

// 最適化する幅のバリエーション
const SIZES = [
  { name: "thumb", width: 480, quality: 80 },
  { name: "medium", width: 800, quality: 82 },
  { name: "large", width: 1280, quality: 85 },
];

const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

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
        const originalExists = EXTENSIONS.some((ext) =>
          fs.existsSync(path.join(originalDir, `${baseName}${ext}`))
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
 * 画像最適化メイン処理
 */
export async function optimizeImages() {
  // 1. ブログ画像用フォルダを md ファイルと同期
  syncBlogFolders();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 2. 元画像が削除された WebP をクリーンアップ
  cleanupOrphanOptimizedFiles();

  console.log("🚀 Starting image optimization with sharp...");
  const imageFiles = getAllImageFiles(BASE_IMAGE_DIR);
  let processedCount = 0;

  for (const inputPath of imageFiles) {
    const ext = path.extname(inputPath).toLowerCase();
    const fileName = path.basename(inputPath);
    const baseName = path.basename(inputPath, ext);

    const relativeDir = path.relative(BASE_IMAGE_DIR, path.dirname(inputPath));
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

    if (!needOptimization) {
      continue;
    }

    console.log(
      `\n📸 Processing: ${path.join(relativeDir, fileName)} (${(
        originalSize /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    const image = sharp(inputPath);
    const metadata = await image.metadata();

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
  }

  // 終了後に空ディレクトリを再クリーンアップ
  cleanupOrphanOptimizedFiles();

  if (processedCount > 0) {
    console.log(`\n✨ Finished optimizing ${processedCount} images!`);
  } else {
    console.log("✨ All images are already up-to-date.");
  }
}

// スクリプト直接実行時
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, "$1"));

if (isDirectRun) {
  optimizeImages().catch((err) => {
    console.error("Error optimizing images:", err);
    process.exit(1);
  });
}
