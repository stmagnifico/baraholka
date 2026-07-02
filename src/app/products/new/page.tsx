"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { UsernameRequired } from "@/components/UsernameRequired";
import { useTelegramContext } from "@/context/TelegramContext";
import { useState } from "react";

export default function NewProductPage() {
  const router = useRouter();
  const { user, initData, isTelegramEnv, isReady } = useTelegramContext();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    price: string;
    isFree: boolean;
    category: string;
    images: string[];
  }) => {
    if (!isTelegramEnv && !initData) {
      alert("Відкрийте застосунок через Telegram для публікації оголошень.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-init-data": initData,
        },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description.trim(),
          price: data.isFree ? 0 : parseFloat(data.price),
          isFree: data.isFree,
          category: data.category,
          images: data.images,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Помилка сервера");
      }

      const created = await res.json();
      setTimeout(() => router.push(`/products/${created.id}`), 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Невідома помилка");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return null;

  if (!isTelegramEnv) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-base font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
          Відкрийте через Telegram
        </p>
        <p className="text-sm text-[var(--tg-theme-hint-color,#888)]">
          Для публікації оголошень потрібно запустити застосунок у Telegram.
        </p>
      </div>
    );
  }

  if (!user?.username) {
    return <UsernameRequired />;
  }

  return (
    <ProductForm
      mode="create"
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
