import { photographyItems } from "@/features/photography/photographyItems";
import type { PostData } from "@/features/blog/posts";
import { resolveOptimizedImage } from "@/lib/imageVariants";
import {
  BOND_PROJECT,
  KNOWS_ABOUT,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "./site";

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const BOND_ID = `${SITE_URL}/#project-bond`;

export const personSchema = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: SITE_AUTHOR.name,
  url: SITE_AUTHOR.url,
  jobTitle: SITE_AUTHOR.jobTitle,
  description: SITE_AUTHOR.description,
  sameAs: [SITE_AUTHOR.github, SITE_AUTHOR.x],
  knowsAbout: [...KNOWS_ABOUT],
};

export const websiteSchema = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  author: { "@id": PERSON_ID },
  inLanguage: ["ja", "en"],
};

/** トップページ用: Person / WebSite / Bond（SoftwareApplication） */
export function homeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personSchema,
      websiteSchema,
      {
        "@type": "SoftwareApplication",
        "@id": BOND_ID,
        name: BOND_PROJECT.name,
        applicationCategory: BOND_PROJECT.applicationCategory,
        operatingSystem: BOND_PROJECT.operatingSystem,
        url: BOND_PROJECT.url,
        description: BOND_PROJECT.description,
        author: { "@id": PERSON_ID },
      },
    ],
  };
}

/** 単体ページでも解決できるよう、@id 参照ではなくインラインで人物を表す */
const personInline = {
  "@type": "Person",
  name: SITE_AUTHOR.name,
  url: SITE_AUTHOR.url,
  sameAs: [SITE_AUTHOR.github, SITE_AUTHOR.x],
};

/** ブログ一覧用: Blog + BlogPosting の一覧 */
export function blogListStructuredData(posts: PostData[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    name: "Canooopus' Blog",
    url: `${SITE_URL}/blog`,
    description:
      "Technical articles, architecture breakdowns, and personal notes by Canooopus.",
    inLanguage: "ja",
    author: personInline,
    publisher: personInline,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      author: personInline,
    })),
  };
}

/** ブログ記事用: BlogPosting */
export function blogPostStructuredData(post: PostData) {
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: `${post.title} - Canooopus' blog`,
    datePublished: post.date,
    dateModified: post.date,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: personInline,
    publisher: personInline,
    keywords: post.tags,
    inLanguage: "ja",
    image: `${SITE_URL}/opengraph-image.png`,
  };
}

/** 写真ページ用: ImageGallery */
export function photographyStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": `${SITE_URL}/photography#gallery`,
    name: "Photography — Canooopus",
    url: `${SITE_URL}/photography`,
    description: "A collection of photographs by Canooopus.",
    about: personInline,
    image: photographyItems.map((photo) => ({
      "@type": "ImageObject",
      name: photo.title,
      description: photo.description,
      datePublished: photo.date,
      contentUrl: new URL(resolveOptimizedImage(photo.src).defaultSrc, SITE_URL)
        .href,
    })),
  };
}
