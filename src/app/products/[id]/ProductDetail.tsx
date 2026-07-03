"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Tag,
  Calendar,
  Pencil,
  Trash2,
  ShieldAlert,
  Share2,
} from "lucide-react";
import { Product } from "@/types";
import { formatProductPrice, formatDate, getDisplayName } from "@/lib/utils";
import {
  CATEGORY_MAP,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
  ADMIN_EDITED_NOTICE,
} from "@/lib/constants";
import { getTelegramContactUrl } from "@/lib/telegram-client";
import { shareProductInTelegram } from "@/lib/share";
import { useTelegramContext } from "@/context/TelegramContext";
import { useSafeBack } from "@/hooks/useSafeBack";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageGallery } from "@/components/ImageGallery";
import { cn } from "@/lib/utils";

export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const goBack = useSafeBack("/");
  const { user, initData, webApp, isModerator } = useTelegramContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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

  const handleAdminDelete = async () => {
    if (!product) return;
    if (!confirm(`Видалити оголошення «${product.title}»? Користувачу прийде повідомлення в боті.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { "x-init-data": initData },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Помилка видалення");
      }
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Помилка видалення");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-lg font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
          Оголошення не знайдено
        </p>
        <Button variant="secondary" onClick={goBack}>
          Назад
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === Number(product.userId);
  const canModerate = isModerator && !isOwner;

  if (product.status === "DRAFT" && !isOwner && !isModerator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-lg font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
          Оголошення не знайдено
        </p>
        <Button variant="secondary" onClick={goBack}>
          Назад
        </Button>
      </div>
    );
  }

  const images =
    product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];

  const isSold = product.status === "SOLD";
  const contactUrl =
    !isOwner && product.status === "ACTIVE" && product.user?.username
      ? getTelegramContactUrl({ id: product.userId, username: product.user.username })
      : null;

  const handleContact = () => {
    if (!contactUrl) return;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(contactUrl);
    } else {
      window.open(contactUrl, "_blank", "noopener,noreferrer");
    }
  };

  const canShare = product.status !== "DRAFT";
  const handleShare = () => {
    shareProductInTelegram(webApp, {
      id: product.id,
      title: product.title,
      isFree: product.isFree,
      price: product.price,
    });
  };

  return (
    <div className="pb-8">
      <div className="relative">
        <button
          onClick={goBack}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {canShare && (
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
            aria-label="Поділитися"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}

        <ImageGallery images={images} alt={product.title} isSold={isSold} />
      </div>

      <div className="bg-[var(--tg-theme-bg-color,#fff)] rounded-t-3xl -mt-4 relative px-4 pt-5">
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

        {product.adminEditedAt && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-orange-50 border border-orange-100">
            <ShieldAlert className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-800">{ADMIN_EDITED_NOTICE}</p>
              <p className="text-[10px] text-orange-600 mt-0.5">
                {formatDate(product.adminEditedAt)}
              </p>
            </div>
          </div>
        )}

        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)] mb-1">
          {product.title}
        </h1>
        <p
          className={cn(
            "text-2xl font-extrabold mb-4",
            product.isFree
              ? "text-green-600"
              : "text-[var(--tg-theme-accent-text-color,#2481cc)]"
          )}
        >
          {formatProductPrice(product)}
        </p>

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)] mb-1">
            Опис
          </h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,#888)] leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--tg-theme-hint-color,#888)] mb-6">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(product.createdAt)}</span>
        </div>

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

        {(isOwner || canModerate) && (
          <Button
            variant="secondary"
            className="gap-2 mb-3"
            onClick={() => router.push(`/products/${product.id}/edit`)}
          >
            <Pencil className="w-4 h-4" />
            {canModerate ? "Редагувати (адмін)" : "Редагувати оголошення"}
          </Button>
        )}

        {canModerate && (
          <Button
            variant="danger"
            className="gap-2 mb-3"
            loading={deleting}
            onClick={handleAdminDelete}
          >
            <Trash2 className="w-4 h-4" />
            Видалити оголошення
          </Button>
        )}

        {!isSold && contactUrl && (
          <Button size="lg" className="gap-2" onClick={handleContact}>
            <MessageCircle className="w-5 h-5" />
            Зв&apos;язатися з продавцем
          </Button>
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
