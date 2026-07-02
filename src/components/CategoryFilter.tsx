"use client";

import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selected: string;
  onChange: (id: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
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
  );
}
