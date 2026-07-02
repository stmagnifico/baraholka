"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, X, CheckCircle } from "lucide-react";
import { CATEGORIES, MOCK_IMAGES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { useTelegramContext } from "@/context/TelegramContext";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FormState {
  title: string;
  description: string;
  price: string;
  category: string;
}

const INITIAL_STATE: FormState = {
  title: "",
  description: "",
  price: "",
  category: "",
};

export default function NewProductPage() {
  const router = useRouter();
  const { initData, isTelegramEnv } = useTelegramContext();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [mockImages, setMockImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.title.trim()) next.title = "Введіть назву";
    if (!form.description.trim()) next.description = "Введіть опис";
    if (!form.price || isNaN(+form.price) || +form.price <= 0)
      next.price = "Вкажіть коректну ціну";
    if (!form.category) next.category = "Оберіть категорію";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddMockPhoto = () => {
    if (mockImages.length >= 5) return;
    const available = MOCK_IMAGES.filter((img) => !mockImages.includes(img));
    if (available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    setMockImages((prev) => [...prev, pick]);
  };

  const handleRemoveImage = (url: string) => {
    setMockImages((prev) => prev.filter((i) => i !== url));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
          title: form.title.trim(),
          description: form.description.trim(),
          price: parseFloat(form.price),
          category: form.category,
          images: mockImages,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Помилка сервера");
      }

      const created = await res.json();
      setSuccess(true);
      setTimeout(() => router.push(`/products/${created.id}`), 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Невідома помилка");
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)]">
          Нове оголошення
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo upload mock */}
        <div>
          <label className="block text-sm font-semibold text-[var(--tg-theme-text-color,#111)] mb-2">
            Фото
          </label>
          <div className="flex gap-2 flex-wrap">
            {mockImages.map((url) => (
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
            {mockImages.length < 5 && (
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

        {/* Title */}
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

        {/* Description */}
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

        {/* Price */}
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

        {/* Category */}
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
          Опублікувати оголошення
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
