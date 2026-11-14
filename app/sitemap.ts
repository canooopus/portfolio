import type { MetadataRoute } from "next";
import { getSortedPostsData } from "@/features/blog/posts";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml には HTML ページだけを含める（llms.txt などのアセットは含めない）。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getSortedPostsData();
  const latestPostDate = posts[0]?.date ? new Date(posts[0].date) : new Date();
  const latestModified = isNaN(latestPostDate.getTime())
    ? new Date()
    : latestPostDate;

  // ブログ個別記事の URL 一覧
  const postUrls: MetadataRoute.Sitemap = posts.map((post) => {
    let lastModified = latestModified;
    if (post.date) {
      const parsedDate = new Date(post.date);
      if (!isNaN(parsedDate.getTime())) {
        lastModified = parsedDate;
      }
    }

    return {
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    };
  });

  // 静的ページの URL
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: latestModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/photography`,
      lastModified: latestModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  return [...staticUrls, ...postUrls];
}
