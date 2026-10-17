import { useCallback, useEffect } from "react";

/**
 * モーダル表示時等に背景のスクロールを抑制し、
 * スクロールバー消失によるレイアウトシフトを補正するカスタムフック
 */
export function useScrollLock(isOpen: boolean) {
  // スクロールロックの適用
  const lockScroll = useCallback(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.scrollbarGutter = "auto";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      // スクロールバー幅を CSS 変数としてセット（FloatingMenu などの位置補正用）
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`,
      );
    }
  }, []);

  // スクロールバーとガターの完全復元
  const unlockScroll = useCallback(() => {
    document.documentElement.style.scrollbarGutter = "";
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.documentElement.style.removeProperty("--scrollbar-width");
  }, []);

  // isOpen の変化に応じたスクロールロック
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    }
  }, [isOpen, lockScroll]);

  // コンポーネントアンマウント時の安全対策
  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, [unlockScroll]);

  return { lockScroll, unlockScroll };
}

