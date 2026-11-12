import { getPhotographyById } from "@/features/photography/photographyItems";
import type { GalleryItem } from "./types";

/** home の BookAlbum に表示する写真。photographyItems.ts の ID で選ぶ */
const homePhotographyIds = [
  "adriatic-horizon",
  "kobe-from-above",
  "cherry-blossom",
  "dubrovnik-cathedral",
  "azalea",
  "wedded-rocks",
];

export const galleryItems: GalleryItem[] = homePhotographyIds.map((id) => {
  const photo = getPhotographyById(id);
  return {
    src: photo.src,
    // home では短いキャプションだけを使う
    description: photo.title,
  };
});
