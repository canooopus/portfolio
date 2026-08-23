"use client";

import { useEffect } from "react";
import Image from "next/image";
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (selectedItem) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, onClose]);

  return (
    <AnimatePresence>
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 cursor-zoom-out"
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
    </AnimatePresence>
  );
}
