"use client";

import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Пошук оголошень..." }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  const handleClear = useCallback(() => onChange(""), [onChange]);

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 h-11 transition-all ${
        focused
          ? "bg-[var(--tg-theme-bg-color,#fff)] ring-2 ring-[var(--tg-theme-button-color,#2481cc)] shadow"
          : "bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
      }`}
    >
      <Search className="w-4 h-4 text-[var(--tg-theme-hint-color,#888)] flex-shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-[var(--tg-theme-text-color,#111)] placeholder-[var(--tg-theme-hint-color,#888)] outline-none"
      />
      {value && (
        <button onClick={handleClear} className="flex-shrink-0">
          <X className="w-4 h-4 text-[var(--tg-theme-hint-color,#888)]" />
        </button>
      )}
    </div>
  );
}
