"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useToc } from "@/context/TocContext";
import { useTocNavigation } from "@/hooks/useTocNavigation";
import {
  useActiveTocItem,
  useRevealActiveTocItem,
} from "@/hooks/useActiveTocItem";

const inter = Inter({ subsets: ["latin"], weight: "400" });

// 目次パネルの最小幅（メニューパネルと同じ幅）
const MIN_CONTENTS_WIDTH = 160;
// リンクの px-2(16px) + パネルの p-2(16px) + border(2px) + 余白(2px)
const CONTENTS_WIDTH_OFFSET = 36;

// TableOfContents が表示される幅。この幅以上のときはメニューに Contents を出さない
const TOC_MEDIA_QUERY = "(min-width: 1080px)";

function subscribeTocMediaQuery(callback: () => void) {
  const mql = window.matchMedia(TOC_MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsWideViewport() {
  return window.matchMedia(TOC_MEDIA_QUERY).matches;
}

// SSR 時は広い画面として扱う（メニューは閉じた状態で描画されるため実害はない）
function getIsWideViewportServer() {
  return true;
}

type MenuView = "closed" | "menu" | "contents";

export default function FloatingMenu() {
  const { isReady } = useMenu();
  const { tocItems } = useToc();
  const { handleClick: handleTocClick } = useTocNavigation();
  const pathname = usePathname();
  const [view, setView] = useState<MenuView>("closed");
  const [activePathname, setActivePathname] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const tocListRef = useRef<HTMLUListElement>(null);
  const contentsMeasureRef = useRef<HTMLDivElement>(null);
  const [contentsWidth, setContentsWidth] = useState(MIN_CONTENTS_WIDTH);
  const isMenuOpen = view !== "closed";

  // 目次パネルを開いている間だけスクロール位置から現在のセクションを判定する
  const [activeTocId, setActiveTocId] = useActiveTocItem(
    tocItems,
    view === "contents",
  );
  // 選択中の項目が見出し一覧の表示範囲外なら、一覧内だけスクロールして追従する
  useRevealActiveTocItem(tocListRef, activeTocId, view === "contents");

  // 固定目次と同じ幅判定（useSyncExternalStore で同期購読）
  const isWideViewport = useSyncExternalStore(
    subscribeTocMediaQuery,
    getIsWideViewport,
    getIsWideViewportServer,
  );

  // 固定目次が出る幅では重複するので、狭い画面で記事に目次があるときだけ出す
  const showContents = !isWideViewport && tocItems.length > 0;

  // 目次項目が折り返さない幅を、非表示の測定用要素から取得する
  useEffect(() => {
    const element = contentsMeasureRef.current;
    if (!element || tocItems.length === 0) return;

    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const textWidth = Math.ceil(element.getBoundingClientRect().width);
      setContentsWidth(
        Math.max(MIN_CONTENTS_WIDTH, textWidth + CONTENTS_WIDTH_OFFSET),
      );
    };

    measure();
    // フォント読み込みで文字幅が変わる場合に再測定する
    void document.fonts.ready.then(measure);

    return () => {
      cancelled = true;
    };
  }, [tocItems]);

  // ページ遷移時にメニューを閉じる（レンダー中のstate調整。ガードにより1回だけ実行）
  if (pathname !== activePathname) {
    setActivePathname(pathname);
    setView("closed");
  }

  // スマホのスクロールとタップを区別してメニューを閉じる処理
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isScrolling = false;

    const handleTouchStart = (event: TouchEvent) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      isScrolling = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touchX = event.touches[0].clientX;
      const touchY = event.touches[0].clientY;

      if (
        Math.abs(touchX - touchStartX) > 10 ||
        Math.abs(touchY - touchStartY) > 10
      ) {
        isScrolling = true;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isScrolling) return;

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setView("closed");
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setView("closed");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setView("closed");
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: true,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMenuOpen]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    setView("closed");

    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // 目次を開く（表示中のセクションの選択状態は useActiveTocItem が追随する）
  const handleOpenContents = () => {
    setView("contents");
  };

  const menuPanelHeight = showContents ? 176 : 160;
  // 目次がすべて収まる高さ（見出し 1 件あたりの行高・行間 + 下部の戻るピル領域）。
  // 画面に収まらない長さのときだけ、外側の max-h で制限されて一覧内スクロールになる
  const contentsPanelHeight = 48 + Math.ceil(tocItems.length * 33.25);

  return (
    <motion.div
      ref={menuRef}
      style={{
        pointerEvents: isReady ? "auto" : "none",
        // モーダル開閉によるビューポート幅の変動を相殺し、画面上の絶対位置を完全に固定
        right: "calc(1rem + var(--scrollbar-width, 0px))",
      }}
      // 1. initial に初期状態の形状・角丸を明示
      initial={{
        opacity: 0,
        y: 15,
        width: 48,
        height: 48,
        borderRadius: 24,
      }}
      animate={{
        width:
          view === "closed" ? 48 : view === "contents" ? contentsWidth : 160,
        height:
          view === "closed"
            ? 48
            : view === "contents"
              ? contentsPanelHeight
              : menuPanelHeight,
        borderRadius: view === "closed" ? 24 : 20,
        opacity: isReady ? 1 : 0,
        y: isReady ? 0 : 15,
      }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      // className から `right-4` を除外して style 側の calc に一本化
      className={`fixed bottom-12 z-50 w-12 h-12 max-h-[calc(100vh-7rem)] max-w-[calc(100vw-2rem)] rounded-3xl bg-black/50 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden flex items-center justify-center ${inter.className}`}
    >
      <AnimatePresence mode="wait">
        {view === "contents" ? (
          <motion.div
            key="contents-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex h-full w-full flex-col p-2 text-neutral-200"
          >
            <ul
              ref={tocListRef}
              className="-mr-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    data-active={item.id === activeTocId ? "true" : undefined}
                    aria-current={
                      item.id === activeTocId ? "location" : undefined
                    }
                    onClick={(event) => {
                      if (handleTocClick(event, item.id)) {
                        setActiveTocId(item.id);
                        setView("closed");
                      }
                    }}
                    className={`block overflow-hidden text-ellipsis whitespace-nowrap rounded-xl px-2 py-1.5 text-sm leading-snug transition-colors duration-200 hover:bg-white/10 ${
                      item.id === activeTocId
                        ? "text-neutral-50"
                        : "text-white/40 hover:text-neutral-100"
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setView("menu")}
              aria-label="Back to menu"
              className="mt-1 flex h-7 w-full shrink-0 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 text-sm leading-none text-neutral-50 transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                width="14"
                height="14"
                className="-ml-0.5"
              >
                <path
                  d="M14 6l-6 6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Menu</span>
            </button>
          </motion.div>
        ) : view === "menu" ? (
          <motion.div
            key="menu-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-2 flex flex-col justify-center w-full h-full text-neutral-200"
          >
            <div className="flex flex-col gap-1 shrink-0">
              <Link
                href="/"
                onClick={(e) => handleNavClick(e, "/")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-sm text-neutral-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="18"
                  height="18"
                >
                  <path d="M6.133 21C4.955 21 4 20.02 4 18.81v-8.802c0-.665.295-1.295.8-1.71l5.867-4.818a2.09 2.09 0 0 1 2.666 0l5.866 4.818c.506.415.801 1.045.801 1.71v8.802c0 1.21-.955 2.19-2.133 2.19z" />
                  <path d="M9.5 21v-5.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2V21" />
                </svg>
                <span>Home</span>
              </Link>

              <Link
                href="/photography"
                onClick={(e) => handleNavClick(e, "/photography")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-sm text-neutral-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="18"
                  height="18"
                >
                  <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2a2 2 0 0 0 1.7-.95l.5-.8A1.5 1.5 0 0 1 11.2 3.5h1.6a1.5 1.5 0 0 1 1.3.75l.5.8A2 2 0 0 0 16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
                  <circle cx="12" cy="12.5" r="3.2" />
                </svg>
                <span>Photography</span>
              </Link>

              <Link
                href="/blog"
                onClick={(e) => handleNavClick(e, "/blog")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-sm text-neutral-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="18"
                  height="18"
                >
                  <path d="M16.5 4H8a4 4 0 0 0-4 4v8.5a4 4 0 0 0 4 4h6.843a4 4 0 0 0 2.829-1.172l1.656-1.656a4 4 0 0 0 1.172-2.829V8a4 4 0 0 0-4-4" />
                  <path d="M20.5 14H17a3 3 0 0 0-3 3v3.5M8 8h7.5M8 12h5" />
                </svg>
                <span>Blog</span>
              </Link>

              {showContents && (
                <button
                  type="button"
                  onClick={handleOpenContents}
                  className="flex w-full items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-sm text-neutral-200 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="18"
                    height="18"
                  >
                    <path
                      d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Contents</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="menu-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setView("menu")}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            className="w-12 h-12 flex items-center justify-center rounded-full text-neutral-200 hover:bg-white/10 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.1"
              width="21"
              height="21"
            >
              <path
                fill="currentColor"
                d="M7 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 目次項目の自然な幅を測るための非表示要素（折り返しを許さずに計測する） */}
      <div
        ref={contentsMeasureRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed left-0 top-0 w-max whitespace-nowrap text-sm leading-snug"
      >
        {tocItems.map((item) => (
          <div key={item.id}>{item.text}</div>
        ))}
      </div>
    </motion.div>
  );
}
