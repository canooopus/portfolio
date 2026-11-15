"use client";

import { useEffect } from "react";
import type { TocItem } from "@/features/blog/posts";
import { useToc } from "@/context/TocContext";

interface TocRegistrationProps {
  items: TocItem[];
}

/**
 * 記事ページの目次を TocContext に登録するだけのコンポーネント。
 * 記事から離れたら登録を解除し、フローティングメニューに目次を残さない。
 */
export default function TocRegistration({ items }: TocRegistrationProps) {
  const { setTocItems } = useToc();

  useEffect(() => {
    setTocItems(items);
    return () => setTocItems([]);
  }, [items, setTocItems]);

  return null;
}
