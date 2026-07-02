"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { formatProductPrice, formatDate } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-[var(--tg-theme-bg-color,#fff)] rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 transition-transform active:scale-[0.98]">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>

        <div className="p-3">
          <p className="text-xs text-[var(--tg-theme-hint-color,#888)] mb-0.5">
            {CATEGORY_MAP[product.category] ?? product.category}
          </p>
          <h3 className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)] line-clamp-2 leading-tight mb-1">
            {product.title}
          </h3>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
            <span
              className={cn(
                "text-base font-bold shrink-0",
                product.isFree
                  ? "text-green-600"
                  : "text-[var(--tg-theme-accent-text-color,#2481cc)]"
              )}
            >
              {formatProductPrice(product)}
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
