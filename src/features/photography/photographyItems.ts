import type { PhotographyItem } from "./types";

/**
 * photography ページに表示する全写真の正データ。
 * home に出す写真は src/features/portfolio/galleryItems.ts で ID を選ぶ。
 *
 * 並び順は photography ページの2カラムで左右の高さが揃うように調整している。
 * home の並び順は galleryItems.ts の homePhotographyIds で別途指定する。
 */
export const photographyItems: PhotographyItem[] = [
  {
    id: "ice-plant",
    src: "/images/home/gallery/photo1.jpg",
    title: "Ice plant",
    description:
      "A dense carpet of magenta ice plant flowers opening toward the sun.",
    date: "2026-05-16",
    aspectRatio: "1 / 1",
  },
  {
    id: "kobe-from-above",
    src: "/images/home/gallery/photo2.jpg",
    title: "Kobe from Above",
    description:
      "Kobe and the Akashi Strait seen from the top of Mt. Rokko, with the Akashi Kaikyo Bridge faintly visible across the water.",
    date: "2026-03-24",
    aspectRatio: "3 / 4",
  },
  {
    id: "ginkakuji-temple",
    src: "/images/home/gallery/photo4.jpg",
    title: "Ginkakuji Temple",
    description:
      "The two-story wooden pavilion of Ginkakuji Temple surrounded by a quiet moss garden.",
    date: "2026-04-28",
    aspectRatio: "4 / 3",
  },
  {
    id: "the-national-art-center",
    src: "/images/home/gallery/photo7.jpeg",
    title: "The National Art Center, Tokyo",
    description:
      "The inverted concrete cone cafe floating beneath the sweeping glass facade of The National Art Center, Tokyo.",
    date: "2026-10-12",
    aspectRatio: "1 / 1",
  },
  {
    id: "dubrovnik-at-dusk",
    src: "/images/home/gallery/photo11.jpeg",
    title: "Dubrovnik at Dusk",
    description:
      "A traditional ship sailing past St. John Fortress across the calm Adriatic Sea under a twilight gradient.",
    date: "2026-07-24",
    aspectRatio: "4 / 3",
  },
  {
    id: "plitvice-lakes",
    src: "/images/home/gallery/photo12.jpeg",
    title: "Plitvice Lakes",
    description:
      "Cascading turquoise lakes and wooden boardwalks woven through the lush limestone canyon of Plitvice.",
    date: "2026-07-20",
    aspectRatio: "3 / 4",
  },
  {
    id: "cherry-blossom",
    src: "/images/home/gallery/photo3.jpg",
    title: "Cherry blossom",
    description:
      "White cherry blossoms crowding the branches on an overcast spring day.",
    date: "2026-04-05",
    aspectRatio: "3 / 4",
  },
  {
    id: "azalea",
    src: "/images/home/gallery/photo5.jpg",
    title: "Azalea",
    description:
      "Bright pink azalea flowers in full bloom, lit by strong spring sunlight.",
    date: "2026-04-21",
    aspectRatio: "1 / 1",
  },
  {
    id: "wedded-rocks",
    src: "/images/home/gallery/photo6.jpg",
    title: "Wedded Rocks",
    description:
      "The Meoto Iwa rocks linked by a sacred shimenawa rope, with the sea stretching to the horizon.",
    date: "2026-01-04",
    aspectRatio: "16 / 9",
  },
  {
    id: "mount-prometheus",
    src: "/images/home/gallery/photo8.jpeg",
    title: "Mount Prometheus",
    description:
      "Mount Prometheus towering over Mediterranean Harbor and the fortress galleon under an unbroken blue sky.",
    date: "2026-10-11",
    aspectRatio: "4 / 3",
  },
  {
    id: "hydrangea",
    src: "/images/home/gallery/photo9.jpeg",
    title: "Hydrangea",
    description:
      "A vivid sphere of pink hydrangea petals glowing against the dark garden leaves.",
    date: "2026-06-10",
    aspectRatio: "1 / 1",
  },
  {
    id: "dubrovnik-cathedral",
    src: "/images/home/gallery/photo10.jpg",
    title: "Dubrovnik Cathedral",
    description:
      "The Baroque facade and stone statues of the Cathedral of the Assumption against a dramatic Adriatic sky.",
    date: "2026-07-24",
    aspectRatio: "4 / 3",
  },
  {
    id: "adriatic-horizon",
    src: "/images/home/gallery/photo13.jpg",
    title: "Adriatic Horizon",
    description:
      "A solitary white boat tracing a calm line across the vast, deep blue expanse of the Adriatic Sea.",
    date: "2026-07-24",
    aspectRatio: "4 / 3",
  },
];

/** ID から写真を取得する。存在しない ID はビルド時に検出する */
export function getPhotographyById(id: string): PhotographyItem {
  const photo = photographyItems.find((item) => item.id === id);
  if (!photo) {
    throw new Error(`Photography not found: ${id}`);
  }
  return photo;
}
