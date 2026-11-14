import type { MetadataRoute } from "next";
import { AI_CRAWLERS, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // AI / LLM クローラーを明示的に許可する
        userAgent: [...AI_CRAWLERS],
        allow: "/",
        other: {
          "Content-Signal": "ai-train=no, search=yes, ai-input=no",
        },
      },
      {
        userAgent: "*",
        allow: "/",
        other: {
          "Content-Signal": "ai-train=no, search=yes, ai-input=no",
        },
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  };
}
