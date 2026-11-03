import fs from "fs";
import path from "path";
import { cache } from "react";
import type { Root as HastRoot, RootContent as HastNode } from "hast";
import type { Root as MdastRoot, RootContent as MdastNode } from "mdast";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDeflist from "remark-deflist"; // ★追加: 定義リスト (17. Definition Lists)
import remarkGithubBlockquoteAlert from "remark-github-blockquote-alert"; // ★追加: アラート (18. Alerts)
import remarkMath from "remark-math"; // ★追加: 数式記法 (19. Mathematical Expressions)
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex"; // ★追加: 数式のHTMLレンダリング
import rehypeMermaid from "rehype-mermaid"; // ★追加: Mermaid図表のSVG変換 (20-22)
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { getOgpData, OgpData } from "./ogp";

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
function parseTags(data: Record<string, unknown>, slug: string): string[] | undefined {
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

export interface PostData extends PostMetadata {
  contentHtml?: string;
  hasMermaid?: boolean;
}

/**
 * メタデータ（title, date）のみを高速に取得（HTMLパースをスキップ）
 */
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

export const getSortedPostsData = cache((): PostData[] => {
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
      } as PostData;
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
});

/**
 * Markdown内の画像（<img src="...">）を事前生成WebP & srcsetに自動変換するRehypeプラグイン
 */
function rehypeOptimizeImages() {
  function visit(node: HastRoot | HastNode) {
    if (
      node.type === "element" &&
      node.tagName === "img" &&
      node.properties.src
    ) {
      const src = node.properties.src;

      if (!src.startsWith("/images/optimized/")) {
        const match = src.match(
          /^\/images\/(?:(.+)\/)?([^/]+)\.(jpg|jpeg|png|webp)$/i,
        );
        if (match) {
          const subDir = match[1] || "";
          const baseName = match[2];
          const prefix = subDir
            ? `/images/optimized/${subDir}`
            : `/images/optimized`;

          const thumbSrc = `${prefix}/${baseName}-thumb.webp`;
          const mediumSrc = `${prefix}/${baseName}-medium.webp`;
          const largeSrc = `${prefix}/${baseName}-large.webp`;

          node.properties.src = mediumSrc;
          node.properties.srcSet = `${thumbSrc} 480w, ${mediumSrc} 800w, ${largeSrc} 1280w`;
          node.properties.loading = node.properties.loading || "lazy";
          node.properties.decoding = node.properties.decoding || "async";
        }
      }
    }

    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }

  return (tree: HastRoot) => {
    visit(tree);
  };
}

/**
 * HTML文字列のエスケープ
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * OGPカードのHTMLレンダリング
 */
function renderOgpCardHtml(ogp: OgpData): string {
  const safeUrl = escapeHtml(ogp.url);
  const safeTitle = escapeHtml(ogp.title);
  const safeDescription = ogp.description ? escapeHtml(ogp.description) : "";
  const safeDomain = escapeHtml(ogp.domain);
  const safeFavicon = ogp.favicon ? escapeHtml(ogp.favicon) : "";
  const safeImage = ogp.image ? escapeHtml(ogp.image) : "";

  return `
<div class="ogp-card-container not-prose my-6">
  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="ogp-card group">
    <div class="ogp-card-body">
      <div class="ogp-card-title">${safeTitle}</div>
      ${safeDescription ? `<p class="ogp-card-description">${safeDescription}</p>` : ""}
      <div class="ogp-card-footer">
        ${safeFavicon ? `<img src="${safeFavicon}" alt="" class="ogp-card-favicon" loading="lazy" />` : ""}
        <span class="ogp-card-domain">${safeDomain}</span>
      </div>
    </div>
    ${
      safeImage
        ? `<div class="ogp-card-image-wrap">
        <img src="${safeImage}" alt="${safeTitle}" class="ogp-card-image" loading="lazy" />
      </div>`
        : ""
    }
  </a>
</div>
`.trim();
}

/**
 * [card](url) 記法をOGPリンクカードに変換するRemarkプラグイン
 */
function remarkOgpCard() {
  return async (tree: MdastRoot) => {
    async function processNode(node: MdastNode): Promise<MdastNode[]> {
      // 単独の段落にある [card](url) をチェック
      if (node.type === "paragraph") {
        const nonWhitespace = node.children.filter(
          (c) => !(c.type === "text" && c.value.trim() === ""),
        );

        if (nonWhitespace.length === 1 && nonWhitespace[0].type === "link") {
          const linkNode = nonWhitespace[0];
          const linkText = linkNode.children
            .map((c) => ("value" in c ? c.value : ""))
            .join("")
            .trim();

          if (linkText === "card" && linkNode.url) {
            const ogp = await getOgpData(linkNode.url);
            return [
              {
                type: "html",
                value: renderOgpCardHtml(ogp),
              },
            ];
          }
        }
      }

      // それ以外でインラインの [card](url) があった場合も置換対応
      if ("children" in node && Array.isArray(node.children)) {
        const newChildren: MdastNode[] = [];
        for (const child of node.children) {
          if (child.type === "link") {
            const linkText = child.children
              .map((c) => ("value" in c ? c.value : ""))
              .join("")
              .trim();
            if (linkText === "card" && child.url) {
              const ogp = await getOgpData(child.url);
              newChildren.push({
                type: "html",
                value: renderOgpCardHtml(ogp),
              });
              continue;
            }
          }
          newChildren.push(child);
        }
        (node as { children: MdastNode[] }).children =
          await processNodes(newChildren);
      }

      return [node];
    }

    async function processNodes(nodes: MdastNode[]): Promise<MdastNode[]> {
      const results = await Promise.all(nodes.map(processNode));
      return results.flat();
    }

    if (Array.isArray(tree.children)) {
      tree.children = await processNodes(tree.children);
    }
  };
}

export const getPostData = cache(async (slug: string): Promise<PostData | null> => {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // unifiedエコシステムで Markdown -> HTML 変換
  const processedContent = await unified()
    .use(remarkParse)                       // 1. Markdown をASTにパース
    .use(remarkGfm)                         // 2. GFM (テーブル、タスクリスト等)
    .use(remarkDeflist)                     // 3. 定義リストを解析 (<dl>, <dt>, <dd>)
    .use(remarkGithubBlockquoteAlert)       // 4. [!NOTE] などのアラート記法を解析
    .use(remarkMath)                        // 5. $...$ や $$...$$ の数式記法を解析
    .use(remarkOgpCard)                     // 6. [card](url) 記法をOGPカードに変換
    .use(remarkRehype, { allowDangerousHtml: true }) // 7. AST を HTML構造 (rehype) に変換
    .use(rehypeRaw)                         // 7. 生HTMLノードを rehype AST 要素に変換
    .use(rehypeOptimizeImages)              // 8. 画像を WebP & srcset に自動変換
    .use(rehypeKatex)                       // 9. 数式を KaTeX による表示用HTMLへ変換
    .use(rehypeMermaid, {                   // 10. Mermaid コードブロックを pre.mermaid に変換 (ビルド時エラー防止)
      strategy: "pre-mermaid",
    })
    .use(rehypePrettyCode, {                // 11. コードブロックのシンタックスハイライト
      theme: "github-light",
      keepBackground: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true }) // 12. HTML文字列として出力
    .process(content);

  const contentHtml = processedContent.toString();
  const hasMermaid = content.includes("```mermaid") || contentHtml.includes('class="mermaid"');

  return {
    slug,
    title: data.title || "No Title",
    date: data.date || "1970-01-01",
    tags: parseTags(data, slug),
    contentHtml,
    hasMermaid,
  };
});
