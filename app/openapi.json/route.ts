import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /openapi.json — エージェントが利用できる読み取り専用エンドポイントのカタログ。
 * サイト内に存在する GET エンドポイントだけを記載する。
 */
export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Canooopus Portfolio & Content API",
      version: "1.0.0",
      description:
        "Read-only discovery and content endpoints for Canooopus's portfolio, blog, and photography gallery.",
      contact: {
        name: "Canooopus",
        url: "https://github.com/canooopus",
      },
    },
    servers: [
      {
        url: SITE_URL,
        description: "Production server",
      },
    ],
    paths: {
      "/llms.txt": {
        get: {
          summary: "Site summary in llms.txt format",
          description:
            "Structured Markdown summary of Canooopus, the Bond project, blog posts, and external links.",
          operationId: "getLlmsTxt",
          responses: {
            "200": {
              description: "Structured Markdown summary",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },
      "/llms-full.txt": {
        get: {
          summary: "Complete site archive",
          description:
            "Full text of every blog post plus the site overview and photography list.",
          operationId: "getLlmsFullTxt",
          responses: {
            "200": {
              description: "Full Markdown archive",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },
      "/api/markdown": {
        get: {
          summary: "Markdown representation of an HTML page",
          description:
            "Returns a Markdown version of /, /blog, /blog/{slug}, or /photography. Also used for Accept: text/markdown content negotiation.",
          operationId: "getMarkdown",
          parameters: [
            {
              name: "path",
              in: "query",
              required: false,
              description:
                "Target page path, for example /blog/custom_image_optimization_pipeline.",
              schema: {
                type: "string",
                default: "/",
              },
            },
          ],
          responses: {
            "200": {
              description: "Markdown content",
              content: {
                "text/markdown": {
                  schema: { type: "string" },
                },
              },
            },
            "404": {
              description: "Page not found",
            },
          },
        },
      },
      "/sitemap.xml": {
        get: {
          summary: "XML sitemap",
          description: "All public HTML pages with their last-modified dates.",
          operationId: "getSitemap",
          responses: {
            "200": {
              description: "XML sitemap",
              content: {
                "application/xml": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },
      "/robots.txt": {
        get: {
          summary: "Crawler policy",
          description:
            "Crawler rules. AI crawlers are explicitly allowed and the sitemap URL is listed.",
          operationId: "getRobotsTxt",
          responses: {
            "200": {
              description: "robots.txt",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };

  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
