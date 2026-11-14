import { NextRequest } from "next/server";
import { getSortedPostsData, getRawPostContent } from "@/features/blog/posts";
import { photographyItems } from "@/features/photography/photographyItems";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get("path") || "/";

  // URL を正規化 (末尾スラッシュ除去、ただし "/" はそのまま)
  const normalizedPath =
    targetPath.length > 1 && targetPath.endsWith("/")
      ? targetPath.slice(0, -1)
      : targetPath;

  const markdownHeaders = {
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: "Accept",
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  };

  // 1. トップページ
  if (normalizedPath === "" || normalizedPath === "/") {
    const posts = getSortedPostsData();
    const blogList = posts
      .slice(0, 5)
      .map(
        (p) =>
          `- [${p.title}](${BASE_URL}/blog/${p.slug}) (${p.date})${
            p.tags?.length ? ` [${p.tags.join(", ")}]` : ""
          }`,
      )
      .join("\n");

    const content = `# Canooopus

> Engineer & Designer living in Japan. I just build what I want to build independently.

## About Me

I’m Canooopus, an engineer & designer living in Japan. I build what I want to build independently.
Focused on modern web technologies (Next.js, TypeScript, React, Tailwind CSS), creative coding, and clean UI/UX.
In my free time, I enjoy photography, exploring new gadgets, and listening to RADWIMPS.

## Featured Projects

- [Bond](https://robopro2.com/app/nagasima/LINE/): A browser-based real-time chat application developed independently.

## Navigation

- [Home](${BASE_URL}/)
- [Blog](${BASE_URL}/blog)
- [Photography](${BASE_URL}/photography)
- [Discovery: llms.txt](${BASE_URL}/llms.txt)

## Recent Blog Posts

${blogList}

## Social & Links

- GitHub: https://github.com/canooopus
- X (Twitter): https://x.com/Canopus1170612
`;

    return new Response(content, { headers: markdownHeaders });
  }

  // 2. ブログ一覧ページ
  if (normalizedPath === "/blog") {
    const posts = getSortedPostsData();
    const list = posts
      .map((p) => {
        const tags = p.tags?.length ? ` | Tags: ${p.tags.join(", ")}` : "";
        return `## [${p.title}](${BASE_URL}/blog/${p.slug})\n\n- Date: ${p.date}${tags}\n- URL: ${BASE_URL}/blog/${p.slug}\n`;
      })
      .join("\n");

    const content = `# Blog - Canooopus

Archive of technical articles, architecture breakdowns, and personal insights.

${list}
`;

    return new Response(content, { headers: markdownHeaders });
  }

  // 3. ブログ個別記事 (/blog/[slug])
  if (normalizedPath.startsWith("/blog/")) {
    const slug = normalizedPath.replace(/^\/blog\//, "");
    const postData = getRawPostContent(slug);

    if (!postData) {
      return new Response("# 404 - Post Not Found\n\nThe requested blog post does not exist.", {
        status: 404,
        headers: markdownHeaders,
      });
    }

    const { metadata, content } = postData;
    const tagsStr = metadata.tags?.length ? `Tags: ${metadata.tags.join(", ")}\n` : "";

    const fullMarkdown = `# ${metadata.title}

- Published: ${metadata.date}
- URL: ${BASE_URL}/blog/${slug}
${tagsStr}
---

${content.trim()}
`;

    return new Response(fullMarkdown, { headers: markdownHeaders });
  }

  // 4. 写真ギャラリー (/photography)
  if (normalizedPath === "/photography") {
    const photos = photographyItems
      .map(
        (photo) =>
          `### ${photo.title}${photo.date ? ` (${photo.date})` : ""}\n- Description: ${photo.description}\n`,
      )
      .join("\n");

    const content = `# Photography - Canooopus

A collection of photography captured by Canooopus.

${photos}
`;

    return new Response(content, { headers: markdownHeaders });
  }

  // 5. その他
  return new Response(`# 404 - Page Not Found\n\nPath ${targetPath} was not found on this server.`, {
    status: 404,
    headers: markdownHeaders,
  });
}
