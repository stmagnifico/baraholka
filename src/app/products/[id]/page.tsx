"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MessageCircle,
  Tag,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Product } from "@/types";
import { formatPrice, formatDate, getDisplayName } from "@/lib/utils";
import { CATEGORY_MAP, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/lib/constants";
import { getTelegramContactUrl } from "@/lib/telegram";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then(setProduct)
      .catch(() => setError("Оголошення не знайдено"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-lg font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
          Оголошення не знайдено
        </p>
        <Button variant="secondary" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    );
  }

  const images = product.images.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];

  const isSold = product.status === "SOLD";
  const contactUrl = product.user
    ? getTelegramContactUrl({ id: product.userId, username: product.user.username })
    : null;

  return (
    <div className="pb-8">
      {/* Image gallery */}
      <div className="relative bg-black">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative aspect-square">
          <Image
            src={images[imgIndex]}
            alt={product.title}
            fill
            className={cn("object-cover", isSold && "opacity-70 grayscale")}
            priority
          />
          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/60 text-white font-bold text-lg px-5 py-2 rounded-full uppercase tracking-widest">
                Продано
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails nav */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
              disabled={imgIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setImgIndex((i) => Math.min(images.length - 1, i + 1))}
              disabled={imgIndex === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === imgIndex ? "bg-white w-4" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="bg-[var(--tg-theme-bg-color,#fff)] rounded-t-3xl -mt-4 relative px-4 pt-5">
        {/* Status + category */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              PRODUCT_STATUS_COLORS[product.status]
            )}
          >
            {PRODUCT_STATUS_LABELS[product.status]}
          </span>
          <Badge variant="secondary">
            <Tag className="w-3 h-3 mr-1" />
            {CATEGORY_MAP[product.category] ?? product.category}
          </Badge>
        </div>

        {/* Title & price */}
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)] mb-1">
          {product.title}
        </h1>
        <p className="text-2xl font-extrabold text-[var(--tg-theme-accent-text-color,#2481cc)] mb-4">
          {formatPrice(product.price, product.currency)}
        </p>

        {/* Description */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)] mb-1">
            Опис
          </h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,#888)] leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1 text-xs text-[var(--tg-theme-hint-color,#888)] mb-6">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(product.createdAt)}</span>
        </div>

        {/* Seller */}
        {product.user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] mb-6">
            <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color,#2481cc)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(product.user.firstName?.[0] ?? product.user.username?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-[var(--tg-theme-hint-color,#888)]">Продавець</p>
              <p className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)]">
                {getDisplayName(product.user)}
              </p>
              {product.user.username && (
                <p className="text-xs text-[var(--tg-theme-link-color,#2481cc)]">
                  @{product.user.username}
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        {!isSold && contactUrl && (
          <a href={contactUrl} target="_blank" rel="noreferrer">
            <Button size="lg" className="gap-2">
              <MessageCircle className="w-5 h-5" />
              Зв&apos;язатися з продавцем
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
      <div className="bg-white rounded-t-3xl -mt-4 px-4 pt-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
