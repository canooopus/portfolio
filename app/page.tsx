"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nova_Mono, Caveat, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/context/MenuContext"; 
import { galleryItems } from "@/features/portfolio/galleryItems";
import { playlists } from "@/features/portfolio/playlists";

const novaMono = Nova_Mono({
  subsets: ["latin"],
  weight: "400",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: "400",
});
const inter = Inter({
  subsets: ["latin"],
  weight: "400",
});

// ギャラリーデータの定義。ここを編集するだけでページが増減します
export default function Home() {
  const { setIsReady } = useMenu();
  const svgRef = useRef<SVGSVGElement>(null);
  const [showText, setShowText] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    src: string;
    description: string;
  } | null>(null);

  const [playlistIndex, setPlaylistIndex] = useState(0);

  // PC用無限ループカルーセルの制御用ステート (初期値 1: 本物の最初の要素)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // iframe操作用のオーバーレイ制御用ステート
  const [activeIframeIndex, setActiveIframeIndex] = useState<
    string | number | null
  >(null);

  // モバイルスクロール状態判定用
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PC版：前後の切り替えアクション
  const prevPlaylist = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const nextPlaylist = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // PC版：トランジション終了時の瞬間移動
  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(playlists.length); // 本物の最後の要素 (インデックス 3) へ瞬間移動
    } else if (currentIndex === playlists.length + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1); // 本物の最初の要素 (インデックス 1) へ瞬間移動
    }
  };

  // ロゴが完全に描画されるまで（showTextがtrueになるまで）スクロールを禁止
  useEffect(() => {
    // スクロールした状態でのリロード時にロゴが表示範囲外へずれないようスクロール位置を最上部に固定
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (!showText) {
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
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

  // 表示用 playlistIndex の同期
  useEffect(() => {
    let index = currentIndex - 1;
    if (index < 0) index = playlists.length - 1;
    if (index >= playlists.length) index = 0;
    setPlaylistIndex(index);
  }, [currentIndex, playlists.length]);

  // transitionを有効に戻す
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    if (selectedItem) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loopedPlaylists = useMemo(() => {
    if (!playlists.length) return [];
    return [playlists[playlists.length - 1], ...playlists, playlists[0]];
  }, []);

  // 初期表示時にクローンではない「最初の要素」までスクロール
  useEffect(() => {
    if (scrollRef.current) {
      const step = scrollRef.current.clientHeight + 16;
      scrollRef.current.scrollTop = step;
    }
  }, []);

  // スクロール状態監視用のタイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!svgRef.current) return;

    const paths =
      svgRef.current.querySelectorAll<SVGPathElement>(".animated-path");

    let currentDelay = 0;
    const speed = 400; //

    paths.forEach((path) => {
      const length = path.getTotalLength();

      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.setProperty("--path-length", `${length}`);

      const duration = length / speed;

      path.style.animationDuration = `${duration}s`;
      path.style.animationDelay = `${currentDelay}s`;

      currentDelay += duration;

      path.getBoundingClientRect();
      path.style.animationName = "drawAndFill";
      path.style.animationTimingFunction = "cubic-bezier(0.4, 0, 0.2, 1)";
      path.style.animationFillMode = "both";
    });

    const totalTimeMs = currentDelay * 1000;

    const timer = setTimeout(() => {
      setShowText(true);
      setIsReady(true);
    }, totalTimeMs + 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`w-full ${!showText ? "h-screen overflow-hidden" : "min-h-screen overflow-x-clip"}`}>
      <main className="max-w-2xl mx-auto px-6 pt-20 pb-0 md:pt-32 selection:bg-blue-100 flex flex-col items-start justify-center min-h-[50vh]">

        {/* ロゴセクション */}
        <div className="mb-12 w-full max-w-60 md:max-w-75">
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
            .animated-path {
              opacity: 0;
            }
            @keyframes drawAndFill {
              0% {
                stroke-dashoffset: var(--path-length);
                fill: rgba(0, 0, 0, 0);
                opacity: 1;
              }
              100% {
                stroke-dashoffset: 0;
                fill: rgba(0, 0, 0, 0);
                opacity: 1;
              }
            }

            /* 3D Book Album Styles */
            .book-container {
              perspective: 1600px;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2.5rem 0;
            }

            @media (max-width: 640px) {
              .book-container {
                padding: 0.5rem 0;
              }
            }
            .book-wrapper {
              position: relative;
              transition: transform 0.3s ease;
            }
            .book {
              position: relative;
              width: 560px;
              height: 380px;
              transform-style: preserve-3d;
              transform: rotateX(10deg);
              transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .book-sheet {
              position: absolute;
              top: 0;
              right: 0;
              width: 50%;
              height: 100%;
              transform-origin: left center;
              transform-style: preserve-3d;
            }
            .book-sheet.flipped {
              transform: rotateY(-180deg);
            }
            .book-page {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              backface-visibility: hidden;
              background-color: #FAF9F5;
              border: 1px solid rgba(0, 0, 0, 0.1);
              box-shadow: inset 3px 0 12px rgba(0, 0, 0, 0.04), 2px 2px 8px rgba(0, 0, 0, 0.06);
              padding: 24px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              user-select: none;
            }
            .book-page-front {
              border-radius: 2px 10px 10px 2px;
              box-shadow: 
                inset 3px 0 10px rgba(0,0,0,0.02),
                2px 1px 3px rgba(0,0,0,0.05);
            }
            .book-page-back {
              transform: rotateY(180deg);
              border-radius: 10px 2px 2px 10px;
              box-shadow: inset -3px 0 12px rgba(0, 0, 0, 0.04), -2px 2px 8px rgba(0, 0, 0, 0.06);
            }
            /* ページの内側のグラデーション影（本の中央の谷折り部分） */
            .book-page-front::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 15px;
              height: 100%;
              background: linear-gradient(to right, rgba(0,0,0,0.06), transparent);
              pointer-events: none;
            }
            .book-page-back::after {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 15px;
              height: 100%;
              background: linear-gradient(to left, rgba(0,0,0,0.06), transparent);
              pointer-events: none;
            }
            /* 背表紙（谷折りシャドウ） */
            .book-spine {
              position: absolute;
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 8px;
              height: 100%;
              background: linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0.12));
              box-shadow: 0 0 4px rgba(0,0,0,0.1);
              z-index: 10;
              pointer-events: none;
            }
            /* 紙の質感風の薄い方眼紙背景 */
            .bg-grid-paper {
              background-image: radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px);
              background-size: 16px 16px;
            }
          `,
            }}
          />

          <svg
            ref={svgRef}
            version="1.1"
            viewBox="0 0 350 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            {/* 上のパス */}
            <path
              className="animated-path -rotate-1"
              d="M33.7684 24.687C33.7684 24.687 37.2598 22.7513 39.2684 21.187C41.8828 19.1509 43.2323 17.8014 45.2684 15.187C46.8328 13.1784 47.6279 11.9632 48.7684 9.68703C49.4346 8.35754 50.2055 7.67277 50.2684 6.18703C50.3106 5.19228 50.2244 4.57213 49.7684 3.68703C48.8478 1.89988 47.2299 1.6278 45.2684 1.18703C43.7443 0.844539 42.8244 1.0491 41.2684 1.18703C38.249 1.45468 36.5951 2.09216 33.7684 3.18703C31.3256 4.13325 30.0372 4.87723 27.7684 6.18703C25.3296 7.59503 23.9954 8.46336 21.7684 10.187C19.0366 12.3015 17.6598 13.694 15.2684 16.187C12.2916 19.2903 10.0258 21.9534 8.26844 24.687C6.51108 27.4207 5.52579 28.9534 3.76844 31.687C2.01108 34.4207 1.63025 35.4915 1.26844 38.187C1.06062 39.7352 0.783621 40.7021 1.26844 42.187C1.77286 43.7321 2.43278 44.5882 3.76844 45.5143C4.95308 46.3356 5.85123 46.4234 7.26844 46.687C10.3638 47.2629 12.1585 46.6781 15.2684 46.187C19.2023 45.5659 21.4374 44.7754 25.2684 43.687C29.9075 42.3691 32.3476 41.1142 36.7684 39.187C39.7313 37.8954 41.4281 37.2296 44.2684 35.687C46.2695 34.6003 47.2611 33.7621 49.2684 32.687C50.4231 32.0686 51.0219 31.5894 52.2684 31.187C53.2159 30.8811 53.7739 30.6397 54.7684 30.687C55.5726 30.7253 56.0892 30.7548 56.7684 31.187C57.2344 31.4835 57.7684 32.187 57.7684 32.187C57.7684 32.187 56.6946 30.9958 55.7684 30.687C54.8422 30.3783 54.2411 30.6025 53.2684 30.687C48.5634 31.0962 45.9972 33.2404 42.7684 36.687C41.9137 37.5995 41.4224 38.1214 40.7684 39.187C40.3117 39.9313 39.7684 40.3138 39.7684 41.187C39.7684 41.8045 39.7996 42.2852 40.2684 42.687C40.8615 43.1953 42.2684 42.687 42.2684 42.687C42.2684 42.687 45.0475 41.5453 46.7684 40.687C52.2942 37.9314 54.3157 34.5845 59.7684 31.687C60.9251 31.0724 62.2686 30.187 62.7684 30.187C63.2683 30.187 62.3034 32.074 61.7684 33.187C61.0408 34.7009 59.8491 35.1109 59.2684 36.687C58.8578 37.8015 58.7301 38.4999 58.7684 39.687C58.8005 40.6822 58.7686 41.687 59.2684 42.187C59.7683 42.687 60.7427 42.9555 61.7684 43.187C64.4956 43.8026 68.7684 41.687 68.7684 41.687L76.7684 38.187C76.7684 38.187 80.93 36.3733 83.2684 34.687C84.952 33.473 87.2684 31.187 87.2684 31.187C87.2684 31.187 93.7686 24.687 94.2684 24.687C94.7683 24.687 86.8062 30.4171 83.2684 35.187C81.2336 37.9305 81.7686 38.187 78.7684 42.687C75.7683 47.187 83.0489 39.9662 85.7684 38.187C88.7142 36.2599 90.1984 34.9093 93.2684 33.187C95.1724 32.1189 96.2354 31.4825 98.2684 30.687C99.4185 30.237 100.768 29.687 101.268 29.687C101.769 29.687 102.269 29.687 102.768 30.687C103.268 31.687 102.239 34.0553 101.768 36.187C101.421 37.7593 100.768 38.687 100.768 40.187C100.769 41.687 102.268 41.687 102.268 41.687C102.268 41.687 104.72 41.4737 106.268 41.187C108.457 40.7816 111.768 39.687 111.768 39.687C111.768 39.687 117.535 37.2696 120.768 35.187C122.64 33.9816 123.323 32.7687 125.268 31.687C126.568 30.9645 127.769 30.687 128.768 30.187C129.768 29.687 126.23 30.882 124.768 31.687C122.468 32.9547 121.165 33.9621 119.768 36.187C118.978 37.4465 118.68 38.2581 118.268 39.687C117.993 40.6437 118.006 41.7265 118.268 42.687C118.454 43.3662 118.213 43.2548 118.768 43.687C119.113 43.9551 119.344 44.0856 119.768 44.187C121.138 44.5141 122.768 42.187 122.768 42.187C122.768 42.187 124.132 40.4429 124.768 39.187C125.244 38.2491 125.478 37.6978 125.768 36.687C126.096 35.5454 126.268 34.8748 126.268 33.687C126.268 32.4993 125.269 29.687 125.768 30.687C126.268 31.687 129.569 33.1757 132.268 34.187C134.53 35.0343 135.865 35.4534 138.268 35.687C140.996 35.9522 142.595 35.7923 145.268 35.187C147.497 34.6823 150.768 33.187 150.768 33.187C150.768 33.187 155.269 30.187 156.268 30.187C157.268 30.187 151.481 32.3065 149.268 34.687C148.125 35.9174 147.121 36.7397 146.268 38.187C145.604 39.3157 145.381 40.3821 145.268 41.687C145.183 42.679 145.035 43.014 145.768 43.687C146.362 44.2313 146.964 44.2285 147.768 44.187C149.175 44.1145 149.821 43.7289 150.768 42.687C151.534 41.8446 152.256 40.2038 152.768 39.187C153.519 37.6972 153.522 36.837 153.768 35.187C154.059 33.2463 153.269 31.187 153.268 30.687C153.268 30.187 156.814 32.7717 159.268 33.687C161.354 34.4649 162.578 34.7895 164.768 35.187C166.508 35.5027 167.5 35.6824 169.268 35.687C172.869 35.6966 174.985 35.1645 178.268 33.687C180.59 32.6423 183.269 30.187 183.768 30.187C184.268 30.187 176.268 35.187 176.268 35.187C176.268 35.187 173.653 37.6102 173.268 39.687C173.091 40.647 172.94 41.2676 173.268 42.187C173.505 42.85 173.653 43.3451 174.268 43.687C175.139 44.1706 175.855 43.5825 176.768 43.187C177.916 42.6904 178.433 42.1168 179.268 41.187C180.965 39.2993 181.525 37.7138 181.768 35.187C181.938 33.427 180.768 29.8775 181.268 30.687C181.768 31.4965 184.741 33.201 187.268 34.187C189.873 35.2032 191.479 35.4957 194.268 35.687C197.003 35.8746 198.611 35.8556 201.268 35.187C203.308 34.674 204.455 34.2523 206.268 33.187C210.581 30.6539 213.769 23.187 214.268 23.187C214.768 23.187 199.264 41.7187 189.768 53.687C177.144 69.5981 156.769 94.687 157.768 94.687C158.768 94.687 191.268 53.687 191.268 53.687C191.268 53.687 199.676 43.4306 206.268 38.187C208.898 36.0958 212.768 32.687 212.768 32.687C212.768 32.687 215.992 30.2355 218.268 30.187C219.264 30.1658 220.127 30.2211 220.768 30.687C221.338 31.101 221.546 31.5191 221.768 32.187C222.472 34.2991 218.768 37.187 218.768 37.187C218.768 37.187 214.932 39.9691 212.268 41.187C210.244 42.1128 206.768 42.687 206.768 42.687C206.768 42.687 205.268 42.687 206.268 41.687C207.269 40.687 215.768 40.187 215.768 40.187C215.768 40.187 221.598 39.4853 225.268 38.687C228.23 38.0428 229.902 37.6733 232.768 36.687C234.757 36.0028 235.976 35.7877 237.768 34.687C239.537 33.6007 240.769 31.187 241.768 31.187C242.768 31.187 237.802 34.065 236.268 36.687C235.518 37.9707 234.547 38.7165 234.768 40.187C234.898 41.0505 235.094 41.6319 235.768 42.187C237.253 43.4096 240.268 40.687 240.268 40.687C240.268 40.687 254.768 28.187 253.768 29.687C252.769 31.187 251.94 32.4297 250.768 34.187C249.987 35.3586 249.17 35.8376 248.768 37.187C248.378 38.497 248.296 39.4045 248.768 40.687C249.201 41.8602 249.683 42.5671 250.768 43.187C252.664 44.2695 256.268 42.687 256.268 42.687C256.268 42.687 261.81 40.3703 265.268 38.687C268.646 37.0433 270.749 36.4208 273.768 34.187C275.216 33.1164 275.79 32.2147 277.268 31.187C278.561 30.2884 280.268 29.187 280.268 29.187C280.268 29.187 282.915 27.7538 284.268 28.187C284.939 28.4016 285.269 28.687 285.768 29.187C286.268 29.687 285.762 30.8226 285.268 31.687C284.857 32.4063 283.769 32.687 283.768 33.187C283.768 33.687 285.648 31.9315 285.768 30.687C285.87 29.6404 285.582 28.8526 284.768 28.187C283.55 27.1905 282.176 27.983 280.768 28.687C279.768 29.187 277.863 30.6336 276.268 32.187C274.979 33.4432 273.57 33.9122 273.268 35.687C273.17 36.2645 273.114 36.6219 273.268 37.187C273.454 37.8663 273.794 38.1673 274.268 38.687C276.785 41.4407 280.869 35.3398 283.768 37.687C284.198 38.0345 284.472 38.2211 284.768 38.687C285.991 40.6082 283.252 41.9592 281.768 43.687C279.861 45.9095 278.482 47.0853 275.768 48.187C274.277 48.7927 273.285 49.7286 271.768 49.187C271.105 48.9502 270.591 48.8129 270.268 48.187C269.636 46.9596 272.768 45.687 272.768 45.687C272.768 45.687 277.595 43.4358 280.768 42.187C283.47 41.124 284.985 40.5102 287.768 39.687C291.221 38.666 293.217 38.282 296.768 37.687C300.065 37.1347 305.268 36.687 305.268 36.687"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                fill: "rgba(0, 0, 0, 0)",
                transform: "translate(15px, 10px)",
              }}
            />
            {/* 下のパス */}
            <path
              className="animated-path"
              d="M0.5 23.1673C0.5 23.1673 1 22.1673 2 21.6673C3 21.1673 11.4171 18.8185 17.5 17.1673C24.4927 15.269 28.417 14.1947 35.5 12.6673C43.0631 11.0363 47.3651 10.4198 55 9.16726C60.0688 8.33572 62.9035 7.80753 68 7.16726C71.7014 6.70226 73.7902 6.55975 77.5 6.16726C79.3987 5.96638 81.6172 5.93125 82.5 6.16726C83.3828 6.40327 83.3349 6.89185 83.5 7.16726C83.6651 7.44267 83.3294 8.29947 82.5 9.16726C81.5271 10.1852 80.7016 10.4332 79.5 11.1673C75.3209 13.7201 68.5 16.543 68 16.1673C67.5 15.7915 74.3336 13.8176 78.5 12.6673C86.1432 10.5569 90.6947 9.93931 98.5 8.54301C108.076 6.82996 113.355 5.9323 123 4.66726C133.097 3.34296 138.834 3.2685 149 2.66726C157.975 2.13645 163.01 1.60875 172 1.66726C179.82 1.71815 190.5 2.16727 192 2.66726C193.5 3.16724 194.156 3.57379 194 4.66726C193.862 5.63376 192 6.16726 192 6.16726C192 6.16726 180.919 8.17326 174 10.1673C168.244 11.8259 159 14.7915 159.5 15.1673C160 15.543 171.014 11.5717 178.5 9.66726C185.479 7.89191 189.395 6.83703 196.5 5.66726C199.225 5.21867 200.761 5.01469 203.5 4.66726C207.201 4.1979 209.291 3.94454 213 3.54301C216.516 3.16237 218.484 2.92364 222 2.54301C225.709 2.14148 227.781 1.9543 231.5 1.66726C235.982 1.32137 238.509 1.22771 243 1.04301C248.076 0.834256 250.92 0.754483 256 0.667258C260.1 0.596859 262.399 0.543015 266.5 0.543015C272.748 0.543015 276.258 0.387695 282.5 0.667258C287.392 0.886365 290.122 1.23665 295 1.66726C299.103 2.02945 301.417 2.12271 305.5 2.66726C309.032 3.13832 311.064 3.22292 314.5 4.16726C316.286 4.6582 316 4.54301 318 5.16728C318.834 5.42746 320.362 6.07094 321 6.66726C321.514 7.14803 322 7.46325 322 8.16728C322 8.8713 321.086 9.77675 320.5 10.1673C319 11.1673 319.09 10.9457 317.5 11.6673C315.585 12.5362 314.441 12.8584 312.5 13.6673C311.127 14.2392 308.5 15.1673 308.5 15.1673"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                fill: "rgba(0, 0, 0, 0)",
                transform: "translate(0, 65px)",
              }}
            />
          </svg>
        </div>
        <div
          className={`w-full transition-all duration-1000 ease-out ${showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* テキストセクション */}
          <div className="space-y-8 w-full">
            <p>
              I’m Canooopus, an engineer & designer living in Japan. I just
              build what I want to build independently.
            </p>

            <p>
              I’m currently working on
              <Link
                href="https://robopro2.com/app/nagasima/LINE/"
                className="inline-flex items-center gap-1 align-middle ml-1 mb-1 hover:opacity-80 transition-opacity underline decoration-1 underline-offset-2"
              >
                <span className="h-[1em] w-[1em] flex items-center">
                  <Image
                    src="/images/brand/Bond.svg"
                    alt="ロゴ"
                    width={100}
                    height={100}
                    priority
                    className="w-full h-full object-contain"
                  />
                </span>
                <span className={novaMono.className}>Bond</span>
              </Link>
              , a browser-based chat app.
            </p>
            <p>
              In my free time, I enjoy photography, exploring new gadgets, and I
              absolutely love{" "}
              <Link
                href="https://radwimps.jp/"
                target="_blank"
                className="hover:opacity-80 transition-opacity underline decoration-1 underline-offset-2"
              >
                RADWIMPS
              </Link>
              .
            </p>
          </div>
          <div className="mt-12 w-full">
            <p
              className={`text-3xl -rotate-3 relative z-10 translate-y-3 md:translate-y-1 ${caveat.className}`}
            >
              My playlist
            </p>
            <div className="relative pt-4 pl-0 pb-4 pr-0 before:content-[''] before:absolute before:inset-0 before:w-screen before:left-1/2 before:-translate-x-1/2 before:bg-gray-100 before:-z-10">
              <div className="max-w-2xl mx-auto py-4 md:py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* 左矢印ボタン（PC版のみ表示） */}
                  <button
                    onClick={prevPlaylist}
                    className="hidden md:flex p-2 rounded-full hover:bg-gray-200 transition-colors shrink-0 text-gray-500 hover:text-gray-900"
                    aria-label="Previous track"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>

                  {/* PC版 iframe本体（gapを追加し、クローン配列を使用して無限ループ化） */}
                  <div className="hidden md:block relative w-full flex-1 min-w-0 h-38">
                    <div
                      className="absolute -left-3 -right-3 top-0 bottom-0 overflow-hidden pointer-events-none"
                      style={{
                        maskImage:
                          "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)",
                        WebkitMaskImage:
                          "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)",
                      }}
                    >
                      <div className="w-full h-full px-3 pointer-events-auto">
                        <div
                          className={`flex gap-4 h-full ${
                            isTransitioning
                              ? "transition-transform duration-500 ease-in-out"
                              : "transition-none"
                          }`}
                          style={{
                            transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 16}px)) translate3d(0,0,0)`,
                            backfaceVisibility: "hidden",
                            willChange: "transform",
                          }}
                          onTransitionEnd={handleTransitionEnd}
                        >
                          {loopedPlaylists.map((url, i) => (
                            <div
                              key={i}
                              className="w-full h-full shrink-0 relative"
                              style={{
                                backfaceVisibility: "hidden",
                                transform: "translate3d(0,0,0)",
                                willChange: "transform",
                              }}
                              onMouseLeave={() => setActiveIframeIndex(null)}
                            >
                              <iframe
                                src={url}
                                className="w-full h-full rounded-xl border-0 bg-transparent pointer-events-auto"
                                allowFullScreen
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                              />
                              {/* 透明カバー。DOMに常にマウントし、pointer-eventsのみ制御 */}
                              <div
                                className={`absolute inset-0 w-full h-full cursor-pointer z-10 ${
                                  activeIframeIndex === i
                                    ? "pointer-events-none"
                                    : "pointer-events-auto"
                                }`}
                                onClick={() => setActiveIframeIndex(i)}
                                style={{
                                  backfaceVisibility: "hidden",
                                  transform: "translate3d(0,0,0)",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* スマホ版 iframe本体（スクロールの滑らかさを追加） */}
                  <div className="relative md:hidden w-full h-38">
                    <div
                      className="absolute -top-3 -bottom-3 left-0 right-6 pointer-events-none"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)",
                      }}
                    >
                      <div
                        ref={scrollRef}
                        className="flex flex-col w-full h-full overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden gap-4 py-3 pointer-events-auto"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          backfaceVisibility: "hidden",
                          transform: "translate3d(0,0,0)",
                          willChange: "transform",
                        }}
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          const h = 152; // 要素の本来の高さ
                          const step = h + 16;
                          const scroll = target.scrollTop;

                          // スクロール状態の管理 (スクロール中はオーバーレイを復活させる)
                          setIsScrolling(true);
                          setActiveIframeIndex(null);
                          if (scrollTimeoutRef.current) {
                            clearTimeout(scrollTimeoutRef.current);
                          }
                          scrollTimeoutRef.current = setTimeout(() => {
                            setIsScrolling(false);
                          }, 150);

                          // 無限ループ時のジャンプ
                          if (scroll <= 0) {
                            target.scrollTo({
                              top: step * playlists.length,
                              behavior: "auto",
                            });
                          } else if (
                            scroll >=
                            step * (loopedPlaylists.length - 1)
                          ) {
                            target.scrollTo({ top: step, behavior: "auto" });
                          }

                          const index = Math.round(target.scrollTop / step) - 1;
                          const safeIndex =
                            (index + playlists.length) % playlists.length;
                          if (safeIndex !== playlistIndex) {
                            setPlaylistIndex(safeIndex);
                          }
                        }}
                      >
                        {loopedPlaylists.map((url, index) => {
                          const uniqueKey = `mobile-${index}`;
                          const isOverlayActive =
                            isScrolling || activeIframeIndex !== uniqueKey;
                          return (
                            <div
                              key={uniqueKey}
                              className="w-full h-38 shrink-0 snap-center relative"
                              style={{
                                backfaceVisibility: "hidden",
                                transform: "translate3d(0,0,0)",
                                willChange: "transform",
                              }}
                            >
                              <iframe
                                src={url}
                                className="w-full h-full rounded-xl border-0 bg-transparent pointer-events-auto"
                                allowFullScreen
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                              />
                              {/* 透明カバー。DOMに常にマウントし、pointer-eventsのみ制御 */}
                              <div
                                className={`absolute inset-0 w-full h-full cursor-pointer z-10 ${
                                  isOverlayActive
                                    ? "pointer-events-auto"
                                    : "pointer-events-none"
                                }`}
                                onClick={() => {
                                  if (!isScrolling) {
                                    setActiveIframeIndex(uniqueKey);
                                  }
                                }}
                                style={{
                                  backfaceVisibility: "hidden",
                                  transform: "translate3d(0,0,0)",
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* 右のバー（インジケーター） */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
                      {playlists.map((_, index) => (
                        <div
                          key={index}
                          className={`w-0.5 transition-all duration-300 rounded-full ${
                            playlistIndex === index
                              ? "bg-gray-800 h-6"
                              : "bg-gray-300 h-3"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 右矢印ボタン（PC版のみ表示） */}
                  <button
                    onClick={nextPlaylist}
                    className="hidden md:flex p-2 rounded-full hover:bg-gray-200 transition-colors shrink-0 text-gray-500 hover:text-gray-900"
                    aria-label="Next track"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p
                className={`text-3xl -rotate-3 relative z-10 md:-translate-y-2 mt-0 ${caveat.className}`}
              >
                Gallery
              </p>
              <BookAlbum
                caveatClass={caveat.className}
                novaMonoClass={novaMono.className}
                onImageClick={(item) => setSelectedItem(item)}
              />
            </div>
          </div>
        </div>
      </main>
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 cursor-zoom-out"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 画像ボックス */}
              <div className="bg-white p-2 md:p-4 shadow-2xl rounded-sm">
                <img
                  src={selectedItem.src}
                  alt={selectedItem.description}
                  className="max-h-[65vh] w-auto object-contain"
                />
                <p
                  className={`text-center mt-2 text-xl md:text-2xl text-neutral-800 ${caveat.className}`}
                >
                  {selectedItem.description}
                </p>
              </div>

              {/* Close ボタン */}
              <button
                onClick={() => setSelectedItem(null)}
                className="mt-6 px-6 py-1.5 bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#4B5563] rounded-full transition-all duration-200 text-sm font-medium cursor-pointer active:scale-95"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- AlbumPageContent Component ---
