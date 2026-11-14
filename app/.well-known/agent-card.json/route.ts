import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/agent-card.json — A2A (Agent-to-Agent) Protocol Agent Card.
 * Allows other AI agents to discover and interact with Canooopus's agent interface.
 */
export async function GET() {
  const agentCard = {
    name: `${SITE_NAME} Agent`,
    version: "1.0.0",
    description:
      "Personal AI agent for Canooopus's portfolio, providing information on projects, technical articles, and design works.",
    supportedInterfaces: [
      {
        url: `${SITE_URL}/api/a2a`,
        protocol: "json-rpc-2.0",
        transport: "http",
      },
    ],
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    skills: [
      {
        id: "portfolio-guide",
        name: "Portfolio & Projects Guide",
        description:
          "Retrieve project details, tech stack, and background of Canooopus's works including Bond.",
      },
      {
        id: "blog-search",
        name: "Blog & Tech Articles",
        description:
          "Search and retrieve technical blog posts about Next.js, image optimization, and UI engineering.",
      },
    ],
  };

  return Response.json(agentCard, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
