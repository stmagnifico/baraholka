"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { useTelegramContext } from "@/context/TelegramContext";
import { useState } from "react";

export default function NewProductPage() {
  const router = useRouter();
  const { initData, isTelegramEnv } = useTelegramContext();
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

  return (
    <ProductForm
      mode="create"
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
