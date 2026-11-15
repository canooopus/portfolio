"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TocItem } from "@/features/blog/posts";

interface TocFloatingProps {
  items: TocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}

const PANEL_ID = "toc-floating-panel";

// FloatingMenu（48px・bottom-12・右端 1rem）に揃えた寸法
const MENU_SIZE = 48;
const MENU_GAP = 8;
const PANEL_WIDTH = 232;
const PANEL_HEADER_HEIGHT = 36; // h-9
const PANEL_ROW_HEIGHT = 36; // h-9
const PANEL_PADDING = 8; // ul の py-1
const PANEL_BORDER = 2; // border（上下 1px）
const PANEL_MAX_HEIGHT = 384;

/**
 * 1080px 未満で使う目次 UI。FloatingMenu と同じ寸法・見た目・動きに合わせている。
 *
 * - 最初の h2 を通過すると、メニューの左隣に現在のセクション名だけのピルが現れる
 * - ピルをタップすると、メニューの位置からパネルが伸びて開く（メニューはパネルの下に隠れる）
 * - 背景の暗転・スクロールロックはせず、外側タップ / Escape /
 *   画面幅が 1080px 以上になったときに閉じる
 */
export default function TocFloating({
  items,
  activeId,
  onNavigate,
}: TocFloatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // パネルを閉じたあと、ピルが再マウントされてからフォーカスを戻すためのフラグ
  const restoreFocusRef = useRef(false);
  const reduceMotion = useReducedMotion();

  // 前置き（最初の h2 より前）を読んでいる間は出さない
  // （パネルを開いたまま上へスクロールした場合は閉じるまで表示を保つ）
  const isShown = activeId !== null || isOpen;
  const activeItem = items.find((item) => item.id === activeId);

  // パネルの高さは行数から決める（height: auto の計測を挟まずバネで伸ばすため）
  const expandedHeight = Math.min(
    PANEL_HEADER_HEIGHT +
      items.length * PANEL_ROW_HEIGHT +
      PANEL_PADDING +
      PANEL_BORDER,
    PANEL_MAX_HEIGHT,
  );

  // FloatingMenu と同じ操作でパネルを閉じる
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let isScrolling = false;

    const handleTouchStart = (event: TouchEvent) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      isScrolling = false;
    };

    // スクロール操作とタップを区別する（スクロール中は閉じない）
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
      if (isScrolling) {
        return;
      }

      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        restoreFocusRef.current = true;
        setIsOpen(false);
      }
    };

    // デスクトップ用の固定目次に切り替わる幅では、パネルを残さない
    const desktopQuery = window.matchMedia("(min-width: 1080px)");
    const handleViewportChange = () => {
      if (desktopQuery.matches) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd);
    desktopQuery.addEventListener("change", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      desktopQuery.removeEventListener("change", handleViewportChange);
    };
  }, [isOpen]);

  // アンマウント時に FloatingMenu の表示を必ず戻す
  useEffect(() => {
    return () => {
      const menu = document.querySelector<HTMLElement>("[data-floating-menu]");
      if (menu) {
        menu.style.visibility = "";
      }
    };
  }, []);

  // パネルが開いたらフォーカスを移し、選択中の項目が見える位置まで送る
  const handlePanelShown = () => {
    if (!isOpen) {
      return;
    }

    // パネルはメニューと同じ位置から伸びるので、重なったところでメニューを隠す
    const menu = document.querySelector<HTMLElement>("[data-floating-menu]");
    if (menu) {
      menu.style.visibility = "hidden";
    }

    panelRef.current?.focus({ preventScroll: true });

    const list = listRef.current;
    if (!list) {
      return;
    }

    const active =
      list.querySelector<HTMLElement>('[data-active="true"]') ??
      list.querySelector<HTMLElement>("a");
    if (!active) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    if (activeRect.top < listRect.top) {
      list.scrollTop -= listRect.top - activeRect.top + 8;
    } else if (activeRect.bottom > listRect.bottom) {
      list.scrollTop += activeRect.bottom - listRect.bottom + 8;
    }
  };

  // ピルが表示されたら（パネルを閉じた直後なら）フォーカスを戻す
  const handleButtonShown = () => {
    if (!restoreFocusRef.current) {
      return;
    }
    restoreFocusRef.current = false;
    buttonRef.current?.focus({ preventScroll: true });
  };

  // パネルの退場が終わってからメニューを戻す（退場中はパネルの下に隠しておく）
  const restoreMenu = () => {
    const menu = document.querySelector<HTMLElement>("[data-floating-menu]");
    if (menu) {
      menu.style.visibility = "";
    }
  };

  const handleItemClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    // 修飾キー付きクリックはブラウザ標準の動作（新規タブ等）に任せる
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    restoreFocusRef.current = true;
    setIsOpen(false);
    onNavigate(id);
  };

  return (
    <div
      className="fixed bottom-12 flex items-end justify-end min-[1080px]:hidden"
      style={{
        right: "calc(1rem + var(--scrollbar-width, 0px))",
        // 閉じている間はメニュー(z-50)の下、開いたらパネルがメニューを覆うよう上に出す
        zIndex: isOpen ? 55 : 40,
      }}
    >
      <AnimatePresence
        initial={false}
        mode="wait"
        onExitComplete={restoreMenu}
      >
        {isOpen ? (
          // メニューの 48×48 から右下を起点に伸び、メニューを覆う
          <motion.div
            key="panel"
            ref={panelRef}
            id={PANEL_ID}
            role="dialog"
            aria-label="Contents"
            tabIndex={-1}
            initial={{
              opacity: 0,
              width: MENU_SIZE,
              height: MENU_SIZE,
              borderRadius: 24,
            }}
            animate={{
              opacity: 1,
              width: PANEL_WIDTH,
              height: expandedHeight,
              borderRadius: 20,
            }}
            exit={{
              opacity: 0,
              width: MENU_SIZE,
              height: MENU_SIZE,
              borderRadius: 24,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", damping: 24, stiffness: 280 }
            }
            style={{
              transformOrigin: "bottom right",
              maxHeight: "calc(100dvh - 5rem)",
            }}
            onAnimationStart={handlePanelShown}
            className="relative overflow-hidden border border-white/10 bg-black/50 shadow-lg backdrop-blur-md focus:outline-none"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, delay: 0.1 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex h-9 shrink-0 items-center gap-2 px-4 text-xs font-medium tracking-wide text-white/50">
                <ListIcon />
                <span className="truncate">Contents</span>
              </div>

              <ul
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {items.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        data-active={isActive ? "true" : undefined}
                        aria-current={isActive ? "location" : undefined}
                        onClick={(event) => handleItemClick(event, item.id)}
                        className={`flex h-9 items-center rounded-xl px-3 text-sm transition-colors duration-200 ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="min-w-0 truncate">{item.text}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        ) : isShown ? (
          // 閉じている間はメニューの左隣にセクション名だけを出す
          <motion.button
            key="pill"
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-haspopup="dialog"
            aria-controls={PANEL_ID}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.4,
              y: 8,
              transition: { duration: 0.15, ease: "easeIn" },
            }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }
            }
            onAnimationStart={handleButtonShown}
            style={{
              marginRight: MENU_SIZE + MENU_GAP,
              transformOrigin: "100% 50%",
            }}
            className="flex h-12 w-fit max-w-[calc(100vw-6rem)] cursor-pointer items-center rounded-3xl border border-white/10 bg-black/50 px-4 text-sm text-neutral-200 shadow-lg backdrop-blur-md"
          >
            <span className="min-w-0 truncate">
              {activeItem?.text ?? "Contents"}
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}
