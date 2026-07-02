"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { CATEGORY_MAP, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
  const statusLabel = PRODUCT_STATUS_LABELS[product.status];
  const statusColor = PRODUCT_STATUS_COLORS[product.status];
  const isSold = product.status === "SOLD";

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-[var(--tg-theme-bg-color,#fff)] rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 transition-transform active:scale-[0.98]">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className={cn("object-cover transition-transform group-hover:scale-105", isSold && "opacity-60 grayscale")}
          />
          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Продано
              </span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="p-3">
          <p className="text-xs text-[var(--tg-theme-hint-color,#888)] mb-0.5">
            {CATEGORY_MAP[product.category] ?? product.category}
          </p>
          <h3 className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)] line-clamp-2 leading-tight mb-1">
            {product.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-base font-bold text-[var(--tg-theme-accent-text-color,#2481cc)]">
              {formatPrice(product.price, product.currency)}
            </span>
            <span className="text-xs text-[var(--tg-theme-hint-color,#888)]">
              {formatDate(product.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
