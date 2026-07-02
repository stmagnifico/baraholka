"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { useTelegramContext } from "@/context/TelegramContext";
import { Product } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { initData } = useTelegramContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then(setProduct)
      .catch(() => router.replace("/profile"))
      .finally(() => setFetching(false));
  }, [id, router]);

  const handleSubmit = async (
    data: {
      title: string;
      description: string;
      price: string;
      isFree: boolean;
      category: string;
      images: string[];
    },
    _publish: boolean
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
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

      router.push(`/products/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Невідома помилка");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !product) {
    return (
      <div className="px-4 pt-4">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      mode="edit"
      loading={loading}
      initData={initData}
      initialData={{
        title: product.title,
        description: product.description,
        price: product.isFree ? "" : product.price,
        isFree: product.isFree,
        category: product.category,
        images: product.images,
      }}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
