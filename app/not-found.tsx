"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { useMenu } from "@/context/MenuContext";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// マーカーのスタイル定義
const markerStyle: React.CSSProperties = {
  background:
    "linear-gradient(102deg, rgba(254, 240, 138, 0.95) 0%, rgba(254, 240, 138, 0.35) 50%, rgba(254, 240, 138, 0.95) 100%)",
  color: "rgb(23 23 23)", // text-neutral-900相当
  padding: "0 0.4em",
  borderRadius: "1.8em 0.6em 1.4em 0.8em / 0.8em 1.3em 0.7em 1.4em",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
};

export default function NotFound() {
  const { setIsReady, setShowFooter } = useMenu();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsReady(true);
    setShowFooter(false);

    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setShowFooter(true);
    };
  }, [setIsReady, setShowFooter]);

  return (
    <div
      className={`w-full min-h-[75vh] flex flex-col justify-center items-start selection:bg-blue-100 ${caveat.className}`}
    >
      <main className="max-w-2xl w-full mx-auto px-6 pt-20 pb-16 md:pt-32 flex flex-col items-start justify-center">
        <div
          className={`w-full transition-all duration-1000 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* タイトル：<mark> で囲んでマーカーを適用 */}
          <h2 className="text-3xl md:text-4xl -rotate-1 origin-left text-neutral-800 mb-6">
            <mark style={markerStyle}>Page not found ...</mark>
          </h2>

          {/* サブタイトル */}
          <p className="text-xl md:text-2xl text-neutral-500 origin-left leading-relaxed">
            The page you are looking for might have been removed or moved.
          </p>
        </div>
      </main>
    </div>
  );
}
