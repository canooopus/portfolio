"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image } from "@/components/common/Image";
import { motion, AnimatePresence } from "framer-motion";
import { GalleryItem } from "@/features/portfolio/types";

interface ImageModalProps {
  selectedItem: GalleryItem | null;
  onClose: () => void;
  caveatClass: string;
}

export function ImageModal({
  selectedItem,
  onClose,
  caveatClass,
}: ImageModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 画面全体のブラー適用 & ガター解除 & 余白補正
  const lockScroll = () => {
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
  };

  // スクロールバーとガターの完全復元
  const unlockScroll = () => {
    document.documentElement.style.scrollbarGutter = "";
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.documentElement.style.removeProperty("--scrollbar-width");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (selectedItem) {
      window.addEventListener("keydown", handleKeyDown);
      lockScroll();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItem, onClose]);

  // コンポーネントアンマウント時の安全対策
  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    // onExitComplete でフェードアウト完了後にスクロールバーとガターを復元
    <AnimatePresence onExitComplete={unlockScroll}>
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 cursor-zoom-out select-none"
          onClick={onClose}
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
              <Image
                src={selectedItem.src}
                alt={selectedItem.description}
                width={1200}
                height={900}
                sizes="(max-width: 768px) 90vw, 576px"
                className="max-h-[65vh] w-auto object-contain"
                priority
                variant="large"
              />
              <p
                className={`text-center mt-2 text-xl md:text-2xl text-neutral-800 ${caveatClass}`}
              >
                {selectedItem.description}
              </p>
            </div>

            {/* Close ボタン */}
            <button
              onClick={onClose}
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
