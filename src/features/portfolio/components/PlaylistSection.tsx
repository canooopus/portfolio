"use client";

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import { playlists } from "@/features/portfolio/playlists";

interface PlaylistSectionProps {
  caveatClass: string;
}

function subscribeMediaQuery(callback: () => void) {
  const mql = window.matchMedia("(min-width: 768px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshotDesktop() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getServerSnapshotDesktop() {
  return false;
}

export function PlaylistSection({ caveatClass }: PlaylistSectionProps) {
  // デバイス判定（PC vs モバイル）：useSyncExternalStoreで同期購読
  const isDesktop = useSyncExternalStore(
    subscribeMediaQuery,
    getSnapshotDesktop,
    getServerSnapshotDesktop
  );

  // PC用無限ループカルーセルの制御用ステート (初期値 1: 本物の最初の要素)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // モバイル用インデックス
  const [mobilePlaylistIndex, setMobilePlaylistIndex] = useState(0);

  // 表示用インデックス（PC版はcurrentIndexから即時算出、モバイルはスクロールから）
  const pcPlaylistIndex = (currentIndex - 1 + playlists.length) % playlists.length;
  const playlistIndex = isDesktop ? pcPlaylistIndex : mobilePlaylistIndex;

  // ロード済みインデックス管理（初期表示のスライド 1 とその前後 0, 2 のみを初期ロード）
  const [loadedPcIndices, setLoadedPcIndices] = useState<Set<number>>(
    () => new Set([0, 1, 2])
  );
  const [loadedMobileIndices, setLoadedMobileIndices] = useState<Set<number>>(
    () => new Set([0, 1, 2])
  );

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
    const next = currentIndex - 1;
    setCurrentIndex(next);
    setLoadedPcIndices((prev) => {
      const updated = new Set(prev);
      updated.add(next);
      updated.add(next - 1);
      updated.add(next + 1);
      return updated;
    });
  };

  const nextPlaylist = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setLoadedPcIndices((prev) => {
      const updated = new Set(prev);
      updated.add(next);
      updated.add(next - 1);
      updated.add(next + 1);
      return updated;
    });
  };

  // PC版：トランジション終了時の瞬間移動
  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      const target = playlists.length;
      setCurrentIndex(target);
      setLoadedPcIndices((prev) => {
        const updated = new Set(prev);
        updated.add(target);
        updated.add(target - 1);
        updated.add(target + 1);
        return updated;
      });
    } else if (currentIndex === playlists.length + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
      setLoadedPcIndices((prev) => {
        const updated = new Set(prev);
        updated.add(1);
        updated.add(0);
        updated.add(2);
        return updated;
      });
    }
  };

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
    <>
      <p
        className={`text-3xl -rotate-3 origin-left w-fit relative z-10 -translate-y-1/2 top-0.5 ${caveatClass}`}
      >
        My playlist
      </p>
      <div className="max-w-2xl mx-auto pt-1 pb-4 md:pt-3 md:pb-6">
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
                  {loopedPlaylists.map((url, i) => {
                    const shouldLoad =
                      isDesktop === true && loadedPcIndices.has(i);

                    return (
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
                        {shouldLoad ? (
                          <iframe
                            src={url}
                            className="w-full h-full rounded-xl border-0 bg-transparent pointer-events-auto"
                            allowFullScreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-neutral-200/50" />
                        )}
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
                    );
                  })}
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

                  const rawIndex = Math.round(target.scrollTop / step);
                  setLoadedMobileIndices((prev) => {
                    const next = new Set(prev);
                    next.add(rawIndex);
                    next.add(rawIndex - 1);
                    next.add(rawIndex + 1);
                    return next.size === prev.size ? prev : next;
                  });

                  const index = rawIndex - 1;
                  const safeIndex =
                    (index + playlists.length) % playlists.length;
                  if (safeIndex !== mobilePlaylistIndex) {
                    setMobilePlaylistIndex(safeIndex);
                  }
                }}
              >
                {loopedPlaylists.map((url, index) => {
                  const uniqueKey = `mobile-${index}`;
                  const isOverlayActive =
                    isScrolling || activeIframeIndex !== uniqueKey;
                  const shouldLoad =
                    isDesktop === false && loadedMobileIndices.has(index);

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
                      {shouldLoad ? (
                        <iframe
                          src={url}
                          className="w-full h-full rounded-xl border-0 bg-transparent pointer-events-auto"
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-neutral-200/50" />
                      )}
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
    </>
  );
}
