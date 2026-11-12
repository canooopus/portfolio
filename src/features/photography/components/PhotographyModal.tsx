"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Image } from "@/components/common/Image";
import type { PhotographyItem } from "@/features/photography/types";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useScrollLock } from "@/hooks/useScrollLock";

interface PhotographyModalProps {
  photo: PhotographyItem | null;
  onClose: () => void;
  caveatClass: string;
}

function formatPhotoDate(value?: string): string | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function PhotographyModal({
  photo,
  onClose,
  caveatClass,
}: PhotographyModalProps) {
  const mounted = useIsMounted();
  const { unlockScroll } = useScrollLock(Boolean(photo));
  const prefersReducedMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const formattedDate = formatPhotoDate(photo?.date);

  // モーダルを開いたらカードにフォーカスし、閉じたら元の要素へ戻す
  useEffect(() => {
    if (!photo) return;

    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const rafId = requestAnimationFrame(() => {
      cardRef.current?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(rafId);
  }, [photo]);

  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photo, onClose]);

  const handleExitComplete = useCallback(() => {
    unlockScroll();
    setFlipped(false);
    triggerRef.current?.focus({ preventScroll: true });
    triggerRef.current = null;
  }, [unlockScroll]);

  if (!mounted) return null;

  return createPortal(
    // onExitComplete でフェードアウト完了後にスクロールバーとフォーカスを復元
    <AnimatePresence onExitComplete={handleExitComplete}>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={photo.title}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4 backdrop-blur-md select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex w-full max-w-xl flex-col items-center [perspective:1600px]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* home のギャラリーモーダルと同じく、写真の幅に合わせてフレームを縮める */}
            <motion.div
              ref={cardRef}
              role="button"
              tabIndex={0}
              aria-label={
                flipped
                  ? `Show photo: ${photo.title}`
                  : `Show description: ${photo.title}`
              }
              aria-pressed={flipped}
              onClick={() => setFlipped((value) => !value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setFlipped((value) => !value);
                }
              }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 90, damping: 17, mass: 0.9 }
              }
              className="relative cursor-pointer rounded-sm bg-white p-2 shadow-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-4 md:p-4"
              style={{
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              {/* 表面: 写真 + タイトル */}
              <div
                aria-hidden={flipped}
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={photo.src}
                  alt={photo.title}
                  width={1200}
                  height={900}
                  sizes="(max-width: 768px) 90vw, 576px"
                  className="mx-auto block max-h-[65vh] w-auto object-contain"
                  priority
                  variant="large"
                />
                <p
                  className={`mt-2 text-center text-xl text-neutral-800 md:text-2xl ${caveatClass}`}
                >
                  {photo.title}
                </p>
              </div>

              {/* 裏面: 説明文 + 撮影日 */}
              <div
                aria-hidden={!flipped}
                className="absolute inset-0 overflow-y-auto rounded-sm bg-white"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center md:px-10">
                  <p
                    className={`max-w-md text-lg leading-relaxed whitespace-pre-line text-neutral-800 md:text-xl ${caveatClass}`}
                  >
                    {photo.description}
                  </p>
                  {formattedDate && (
                    <p
                      className={`mt-8 text-base text-neutral-600 md:text-lg ${caveatClass}`}
                    >
                      {formattedDate}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <button
              onClick={onClose}
              className="mt-6 cursor-pointer rounded-full bg-[#E5E7EB] px-6 py-1.5 text-sm font-medium text-[#4B5563] transition-all duration-200 hover:bg-[#D1D5DB] active:scale-95"
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
