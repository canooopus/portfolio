import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPostData,
  getSortedPostsData,
  getPostMetadata,
} from "@/features/blog/posts";
import { Inter } from "next/font/google";
import MermaidScript from "@/components/markdown/MermaidScript";
import CodeCopyScript from "@/components/markdown/CodeCopyScript";
import BlogImageModal from "@/components/markdown/BlogImageModal";
import FootnoteScrollScript from "@/components/markdown/FootnoteScrollScript";
import TagList from "@/components/blog/TagList";
import TableOfContents from "@/components/blog/TableOfContents";

// 1. weightの指定を外すことで、太字（Bold）が正しく適用されるようにします
const inter = Inter({ subsets: ["latin"] });

interface PostProps {
  params: Promise<{ slug: string }>;
}

// 各記事の静的パス一覧を事前に定義
export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 記事ごとにSEO用メタデータを動的作成（フロントマターのみ高速取得）
export async function generateMetadata({ params }: PostProps) {
  const { slug } = await params;
  const post = getPostMetadata(slug);

  if (!post) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: post.title,
    description: `${post.title} - Canooopus' blog`,
    openGraph: {
      title: post.title,
      description: `${post.title} - Canooopus' blog`,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: `${post.title} - Canooopus' blog`,
    },
  };
}

// 記事詳細ページの本体
export default async function BlogPostPage({ params }: PostProps) {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const toc = post.toc ?? [];
  const hasToc = post.showToc !== false && toc.length >= 2;

  return (
    <div className={`w-full min-h-screen relative ${inter.className}`}>
      {/* ブログ一覧へ戻るナビゲーション */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-16 z-10 animate-fade-up ${
          hasToc ? "min-[1080px]:fixed min-[1080px]:top-25" : ""
        }`}
      >
        <div
          className={
            hasToc
              ? "mx-auto max-w-2xl px-6 min-[1080px]:mx-0 min-[1080px]:max-w-none min-[1080px]:px-0"
              : "mx-auto max-w-2xl px-6"
          }
        >
          <Link
            href="/blog"
            className={`pointer-events-auto text-neutral-400 hover:text-neutral-950 transition-colors inline-flex items-center ${
              hasToc ? "min-[1080px]:ml-[calc(25%-228px)]" : ""
            }`}
            aria-label="Back to Blog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.125em"
              height="1.125em"
              viewBox="0 0 24 24"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <path d="m9 14l-4-4l4-4" />
                <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
              </g>
            </svg>
            <span className="ml-1 text-sm font-normal selection:bg-blue-100">
              Archive
            </span>
          </Link>
        </div>
      </div>

      {/* 目次（記事の外側・左側に固定表示。h2 が2つ以上ある場合のみ） */}
      {hasToc && <TableOfContents items={toc} />}

      {/* 目次が非表示のときは上部の余白を広めに取る */}
      <main
        className={`max-w-2xl mx-auto px-6 pb-20 selection:bg-blue-100 animate-fade-up pt-32 ${
          hasToc ? "min-[1080px]:pt-24" : ""
        }`}
      >
        {/* 記事のタイトル・投稿日ヘッダー */}
        <header className="mb-10">
          {/* タイトルを上に配置 */}
          <h1 className="text-base font-semibold text-neutral-900 tracking-tight leading-snug mb-3">
            {post.title}
          </h1>
          {/* 日付を下に配置し、「posted」と日付で色を分けています */}
          <div className="text-sm flex items-center gap-2">
            <span className="text-neutral-400">Posted</span>
            <time className="text-neutral-800">{formatDate(post.date)}</time>
          </div>
          {post.tags?.length ? (
            <TagList tags={post.tags} className="mt-3 flex flex-wrap gap-1.5" />
          ) : null}
        </header>

        {/* 記事本文 */}
        {post.contentHtml && (
          <>
            <article
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
            {post.hasMermaid && <MermaidScript />}
            <CodeCopyScript />
            <BlogImageModal />
            <FootnoteScrollScript />
          </>
        )}
      </main>
    </div>
  );
}
