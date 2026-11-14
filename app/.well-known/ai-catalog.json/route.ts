import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/ai-catalog.json — ARD (Agentic Resource Discovery) Capability Manifest.
 * Allows AI agents to discover MCP servers, A2A agents, OpenAPI schemas, and Agent Skills.
 */
export async function GET() {
  const host = new URL(SITE_URL).host;

  const catalog = {
    $schema: "https://agenticresourcediscovery.org/schemas/v1/ai-catalog.json",
    specVersion: "1.0",
    host: {
      name: SITE_NAME,
      domain: host,
      description: SITE_DESCRIPTION,
    },
    entries: [
      {
        id: `urn:air:${host}:api:openapi`,
        displayName: `${SITE_NAME} OpenAPI Specification`,
        type: "application/vnd.oai.openapi+json",
        url: `${SITE_URL}/openapi.json`,
        representativeQueries: [
          "What APIs does Canooopus provide?",
          "OpenAPI schema for blog and portfolio",
          "API specification",
        ],
      },
      {
        id: `urn:air:${host}:catalog:api-catalog`,
        displayName: `${SITE_NAME} API Catalog (RFC 9727)`,
        type: "application/linkset+json",
        url: `${SITE_URL}/.well-known/api-catalog`,
        representativeQueries: [
          "API catalog discovery",
          "Linkset of service descriptors and status",
          "RFC 9727 catalog",
        ],
      },
      {
        id: `urn:air:${host}:mcp:server-card`,
        displayName: `${SITE_NAME} MCP Server Card`,
        type: "application/json",
        url: `${SITE_URL}/.well-known/mcp/server-card.json`,
        representativeQueries: [
          "Connect via Model Context Protocol",
          "MCP server card and capabilities",
          "Tools for blog and projects",
        ],
      },
      {
        id: `urn:air:${host}:a2a:agent-card`,
        displayName: `${SITE_NAME} A2A Agent Card`,
        type: "application/json",
        url: `${SITE_URL}/.well-known/agent-card.json`,
        representativeQueries: [
          "Agent-to-agent discovery card",
          "A2A communication interface",
          "Canooopus agent skills",
        ],
      },
      {
        id: `urn:air:${host}:skills:portfolio-guide`,
        displayName: `${SITE_NAME} Portfolio Guide Skill`,
        type: "text/markdown",
        url: `${SITE_URL}/.well-known/agent-skills/portfolio-guide/SKILL.md`,
        representativeQueries: [
          "How to navigate Canooopus portfolio",
          "Project information on Bond and blog",
          "Agent skills instructions",
        ],
      },
      {
        id: `urn:air:${host}:doc:llms-txt`,
        displayName: `${SITE_NAME} Summary (llms.txt)`,
        type: "text/plain",
        url: `${SITE_URL}/llms.txt`,
        representativeQueries: [
          "Summary of Canooopus profile",
          "Overview of blog posts and projects",
          "llms.txt site guide",
        ],
      },
    ],
  };

  return Response.json(catalog, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
