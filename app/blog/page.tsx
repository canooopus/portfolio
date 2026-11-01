import Link from "next/link";
import { getSortedPostsData } from "@/features/blog/posts";
import TagList from "@/components/blog/TagList";
import { Inter } from "next/font/google";
import { Caveat } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata = {
  title: "Blog",
  description: "Canooopusの技術記事・思考メモ一覧です。",
};

export default function BlogListPage() {
  const allPosts = getSortedPostsData();

  // 年ごとに記事をグループ化
  const postsByYear = allPosts.reduce<Record<string, typeof allPosts>>(
    (acc, post) => {
      const year = new Date(post.date).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(post);
      return acc;
    },
    {},
  );

  // 年を降順（最新順）に並び替え
  const sortedYears = Object.keys(postsByYear).sort(
    (a, b) => Number(b) - Number(a),
  );

  // "MMM D" (例: "Oct 24", "Jan 5") 形式のフォーマッター
  const formatMonthDay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`w-full min-h-screen bg-white text-neutral-900 overflow-x-hidden ${inter.className}`}
    >
      {/* 手描き線アニメーション用のキーフレーム定義 */}
      <style>{`
        @keyframes drawArrow {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-24 selection:bg-blue-100 animate-fade-up">
        {/* ブログのヘッダーセクション */}
        <div className="mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Blog
          </h1>
          <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
            Technical writing, thoughts, and updates.
          </p>
        </div>

        {/* 記事一覧コンテナ */}
        {sortedYears.length === 0 ? (
          <p className="text-sm text-neutral-400">No posts found.</p>
        ) : (
          <div className="space-y-8 sm:space-y-4">
            {sortedYears.map((year, yearIndex) => (
              <div
                key={year}
                className="flex flex-col sm:flex-row gap-1 sm:gap-10 items-start"
              >
                {/* 年（スマホは上、PCは左カラム） */}
                <div className="w-auto sm:w-16 shrink-0 pt-0 sm:pt-3.5 text-sm sm:text-base font-medium sm:font-normal text-neutral-400">
                  {year}
                </div>

                {/* 記事リスト */}
                <div className="w-full sm:flex-1 min-w-0 divide-y divide-neutral-100 group/list">
                  {postsByYear[year].map((post, postIndex) => {
                    const isNew = yearIndex === 0 && postIndex === 0;

                    return (
                      <article
                        key={post.slug}
                        className="transition-opacity duration-200 group-hover/list:opacity-35 hover:opacity-100!"
                      >
                        <Link
                          href={`/blog/${post.slug}`}
                          className="flex items-start justify-between py-3.5 w-full min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded"
                        >
                          <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                            {/* 記事タイトル ＋ Newバッジ & 手書き矢印 */}
                            <div className="flex items-start sm:items-center gap-2 min-w-0">
                              {/* スマホは text-sm かつ 2行、PCは text-base かつ 1行省略 */}
                              <span className="text-sm sm:text-base font-medium text-neutral-900 line-clamp-2 sm:line-clamp-none sm:truncate">
                                {post.title}
                              </span>
                              {isNew && (
                                <div className="inline-flex items-center gap-1 shrink-0 select-none leading-none pt-0.5 sm:pt-0">
                                  {/* 手書き風矢印（スマホ時は少し小さめにスケール） */}
                                  <svg
                                    className="w-6 h-4 sm:w-7 sm:h-5 text-orange-500 shrink-0 -rotate-6 translate-y-px"
                                    viewBox="0 0 42 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M 38 13 C 32 5 26 4 23 7 C 20 10 21 14 24 14 C 28 14 30 10 26 7 C 21 4 12 10 4 10"
                                      style={{
                                        strokeDasharray: 70,
                                        strokeDashoffset: 70,
                                        animation:
                                          "drawArrow 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.85s forwards",
                                      }}
                                    />
                                    <path
                                      d="M 9 6 L 4 10 L 9 14"
                                      style={{
                                        strokeDasharray: 20,
                                        strokeDashoffset: 20,
                                        animation:
                                          "drawArrow 0.25s ease-out 1.4s forwards",
                                      }}
                                    />
                                  </svg>

                                  {/* New文字（スマホ時は text-xl、PC時は text-2xl） */}
                                  <span
                                    className={`inline-flex items-center text-xl sm:text-2xl font-regular text-orange-500 tracking-tight shrink-0 leading-none -translate-y-0.5 ${caveat.className}`}
                                  >
                                    New
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* タグ */}
                            {post.tags?.length ? (
                              <TagList
                                tags={post.tags}
                                className="flex flex-wrap gap-1"
                              />
                            ) : null}
                          </div>

                          {/* 日付（スマホ時は text-xs にしてタイトルを引き立てる） */}
                          <time className="text-xs sm:text-sm text-neutral-400 shrink-0 pt-0.5 sm:pt-0">
                            {formatMonthDay(post.date)}
                          </time>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
