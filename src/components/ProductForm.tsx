"use client";

import { useState, useRef, FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Camera, X, CheckCircle } from "lucide-react";
import { CATEGORIES, MOCK_IMAGES } from "@/lib/constants";
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

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ProductFormData>;
  loading?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
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

export function ProductForm({
  mode,
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    ...EMPTY,
    ...initialData,
    images: initialData?.images ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddMockPhoto = () => {
    if (form.images.length >= 5) return;
    const available = MOCK_IMAGES.filter((img) => !form.images.includes(img));
    if (available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    setForm((prev) => ({ ...prev, images: [...prev.images, pick] }));
  };

  const handleRemoveImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit(form);
    if (mode === "create") setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)] mb-1">
          Оголошення опубліковано!
        </h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#888)]">
          Переходимо на сторінку оголошення…
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
            Фото
          </label>
          <div className="flex gap-2 flex-wrap">
            {form.images.map((url) => (
              <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <Image src={url} alt="фото" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {form.images.length < 5 && (
              <button
                type="button"
                onClick={handleAddMockPhoto}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--tg-theme-hint-color,#aaa)] flex flex-col items-center justify-center text-[var(--tg-theme-hint-color,#888)] gap-1 transition-colors hover:border-[var(--tg-theme-button-color,#2481cc)]"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px]">Додати</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" />
          <p className="text-xs text-[var(--tg-theme-hint-color,#888)] mt-1.5">
            Тестовий режим: зображення беруться з Unsplash
          </p>
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

        <Button type="submit" size="lg" loading={loading} className="mt-2">
          {mode === "create" ? "Опублікувати оголошення" : "Зберегти зміни"}
        </Button>
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
