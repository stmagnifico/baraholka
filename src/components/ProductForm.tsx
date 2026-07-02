"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Camera, ImagePlus, Loader2, X, CheckCircle } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { compressImage } from "@/lib/image-compress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ProductFormData {
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  category: string;
  images: string[];
}

interface ImageItem {
  id: string;
  preview: string;
  url?: string;
  uploading?: boolean;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ProductFormData>;
  loading?: boolean;
  initData?: string;
  onSubmit: (data: ProductFormData, publish: boolean) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: ProductFormData = {
  title: "",
  description: "",
  price: "",
  isFree: false,
  category: "",
  images: [],
};

const MAX_IMAGES = 5;

function toImageItems(urls: string[]): ImageItem[] {
  return urls.map((url) => ({ id: url, preview: url, url }));
}

export function ProductForm({
  mode,
  initialData,
  loading = false,
  initData = "",
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    ...EMPTY,
    ...initialData,
    images: initialData?.images ?? [],
  });
  const [imageItems, setImageItems] = useState<ImageItem[]>(() =>
    toImageItems(initialData?.images ?? [])
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [success, setSuccess] = useState<"published" | "draft" | null>(null);
  const [imageError, setImageError] = useState("");
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const set =
    (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.title.trim()) next.title = "Введіть назву";
    if (!form.description.trim()) next.description = "Введіть опис";
    if (!form.isFree && (!form.price || isNaN(+form.price) || +form.price <= 0)) {
      next.price = "Вкажіть коректну ціну або оберіть «безкоштовно»";
    }
    if (!form.category) next.category = "Оберіть категорію";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "x-init-data": initData },
      body,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Не вдалося завантажити фото");
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImageError("");

    const slotsLeft = MAX_IMAGES - imageItems.length;
    if (slotsLeft <= 0) return;

    const selected = Array.from(files).slice(0, slotsLeft);

    for (const raw of selected) {
      const id = crypto.randomUUID();
      let preview = "";
      try {
        const compressed = await compressImage(raw);
        preview = URL.createObjectURL(compressed);
        blobUrlsRef.current.add(preview);

        setImageItems((prev) => [...prev, { id, preview, uploading: true }]);

        const url = await uploadFile(compressed);
        setImageItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, url, uploading: false } : item))
        );
      } catch (err) {
        if (preview) {
          URL.revokeObjectURL(preview);
          blobUrlsRef.current.delete(preview);
        }
        setImageItems((prev) => prev.filter((item) => item.id !== id));
        setImageError(err instanceof Error ? err.message : "Помилка завантаження");
      }
    }
  };

  const handleRemoveImage = (item: ImageItem) => {
    if (item.preview.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
      blobUrlsRef.current.delete(item.preview);
    }
    setImageItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const getReadyImages = (): string[] | null => {
    if (imageItems.some((i) => i.uploading)) {
      setImageError("Зачекайте, фото ще завантажуються");
      return null;
    }
    if (imageItems.some((i) => !i.url)) {
      setImageError("Деякі фото не завантажились — спробуйте ще раз");
      return null;
    }
    return imageItems.map((i) => i.url!);
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validate()) return;

    const images = getReadyImages();
    if (!images) return;

    const data: ProductFormData = { ...form, images };
    await onSubmit(data, publish);
    if (mode === "create") setSuccess(publish ? "published" : "draft");
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSubmit(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)] mb-1">
          {success === "published" ? "Оголошення опубліковано!" : "Чернетку збережено"}
        </h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#888)]">
          {success === "published"
            ? "Переходимо на сторінку оголошення…"
            : "Переходимо до профілю…"}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)]">
          {mode === "create" ? "Нове оголошення" : "Редагування"}
        </h1>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
            Фото
          </label>
          <div className="flex gap-2 flex-wrap">
            {imageItems.map((item) => (
              <div key={item.id} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                {item.preview.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="фото" className="w-full h-full object-cover" />
                ) : (
                  <Image src={item.preview} alt="фото" fill className="object-cover" />
                )}
                {item.uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(item)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {imageItems.length < MAX_IMAGES && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--tg-theme-hint-color,#aaa)] flex flex-col items-center justify-center text-[var(--tg-theme-hint-color,#888)] gap-1 transition-colors hover:border-[var(--tg-theme-button-color,#2481cc)]"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px]">Галерея</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--tg-theme-hint-color,#aaa)] flex flex-col items-center justify-center text-[var(--tg-theme-hint-color,#888)] gap-1 transition-colors hover:border-[var(--tg-theme-button-color,#2481cc)]"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px]">Камера</span>
                </button>
              </div>
            )}
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-[var(--tg-theme-hint-color,#888)] mt-1.5">
            До {MAX_IMAGES} фото. Можна обрати з галереї або зробити знімок.
          </p>
          {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
        </div>

        <Field
          label="Назва *"
          error={errors.title}
          input={
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="Наприклад: iPhone 13, коляска Chicco…"
              maxLength={120}
              className={inputCls(!!errors.title)}
            />
          }
        />

        <Field
          label="Опис *"
          error={errors.description}
          input={
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Стан, комплектація, причина продажу…"
              rows={4}
              maxLength={2000}
              className={cn(inputCls(!!errors.description), "resize-none")}
            />
          }
        />

        <div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  isFree: e.target.checked,
                  price: e.target.checked ? "" : prev.price,
                }));
                setErrors((prev) => ({ ...prev, price: undefined }));
              }}
              className="w-4 h-4 rounded accent-[var(--tg-theme-button-color,#2481cc)]"
            />
            <span className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)]">
              Віддати безкоштовно
            </span>
          </label>

          {!form.isFree && (
            <Field
              label="Ціна (грн) *"
              error={errors.price}
              input={
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={set("price")}
                    placeholder="0"
                    className={cn(inputCls(!!errors.price), "pr-14")}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--tg-theme-hint-color,#888)] font-medium">
                    UAH
                  </span>
                </div>
              }
            />
          )}
        </div>

        <Field
          label="Категорія *"
          error={errors.category}
          input={
            <select
              value={form.category}
              onChange={set("category")}
              className={cn(inputCls(!!errors.category), "appearance-none cursor-pointer")}
            >
              <option value="">Оберіть категорію…</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          }
        />

        {mode === "create" ? (
          <div className="flex flex-col gap-2 mt-2">
            <Button type="submit" size="lg" loading={loading}>
              Опублікувати оголошення
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              loading={loading}
              onClick={() => void handleSubmit(false)}
            >
              Зберегти чернетку
            </Button>
          </div>
        ) : (
          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Зберегти зміни
          </Button>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--tg-theme-text-color,#111)] mb-1.5">
        {label}
      </label>
      {input}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-4 py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] text-[var(--tg-theme-text-color,#111)] text-sm placeholder-[var(--tg-theme-hint-color,#888)] outline-none transition-all border",
    hasError
      ? "border-red-400 ring-1 ring-red-400"
      : "border-transparent focus:border-[var(--tg-theme-button-color,#2481cc)] focus:ring-1 focus:ring-[var(--tg-theme-button-color,#2481cc)]"
  );
}
