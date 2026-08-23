"use client";

import { useState } from "react";
import { BookAlbum } from "./BookAlbum";
import { ImageModal } from "./ImageModal";
import { GalleryItem } from "@/features/portfolio/types";

interface GallerySectionProps {
  caveatClass: string;
  novaMonoClass: string;
}

export function GallerySection({
  caveatClass,
  novaMonoClass,
}: GallerySectionProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  return (
    <>
      <p
        className={`text-3xl -rotate-3 relative z-10 md:-translate-y-2 mt-0 ${caveatClass}`}
      >
        Gallery
      </p>
      <BookAlbum
        caveatClass={caveatClass}
        novaMonoClass={novaMonoClass}
        onImageClick={(item) => setSelectedItem(item)}
      />
      <ImageModal
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        caveatClass={caveatClass}
      />
    </>
  );
}
