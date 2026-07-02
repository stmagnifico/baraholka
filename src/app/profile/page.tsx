"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Package, Trash2, CheckCircle, ArchiveX, PlusCircle } from "lucide-react";
import { Product, ProductStatus } from "@/types";
import { useTelegramContext } from "@/context/TelegramContext";
import { formatPrice, getDisplayName } from "@/lib/utils";
import { CATEGORY_MAP, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, initData, isReady } = useTelegramContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!user?.id || !initData) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/products`, {
        headers: { "x-init-data": initData },
      });
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [user?.id, initData]);

  useEffect(() => {
    if (isReady) loadProducts();
  }, [isReady, loadProducts]);

  const handleStatusChange = async (id: string, status: ProductStatus) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-init-data": initData,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити оголошення? Цю дію не можна скасувати.")) return;
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { "x-init-data": initData },
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (!isReady) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-base font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
          Відкрийте через Telegram
        </p>
        <p className="text-sm text-[var(--tg-theme-hint-color,#888)]">
          Для перегляду профілю потрібно запустити застосунок у Telegram.
        </p>
      </div>
    );
  }

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const soldCount = products.filter((p) => p.status === "SOLD").length;

  return (
    <div className="px-4 pt-4">
      {/* Profile header */}
      <div className="bg-[var(--tg-theme-bg-color,#fff)] rounded-2xl p-4 mb-4 flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          {user.photoUrl ? (
            <Image
              src={user.photoUrl}
              alt={getDisplayName(user)}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--tg-theme-button-color,#2481cc)] flex items-center justify-center text-white text-2xl font-bold">
              {(user.firstName?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--tg-theme-text-color,#111)]">
            {getDisplayName(user)}
          </h1>
          {user.username && (
            <p className="text-sm text-[var(--tg-theme-link-color,#2481cc)]">
              @{user.username}
            </p>
          )}
          <div className="flex gap-4 mt-1.5 text-xs text-[var(--tg-theme-hint-color,#888)]">
            <span><b className="text-[var(--tg-theme-text-color,#111)]">{activeCount}</b> активних</span>
            <span><b className="text-[var(--tg-theme-text-color,#111)]">{soldCount}</b> продано</span>
          </div>
        </div>
      </div>

      {/* Add button */}
      <Button onClick={() => router.push("/products/new")} className="w-full mb-4 gap-2">
        <PlusCircle className="w-5 h-5" />
        Додати оголошення
      </Button>

      {/* Products list */}
      <h2 className="text-base font-bold text-[var(--tg-theme-text-color,#111)] mb-3">
        Мої оголошення
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--tg-theme-bg-color,#fff)] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          Icon={Package}
          title="У вас ще немає оголошень"
          description="Додайте свій перший товар або послугу"
          action={
            <Button onClick={() => router.push("/products/new")}>
              Додати оголошення
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProfileProductCard
              key={product.id}
              product={product}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileProductCard({
  product,
  onStatusChange,
  onDelete,
}: {
  product: Product;
  onStatusChange: (id: string, status: ProductStatus) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const image = product.images[0];

  return (
    <div className="bg-[var(--tg-theme-bg-color,#fff)] rounded-2xl overflow-hidden shadow-sm border border-black/5">
      <button
        onClick={() => router.push(`/products/${product.id}`)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {image && (
          <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
            <Image src={image} alt={product.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                PRODUCT_STATUS_COLORS[product.status]
              )}
            >
              {PRODUCT_STATUS_LABELS[product.status]}
            </span>
            <span className="text-[10px] text-[var(--tg-theme-hint-color,#888)]">
              {CATEGORY_MAP[product.category] ?? product.category}
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)] truncate">
            {product.title}
          </p>
          <p className="text-sm font-bold text-[var(--tg-theme-accent-text-color,#2481cc)]">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex border-t border-black/5 divide-x divide-black/5">
        {product.status === "ACTIVE" && (
          <button
            onClick={() => onStatusChange(product.id, "SOLD")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Продано
          </button>
        )}
        {product.status === "SOLD" && (
          <button
            onClick={() => onStatusChange(product.id, "ACTIVE")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ArchiveX className="w-4 h-4" />
            Повернути в продаж
          </button>
        )}
        <button
          onClick={() => onDelete(product.id)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Видалити
        </button>
      </div>
    </div>
  );
}
