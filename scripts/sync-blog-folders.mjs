import fs from "fs";
import path from "path";

const BLOG_CONTENT_DIR = "content/blog";
const BLOG_IMAGES_DIR = "public/images/blog";
const OPTIMIZED_BLOG_IMAGES_DIR = "public/images/optimized/blog";
// 削除対象外にする共通フォルダ名（必要に応じて追加可能）
const PRESERVED_FOLDERS = new Set(["common"]);

/**
 * content/blog の md ファイルと public/images/blog のフォルダを同期する
 */
export function syncBlogFolders() {
  if (!fs.existsSync(BLOG_CONTENT_DIR)) {
    return;
  }

  if (!fs.existsSync(BLOG_IMAGES_DIR)) {
    fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
  }

  // 1. content/blog 内の .md ファイルのスラッグ名（拡張子なし）を取得
  const mdFiles = fs.readdirSync(BLOG_CONTENT_DIR);
  const activeSlugs = new Set();

  for (const file of mdFiles) {
    if (file.endsWith(".md")) {
      const slug = path.basename(file, ".md");
      activeSlugs.add(slug);
    }
  }

  // 2. 新しい md に対応するフォルダを作成
  for (const slug of activeSlugs) {
    const targetDir = path.join(BLOG_IMAGES_DIR, slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`📁 [Blog Image Sync] 作成: ${targetDir}`);
    }
  }

  // 3. 削除された md に対応するフォルダを削除
  const existingDirs = fs.readdirSync(BLOG_IMAGES_DIR, { withFileTypes: true });
  for (const entry of existingDirs) {
    if (entry.isDirectory()) {
      const folderName = entry.name;
      if (!activeSlugs.has(folderName) && !PRESERVED_FOLDERS.has(folderName)) {
        const toDelete = path.join(BLOG_IMAGES_DIR, folderName);
        fs.rmSync(toDelete, { recursive: true, force: true });
        console.log(`🗑️  [Blog Image Sync] 削除: ${toDelete}`);

        // optimized 側にもゴミがあれば削除
        const optimizedToDelete = path.join(OPTIMIZED_BLOG_IMAGES_DIR, folderName);
        if (fs.existsSync(optimizedToDelete)) {
          fs.rmSync(optimizedToDelete, { recursive: true, force: true });
          console.log(`🗑️  [Blog Image Sync] 最適化キャッシュ削除: ${optimizedToDelete}`);
        }
      }
    }
  }
}

/**
 * 監視モード（ファイル変更時に即同期）
 */
export function watchBlogFolders() {
  syncBlogFolders();

  if (!fs.existsSync(BLOG_CONTENT_DIR)) return;

  console.log(`👀 [Blog Image Sync] ${BLOG_CONTENT_DIR} の変更監視を開始しました`);

  let timeoutId = null;
  fs.watch(BLOG_CONTENT_DIR, (eventType, filename) => {
    if (filename && filename.endsWith(".md")) {
      // 連続イベントのデバウンス（100ms）
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        syncBlogFolders();
      }, 100);
    }
  });
}

// コマンドラインから直接実行された場合
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, "$1"));
if (process.argv.includes("--watch")) {
  watchBlogFolders();
} else if (process.argv.includes("--sync") || isDirectRun) {
  syncBlogFolders();
}
