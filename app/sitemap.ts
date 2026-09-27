import type { MetadataRoute } from "next";
import { getSortedPostsData } from "@/features/blog/posts";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getSortedPostsData();

  // ブログ個別記事の URL 一覧
  const postUrls: MetadataRoute.Sitemap = posts.map((post) => {
    let lastModified = new Date();
    if (post.date) {
      const parsedDate = new Date(post.date);
      if (!isNaN(parsedDate.getTime())) {
        lastModified = parsedDate;
      }
    }

    return {
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    };
  });

  // 静的ページの URL
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  return [...staticUrls, ...postUrls];
}
