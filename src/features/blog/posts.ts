import fs from "fs";
import path from "path";
import { cache } from "react";
import type { Root as HastRoot, RootContent as HastNode } from "hast";
import type { Root as MdastRoot, RootContent as MdastNode } from "mdast";
import matter from "gray-matter";
import { unified, type Transformer } from "unified";
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
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import {
  RESPONSIVE_IMAGE_SIZES,
  resolveOptimizedImage,
} from "@/lib/imageVariants";
import { getOgpData, OgpData } from "./ogp";

const postsDirectory = path.join(process.cwd(), "content", "blog");

// メタデータ・本文だけを扱う軽量実装は postSource.ts に分離している。
// このファイルは rehype-mermaid（playwright）など重い依存を含むため、
// Route Handler からは直接 import しないこと。
export type { PostMetadata } from "./postSource";
export {
  getPostMetadata,
  getRawPostContent,
  getSortedPostsData,
} from "./postSource";
import { type PostMetadata, parseTags } from "./postSource";

export interface TocItem {
  id: string;
  text: string;
}

export interface PostData extends PostMetadata {
  contentHtml?: string;
  hasMermaid?: boolean;
  toc?: TocItem[];
  /** フロントマター `toc: false` のとき false（目次を出さない） */
  showToc?: boolean;
}

/**
 * 記事の HTML を含む完全なデータ。目次や Mermaid 判定など、
 * レンダリング済み本文が必要なページ専用。
 */

/**
 * Markdown内の画像（<img src="...">）を事前生成WebP & srcsetに自動変換するRehypeプラグイン
 *
 * srcset の幅は `scripts/optimize-images.mjs` が出力した実寸マニフェストを参照する。
 * 固定値だと元画像が小さいときに記述子と実ファイル幅がずれ、高 DPR 端末で
 * 画像が想定より小さい CSS 幅で表示されてしまう。
 */
function rehypeOptimizeImages() {
  function visit(node: HastRoot | HastNode) {
    if (
      node.type === "element" &&
      node.tagName === "img" &&
      typeof node.properties.src === "string"
    ) {
      const originalSrc = node.properties.src;
      const resolved = resolveOptimizedImage(originalSrc);

      if (resolved.defaultSrc !== originalSrc) {
        node.properties.src = resolved.defaultSrc;

        if (resolved.srcSet) {
          node.properties.srcSet = resolved.srcSet;

          // width 属性やインライン style でサイズ指定されている画像には
          // 誤った sizes ヒントを与えない
          const hasExplicitWidth =
            node.properties.width !== undefined ||
            (typeof node.properties.style === "string" &&
              /(?:^|;)\s*width\s*:/.test(node.properties.style));

          if (!hasExplicitWidth) {
            node.properties.sizes = RESPONSIVE_IMAGE_SIZES;
          }
        }

        node.properties.loading = node.properties.loading || "lazy";
        node.properties.decoding = node.properties.decoding || "async";
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
 * 見出し要素などのテキストを再帰的に抽出する
 */
function getNodeText(node: HastRoot | HastNode): string {
  if (node.type === "text") {
    return node.value;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => getNodeText(child)).join("");
  }

  return "";
}

/**
 * h2 だけを目次用に収集するRehypeプラグイン。
 * `rehype-slug` で付与された id をそのまま使う。
 */
function rehypeCollectToc(toc: TocItem[]): Transformer<HastRoot> {
  return (tree) => {
    function visit(node: HastRoot | HastNode) {
      if (node.type === "element" && node.tagName === "h2") {
        const id = node.properties.id;
        const className = node.properties.className;
        // GFM の脚注見出し（sr-only の "Footnotes"）など、非表示の見出しは目次に含めない
        const isHidden =
          id === "footnote-label" ||
          (Array.isArray(className) && className.includes("sr-only"));

        if (!isHidden) {
          const text = getNodeText(node).replace(/\s+/g, " ").trim();

          if (typeof id === "string" && id && text) {
            toc.push({ id, text });
          }
        }
      }

      if ("children" in node && Array.isArray(node.children)) {
        for (const child of node.children) {
          visit(child);
        }
      }
    }

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

  const toc: TocItem[] = [];

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
    .use(rehypeSlug)                        // 8. 見出しに id を付与（目次のアンカー用）
    .use(rehypeCollectToc, toc)             // 9. h2 のみを目次データとして収集
    .use(rehypeOptimizeImages)              // 10. 画像を WebP & srcset に自動変換
    .use(rehypeKatex)                       // 11. 数式を KaTeX による表示用HTMLへ変換
    .use(rehypeMermaid, {                   // 12. Mermaid コードブロックを pre.mermaid に変換 (ビルド時エラー防止)
      strategy: "pre-mermaid",
    })
    .use(rehypePrettyCode, {                // 13. コードブロックのシンタックスハイライト
      theme: "github-light",
      keepBackground: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true }) // 14. HTML文字列として出力
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
    toc,
    // フロントマターで `toc: false` を指定した記事は目次を表示しない
    showToc: data.toc !== false,
  };
});
