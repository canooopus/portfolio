export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export async function GET() {
  const pluginManifest = {
    schema_version: "v1",
    name_for_model: "canooopus_site",
    name_for_human: "Canooopus Portfolio & Content",
    description_for_model:
      "Plugin and discovery catalog for Canooopus. Access developer profile, featured projects including Bond (browser-based chat app), full technical blog archives, and photography highlights.",
    description_for_human:
      "Access portfolio information, Bond chat app details, and blog articles by Canooopus.",
    auth: {
      type: "none",
    },
    api: {
      type: "openapi",
      url: `${BASE_URL}/openapi.json`,
    },
    logo_url: `${BASE_URL}/icon.png`,
    contact_email: "https://github.com/canooopus",
    legal_info_url: `${BASE_URL}`,
  };

  return Response.json(pluginManifest, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
