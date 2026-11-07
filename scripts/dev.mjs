import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { watchBlogFolders } from "./sync-blog-folders.mjs";
import { optimizeImages } from "./optimize-images.mjs";

const BASE_IMAGE_DIR = "public/images";

// 1. 初回最適化＆ブログフォルダ同期
try {
  await optimizeImages();
} catch (err) {
  console.error("Initial image optimization error:", err);
}

// 2. ブログ Markdown の変更監視を開始
watchBlogFolders();

// 3. public/images/ の画像ファイル追加・削除を監視して自動最適化＆自動クリーンアップ
if (fs.existsSync(BASE_IMAGE_DIR)) {
  let optimizeTimeout = null;
  fs.watch(BASE_IMAGE_DIR, { recursive: true }, (eventType, filename) => {
    // optimized ディレクトリ内の変更はループ防止のため無視
    if (filename && (filename.startsWith("optimized") || filename.startsWith("optimized" + path.sep))) {
      return;
    }

    clearTimeout(optimizeTimeout);
    optimizeTimeout = setTimeout(async () => {
      try {
        await optimizeImages();
      } catch (err) {
        console.error("Watch image optimization error:", err);
      }
    }, 300);
  });
}

// 4. Next.js の開発サーバーを起動
const isWindows = process.platform === "win32";
const nextCmd = isWindows ? "npx.cmd" : "npx";
const nextProcess = spawn(nextCmd, ["next", "dev"], {
  stdio: "inherit",
  shell: true,
});

nextProcess.on("exit", (code) => {
  process.exit(code ?? 0);
});
