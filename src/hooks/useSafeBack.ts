"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Повертає функцію «назад», яка коректно працює навіть коли міні-додаток
 * відкрито одразу на цій сторінці (deep link, кнопка бота). У такому разі
 * історія порожня і router.back() нічого не робить — тоді йдемо на fallback.
 */
export function useSafeBack(fallback = "/") {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
