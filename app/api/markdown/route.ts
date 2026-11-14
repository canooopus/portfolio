import type { NextRequest } from "next/server";
import { getSortedPostsData, getRawPostContent } from "@/features/blog/posts";
import { photographyItems } from "@/features/photography/photographyItems";
import {
  BOND_PROJECT,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/lib/site";

/**
 * `/api/markdown?path=/blog/...` — 各ページの Markdown 版を返す。
 * `proxy.ts` が `Accept: text/markdown` を検知したときに内部リライトしてくる。
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetPath =
      request.headers.get("x-markdown-path") ||
      searchParams.get("path") ||
      "/";

    // 末尾スラッシュを除去（ルート "/" はそのまま）
    const normalizedPath =
      targetPath.length > 1 && targetPath.endsWith("/")
        ? targetPath.replace(/\/+$/, "")
        : targetPath;

    const markdownHeaders = {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept, x-markdown-path",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      // HTML 版が canonical。Markdown 版は検索インデックス対象にしない。
      "X-Robots-Tag": "noindex",
      Link: `<${SITE_URL}${normalizedPath}>; rel="canonical"`,
    };

  // 1. トップページ
  if (normalizedPath === "" || normalizedPath === "/") {
    const posts = getSortedPostsData();
    const blogList = posts
      .slice(0, 5)
      .map((post) => {
        const tags = post.tags?.length ? ` [${post.tags.join(", ")}]` : "";
        return `- [${post.title}](${SITE_URL}/blog/${post.slug}) (${post.date})${tags}`;
      })
      .join("\n");

    const content = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## About

${SITE_AUTHOR.name} is an ${SITE_AUTHOR.jobTitle.toLowerCase()} living in ${SITE_AUTHOR.location}. Canooopus builds what they want to build independently, focusing on modern web development, UI/UX design, and web applications.

## Featured Projects

- [${BOND_PROJECT.name}](${BOND_PROJECT.url}): ${BOND_PROJECT.description}

## Pages

- [Home](${SITE_URL}/)
- [Blog](${SITE_URL}/blog)
- [Photography](${SITE_URL}/photography)
- [Site summary (llms.txt)](${SITE_URL}/llms.txt)

## Recent Blog Posts

${blogList || "- No posts yet."}

## Social Profiles & Contact

${SOCIAL_LINKS.map((link) => `- [${link.label}](${link.url}): ${link.description}`).join("\n")}
- Contact: ${SITE_AUTHOR.contact}
`;

    return new Response(content, { headers: markdownHeaders });
  }

  // 2. ブログ一覧
  if (normalizedPath === "/blog") {
    const posts = getSortedPostsData();
    const list = posts
      .map((post) => {
        const tags = post.tags?.length ? `Tags: ${post.tags.join(", ")}` : "";
        return `## [${post.title}](${SITE_URL}/blog/${post.slug})

- Date: ${post.date}
- URL: ${SITE_URL}/blog/${post.slug}${tags ? `\n- ${tags}` : ""}
`;
      })
      .join("\n");

    const content = `# Blog — ${SITE_NAME}

Technical articles, architecture breakdowns, and personal notes.

${list || "No posts found."}
`;

    return new Response(content, { headers: markdownHeaders });
  }

  // 3. ブログ個別記事
  if (normalizedPath.startsWith("/blog/")) {
    const slug = normalizedPath.slice("/blog/".length);

    // パストラバーサル防止（slug は英数字・ハイフン・アンダースコアのみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return notFoundMarkdown(targetPath, markdownHeaders);
    }

    const post = getRawPostContent(slug);

    if (!post) {
      return notFoundMarkdown(targetPath, markdownHeaders);
    }

    const { metadata, content } = post;
    const tags = metadata.tags?.length
      ? `\n- Tags: ${metadata.tags.join(", ")}`
      : "";

    const markdown = `# ${metadata.title}

- Published: ${metadata.date}
- URL: ${SITE_URL}/blog/${slug}${tags}

---

${content.trim()}
`;

    return new Response(markdown, { headers: markdownHeaders });
  }

  // 4. 写真ギャラリー
  if (normalizedPath === "/photography") {
    const photos = photographyItems
      .map(
        (photo) =>
          `### ${photo.title}${photo.date ? ` (${photo.date})` : ""}

- Description: ${photo.description}
`,
      )
      .join("\n");

    const content = `# Photography — ${SITE_NAME}

A collection of photographs captured by ${SITE_AUTHOR.name}.

${photos || "No photographs yet."}
`;

    return new Response(content, { headers: markdownHeaders });
  }

  return notFoundMarkdown(targetPath, markdownHeaders);
  } catch (error) {
    console.error("Markdown negotiation error:", error);
    return new Response(
      `# 500 — Server Error

An error occurred while generating the Markdown representation.
`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
        },
      },
    );
  }
}

function notFoundMarkdown(
  targetPath: string,
  headers: Record<string, string>,
) {
  return new Response(
    `# 404 — Page Not Found

The path \`${targetPath}\` was not found on ${SITE_URL}.
`,
    { status: 404, headers },
  );
}
