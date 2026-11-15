"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { TocItem } from "@/features/blog/posts";

interface TocContextType {
  /** 表示中の記事の目次（h2 一覧）。記事ページ以外では空配列 */
  tocItems: TocItem[];
  setTocItems: (items: TocItem[]) => void;
}

const TocContext = createContext<TocContextType>({
  tocItems: [],
  setTocItems: () => {},
});

/**
 * 記事ページの目次をフローティングメニューへ渡すための provider。
 * 目次はページ側でしか生成できないため、ページから登録してルートのメニューで読む。
 */
export const TocProvider = ({ children }: { children: React.ReactNode }) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  const value = useMemo(() => ({ tocItems, setTocItems }), [tocItems]);

  return <TocContext.Provider value={value}>{children}</TocContext.Provider>;
};

export const useToc = () => useContext(TocContext);
