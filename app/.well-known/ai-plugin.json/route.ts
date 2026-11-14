import { SITE_AUTHOR, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /.well-known/ai-plugin.json — AI プラグイン / エージェント向けの discovery manifest。
 * 実際に呼び出せる API は /openapi.json に記載している。
 */
export async function GET() {
  const manifest = {
    schema_version: "v1",
    name_for_model: "canooopus_site",
    name_for_human: "Canooopus Portfolio & Content",
    description_for_model:
      "Discovery catalog for Canooopus. Read the developer profile, featured projects including Bond (a browser-based chat app), the full technical blog archive, and photography highlights.",
    description_for_human:
      "Portfolio information, Bond chat app details, blog articles, and photography by Canooopus.",
    auth: {
      type: "none",
    },
    api: {
      type: "openapi",
      url: `${SITE_URL}/openapi.json`,
    },
    logo_url: `${SITE_URL}/icon.png`,
    contact_email: SITE_AUTHOR.email,
    legal_info_url: SITE_URL,
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
