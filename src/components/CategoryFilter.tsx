"use client";

import { useState, useEffect, useRef } from "react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface CategoryFilterProps {
  selected: string;
  onChange: (id: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div className="relative -mx-4">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide scroll-smooth"
      >
        <button
          onClick={() => onChange("")}
          className={cn(
            "flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all",
            selected === ""
              ? "bg-[var(--tg-theme-button-color,#2481cc)] text-[var(--tg-theme-button-text-color,#fff)] shadow-sm"
              : "bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-text-color,#111)]"
          )}
        >
          Всі
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              selected === cat.id
                ? "bg-[var(--tg-theme-button-color,#2481cc)] text-[var(--tg-theme-button-text-color,#fff)] shadow-sm"
                : "bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-text-color,#111)]"
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--tg-theme-secondary-bg-color,#f5f5f5)] to-transparent" />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[var(--tg-theme-hint-color,#888)]">
            <ChevronRight className="w-4 h-4 animate-pulse" />
          </div>
        </>
      )}
    </div>
  );
}
