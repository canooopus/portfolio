"use client";

import { useEffect, useState, type RefObject } from "react";
import type { TocItem } from "@/features/blog/posts";

// 画面上端からこの位置を越えた見出しを「読んでいるセクション」とみなす
export const ACTIVE_TOC_OFFSET = 128;

/**
 * スクロール位置から現在読んでいる見出し（h2）の id を返す hook。
 *
 * - ページ最下部まで到達したら最後の見出しを選択状態にする
 * - enabled が false の間はスクロールを計測しない（目次を表示していないときの負荷を避ける）
 *
 * 固定目次（TableOfContents）とフローティングメニューの目次で共有する。
 */
export function useActiveTocItem(items: TocItem[], enabled = true) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frameId = 0;

    // id と要素の対応はマウント中に変わらないため、1 回だけ解決する
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null);

    const updateActive = () => {
      frameId = 0;

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
        if (heading.getBoundingClientRect().top <= ACTIVE_TOC_OFFSET) {
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
  }, [items, enabled]);

  return [activeId, setActiveId] as const;
}

/**
 * 選択中の項目が一覧の表示範囲外なら、一覧内だけスクロールして追従する。
 * 対象の一覧には `data-active="true"` を付けたアンカーが必要。
 */
export function useRevealActiveTocItem(
  listRef: RefObject<HTMLElement | null>,
  activeId: string | null,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

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
  }, [listRef, activeId, enabled]);
}
