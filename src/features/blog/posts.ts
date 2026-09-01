import fs from "fs";
import path from "path";
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

const postsDirectory = path.join(process.cwd(), "content", "blog");

export interface PostData {
  slug: string;
  title: string;
  date: string;
  contentHtml?: string;
}

export function getSortedPostsData(): PostData[] {
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
      } as PostData;
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Markdown内の画像（<img src="...">）を事前生成WebP & srcsetに自動変換するRehypeプラグイン
 */
function rehypeOptimizeImages() {
  function visit(node: any) {
    if (!node || typeof node !== "object") return;

    if (node.type === "element" && node.tagName === "img" && node.properties?.src) {
      const src = String(node.properties.src);

      if (!src.startsWith("/images/optimized/")) {
        const match = src.match(/^\/images\/(?:(.+)\/)?([^/]+)\.(jpg|jpeg|png|webp)$/i);
        if (match) {
          const subDir = match[1] || "";
          const baseName = match[2];
          const prefix = subDir ? `/images/optimized/${subDir}` : `/images/optimized`;

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

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }

  return (tree: any) => {
    visit(tree);
  };
}

export async function getPostData(slug: string): Promise<PostData | null> {
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
    .use(remarkRehype, { allowDangerousHtml: true }) // 6. AST を HTML構造 (rehype) に変換
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

  return {
    slug,
    title: data.title || "No Title",
    date: data.date || "1970-01-01",
    contentHtml,
  };
}
