"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { Image } from "@/components/common/Image";
import { photographyItems } from "@/features/photography/photographyItems";
import type { PhotographyItem } from "@/features/photography/types";
import { PhotographyModal } from "./PhotographyModal";

/** カードごとの固定角度。ランダムにするとハイドレーションでズレるため配列で持つ */
const CARD_ROTATIONS = [-2, 1.5, -1, 2.5, -1.5, 2];

interface PhotographyGalleryProps {
  caveatClass: string;
}

export function PhotographyGallery({ caveatClass }: PhotographyGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotographyItem | null>(
    null,
  );
  const closeModal = useCallback(() => setSelectedPhoto(null), []);

  if (photographyItems.length === 0) {
    return <p className="py-16 text-center text-neutral-400">No photos yet.</p>;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* 散らばったプリント風のカード。ホバー / フォーカスで正面に戻す */
        .photography-card {
          transform: rotate(var(--photography-rotation, 0deg));
          transition: transform 300ms ease, box-shadow 300ms ease;
        }
        .photography-card:hover,
        .photography-card:focus-visible {
          transform: rotate(0deg) translateY(-4px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
        }
        @media (hover: none) {
          .photography-card:hover {
            transform: rotate(var(--photography-rotation, 0deg));
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .photography-card {
            transition: none;
          }
        }
      `,
        }}
      />

      <div className="columns-1 [column-gap:2rem] md:columns-2">
        {photographyItems.map((photo, index) => (
          <div key={photo.id} className="mb-8 break-inside-avoid">
            <div
              role="button"
              tabIndex={0}
              aria-label={`Open ${photo.title}`}
              onClick={() => setSelectedPhoto(photo)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedPhoto(photo);
                }
              }}
              className="photography-card group w-full cursor-pointer bg-white p-3 shadow-md ring-1 ring-black/[0.07] outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-4"
              style={
                {
                  "--photography-rotation": `${
                    CARD_ROTATIONS[index % CARD_ROTATIONS.length]
                  }deg`,
                } as CSSProperties
              }
            >
              <div
                className="relative w-full overflow-hidden bg-neutral-100"
                style={{ aspectRatio: photo.aspectRatio ?? "4 / 3" }}
              >
                <Image
                  src={photo.src}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  variant="thumb"
                  priority={index < 2}
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <p
                className={`mt-3 text-center text-lg text-neutral-700 md:text-xl ${caveatClass}`}
              >
                {photo.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      <PhotographyModal
        photo={selectedPhoto}
        onClose={closeModal}
        caveatClass={caveatClass}
      />
    </>
  );
}
