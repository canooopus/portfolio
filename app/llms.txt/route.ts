import { getSortedPostsData } from "@/features/blog/posts";

export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export async function GET() {
  const posts = getSortedPostsData();

  const blogListMarkdown = posts
    .map((post) => {
      const tagsStr = post.tags && post.tags.length > 0 ? ` [${post.tags.join(", ")}]` : "";
      return `- [${post.title}](${BASE_URL}/blog/${post.slug})${tagsStr}: Published on ${post.date}`;
    })
    .join("\n");

  const content = `# Canooopus

> Portfolio and blog of Canooopus, an engineer & designer living in Japan who independently creates web applications, tools, and visual experiences.

## About Canooopus

Canooopus is an engineer and designer based in Japan. He builds what he wants to build independently, specializing in modern web development, UI/UX design, and web applications.
Interests include photography, exploring new gadgets, and Japanese rock band RADWIMPS.

- Primary Technologies: Next.js (App Router), TypeScript, React, Tailwind CSS, Sharp, Vercel, Cloudflare R2 & Workers.
- Location: Japan
- Role: Engineer & Designer

## Featured Projects

- [Bond](https://robopro2.com/app/nagasima/LINE/): A browser-based chat application developed independently by Canooopus.

## Core Navigation

- [Home](${BASE_URL}/): Portfolio homepage featuring an overview of Canooopus, project showcase for Bond, curated playlists, and photo albums.
- [Blog](${BASE_URL}/blog): Technical articles, personal website development insights, image optimization architecture, and Markdown guides.
- [Photography](${BASE_URL}/photography): Photography gallery capturing landscapes, urban life, and travel moments.

## Blog Posts

${blogListMarkdown}

## Links & Social Profiles

- [GitHub](https://github.com/canooopus): Open source projects, experiments, and source code.
- [X (formerly Twitter)](https://x.com/Canopus1170612): Social updates, thoughts, and announcements.
- [Website](${BASE_URL}): Official portfolio and personal website.

## Optional Discovery Files

- [Full Content (llms-full.txt)](${BASE_URL}/llms-full.txt): Comprehensive text including full blog posts and complete context.
- [Sitemap](${BASE_URL}/sitemap.xml): Complete XML sitemap of all public pages.
- [Robots.txt](${BASE_URL}/robots.txt): Crawler rules allowing AI agents and web crawlers.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
