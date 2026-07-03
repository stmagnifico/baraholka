"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PRODUCT_UNAVAILABLE_MESSAGES } from "@/lib/constants";

type UnavailableReason = keyof typeof PRODUCT_UNAVAILABLE_MESSAGES;

interface ProductUnavailableProps {
  reason: UnavailableReason;
  onBack: () => void;
}

export function ProductUnavailable({ reason, onBack }: ProductUnavailableProps) {
  const message = PRODUCT_UNAVAILABLE_MESSAGES[reason] ?? PRODUCT_UNAVAILABLE_MESSAGES.unavailable;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center bg-[var(--tg-theme-bg-color,#fff)]">
      <div className="w-16 h-16 rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] flex items-center justify-center mb-4 text-3xl">
        {reason === "deleted" ? "🗑️" : reason === "hidden" ? "👁️‍🗨️" : "🚫"}
      </div>
      <p className="text-lg font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
        {message}
      </p>
      <p className="text-sm text-[var(--tg-theme-hint-color,#888)] mb-6">
        {reason === "deleted" && "Можливо, продавець видалив його."}
        {reason === "hidden" && "Продавець тимчасово прибрав оголошення з каталогу."}
        {reason === "reported" && "Ви більше не побачите це оголошення."}
        {reason === "unavailable" && "Спробуйте повернутись до каталогу."}
      </p>
      <Button variant="secondary" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        До каталогу
      </Button>
    </div>
  );
}
