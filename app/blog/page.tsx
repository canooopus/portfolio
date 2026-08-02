import Link from "next/link";
import { getSortedPostsData } from "@/lib/posts";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: "400" });

export const metadata = {
  title: "Blog | Canooopus",
  description: "Canooopus'blog",
};

export default function BlogListPage() {
  const allPosts = getSortedPostsData();

  // 日付表示用のフォーマッター（英語表記に整えます）
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
        
        {/* ブログのヘッダーセクション */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-neutral-900">Blog</h1>
          <p className="mt-5 text-neutral-500 text-sm">
            Technical writing, thoughts, and updates.
          </p>
        </div>

        {/* 記事一覧 */}
        {allPosts.length === 0 ? (
          <p className="text-sm text-neutral-400">No posts found.</p>
        ) : (
          <div className="space-y-8">
            {allPosts.map((post) => (
              <article key={post.slug} className="group relative flex flex-col items-start">
                <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                  <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                    {/* カード全体をクリック可能にする透明なリンク */}
                    <span className="absolute -inset-y-2.5 -inset-x-4 z-0 rounded-2xl md:-inset-y-4 md:-inset-x-6" />
                    <span className="relative z-10">{post.title}</span>
                  </Link>
                </h2>
                <time className="relative z-10 order-first mb-2 flex items-center text-xs text-neutral-400 pl-3.5">
                  <span className="absolute inset-y-0 left-0 flex items-center" aria-hidden="true">
                    <span className="h-4 w-0.5 rounded-full bg-neutral-200" />
                  </span>
                  {formatDate(post.date)}
                </time>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}