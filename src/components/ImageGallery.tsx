"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  isSold?: boolean;
}

export function ImageGallery({ images, alt, isSold }: ImageGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Drag-to-scroll for pointer/mouse (touch uses native scrolling)
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || images.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;
    dragging.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = startScrollLeft.current - (e.clientX - startX.current);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    const el = scrollRef.current;
    if (el) {
      el.releasePointerCapture?.(e.pointerId);
      scrollToIndex(Math.round(el.scrollLeft / el.clientWidth));
    }
  };

  return (
    <div className="relative bg-black">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "flex aspect-square overflow-x-auto snap-x snap-mandatory scrollbar-hide",
          images.length > 1 && "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
      >
        {images.map((src, i) => (
          <div key={i} className="relative w-full h-full flex-shrink-0 snap-center">
            <Image
              src={src}
              alt={`${alt} — ${i + 1}`}
              fill
              sizes="100vw"
              className={cn("object-cover select-none pointer-events-none", isSold && "opacity-70 grayscale")}
              priority={i === 0}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {isSold && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-black/60 text-white font-bold text-lg px-5 py-2 rounded-full uppercase tracking-widest">
            Продано
          </span>
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === images.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeIndex ? "bg-white w-4" : "bg-white/50 w-1.5"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
