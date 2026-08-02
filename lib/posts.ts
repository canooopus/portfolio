import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";

const postsDirectory = path.join(process.cwd(), "posts");

// 記事の型定義
export interface PostData {
  slug: string;
  title: string;
  date: string;
  description?: string;
  contentHtml?: string;
}

// 1. 全記事のメタデータ（一覧用）を日付順にソートして取得する関数
export function getSortedPostsData(): PostData[] {
  // フォルダが存在しない場合は空配列を返す（エラー防止）
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md")) // .mdファイルのみ対象
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");

      // matter を使ってフロントマター（メタデータ）を解析
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || "No Title",
        date: data.date || "1970-01-01",
        description: data.description || "",
      } as PostData;
    });

  // 日付の新しい順にソート
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 2. 単一記事の詳細データ（メタデータ ＋ HTML化された本文）を取得する関数
export async function getPostData(slug: string): Promise<PostData | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  // ファイルが存在しない場合は null を返す
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // unifiedエコシステムで Markdown -> HTML 変換
  const processedContent = await unified()
    .use(remarkParse)               // Markdown をパース
    .use(remarkRehype)              // HTML構造に変換
    .use(rehypePrettyCode, {        // コードハイライトの処理を追加
      theme: "one-dark-pro",        // シンタックスハイライトのテーマ（VS Code風）
      keepBackground: true,         // 背景色をテーマに合わせる
    })
    .use(rehypeStringify)           // HTML文字列として書き出し
    .process(content);

  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title || "No Title",
    date: data.date || "1970-01-01",
    description: data.description || "",
    contentHtml,
  };
}