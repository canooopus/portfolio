import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/oauth-protected-resource — RFC 9728 OAuth 2.0 Protected Resource Metadata.
 * Informs AI agents about authorization servers and scopes required to access site resources.
 */
export async function GET() {
  const metadata = {
    resource: SITE_URL,
    authorization_servers: [SITE_URL],
    scopes_supported: ["read"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${SITE_URL}/auth.md`,
  };

  return Response.json(metadata, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
