"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { useMenu } from "@/context/MenuContext";

const inter = Inter({ subsets: ["latin"], weight: "400" });

export default function Footer() {
  const { isReady, showFooter } = useMenu(); // showFooter を取得

  if (!showFooter) return null; // 非表示フラグが false の場合は描画しない

  return (
    <footer
      className={`w-full py-16 md:py-20 text-center text-sm text-neutral-400 border-t border-neutral-100 bg-white selection:bg-blue-100 transition-opacity duration-1000 ${isReady ? "opacity-100" : "opacity-0"} ${inter.className}`}
    >
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4">
        <div className="flex gap-6">
          <Link
            href="https://github.com/canooopus"
            target="_blank"
            className="hover:text-neutral-600 transition-colors underline decoration-1 underline-offset-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              width="21"
              height="21"
            >
              <path d="M16 22.027v-2.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.75a5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.4 13.4 0 0 0-7 0c-2.73-1.83-3.91-1.48-3.91-1.48A5.07 5.07 0 0 0 5 5.797a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58v2.87" />
              <path d="M9 20.027c-3 .973-5.5 0-7-3" />
            </svg>
          </Link>
          <Link
            href="https://x.com/Canopus1170612"
            target="_blank"
            className="hover:text-neutral-600 transition-colors"
          >
            <svg
              viewBox="0 1 23 23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              width="21"
              height="21"
            >
              <path d="M9.6 4.802a.973.973 0 00-.806-.427H5.148a.39.39 0 00-.322.608L14.49 19.23a.973.973 0 00.805.427h3.646a.39.39 0 00.323-.608L9.6 4.802zM10.45 13.433L4.669 20M18.757 4l-5.437 6.176"></path>
            </svg>
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Canooopus</p>
      </div>
    </footer>
  );
}
