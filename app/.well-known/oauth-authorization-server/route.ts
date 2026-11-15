import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/oauth-authorization-server — RFC 8414 OAuth 2.0 Authorization Server Metadata.
 * Supports agent registration via agent_auth block (auth.md) and Poppy protocol binding (poppy_domains).
 */
export async function GET() {
  const host = new URL(SITE_URL).host;

  const metadata = {
    issuer: SITE_URL,
    authorization_endpoint: `${SITE_URL}/auth/authorize`,
    token_endpoint: `${SITE_URL}/api/auth/token`,
    jwks_uri: `${SITE_URL}/.well-known/jwks.json`,
    response_types_supported: ["token"],
    grant_types_supported: ["client_credentials"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
    scopes_supported: ["read"],
    poppy_domains: [host],
    agent_auth: {
      // auth.md スキルの場所（Auth.md spec の agent_auth.skill）
      skill: `${SITE_URL}/auth.md`,
      register_uri: `${SITE_URL}/auth.md`,
      // 公開サイトのため匿名アクセスが唯一の登録方法。
      // service / API キーは必要になった時点で追加する。
      identity_types_supported: ["anonymous"],
      anonymous: {
        credential_types_supported: ["none"],
        claim_uri: `${SITE_URL}/auth.md`,
      },
    },
  };

  return Response.json(metadata, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
