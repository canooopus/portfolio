import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/poppy.json — Personal Agent Protocol (Poppy) Discovery Manifest.
 */
export async function GET() {
  const host = new URL(SITE_URL).host;

  // このサイトは公開の読み取り専用サイトで、Poppy の agent/apis/session
  // インターフェース（OAuth 発行・失効）は実装していない。
  // 実装していない capability を宣言すると issuer 検証で落ちるため、
  // spec の website-only 形式（web: {} のみ）を返す。
  const manifest = {
    protocol_version: "0.1",
    organization: {
      name: SITE_NAME,
      domain: host,
    },
    web: {},
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
