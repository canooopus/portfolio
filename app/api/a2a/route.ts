import { type NextRequest } from "next/server";
import { BOND_PROJECT, SITE_AUTHOR, SITE_NAME, SITE_URL } from "@/lib/site";
import { getSortedPostsData } from "@/features/blog/posts";

export const dynamic = "force-dynamic";

/**
 * /api/a2a — A2A (Agent-to-Agent) JSON-RPC 2.0 communication endpoint.
 */
export async function GET() {
  return Response.json(
    {
      name: `${SITE_NAME} A2A Service`,
      protocol: "json-rpc-2.0",
      version: "1.0.0",
      status: "online",
      description: "Send POST requests with standard JSON-RPC 2.0 to communicate with this agent.",
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id ?? null;
    const method = body?.method;

    if (method === "agent/describe") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          name: `${SITE_NAME} Agent`,
          author: SITE_AUTHOR,
          featuredProjects: [BOND_PROJECT],
          siteUrl: SITE_URL,
        },
      });
    }

    if (method === "agent/skills") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          skills: [
            {
              id: "portfolio-guide",
              name: "Portfolio & Projects Guide",
              description: "Information about Canooopus and projects including Bond.",
            },
            {
              id: "blog-search",
              name: "Blog & Tech Articles",
              description: "Access to recent technical blog posts.",
            },
          ],
        },
      });
    }

    if (method === "blog/list") {
      const posts = getSortedPostsData();
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          posts: posts.slice(0, 10).map((p) => ({
            title: p.title,
            slug: p.slug,
            date: p.date,
            url: `${SITE_URL}/blog/${p.slug}`,
          })),
        },
      });
    }

    return Response.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  }
}
