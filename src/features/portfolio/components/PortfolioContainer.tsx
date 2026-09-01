"use client";

import { useState, useEffect } from "react";
import { AnimatedLogo } from "./AnimatedLogo";
import { IntroText } from "./IntroText";
import { PlaylistSection } from "./PlaylistSection";
import { GallerySection } from "./GallerySection";

interface PortfolioContainerProps {
  novaMonoClass: string;
  caveatClass: string;
}

export function PortfolioContainer({
  novaMonoClass,
  caveatClass,
}: PortfolioContainerProps) {
  const [showText, setShowText] = useState(false);

  // ロゴが完全に描画されるまで（showTextがtrueになるまで）スクロールを禁止し、最上部に固定
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if (!showText) {
      resetScroll();
      document.body.style.overflow = "hidden";

      // ブラウザの非同期スクロール復元に対抗するため次フレームでもリセット
      const rafId = requestAnimationFrame(resetScroll);
      return () => {
        cancelAnimationFrame(rafId);
      };
    } else {
      // 明示的に "auto" に戻すことで、確実にスクロール機能を復帰させます
      document.body.style.overflow = "auto";
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    }
    return () => {
      document.body.style.overflow = "";
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, [showText]);

  return (
    <div
      className={`w-full ${
        !showText ? "h-screen overflow-hidden" : "min-h-screen overflow-x-clip"
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        html {
          overscroll-behavior-y: none;
          min-height: 100%;
          scrollbar-gutter: stable;
        }
        body {
          overflow-x: clip; /* htmlではなく、bodyのみに設定します */
        }
      `,
        }}
      />
      <main className="max-w-2xl mx-auto px-6 pt-20 pb-0 md:pt-32 selection:bg-blue-100 flex flex-col items-start justify-center min-h-[50vh]">
        {/* ロゴセクション */}
        <AnimatedLogo onComplete={() => setShowText(true)} />

        {/* コンテンツセクション */}
        <div
          className={`w-full transition-all duration-1000 ease-out ${
            showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <IntroText novaMonoClass={novaMonoClass} />
          <div className="mt-16 w-full">
            <div className="relative pb-6 before:content-[''] before:absolute before:inset-0 before:w-screen before:left-1/2 before:-translate-x-1/2 before:bg-gray-100 before:-z-10">
              <PlaylistSection caveatClass={caveatClass} />
              <GallerySection
                caveatClass={caveatClass}
                novaMonoClass={novaMonoClass}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
