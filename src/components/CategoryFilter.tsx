"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selected: string;
  onChange: (id: string) => void;
}

const COLLAPSED_PREVIEW_COUNT = 2;

function getCategoryIndex(id: string): number {
  return CATEGORIES.findIndex((c) => c.id === id);
}

function isLateCategory(id: string): boolean {
  return getCategoryIndex(id) >= COLLAPSED_PREVIEW_COUNT;
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "bg-[var(--tg-theme-button-color,#2481cc)] text-[var(--tg-theme-button-text-color,#fff)] shadow-sm"
          : "bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-text-color,#111)]"
      )}
    >
      {label}
    </button>
  );
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (selected && isLateCategory(selected)) {
      setExpanded(true);
    }
  }, [selected]);

  const handleSelect = (id: string) => {
    onChange(id);
  };

  const hideDisabled = selected !== "" && isLateCategory(selected);

  const previewIds = CATEGORIES.slice(0, COLLAPSED_PREVIEW_COUNT).map((c) => c.id);
  const selectedOutsidePreview =
    selected && !previewIds.includes(selected as (typeof previewIds)[number]);

  const collapsedCategories = CATEGORIES.filter((cat) => {
    if (previewIds.includes(cat.id)) return true;
    if (selectedOutsidePreview && cat.id === selected) return true;
    return false;
  });

  if (expanded) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            label="Всі"
            active={selected === ""}
            onClick={() => handleSelect("")}
          />
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={`${cat.emoji} ${cat.label}`}
              active={selected === cat.id}
              onClick={() => handleSelect(cat.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          disabled={hideDisabled}
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            hideDisabled
              ? "text-[var(--tg-theme-hint-color,#888)] cursor-not-allowed opacity-50"
              : "text-[var(--tg-theme-link-color,#2481cc)]"
          )}
        >
          <ChevronUp className="w-4 h-4" />
          Сховати
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryChip
        label="Всі"
        active={selected === ""}
        onClick={() => handleSelect("")}
      />
      {collapsedCategories.map((cat) => (
        <CategoryChip
          key={cat.id}
          label={`${cat.emoji} ${cat.label}`}
          active={selected === cat.id}
          onClick={() => handleSelect(cat.id)}
        />
      ))}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1 h-9 px-4 rounded-full text-sm font-medium bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-link-color,#2481cc)]"
      >
        Ще
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
