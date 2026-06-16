"use client";
import { useState } from "react";

// Plain <img> with a fallback when the CDN doesn't have an asset.
export default function SafeImg({ src, fallback, alt = "", ...rest }) {
  const [cur, setCur] = useState(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cur}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (fallback && cur !== fallback) setCur(fallback);
        else setCur("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E");
      }}
      {...rest}
    />
  );
}
