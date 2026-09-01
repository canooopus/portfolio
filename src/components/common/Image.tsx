"use client";

import React, { useState, useRef, useEffect } from "react";

export interface CustomImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  srcSet?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "thumb" | "medium" | "large" | "auto";
}

/**
 * ギャラリー画像などのパスから最適化済み WebP の srcset / src を解決するヘルパー
 */
function resolveOptimizedSrc(
  src: string,
  variant: "thumb" | "medium" | "large" | "auto" = "auto"
): { defaultSrc: string; srcSet?: string } {
  // 既に optimized 配下のパスが直接指定されている場合はそのまま返す
  if (src.startsWith("/images/optimized/")) {
    return { defaultSrc: src };
  }

  // /images/(任意の階層/)?(ファイル名).(jpg|jpeg|png|webp) の形式を判定
  const match = src.match(/^\/images\/(?:(.+)\/)?([^/]+)\.(jpg|jpeg|png|webp)$/i);
  if (!match) {
    return { defaultSrc: src };
  }

  const subDir = match[1] || ""; // 例: "gallery", "home/gallery", "blog/hello-world", または ""
  const baseName = match[2]; // 例: "photo1", "eyecatch"

  const prefix = subDir ? `/images/optimized/${subDir}` : `/images/optimized`;
  const thumbSrc = `${prefix}/${baseName}-thumb.webp`;
  const mediumSrc = `${prefix}/${baseName}-medium.webp`;
  const largeSrc = `${prefix}/${baseName}-large.webp`;

  if (variant === "thumb") {
    return { defaultSrc: thumbSrc };
  }
  if (variant === "medium") {
    return { defaultSrc: mediumSrc };
  }
  if (variant === "large") {
    return { defaultSrc: largeSrc };
  }

  // auto: 複数解像度の srcset を生成
  return {
    defaultSrc: mediumSrc,
    srcSet: `${thumbSrc} 480w, ${mediumSrc} 800w, ${largeSrc} 1280w`,
  };
}

export function Image({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality: _quality, // Next.js互換性のためのプロパティ（内部では使用しない）
  sizes,
  srcSet: customSrcSet,
  className = "",
  style,
  loading,
  decoding,
  variant = "auto",
  onLoad,
  ...rest
}: CustomImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { defaultSrc, srcSet: autoSrcSet } = resolveOptimizedSrc(src, variant);
  const finalSrcSet = customSrcSet || autoSrcSet;

  const computedLoading = priority ? "eager" : loading || "lazy";
  const computedDecoding = priority ? "sync" : decoding || "async";
  const fetchPriority = priority ? ("high" as const) : undefined;

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [defaultSrc]);

  const fillStyle: React.CSSProperties = fill
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: (style?.objectFit as React.CSSProperties["objectFit"]) || "cover",
      }
    : {};

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={defaultSrc}
      srcSet={finalSrcSet}
      sizes={sizes}
      alt={alt}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      loading={computedLoading}
      decoding={computedDecoding}
      fetchPriority={fetchPriority}
      className={`transition-opacity duration-300 ${
        isLoaded || priority ? "opacity-100" : "opacity-0"
      } ${className}`}
      style={{
        ...fillStyle,
        ...style,
      }}
      onLoad={handleLoad}
      {...rest}
    />
  );
}

export default Image;