interface AlbumPageContentProps {
  item?: { src: string; description: string };
  caveatClass: string;
  onItemClick?: (item: { src: string; description: string }) => void;
  priority?: boolean;
  eager?: boolean;
}

const AlbumPageContent: React.FC<AlbumPageContentProps> = ({
  item,
  caveatClass,
  onItemClick,
  priority = false,
  eager = false,
}) => {
  if (!item) return <div className="w-full h-full bg-[#FAF9F5]" />;

  return (
    <div className="w-full h-full relative bg-[#FAF9F5] p-4 flex flex-col items-center justify-center">
      <div
        className="w-52 bg-white border border-neutral-200 p-3 shadow-md transition-transform hover:rotate-0 duration-300 cursor-pointer hover:shadow-lg"
        onClick={() => onItemClick?.(item)}
      >
        <div className="relative w-full h-40 bg-neutral-100 overflow-hidden">
          <Image
            src={item.src}
            alt={item.description}
            fill
            sizes="208px"
            priority={priority}
            loading={priority || eager ? undefined : "lazy"}
            className="object-cover"
            quality={90}
          />
        </div>
        <p
          className={`mt-3 text-lg text-neutral-700 text-center ${caveatClass}`}
        >
          {item.description}
        </p>
      </div>
    </div>
  );
};

