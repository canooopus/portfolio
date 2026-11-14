import { SITE_AUTHOR, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /auth.md — Agent Authentication and Registration Specification (WorkOS auth.md format).
 * Informs AI agents about authentication policy, public endpoints, rate limits, and registration.
 */
export async function GET() {
  const content = `# Authentication & Agent Access Policy — ${SITE_NAME}

Welcome AI agents and developers. This document outlines how automated agents and crawlers can interact with ${SITE_URL}.

## Public Read-Only Access

All standard discovery and content endpoints on this site are **public and require no authentication**:

- \`/llms.txt\` and \`/llms-full.txt\`: Summary and complete archive of site content.
- \`/openapi.json\`: OpenAPI 3.1.0 specification.
- \`/.well-known/api-catalog\`: RFC 9727 API Catalog.
- \`/.well-known/agent-card.json\`: A2A Agent Card.
- \`/.well-known/mcp/server-card.json\`: Model Context Protocol Server Card.
- \`/.well-known/ai-catalog.json\`: ARD resource discovery manifest.
- \`/.well-known/poppy.json\`: Personal Agent Protocol manifest.
- \`Accept: text/markdown\` content negotiation: All HTML routes return clean Markdown representations.

## Authentication Details

- **Protected APIs**: None currently. All content is freely accessible.
- **Supported Identity Types**: \`agent\`, \`service\`
- **Credential Types**: \`none\` (Public), \`api_key\` (optional future)
- **Supported Scopes**: \`read\`
- **OAuth Authorization Server**: \`${SITE_URL}/.well-known/oauth-authorization-server\`
- **OAuth Protected Resource**: \`${SITE_URL}/.well-known/oauth-protected-resource\`
- **OpenID Configuration**: \`${SITE_URL}/.well-known/openid-configuration\`

## Rate Limits & Politeness Guidelines

- **Politeness Delay**: We recommend a crawl delay of 1-2 seconds between requests.
- **Cache Respect**: Please respect HTTP Cache-Control headers (\`max-age=3600\`).
- **User-Agent**: Please send an informative User-Agent identifying your agent or bot.
- **Content-Signal**: AI preferences are declared in \`/robots.txt\` (\`ai-train=no, search=yes, ai-input=no\`).

## Agent Registration & Developer Contact

For special access requests, partnership queries, or abuse reporting, contact the site maintainer:

- **Maintainer**: ${SITE_AUTHOR.name}
- **Contact Email**: ${SITE_AUTHOR.email}
- **Developer Profile**: ${SITE_AUTHOR.github}
- **Registration URI**: \`${SITE_URL}/auth.md\`
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
