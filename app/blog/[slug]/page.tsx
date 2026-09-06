import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostData, getSortedPostsData } from "@/features/blog/posts";
import { Inter } from "next/font/google";
import MermaidScript from "@/components/markdown/MermaidScript";
import CodeCopyScript from "@/components/markdown/CodeCopyScript";

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

// 記事ごとにSEO用メタデータを動的作成
export async function generateMetadata({ params }: PostProps) {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    return {
      title: "Not Found | Canooopus",
    };
  }

  return {
    title: `${post.title} | Canooopus`,
    description: "Canooopus'blog",
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

  return (
    <div className={`w-full min-h-screen relative ${inter.className}`}>
      {/* ブログ一覧へ戻るナビゲーション */}
      <div className="absolute lg:fixed top-6 left-6 z-10 animate-fade-up">
        <Link
          href="/blog"
          className="text-neutral-500 hover:text-neutral-950 transition-colors inline-flex items-center"
          aria-label="Back to Blog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.5em"
            height="1.5em"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            >
              <path d="m9 14l-4-4l4-4" />
              <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
            </g>
          </svg>
        </Link>
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-20 selection:bg-blue-100 animate-fade-up">
        {/* 記事のタイトル・投稿日ヘッダー */}
        <header className="mb-10 lg:mt-14">
          {/* タイトルを上に配置 */}
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight leading-snug mb-5">
            {post.title}
          </h1>
          {/* 日付を下に配置し、「posted」と日付で色を分けています */}
          <div className="text-sm flex items-center gap-2">
            <span className="text-neutral-400">Posted</span>
            <time className="text-neutral-800">{formatDate(post.date)}</time>
          </div>
        </header>

        {/* 記事本文 */}
        {post.contentHtml && (
          <>
            <article
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
            <MermaidScript />
            <CodeCopyScript />
          </>
        )}
      </main>
    </div>
  );
}
