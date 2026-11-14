import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/openid-configuration — OpenID Connect Discovery 1.0.
 */
export async function GET() {
  const config = {
    issuer: SITE_URL,
    authorization_endpoint: `${SITE_URL}/auth/authorize`,
    token_endpoint: `${SITE_URL}/api/auth/token`,
    jwks_uri: `${SITE_URL}/.well-known/jwks.json`,
    response_types_supported: ["token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "read"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
  };

  return Response.json(config, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
