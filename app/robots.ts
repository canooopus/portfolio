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
          // ARD の追加 discovery mechanism（well-known の代替導線）
          Agentmap: `${SITE_URL}/.well-known/ai-catalog.json`,
        },
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  };
}
