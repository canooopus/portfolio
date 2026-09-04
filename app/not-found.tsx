"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { useMenu } from "@/context/MenuContext";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function NotFound() {
  const { setIsReady } = useMenu();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsReady(true);
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [setIsReady]);

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
          {/* タイトル */}
          <h2 className="text-3xl md:text-4xl -rotate-1 origin-left text-neutral-800 mb-6">
            Page not found
          </h2>

          {/* 説明文 & リンク */}
          <div className="space-y-6 text-xl md:text-2xl text-neutral-700 leading-relaxed">
            <p className="max-w-md">
              The page you are looking for doesn’t exist, has been removed, or
              its URL may have been changed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
