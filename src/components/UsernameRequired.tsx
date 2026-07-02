"use client";

import { useRouter } from "next/navigation";
import { AtSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function UsernameRequired() {
  const router = useRouter();

  return (
    <div className="px-4 pt-4 pb-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center text-center px-2">
        <div className="w-16 h-16 rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] flex items-center justify-center mb-4">
          <AtSign className="w-8 h-8 text-[var(--tg-theme-button-color,#2481cc)]" />
        </div>

        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)] mb-2">
          Потрібен username в Telegram
        </h1>

        <p className="text-sm text-[var(--tg-theme-hint-color,#888)] leading-relaxed mb-4 max-w-xs">
          Щоб продавати на барахолці, покупці мають мати змогу написати вам. Задайте
          username у налаштуваннях Telegram і поверніться сюди.
        </p>

        <div className="w-full max-w-xs rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] p-4 text-left text-sm text-[var(--tg-theme-text-color,#111)] mb-6">
          <p className="font-semibold mb-2">Як задати username:</p>
          <ol className="list-decimal list-inside space-y-1 text-[var(--tg-theme-hint-color,#888)]">
            <li>Налаштування</li>
            <li>Редагувати профіль</li>
            <li>Ім&apos;я користувача</li>
          </ol>
        </div>

        <Button variant="secondary" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    </div>
  );
}