// --- Book Album Component ---
// --- Book Album Component ---
const BookAlbum: React.FC<{
  caveatClass: string;
  novaMonoClass: string;
  onImageClick: (item: { src: string; description: string }) => void;
}> = ({ caveatClass, novaMonoClass, onImageClick }) => {
  const [currentSheet, setCurrentSheet] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const leftBase = galleryItems[0];
  const rightBase = galleryItems[galleryItems.length - 1];

  // useMemo で配列の再生成を防ぐ
  const sheets = useMemo(() => {
    const list = [];
    for (let i = 1; i < galleryItems.length - 1; i += 2) {
      list.push({
        id: i,
        front: galleryItems[i],
        back: galleryItems[i + 1] ?? null,
      });
    }
    return list;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const newScale =
        containerWidth < 600 ? (containerWidth * 0.9) / 560 : 1.0;
      setScale(Math.max(0.4, Math.min(newScale, 1.0)));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const goNext = () =>
    currentSheet < sheets.length && setCurrentSheet((prev) => prev + 1);
  const goPrev = () => currentSheet > 0 && setCurrentSheet((prev) => prev - 1);

  return (
    <div ref={containerRef} className="book-container select-none mt-6 md:mt-0">
      <div
        className="book-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: "560px",
          height: `${380 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="book" style={{ position: "absolute" }}>
          <div className="book-spine" />

          {/* 左底 */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[#FAF9F5] border border-black/5 rounded-l-lg z-0 overflow-hidden flex items-center justify-center">
            <AlbumPageContent
              item={leftBase}
              caveatClass={caveatClass}
              onItemClick={onImageClick}
              priority={true}
            />
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              animate={{ opacity: currentSheet > 0 ? 0.2 : 0 }}
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.3), transparent)",
              }}
            />
          </div>

          {/* 右底 */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FAF9F5] border border-black/5 rounded-r-lg z-0 overflow-hidden">
            <AlbumPageContent
              item={rightBase}
              caveatClass={caveatClass}
              onItemClick={onImageClick}
              // 最後のページに近づいたら読み込みを優先
              eager={currentSheet >= sheets.length - 1}
            />
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              animate={{ opacity: currentSheet < sheets.length ? 0.2 : 0 }}
              style={{
                background:
                  "linear-gradient(to left, rgba(0,0,0,0.3), transparent)",
              }}
            />
          </div>

          {sheets.map((sheet, index) => {
            const isFlipped = index < currentSheet;

            // 判定範囲を ±2 に拡大（アニメーション中の画像のチラつき・非表示を防ぐ）
            const isNear = Math.abs(index - currentSheet) <= 2;

            // 次に表示される可能性が高いページか判定
            const isNext = index === currentSheet || index === currentSheet - 1;

            let zIndex = 1;
            if (isNext) {
              zIndex = 50;
            } else {
              zIndex = isFlipped ? 10 + index : 10 + (sheets.length - index);
            }

            return (
              <motion.div
                key={sheet.id}
                initial={false}
                animate={{
                  rotateY: isFlipped ? -180 : 0,
                  z: isNext ? 10 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 45,
                  damping: 18,
                  mass: 1.1,
                }}
                className="book-sheet"
                style={{
                  zIndex,
                  transformStyle: "preserve-3d",
                  transformOrigin: "left center",
                  willChange: "transform",
                }}
              >
                <div className="book-page book-page-front">
                  {isNear && (
                    <AlbumPageContent
                      item={sheet.front}
                      caveatClass={caveatClass}
                      onItemClick={onImageClick}
                      eager={isNext}
                    />
                  )}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: isFlipped ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background:
                        "linear-gradient(to right, rgba(0,0,0,0.15), transparent)",
                      borderRadius: "2px 10px 10px 2px",
                    }}
                  />
                </div>

                <div className="book-page book-page-back">
                  {isNear && sheet.back && (
                    <AlbumPageContent
                      item={sheet.back}
                      caveatClass={caveatClass}
                      onItemClick={onImageClick}
                      eager={isNext}
                    />
                  )}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: isFlipped ? 0 : 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background:
                        "linear-gradient(to left, rgba(0,0,0,0.15), transparent)",
                      borderRadius: "10px 2px 2px 10px",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={goPrev}
          disabled={currentSheet === 0}
          aria-label="Previous page"
          className="p-2.5 rounded-full border border-neutral-300 hover:bg-neutral-100 disabled:opacity-20 transition-colors cursor-pointer text-neutral-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <span
          className={`text-sm font-mono text-neutral-500 min-w-20 text-center ${novaMonoClass}`}
        >
          {currentSheet + 1} / {sheets.length + 1}
        </span>

        <button
          onClick={goNext}
          disabled={currentSheet === sheets.length}
          aria-label="Next page"
          className="p-2.5 rounded-full border border-neutral-300 hover:bg-neutral-100 disabled:opacity-20 transition-colors cursor-pointer text-neutral-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};