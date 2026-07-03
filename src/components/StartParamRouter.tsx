"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTelegramContext } from "@/context/TelegramContext";
import { parseProductStartParam } from "@/lib/share";

export function StartParamRouter() {
  const router = useRouter();
  const { webApp, isReady } = useTelegramContext();
  const handled = useRef(false);

  useEffect(() => {
    if (!isReady || handled.current) return;

    const startParam =
      (webApp as { initDataUnsafe?: { start_param?: string } } | null)?.initDataUnsafe
        ?.start_param ?? undefined;

    const productId = parseProductStartParam(startParam);
    if (!productId) return;

    handled.current = true;
    router.replace(`/products/${productId}`);
  }, [isReady, webApp, router]);

  return null;
}
