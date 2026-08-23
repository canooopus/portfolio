"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { playlists } from "@/features/portfolio/playlists";

interface PlaylistSectionProps {
  caveatClass: string;
}

export function PlaylistSection({ caveatClass }: PlaylistSectionProps) {
  const [playlistIndex, setPlaylistIndex] = useState(0);

  // PC用無限ループカルーセルの制御用ステート (初期値 1: 本物の最初の要素)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // iframe操作用のオーバーレイ制御用ステート
  const [activeIframeIndex, setActiveIframeIndex] = useState<
    string | number | null
  >(null);

  // モバイルスクロール状態判定用
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // PC版：前後の切り替えアクション
  const prevPlaylist = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const nextPlaylist = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // PC版：トランジション終了時の瞬間移動
  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(playlists.length); // 本物の最後の要素へ瞬間移動
    } else if (currentIndex === playlists.length + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1); // 本物の最初の要素へ瞬間移動
    }
  };

  // 表示用 playlistIndex の同期
  useEffect(() => {
    let index = currentIndex - 1;
    if (index < 0) index = playlists.length - 1;
    if (index >= playlists.length) index = 0;
    setPlaylistIndex(index);
  }, [currentIndex]);

  // transitionを有効に戻す
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  const loopedPlaylists = useMemo(() => {
    if (!playlists.length) return [];
    return [playlists[playlists.length - 1], ...playlists, playlists[0]];
  }, []);

  // 初期表示時にクローンではない「最初の要素」までスクロール
  useEffect(() => {
    if (scrollRef.current && playlists.length > 0) {
      const step = scrollRef.current.clientHeight + 16;
      scrollRef.current.scrollTop = step;
    }
  }, []);

  // スクロール状態監視用のタイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="mt-12 w-full">
      <p
        className={`text-3xl -rotate-3 relative z-10 translate-y-3 md:translate-y-1 ${caveatClass}`}
      >
        My playlist
      </p>
      <div className="relative pt-4 pl-0 pb-4 pr-0 before:content-[''] before:absolute before:inset-0 before:w-screen before:left-1/2 before:-translate-x-1/2 before:bg-gray-100 before:-z-10">
        <div className="max-w-2xl mx-auto py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* 左矢印ボタン（PC版のみ表示） */}
            <button
              onClick={prevPlaylist}
              className="hidden md:flex p-2 rounded-full hover:bg-gray-200 transition-colors shrink-0 text-gray-500 hover:text-gray-900"
              aria-label="Previous track"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            {/* PC版 iframe本体（gapを追加し、クローン配列を使用して無限ループ化） */}
            <div className="hidden md:block relative w-full flex-1 min-w-0 h-38">
              <div
                className="absolute -left-3 -right-3 top-0 bottom-0 overflow-hidden pointer-events-none"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)",
                }}
              >
                <div className="w-full h-full px-3 pointer-events-auto">
                  <div
                    className={`flex gap-4 h-full ${
                      isTransitioning
                        ? "transition-transform duration-500 ease-in-out"
                        : "transition-none"
                    }`}
                    style={{
                      transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 16}px)) translate3d(0,0,0)`,
                      backfaceVisibility: "hidden",
                      willChange: "transform",
                    }}
                    onTransitionEnd={handleTransitionEnd}
                  >
                    {loopedPlaylists.map((url, i) => (
                      <div
                        key={i}
                        className="w-full h-full shrink-0 relative"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "translate3d(0,0,0)",
                          willChange: "transform",
                        }}
                        onMouseLeave={() => setActiveIframeIndex(null)}
                      >
                        <iframe
                          src={url}
                          className="w-full h-full rounded-xl border-0 bg-transparent pointer-events-auto"
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                        {/* 透明カバー。DOMに常にマウントし、pointer-eventsのみ制御 */}
                        <div
                          className={`absolute inset-0 w-full h-full cursor-pointer z-10 ${
                            activeIframeIndex === i
                              ? "pointer-events-none"
                              : "pointer-events-auto"
                          }`}
                          onClick={() => setActiveIframeIndex(i)}
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "translate3d(0,0,0)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* スマホ版 iframe本体（スクロールの滑らかさを追加） */}
            <div className="relative md:hidden w-full h-38">
              <div
                className="absolute -top-3 -bottom-3 left-0 right-6 pointer-events-none"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)",
                }}
              >
                <div
                  ref={scrollRef}
                  className="flex flex-col w-full h-full overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden gap-4 py-3 pointer-events-auto"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    backfaceVisibility: "hidden",
                    transform: "translate3d(0,0,0)",
                    willChange: "transform",
                  }}
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const h = 152; // 要素の本来の高さ
                    const step = h + 16;
                    const scroll = target.scrollTop;

                    // スクロール状態の管理 (スクロール中はオーバーレイを復活させる)
                    setIsScrolling(true);
                    setActiveIframeIndex(null);
                    if (scrollTimeoutRef.current) {
                      clearTimeout(scrollTimeoutRef.current);
                    }
                    scrollTimeoutRef.current = setTimeout(() => {
                      setIsScrolling(false);
                    }, 150);

                    // 無限ループ時のジャンプ
                    if (scroll <= 0) {
                      target.scrollTo({
                        top: step * playlists.length,
                        behavior: "auto",
                      });
                    } else if (scroll >= step * (loopedPlaylists.length - 1)) {
                      target.scrollTo({ top: step, behavior: "auto" });
                    }

                    const index = Math.round(target.scrollTop / step) - 1;
                    const safeIndex =
                      (index + playlists.length) % playlists.length;
                    if (safeIndex !== playlistIndex) {
                      setPlaylistIndex(safeIndex);
                    }
                  }}
                >
                  {loopedPlaylists.map((url, index) => {
                    const uniqueKey = `mobile-${index}`;
                    const isOverlayActive =
                      isScrolling || activeIframeIndex !== uniqueKey;
                    return (
                      <div
                        key={uniqueKey}
                        className="w-full h-38 shrink-0 snap-center relative"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "translate3d(0,0,0)",
                          willChange: "transform",
                        }}
                      >
                        <iframe
                          src={url}
                          className="w-full h-full rounded-xl border-0 bg-transparent pointer-events-auto"
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                        {/* 透明カバー。DOMに常にマウントし、pointer-eventsのみ制御 */}
                        <div
                          className={`absolute inset-0 w-full h-full cursor-pointer z-10 ${
                            isOverlayActive
                              ? "pointer-events-auto"
                              : "pointer-events-none"
                          }`}
                          onClick={() => {
                            if (!isScrolling) {
                              setActiveIframeIndex(uniqueKey);
                            }
                          }}
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "translate3d(0,0,0)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 右のバー（インジケーター） */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
                {playlists.map((_, index) => (
                  <div
                    key={index}
                    className={`w-0.5 transition-all duration-300 rounded-full ${
                      playlistIndex === index
                        ? "bg-gray-800 h-6"
                        : "bg-gray-300 h-3"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 右矢印ボタン（PC版のみ表示） */}
            <button
              onClick={nextPlaylist}
              className="hidden md:flex p-2 rounded-full hover:bg-gray-200 transition-colors shrink-0 text-gray-500 hover:text-gray-900"
              aria-label="Next track"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
