import { getSortedPostsData, getRawPostContent } from "@/features/blog/posts";
import { photographyItems } from "@/features/photography/photographyItems";

export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export async function GET() {
  const posts = getSortedPostsData();

  const postsFullContent = posts
    .map((post) => {
      const raw = getRawPostContent(post.slug);
      const content = raw ? raw.content.trim() : "";
      const tagsStr = post.tags && post.tags.length > 0 ? `Tags: ${post.tags.join(", ")}\n` : "";

      return `---
### Post: ${post.title}
URL: ${BASE_URL}/blog/${post.slug}
Date: ${post.date}
${tagsStr}
${content}
`;
    })
    .join("\n\n");

  const photosList = photographyItems
    .map((photo) => `- **${photo.title}**${photo.date ? ` (${photo.date})` : ""}: ${photo.description}`)
    .join("\n");

  const fullText = `# Canooopus - Complete Site Documentation (llms-full.txt)

> Comprehensive documentation and complete content archive of Canooopus' portfolio and blog. Designed for AI systems and LLM context digestion.

## About Canooopus

Canooopus is an engineer and designer based in Japan. He builds what he wants to build independently, specializing in modern web development, UI/UX design, and web applications.
Interests include photography, exploring new gadgets, and Japanese rock band RADWIMPS.

- Primary Technologies: Next.js (App Router), TypeScript, React, Tailwind CSS, Sharp, Vercel, Cloudflare R2 & Workers.
- Location: Japan
- Role: Engineer & Designer

## Featured Projects

### Bond
- URL: https://robopro2.com/app/nagasima/LINE/
- Type: Browser-based real-time chat application
- Description: An independently designed and built chat app with intuitive messaging UI, real-time communication, and responsive layout.

## Core Navigation & Pages

- [Home](${BASE_URL}/): Portfolio homepage featuring an overview of Canooopus, project showcase for Bond, curated playlists, and photo albums.
- [Blog](${BASE_URL}/blog): Technical articles, personal website development insights, image optimization architecture, and Markdown guides.
- [Photography](${BASE_URL}/photography): Photography gallery capturing landscapes, urban life, and travel moments.

## Photography Gallery Highlights

${photosList}

## Social Profiles & Contact

- [GitHub](https://github.com/canooopus): Open source projects, experiments, and source code.
- [X (formerly Twitter)](https://x.com/Canopus1170612): Social updates, thoughts, and announcements.
- [Website](${BASE_URL}): Official portfolio and personal website.

================================================================================
## Blog Posts (Full Archive)
================================================================================

${postsFullContent}
`;

  return new Response(fullText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
