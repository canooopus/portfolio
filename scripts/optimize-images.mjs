import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_DIRS = ["public/images/gallery"];
const OUTPUT_DIR = "public/images/optimized";

// 最適化する幅のバリエーション
const SIZES = [
  { name: "thumb", width: 480, quality: 80 },
  { name: "medium", width: 800, quality: 82 },
  { name: "large", width: 1280, quality: 85 },
];

async function optimizeImages() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("🚀 Starting image optimization with sharp...");
  let totalSavedBytes = 0;
  let processedCount = 0;

  for (const srcDir of SOURCE_DIRS) {
    if (!fs.existsSync(srcDir)) continue;

    const files = fs.readdirSync(srcDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;

      const inputPath = path.join(srcDir, file);
      const baseName = path.basename(file, ext);
      const originalSize = fs.statSync(inputPath).size;

      console.log(`\n📸 Processing: ${file} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);

      const image = sharp(inputPath);
      const metadata = await image.metadata();

      for (const size of SIZES) {
        // 元画像の幅より大きくリサイズしない
        const targetWidth = Math.min(size.width, metadata.width || size.width);
        const outputFileName = `${baseName}-${size.name}.webp`;
        const outputPath = path.join(OUTPUT_DIR, outputFileName);

        await sharp(inputPath)
          .resize({ width: targetWidth, withoutEnlargement: true })
          .webp({ quality: size.quality, effort: 4 })
          .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;
        console.log(`  -> Generated ${outputFileName}: ${(newSize / 1024).toFixed(1)} KB (w: ${targetWidth}px)`);
      }

      processedCount++;
    }
  }

  console.log(`\n✨ Finished optimizing ${processedCount} images!`);
}

optimizeImages().catch((err) => {
  console.error("Error optimizing images:", err);
  process.exit(1);
});
