import { type NextRequest } from "next/server";
import { getSortedPostsData, getRawPostContent } from "@/features/blog/posts";
import { BOND_PROJECT, SITE_AUTHOR, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const TOOLS = [
  {
    name: "get_profile",
    description: "Get Canooopus's profile, biography, tech stack, and featured projects like Bond.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_posts",
    description: "List all published blog posts with titles, dates, tags, and slugs.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_post",
    description: "Get full Markdown content of a specific blog post by its slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Post slug identifier (e.g. custom_image_optimization_pipeline)",
        },
      },
      required: ["slug"],
    },
  },
];

export async function GET() {
  return Response.json(
    {
      name: "canooopus-portfolio-mcp",
      version: "1.0.0",
      protocolVersion: "2024-11-05",
      tools: TOOLS,
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

    if (method === "initialize") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "canooopus-portfolio-mcp",
            version: "1.0.0",
          },
          capabilities: {
            tools: {},
          },
        },
      });
    }

    if (method === "tools/list") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS,
        },
      });
    }

    if (method === "tools/call") {
      const toolName = body?.params?.name;
      const args = body?.params?.arguments ?? {};

      if (toolName === "get_profile") {
        return Response.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    author: SITE_AUTHOR,
                    featuredProject: BOND_PROJECT,
                    siteUrl: SITE_URL,
                  },
                  null,
                  2,
                ),
              },
            ],
          },
        });
      }

      if (toolName === "list_posts") {
        const posts = getSortedPostsData();
        return Response.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(posts, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === "get_post") {
        const slug = String(args.slug || "");
        const post = getRawPostContent(slug);
        if (!post) {
          return Response.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: `Post not found: ${slug}` },
          });
        }
        return Response.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: post.content,
              },
            ],
          },
        });
      }

      return Response.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      });
    }

    if (method === "ping") {
      return Response.json({ jsonrpc: "2.0", id, result: {} });
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
