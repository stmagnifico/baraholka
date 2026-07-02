"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useTelegram, UseTelegramReturn } from "@/hooks/useTelegram";

const TelegramContext = createContext<UseTelegramReturn | null>(null);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const tg = useTelegram();
  const didAuth = useRef(false);

  useEffect(() => {
    if (!tg.isReady || !tg.initData || didAuth.current) return;
    didAuth.current = true;

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    }).catch(console.error);
  }, [tg.isReady, tg.initData]);

  return (
    <TelegramContext.Provider value={tg}>{children}</TelegramContext.Provider>
  );
}

export function useTelegramContext(): UseTelegramReturn {
  const ctx = useContext(TelegramContext);
  if (!ctx) throw new Error("useTelegramContext must be used inside TelegramProvider");
  return ctx;
}
