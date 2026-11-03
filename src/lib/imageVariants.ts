import imageManifest from "@/generated/image-manifest.json";

export type ImageVariantName = "thumb" | "medium" | "large";
export type ImageVariant = ImageVariantName | "auto";

type VariantWidths = Partial<Record<ImageVariantName, number>>;

const widthsByPath: Record<string, VariantWidths> = imageManifest;

const normalizedWidths = new Map(
  Object.entries(widthsByPath).map(([key, widths]) => [
    key.toLowerCase(),
    widths,
  ]),
);

const VARIANT_ORDER: ImageVariantName[] = ["thumb", "medium", "large"];

// ブログ本文（max-w-2xl = 672px / px-6 = 24px）に合わせた表示幅
export const RESPONSIVE_IMAGE_SIZES =
  "(min-width: 672px) 624px, calc(100vw - 48px)";

const LOCAL_IMAGE_PATTERN =
  /^\/images\/(?:(.+)\/)?([^/]+)\.(jpg|jpeg|png|webp)$/i;

export interface ResolvedImageSource {
  defaultSrc: string;
  srcSet?: string;
}

/**
 * `/images/...` のパスから最適化済み WebP の src / srcset を解決する。
 *
 * srcset の幅記述子には、`scripts/optimize-images.mjs` が記録した実寸を使う。
 * 元画像が小さいと `withoutEnlargement` により large でも 1280px 未満になるため、
 * 固定の 480w / 800w / 1280w を書くと高 DPR 端末で画像が小さく表示されてしまう。
 */
export function resolveOptimizedImage(
  src: string,
  variant: ImageVariant = "auto",
): ResolvedImageSource {
  // 既に optimized 配下のパスが直接指定されている場合はそのまま返す
  if (src.startsWith("/images/optimized/")) {
    return { defaultSrc: src };
  }

  const match = src.match(LOCAL_IMAGE_PATTERN);
  if (!match) {
    return { defaultSrc: src };
  }

  const subDir = match[1] || "";
  const baseName = match[2];
  const prefix = subDir ? `/images/optimized/${subDir}` : `/images/optimized`;
  const srcFor = (name: ImageVariantName) => `${prefix}/${baseName}-${name}.webp`;

  if (variant !== "auto") {
    return { defaultSrc: srcFor(variant) };
  }

  const widths = normalizedWidths.get(
    src.slice("/images/".length).toLowerCase(),
  );

  if (!widths) {
    // 実寸が不明な場合は幅記述子を偽らず、medium を単体で使う
    return { defaultSrc: srcFor("medium") };
  }

  // 元画像が小さいと同じ幅のバリアントが複数できるため 1 つにまとめる
  const byWidth = new Map<number, string>();
  for (const name of VARIANT_ORDER) {
    const width = widths[name];
    if (typeof width === "number" && width > 0) {
      byWidth.set(width, srcFor(name));
    }
  }

  const candidates = [...byWidth.entries()].sort(([a], [b]) => a - b);
  const defaultName: ImageVariantName = widths.medium
    ? "medium"
    : widths.large
      ? "large"
      : "thumb";

  return {
    defaultSrc: srcFor(defaultName),
    srcSet: candidates.length
      ? candidates.map(([width, url]) => `${url} ${width}w`).join(", ")
      : undefined,
  };
}
