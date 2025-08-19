"use client";

import Image, { ImageProps } from "next/image";
import { memo } from "react";
import { getProxyUrl } from "@/utils/getProxyUrl";

// Simple in-memory cache for loaded images
const imageCache = new Map<string, boolean>();

export const CachedImage = memo(
  function CachedImage({
    src,
    alt,
    onLoad,
    quality = 60, // Lower default quality
    loading = "lazy", // Default to lazy loading
    ...props
  }: ImageProps) {
    // Use a default image if src is undefined or empty
    const imageSrc = (src as string).includes("http")
      ? getProxyUrl(src as string)
      : src;

    // Handle image load and cache
    const handleLoad = (event: any) => {
      imageCache.set(imageSrc as string, true);
      onLoad?.(event);
    };

    return (
      <Image
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        quality={quality}
        loading={loading}
        {...props}
      />
    );
  },
  (prev, next) => {
    // Optimize re-renders by comparing only necessary props
    return (
      prev.src === next.src &&
      prev.className === next.className &&
      prev.height === next.height &&
      prev.width === next.width
    );
  },
);
