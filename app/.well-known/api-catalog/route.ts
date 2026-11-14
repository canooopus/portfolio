import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/api-catalog — RFC 9727 API Catalog.
 * Returns application/linkset+json describing APIs, OpenAPI specs, docs, and health status.
 */
export async function GET() {
  const catalog = {
    linkset: [
      {
        anchor: `${SITE_URL}/api`,
        "service-desc": [
          {
            href: `${SITE_URL}/openapi.json`,
            type: "application/vnd.oai.openapi+json",
          },
        ],
        "service-doc": [
          {
            href: `${SITE_URL}/llms.txt`,
            type: "text/plain",
          },
        ],
        status: [
          {
            href: `${SITE_URL}/api/health`,
            type: "application/json",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/linkset+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
