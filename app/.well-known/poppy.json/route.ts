import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/poppy.json — Personal Agent Protocol (Poppy) Discovery Manifest.
 */
export async function GET() {
  const host = new URL(SITE_URL).host;

  const manifest = {
    protocol_version: "0.1",
    organization: {
      name: SITE_NAME,
      domain: host,
    },
    web: {},
    apis: {
      openapi: `${SITE_URL}/openapi.json`,
      health: `${SITE_URL}/api/health`,
    },
    agent: {
      name: `${SITE_NAME} Agent`,
      card: `${SITE_URL}/.well-known/agent-card.json`,
    },
    auth: {
      issuer: SITE_URL,
    },
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
