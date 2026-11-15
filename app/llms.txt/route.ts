import { getSortedPostsData } from "@/features/blog/postSource";
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
 * /llms.txt — LLM / AI エージェント向けのサイト要約。
 * https://llmstxt.org/ のフォーマット（H1 → 要約 blockquote → リンク集）に従う。
 */
export async function GET() {
  const posts = getSortedPostsData();

  const blogList = posts
    .map((post) => {
      const tags = post.tags?.length ? ` [${post.tags.join(", ")}]` : "";
      return `- [${post.title}](${SITE_URL}/blog/${post.slug})${tags}: Published on ${post.date}`;
    })
    .join("\n");

  const content = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## About

${SITE_AUTHOR.name} is an ${SITE_AUTHOR.jobTitle.toLowerCase()} living in ${SITE_AUTHOR.location}, building web applications and digital tools independently.

- Role: ${SITE_AUTHOR.jobTitle}
- Location: ${SITE_AUTHOR.location}
- Primary technologies: Next.js (App Router), TypeScript, React, Tailwind CSS, Sharp, Vercel, Cloudflare R2 & Workers
- Interests: photography, new gadgets, and the Japanese rock band RADWIMPS

## Featured Projects

- [${BOND_PROJECT.name}](${BOND_PROJECT.url}): ${BOND_PROJECT.description}

## Pages

- [Home](${SITE_URL}/): Portfolio homepage with an introduction, the Bond project, playlists, and selected photographs.
- [Blog](${SITE_URL}/blog): Technical articles and notes about web development, this website's image pipeline, and Markdown.
- [Photography](${SITE_URL}/photography): A photography gallery of landscapes, cities, and travel moments.

## Blog Posts

${blogList || "- No posts yet."}

## Social Profiles & Contact

${SOCIAL_LINKS.map((link) => `- [${link.label}](${link.url}): ${link.description}`).join("\n")}
- Contact: ${SITE_AUTHOR.contact}

## Machine-Readable Resources

- [Full archive (llms-full.txt)](${SITE_URL}/llms-full.txt): Every blog post in plain Markdown, plus the site overview.
- [Markdown negotiation](${SITE_URL}/api/markdown?path=/blog): Send \`Accept: text/markdown\` to any HTML page URL to receive a Markdown representation.
- [OpenAPI specification](${SITE_URL}/openapi.json): Machine-readable list of discovery and content endpoints.
- [API Catalog (RFC 9727)](${SITE_URL}/.well-known/api-catalog): Linkset format catalog of APIs, docs, and health endpoint.
- [Agent Skills Index](${SITE_URL}/.well-known/agent-skills/index.json): Discovery index for AI agent skills per RFC v0.2.0.
- [MCP Server Card](${SITE_URL}/.well-known/mcp/server-card.json): Model Context Protocol server capabilities and SSE transport.
- [A2A Agent Card](${SITE_URL}/.well-known/agent-card.json): Agent-to-Agent discovery manifest.
- [ARD Catalog](${SITE_URL}/.well-known/ai-catalog.json): Agentic Resource Discovery manifest.
- [Poppy Manifest](${SITE_URL}/.well-known/poppy.json): Personal Agent Protocol discovery.
- [Agent Auth (auth.md)](${SITE_URL}/auth.md): Agent registration and authentication guide.
- [AI plugin manifest](${SITE_URL}/.well-known/ai-plugin.json): Discovery manifest pointing at the OpenAPI catalog.
- [Sitemap](${SITE_URL}/sitemap.xml): All public HTML pages.
- [Robots policy](${SITE_URL}/robots.txt): Crawler rules and Content-Signal declarations.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
