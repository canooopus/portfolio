import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostData, getSortedPostsData } from "@/lib/posts";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: "400" });

interface PostProps {
  params: Promise<{ slug: string }>;
}

// 1. 各記事の静的パス一覧を事前に定義（ビルド時にSSGを有効にします）
export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 2. 記事ごとにSEO用メタデータを動的作成
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

// 3. 記事詳細ページの本体
export default async function BlogPostPage({ params }: PostProps) {
  const { slug } = await params;
  const post = await getPostData(slug);

  // 該当する記事が存在しない場合は自動的に404ページへリダイレクトします
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
    <div className={`w-full min-h-screen ${inter.className}`}>
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-20 selection:bg-blue-100">
        
        {/* ブログ一覧へ戻るナビゲーション */}
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="text-xs text-neutral-500 hover:text-neutral-950 transition-colors inline-flex items-center gap-1"
          >
            ← Back to Blog
          </Link>
        </div>

        {/* 記事のタイトル・投稿日ヘッダー */}
        <header className="mb-10">
          <time className="text-xs text-neutral-400 block mb-3">
            {formatDate(post.date)}
          </time>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight leading-snug">
            {post.title}
          </h1>
        </header>

        {/* 記事本文（Step 4で定義した .blog-content を適用して描画） */}
        {post.contentHtml && (
          <article 
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
          />
        )}
      </main>
    </div>
  );
}