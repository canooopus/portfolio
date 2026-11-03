"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { TocItem } from "@/features/blog/posts";

interface TableOfContentsProps {
  items: TocItem[];
}

// 画面上端からこの位置を越えた見出しを「読んでいるセクション」とみなす
const ACTIVE_OFFSET = 128;

/**
 * 記事の h2 だけを表示する固定目次。
 *
 * - 1080px 未満では表示しない（記事幅 672px + 左右の余白を確保できないため）
 * - スクロール位置から現在のセクションを判定し、それ以外は薄く表示する
 * - 目次が縦に長い場合は目次内だけスクロールする
 */
export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let frameId = 0;

    const updateActive = () => {
      frameId = 0;

      const headings = items
        .map((item) => document.getElementById(item.id))
        .filter((heading): heading is HTMLElement => heading !== null);

      if (headings.length === 0) {
        return;
      }

      // ページ最下部まで到達したら最後の見出しを選択状態にする
      // （スクロールできない短いページでは何も選択しない）
      const isScrollable =
        document.documentElement.scrollHeight > window.innerHeight;
      const isAtBottom =
        isScrollable &&
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;

      if (isAtBottom) {
        setActiveId(items[items.length - 1].id);
        return;
      }

      // まだどの見出しも通過していない（前置きを読んでいる）間は未選択にする
      let current: string | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= ACTIVE_OFFSET) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const handleScroll = () => {
      if (frameId !== 0) {
        return;
      }
      frameId = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [items]);

  // 選択中の項目が目次の表示範囲外なら、目次内だけスクロールして追従する
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !active) {
      return;
    }

    if (list.scrollHeight <= list.clientHeight) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    if (activeRect.top < listRect.top) {
      list.scrollTop -= listRect.top - activeRect.top;
    } else if (activeRect.bottom > listRect.bottom) {
      list.scrollTop += activeRect.bottom - listRect.bottom;
    }
  }, [activeId]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const heading = document.getElementById(id);
    if (!heading) {
      return;
    }

    event.preventDefault();
    history.replaceState(null, "", `#${id}`);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    heading.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    setActiveId(id);
  };

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
                onClick={(event) => handleClick(event, item.id)}
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
