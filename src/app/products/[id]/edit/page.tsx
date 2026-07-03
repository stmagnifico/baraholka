"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ProductForm } from "@/components/ProductForm";
import { ProductUnavailable } from "@/components/ProductUnavailable";
import { useTelegramContext } from "@/context/TelegramContext";
import { useSafeBack } from "@/hooks/useSafeBack";
import { Product, ApiError } from "@/types";
import { getDisplayName } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const goBack = useSafeBack("/profile");
  const { user, initData, isModerator } = useTelegramContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState<
    "deleted" | "hidden" | "reported" | "unavailable" | null
  >(null);

  useEffect(() => {
    fetch(`/api/products/${id}`, {
      headers: initData ? { "x-init-data": initData } : {},
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = (await r.json().catch(() => ({}))) as ApiError;
          setUnavailableReason(err.reason ?? "unavailable");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setProduct(data);
      })
      .finally(() => setFetching(false));
  }, [id, initData]);

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
        const err = (await res.json().catch(() => ({}))) as ApiError;
        if (res.status === 410 || res.status === 404) {
          setUnavailableReason(err.reason ?? "deleted");
          setProduct(null);
          return;
        }
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

  if (fetching) {
    return (
      <div className="px-4 pt-4">
        <div className="h-10 w-48 bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-xl animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (unavailableReason) {
    return <ProductUnavailable reason={unavailableReason} onBack={goBack} />;
  }

  if (!product) {
    return <ProductUnavailable reason="unavailable" onBack={goBack} />;
  }

  const isOwner = user?.id === Number(product.userId);
  const canModerate = isModerator && !isOwner;

  if (!isOwner && !isModerator) {
    router.replace("/profile");
    return null;
  }

  return (
    <div>
      {canModerate && product.user && (
        <div className="mx-4 mt-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Редагування оголошення користувача{" "}
            <b>{getDisplayName(product.user)}</b>. Після збереження з&apos;явиться сноска про
            редагування адміністратором.
          </p>
        </div>
      )}
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
        onCancel={goBack}
      />
    </div>
  );
}
