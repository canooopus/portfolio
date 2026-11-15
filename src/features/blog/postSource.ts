import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";

/**
 * ブログ記事の生データだけを扱う軽量モジュール。
 *
 * `posts.ts` は rehype-mermaid（playwright）や shiki など重い依存を
 * 読み込むため、それを Route Handler（`/api/markdown`, `/api/mcp`,
 * `/api/a2a`, `/llms*.txt`）から import すると Vercel のサーバーレス
 * 関数でモジュール解決に失敗して 500 になる。
 * メタデータ・Markdown 本文だけが必要な場合は必ずこちらを使う。
 */

const postsDirectory = path.join(process.cwd(), "content", "blog");

export interface PostMetadata {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
}

/**
 * フロントマターの tags を解釈する。
 * - 未指定 / null / 空配列 → タグなし（undefined）
 * - 配列以外 → ビルド時に落とす（書き間違いを検出するため）
 * - 各要素は trim し、trim後に空ならエラー
 * - 大文字小文字はそのまま保持し、重複のみ除去（表示順はフロントマター順）
 *
 * 原文を保持しているため、将来タグページを作る場合は呼び出し側で
 * encodeURIComponent してURL化する想定。
 */
export function parseTags(
  data: Record<string, unknown>,
  slug: string,
): string[] | undefined {
  const raw = data.tags;

  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    throw new Error(
      `[blog] ${slug}.md: "tags" must be an array (e.g. ["Next.js", "TypeScript"])`,
    );
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of raw) {
    if (typeof item !== "string") {
      throw new Error(`[blog] ${slug}.md: each tag must be a string`);
    }

    const tag = item.trim();

    if (tag === "") {
      throw new Error(`[blog] ${slug}.md: empty tag found`);
    }

    if (seen.has(tag)) {
      continue;
    }

    seen.add(tag);
    tags.push(tag);
  }

  return tags.length > 0 ? tags : undefined;
}

/** メタデータ（title, date）のみを高速に取得（HTMLパースをスキップ） */
export const getPostMetadata = cache((slug: string): PostMetadata | null => {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(fileContents);

  return {
    slug,
    title: data.title || "No Title",
    date: data.date || "1970-01-01",
    tags: parseTags(data, slug),
  };
});

/**
 * Markdown 本文（生テキスト）とメタデータを取得する。
 * llms-full.txt や Markdown negotiation（Accept: text/markdown）用。
 */
export const getRawPostContent = cache(
  (slug: string): { metadata: PostMetadata; content: string } | null => {
    const fullPath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      metadata: {
        slug,
        title: data.title || "No Title",
        date: data.date || "1970-01-01",
        tags: parseTags(data, slug),
      },
      content,
    };
  },
);

export const getSortedPostsData = cache((): PostMetadata[] => {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || "No Title",
        date: data.date || "1970-01-01",
        tags: parseTags(data, slug),
      } as PostMetadata;
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
});
