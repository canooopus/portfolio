import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/mcp/server-card.json — SEP-1649 MCP Server Card.
 * Allows AI agents to discover the Model Context Protocol endpoint and capabilities.
 */
export async function GET() {
  const card = {
    $schema: "https://modelcontextprotocol.io/schemas/server-card.json",
    serverInfo: {
      name: "canooopus-portfolio-mcp",
      version: "1.0.0",
      title: `${SITE_NAME} Portfolio MCP Server`,
      description:
        "Model Context Protocol server for Canooopus's portfolio, featured projects (Bond), technical blog posts, and photography highlights.",
    },
    transport: {
      type: "sse",
      endpoint: `${SITE_URL}/api/mcp`,
    },
    capabilities: {
      tools: {
        listChanged: false,
      },
      resources: {
        subscribe: false,
        listChanged: false,
      },
      prompts: {
        listChanged: false,
      },
    },
  };

  return Response.json(card, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
