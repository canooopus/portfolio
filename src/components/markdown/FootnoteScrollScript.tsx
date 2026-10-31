"use client";

import { useEffect, useRef } from "react";

export default function FootnoteScrollScript() {
  const activeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let highlightCleanup: (() => void) | null = null;

    const getHighlightElement = (target: HTMLElement): HTMLElement => {
      // 本文側の参照番号の場合: 最も近い段落(p)やブロック要素をハイライト対象とする
      if (
        target.hasAttribute("data-footnote-ref") ||
        target.id.includes("fnref")
      ) {
        const blockParent = target.closest<HTMLElement>(
          "p, li, blockquote, dd, div"
        );
        return blockParent || target;
      }
      // 脚注側の場合: li 要素をハイライト対象とする
      const liParent = target.closest<HTMLElement>("li");
      return liParent || target;
    };

    const applyHighlight = (element: HTMLElement) => {
      const highlightTarget = getHighlightElement(element);

      // 過去のハイライトクラスを除去
      document.querySelectorAll(".footnote-highlight-active").forEach((el) => {
        el.classList.remove("footnote-highlight-active");
      });

      // リフローを強制してアニメーションを再実行可能にする
      void highlightTarget.offsetWidth;
      highlightTarget.classList.add("footnote-highlight-active");

      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
      }
      activeTimerRef.current = setTimeout(() => {
        highlightTarget.classList.remove("footnote-highlight-active");
        activeTimerRef.current = null;
      }, 2600);
    };

    const handleScrollToTarget = (targetId: string, smooth = true) => {
      const id = decodeURIComponent(targetId.replace(/^#/, ""));
      if (!id) return false;

      const element = document.getElementById(id);
      if (!element) return false;

      const isReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const shouldUseSmooth = smooth && !isReducedMotion;

      // 既存のスクロール待機リスナー／タイマーがあればクリーンアップ
      if (highlightCleanup) {
        highlightCleanup();
        highlightCleanup = null;
      }

      // 要素を画面中央へスクロール
      element.scrollIntoView({
        behavior: shouldUseSmooth ? "smooth" : "auto",
        block: "center",
      });

      if (!shouldUseSmooth) {
        // 即時スクロールの場合は即座にハイライト
        applyHighlight(element);
        return true;
      }

      // 既にほぼ中央にある場合はスクロールが発生しないため即座にハイライト
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const isAlreadyCentered = Math.abs(elementCenter - viewportCenter) < 15;

      if (isAlreadyCentered) {
        applyHighlight(element);
        return true;
      }

      // スクロール完了（scrollend）を待ってからハイライトを発火
      let triggered = false;
      const onScrollEnd = () => {
        if (triggered) return;
        triggered = true;
        applyHighlight(element);
        cleanListeners();
      };

      // 万一 scrollend が発火しなかった場合のタイムアウトフォールバック（最大1000ms）
      const fallbackTimer = setTimeout(() => {
        onScrollEnd();
      }, 1000);

      const cleanListeners = () => {
        window.removeEventListener("scrollend", onScrollEnd);
        clearTimeout(fallbackTimer);
      };

      highlightCleanup = cleanListeners;
      window.addEventListener("scrollend", onScrollEnd, { once: true });

      return true;
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest<HTMLAnchorElement>(
        "a[data-footnote-ref], a[data-footnote-backref]"
      );
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const success = handleScrollToTarget(href, true);
      if (success) {
        e.preventDefault();
        window.history.pushState(null, "", href);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash) {
        handleScrollToTarget(window.location.hash, true);
      }
    };

    // 初回読み込み時にハッシュが存在する場合のスクロール処理
    let initialTimer: NodeJS.Timeout | null = null;
    if (window.location.hash) {
      initialTimer = setTimeout(() => {
        handleScrollToTarget(window.location.hash, false);
      }, 100);
    }

    const container = document.querySelector(".blog-content");
    if (container) {
      container.addEventListener("click", handleClick as EventListener);
    }
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      if (highlightCleanup) highlightCleanup();
      if (container) {
        container.removeEventListener("click", handleClick as EventListener);
      }
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  return null;
}
