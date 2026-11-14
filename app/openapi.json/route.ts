export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Canooopus Portfolio & Content API",
      version: "1.0.0",
      description:
        "OpenAPI specification for Canooopus's portfolio, blog content, and agent discovery endpoints.",
    },
    servers: [
      {
        url: BASE_URL,
        description: "Production Server",
      },
    ],
    paths: {
      "/llms.txt": {
        get: {
          summary: "Get site summary in llms.txt format",
          description:
            "Returns a structured Markdown summary of Canooopus, projects (including Bond), blog posts, and external links.",
          operationId: "getLlmsTxt",
          responses: {
            "200": {
              description: "Structured markdown summary",
              content: {
                "text/plain": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      "/llms-full.txt": {
        get: {
          summary: "Get full site documentation and blog post archive",
          description:
            "Returns the complete text content of all blog posts, project details, and site overview.",
          operationId: "getLlmsFullTxt",
          responses: {
            "200": {
              description: "Full markdown archive",
              content: {
                "text/plain": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      "/api/markdown": {
        get: {
          summary: "Get Markdown representation of pages (Content Negotiation)",
          description:
            "Returns clean Markdown formatted version of any site page (/ , /blog, /blog/{slug}, /photography).",
          operationId: "getMarkdownContent",
          parameters: [
            {
              name: "path",
              in: "query",
              required: false,
              description: "Target URL path to get markdown for (e.g. /blog/building_my_personal_website)",
              schema: {
                type: "string",
                default: "/",
              },
            },
          ],
          responses: {
            "200": {
              description: "Markdown content of requested page",
              content: {
                "text/markdown": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
            "404": {
              description: "Page not found",
            },
          },
        },
      },
    },
  };

  return Response.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
