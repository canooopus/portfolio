"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Image } from "@/components/common/Image";
import { motion } from "framer-motion";
import { galleryItems } from "@/features/portfolio/galleryItems";
import { GalleryItem } from "@/features/portfolio/types";

interface AlbumPageContentProps {
  item?: GalleryItem;
  caveatClass: string;
  onItemClick?: (item: GalleryItem) => void;
  priority?: boolean;
  eager?: boolean;
}

export const AlbumPageContent: React.FC<AlbumPageContentProps> = ({
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
            priority={true}
            variant="thumb"
            className="object-cover"
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

interface BookAlbumProps {
  caveatClass: string;
  novaMonoClass: string;
  onImageClick: (item: GalleryItem) => void;
}

export function BookAlbum({
  caveatClass,
  novaMonoClass,
  onImageClick,
}: BookAlbumProps) {
  if (!galleryItems || galleryItems.length === 0) {
    return (
      <div className="py-8 text-neutral-400 text-center">
        No images available
      </div>
    );
  }

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
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const newScale =
          containerWidth < 600 ? (containerWidth * 0.9) / 560 : 1.0;
        setScale(Math.max(0.4, Math.min(newScale, 1.0)));
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const goNext = () =>
    currentSheet < sheets.length && setCurrentSheet((prev) => prev + 1);
  const goPrev = () => currentSheet > 0 && setCurrentSheet((prev) => prev - 1);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      <div
        ref={containerRef}
        className="book-container select-none mt-6 md:mt-0"
      >
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
              const isNext =
                index === currentSheet || index === currentSheet - 1;

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
    </>
  );
}
