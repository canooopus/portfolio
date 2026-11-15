"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TocItem } from "@/features/blog/posts";
import { useMenu } from "@/context/MenuContext";

interface TocFloatingProps {
  items: TocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}

const PANEL_ID = "toc-floating-panel";

// FloatingMenu（48px・bottom-12・右端 1rem）に揃えた寸法
const MENU_SIZE = 48;
const MENU_GAP = 8;
const MENU_OFFSET = MENU_SIZE + MENU_GAP; // 56px
const PANEL_MAX_WIDTH = 320;
const PANEL_HEADER_HEIGHT = 36; // h-9
const PANEL_ROW_HEIGHT = 36; // h-9
const PANEL_PADDING = 8; // ul の py-1
const PANEL_BORDER = 2; // border（上下 1px）
const PANEL_MAX_HEIGHT = 384;

/**
 * 1080px 未満で使う目次 UI。FloatingMenu と同じ寸法・見た目・動きに合わせている。
 *
 * - 閉じている時: 左端は画面左端 1rem、右端は FloatingMenu の左隣に並ぶピル
 * - 開いた時: FloatingMenu の位置まで結合し、右下を起点に上・左へパネルが滑らかに展開
 * - 背景の暗転・スクロールロックはせず、外側タップ / Escape / 1080px 以上で閉じる
 */
export default function TocFloating({
  items,
  activeId,
  onNavigate,
}: TocFloatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsTocOpen, isNavMenuOpen } = useMenu();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const restoreFocusRef = useRef(false);
  const reduceMotion = useReducedMotion();

  // MenuContext 経由で FloatingMenu と状態を同期
  useEffect(() => {
    setIsTocOpen(isOpen);
  }, [isOpen, setIsTocOpen]);

  useEffect(() => {
    return () => {
      setIsTocOpen(false);
    };
  }, [setIsTocOpen]);

  // 親コンテナ（画面左右 1rem の全幅）の幅を追従
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // 前置き（最初の h2 より前）を読んでいる間は出さない
  // （パネルを開いたまま上へスクロールした場合は閉じるまで表示を保つ）
  // ナビゲーションメニューが開いている間は隠す
  const isShown = (activeId !== null || isOpen) && !isNavMenuOpen;
  const activeItem = items.find((item) => item.id === activeId);

  // パネルの高さは行数から決める
  const expandedHeight = Math.min(
    PANEL_HEADER_HEIGHT +
      items.length * PANEL_ROW_HEIGHT +
      PANEL_PADDING +
      PANEL_BORDER,
    PANEL_MAX_HEIGHT,
  );

  // 閉じている時の幅（親コンテナ幅 - 右メニューオフセット 56px）
  const closedWidth =
    containerWidth > 0
      ? Math.max(0, containerWidth - MENU_OFFSET)
      : undefined;

  // 開いている時の幅（最大 320px、親幅より狭い場合は親幅に合わせる）
  const openWidth =
    containerWidth > 0
      ? Math.min(PANEL_MAX_WIDTH, containerWidth)
      : PANEL_MAX_WIDTH;

  // パネルが開いたらフォーカスを移し、選択中の項目が見える位置まで送る
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus({ preventScroll: true });

      const list = listRef.current;
      if (!list) return;

      const active =
        list.querySelector<HTMLElement>('[data-active="true"]') ??
        list.querySelector<HTMLElement>("a");
      if (!active) return;

      const listRect = list.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      if (activeRect.top < listRect.top) {
        list.scrollTop -= listRect.top - activeRect.top + 8;
      } else if (activeRect.bottom > listRect.bottom) {
        list.scrollTop += activeRect.bottom - listRect.bottom + 8;
      }
    } else {
      if (restoreFocusRef.current) {
        restoreFocusRef.current = false;
        buttonRef.current?.focus({ preventScroll: true });
      }
    }
  }, [isOpen]);

  // 外側タップ・クリック・キーボード操作で閉じる
  useEffect(() => {
    if (!isOpen) return;

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

  const handleItemClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
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
      ref={containerRef}
      className="fixed bottom-12 flex items-end justify-end pointer-events-none min-[1080px]:hidden"
      style={{
        left: "calc(1rem + var(--scrollbar-width, 0px))",
        right: "calc(1rem + var(--scrollbar-width, 0px))",
        zIndex: isOpen ? 55 : 40,
      }}
    >
      <AnimatePresence>
        {isShown && (
          <motion.div
            key="floating-toc-container"
            ref={panelRef}
            id={PANEL_ID}
            role={isOpen ? "dialog" : undefined}
            aria-label="Contents"
            tabIndex={isOpen ? -1 : undefined}
            initial={{
              opacity: 0,
              y: 15,
              width: closedWidth ?? `calc(100% - ${MENU_OFFSET}px)`,
              height: MENU_SIZE,
              borderRadius: 24,
              marginRight: MENU_OFFSET,
            }}
            animate={{
              opacity: 1,
              y: 0,
              width: isOpen
                ? openWidth
                : (closedWidth ?? `calc(100% - ${MENU_OFFSET}px)`),
              height: isOpen ? expandedHeight : MENU_SIZE,
              borderRadius: isOpen ? 20 : 24,
              marginRight: isOpen ? 0 : MENU_OFFSET,
            }}
            exit={{
              opacity: 0,
              y: 15,
              transition: { duration: 0.15 },
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", damping: 26, stiffness: 280 }
            }
            style={{
              transformOrigin: "bottom right",
              maxHeight: "calc(100dvh - 5rem)",
            }}
            className="relative overflow-hidden border border-white/10 bg-black/50 shadow-lg backdrop-blur-md pointer-events-auto focus:outline-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="panel-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
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
              ) : (
                <motion.button
                  key="pill-content"
                  ref={buttonRef}
                  type="button"
                  onClick={() => setIsOpen(true)}
                  aria-haspopup="dialog"
                  aria-controls={PANEL_ID}
                  aria-label={`Table of contents: ${activeItem?.text ?? "Contents"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full flex items-center justify-center px-4 text-sm text-neutral-200 cursor-pointer"
                >
                  <span className="min-w-0 truncate text-center">
                    {activeItem?.text ?? "Contents"}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
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
