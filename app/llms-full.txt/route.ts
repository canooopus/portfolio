import { getSortedPostsData, getRawPostContent } from "@/features/blog/postSource";
import { photographyItems } from "@/features/photography/photographyItems";
import {
  BOND_PROJECT,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/lib/site";

export const dynamic = "force-static";

/**
 * /llms-full.txt — サイト全体と全ブログ記事の完全な Markdown アーカイブ。
 * 個別ページを巡回せずに文脈を得たい AI エージェント向け。
 */
export async function GET() {
  const posts = getSortedPostsData();

  const postsFullContent = posts
    .map((post) => {
      const raw = getRawPostContent(post.slug);
      const content = raw ? raw.content.trim() : "";
      const tags = post.tags?.length ? `Tags: ${post.tags.join(", ")}\n` : "";

      return `---
## ${post.title}

- URL: ${SITE_URL}/blog/${post.slug}
- Published: ${post.date}
${tags}
${content}
`;
    })
    .join("\n\n");

  const photosList = photographyItems
    .map(
      (photo) =>
        `- **${photo.title}**${photo.date ? ` (${photo.date})` : ""}: ${photo.description}`,
    )
    .join("\n");

  const fullText = `# ${SITE_NAME} — Complete Site Archive (llms-full.txt)

> ${SITE_DESCRIPTION}

## About

${SITE_AUTHOR.name} is an ${SITE_AUTHOR.jobTitle.toLowerCase()} living in ${SITE_AUTHOR.location}, building web applications and digital tools independently.

- Role: ${SITE_AUTHOR.jobTitle}
- Location: ${SITE_AUTHOR.location}
- Primary technologies: Next.js (App Router), TypeScript, React, Tailwind CSS, Sharp, Vercel, Cloudflare R2 & Workers
- Interests: photography, new gadgets, and the Japanese rock band RADWIMPS

## Featured Projects

### ${BOND_PROJECT.name}

- URL: ${BOND_PROJECT.url}
- Type: ${BOND_PROJECT.applicationCategory} (${BOND_PROJECT.operatingSystem})
- Description: ${BOND_PROJECT.description}

## Pages

- [Home](${SITE_URL}/): Portfolio homepage with an introduction, the Bond project, playlists, and selected photographs.
- [Blog](${SITE_URL}/blog): Technical articles and notes about web development, this website's image pipeline, and Markdown.
- [Photography](${SITE_URL}/photography): A photography gallery of landscapes, cities, and travel moments.

## Photography Gallery

${photosList || "- No photographs yet."}

## Social Profiles & Contact

${SOCIAL_LINKS.map((link) => `- [${link.label}](${link.url}): ${link.description}`).join("\n")}
- Contact: ${SITE_AUTHOR.contact}

## Blog Archive (Full Text)

${postsFullContent || "No posts yet."}
`;

  return new Response(fullText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
