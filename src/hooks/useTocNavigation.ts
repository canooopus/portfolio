"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";

/**
 * 目次リンクのジャンプ処理をまとめた hook。
 *
 * - 見出しへスムーススクロールし、URL のハッシュを置き換える
 * - 遷移先の見出しは脚注ジャンプと同じハイライトを一瞬だけ表示する
 * - スクロール中は色を保持し、止まってからフェードさせる
 *   （スクロールの所要時間でハイライトの見える時間が変わらないようにする）
 *
 * 固定目次（TableOfContents）とフローティングメニューの目次で共有する。
 */
export function useTocNavigation() {
  const highlightTimerRef = useRef<number | null>(null);
  const scrollWaitCleanupRef = useRef<(() => void) | null>(null);

  // アンマウント時にハイライト用のタイマーとスクロール待機を片付ける
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      scrollWaitCleanupRef.current?.();
    };
  }, []);

  /** 見出しへジャンプする。見出しが見つからなければ false を返す。 */
  const scrollToHeading = useCallback((id: string) => {
    const heading = document.getElementById(id);
    if (!heading) {
      return false;
    }

    const removeHighlightClasses = () => {
      document
        .querySelectorAll(".footnote-highlight-active, .footnote-highlight-hold")
        .forEach((el) => {
          el.classList.remove(
            "footnote-highlight-active",
            "footnote-highlight-hold",
          );
        });
    };

    // 脚注ジャンプと同じハイライト（.footnote-highlight-active）を付けてフェードさせる
    const fadeHighlight = (element: HTMLElement) => {
      removeHighlightClasses();

      // 直前まで保持用クラスで色が付いていたので、リフローを挟んでアニメーションを最初から再生する
      void element.offsetWidth;
      element.classList.add("footnote-highlight-active");

      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = window.setTimeout(() => {
        element.classList.remove("footnote-highlight-active");
        highlightTimerRef.current = null;
      }, 2600);
    };

    history.replaceState(null, "", `#${id}`);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // 前回の待機・タイマー・ハイライトを片付ける
    scrollWaitCleanupRef.current?.();
    scrollWaitCleanupRef.current = null;
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    removeHighlightClasses();

    heading.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    // スクロールが発生しない場合はそのままフェードを開始する
    const scrollMarginTop =
      parseFloat(window.getComputedStyle(heading).scrollMarginTop) || 0;
    const alreadyAtTarget =
      Math.abs(heading.getBoundingClientRect().top - scrollMarginTop) < 2;

    if (prefersReducedMotion || alreadyAtTarget) {
      fadeHighlight(heading);
      return true;
    }

    // スクロール中は色を保持し、止まってから一定時間フェードさせる
    void heading.offsetWidth;
    heading.classList.add("footnote-highlight-hold");

    let settled = false;
    let idleTimer = 0;
    let maxTimer = 0;

    const settle = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      fadeHighlight(heading);
    };

    const onScroll = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(settle, 150);
    };

    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", settle);
      window.clearTimeout(idleTimer);
      window.clearTimeout(maxTimer);
      if (scrollWaitCleanupRef.current === cleanup) {
        scrollWaitCleanupRef.current = null;
      }
    };

    scrollWaitCleanupRef.current = cleanup;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", settle, { once: true });

    // スクロールが始まらない場合の初回判定と、念のための上限
    idleTimer = window.setTimeout(settle, 300);
    maxTimer = window.setTimeout(settle, 4000);

    return true;
  }, []);

  /**
   * 目次アンカーのクリックハンドラ。
   * 修飾キー付きクリックはブラウザ標準の動作（新規タブ等）に任せる。
   * ジャンプした場合は true を返す。
   */
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return false;
      }

      const navigated = scrollToHeading(id);
      if (navigated) {
        event.preventDefault();
      }
      return navigated;
    },
    [scrollToHeading],
  );

  return { handleClick, scrollToHeading };
}
