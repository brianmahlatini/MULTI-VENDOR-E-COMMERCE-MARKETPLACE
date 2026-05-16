"use client";

import { useState } from "react";

const fallbackImage = "/products/stoneware-coffee-mug-set.svg";

type ProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallbackImage);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setImageSrc(fallbackImage)}
    />
  );
}
