"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";

interface SelectedImage {
  src: string;
  alt: string;
}

export default function BlogImageModal() {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const { unlockScroll } = useScrollLock(Boolean(selectedImage));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === "img") {
        const img = target as HTMLImageElement;

        // リンクで囲まれている画像（a:has(img)）はモーダル対象外
        if (img.closest("a")) {
          return;
        }

        e.preventDefault();

        // 最適化画像の場合は large サイズへ昇格して高解像度表示
        let highResSrc = img.currentSrc || img.src;
        if (highResSrc.includes("/images/optimized/")) {
          highResSrc = highResSrc
            .replace(/-thumb\.webp(\?.*)?$/i, "-large.webp")
            .replace(/-medium\.webp(\?.*)?$/i, "-large.webp");
        }

        const altText = img.alt || img.getAttribute("title") || "";

        setSelectedImage({
          src: highResSrc,
          alt: altText,
        });
      }
    };

    const container = document.querySelector(".blog-content");
    if (container) {
      container.addEventListener("click", handleImageClick as EventListener);
    }

    return () => {
      if (container) {
        container.removeEventListener(
          "click",
          handleImageClick as EventListener,
        );
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    // onExitComplete でフェードアウト完了後にスクロールバーを元に戻す（閉じる際のカクつき防止）
    <AnimatePresence onExitComplete={unlockScroll}>
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.alt || "Image preview"}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 md:p-8 cursor-zoom-out select-none"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative max-w-5xl w-auto flex flex-col items-center cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            {/* 拡大前と同じ角丸・ボーダー・シャドウスタイルのまま拡大 */}
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-h-[85vh] max-w-[90vw] md:max-w-4xl w-auto h-auto object-contain rounded-2xl border border-white/10 shadow-2xl"
            />

            {/* Close ボタン */}
            <button
              onClick={() => setSelectedImage(null)}
              className="mt-6 px-6 py-1.5 bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#4B5563] rounded-full transition-all duration-200 text-sm font-medium cursor-pointer active:scale-95"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
