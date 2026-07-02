"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  isSold?: boolean;
}

export function ImageGallery({ images, alt, isSold }: ImageGalleryProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = (index: number) => {
    setImgIndex(Math.max(0, Math.min(images.length - 1, index)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      goTo(delta < 0 ? imgIndex + 1 : imgIndex - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div className="relative bg-black">
      <div
        className="relative aspect-square touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[imgIndex]}
          alt={alt}
          fill
          className={cn("object-cover select-none", isSold && "opacity-70 grayscale")}
          priority
          draggable={false}
        />
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/60 text-white font-bold text-lg px-5 py-2 rounded-full uppercase tracking-widest">
              Продано
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(imgIndex - 1)}
            disabled={imgIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(imgIndex + 1)}
            disabled={imgIndex === images.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === imgIndex ? "bg-white w-4" : "bg-white/50 w-1.5"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
