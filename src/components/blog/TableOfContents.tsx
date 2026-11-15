"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { TocItem } from "@/features/blog/posts";
import { useTocNavigation } from "@/hooks/useTocNavigation";
import {
  useActiveTocItem,
  useRevealActiveTocItem,
} from "@/hooks/useActiveTocItem";

interface TableOfContentsProps {
  items: TocItem[];
}

// 固定目次を表示する幅（これ未満では非表示なのでスクロール計測も行わない）
const DESKTOP_MEDIA_QUERY = "(min-width: 1080px)";

function subscribeDesktopMediaQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsDesktop() {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getIsDesktopServer() {
  return true;
}

/**
 * 記事の h2 だけを表示する固定目次。
 *
 * - 1080px 未満では表示しない（記事幅 672px + 左右の余白を確保できないため）
 * - スクロール位置から現在のセクションを判定し、それ以外は薄く表示する
 * - 目次が縦に長い場合は目次内だけスクロールする
 * - 遷移先の見出しは脚注ジャンプと同じハイライトを一瞬だけ表示する
 */
export default function TableOfContents({ items }: TableOfContentsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { handleClick } = useTocNavigation();

  const isDesktop = useSyncExternalStore(
    subscribeDesktopMediaQuery,
    getIsDesktop,
    getIsDesktopServer,
  );
  const [activeId, setActiveId] = useActiveTocItem(items, isDesktop);

  // 選択中の項目が目次の表示範囲外なら、目次内だけスクロールして追従する
  useRevealActiveTocItem(listRef, activeId, isDesktop);

  return (
    <nav
      aria-label="Contents"
      className="fixed top-38 left-[calc(25%-228px)] invisible w-42 selection:bg-blue-100 min-[1080px]:visible"
    >
      <ul
        ref={listRef}
        className="max-h-[calc(100vh-15rem)] animate-fade-up space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = item.id === activeId || item.id === hoveredId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                data-active={item.id === activeId ? "true" : undefined}
                aria-current={item.id === activeId ? "location" : undefined}
                onClick={(event) => {
                  if (handleClick(event, item.id)) {
                    setActiveId(item.id);
                  }
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`block text-sm font-normal leading-snug transition-colors duration-200 ${
                  isActive ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
