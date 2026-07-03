"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTelegram, UseTelegramReturn } from "@/hooks/useTelegram";
import { UserRole } from "@/types";

interface TelegramContextValue extends UseTelegramReturn {
  role: UserRole;
  isModerator: boolean;
  isSuperAdmin: boolean;
}

const TelegramContext = createContext<TelegramContextValue | null>(null);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const tg = useTelegram();
  const didAuth = useRef(false);
  const [role, setRole] = useState<UserRole>("USER");

  useEffect(() => {
    if (!tg.isReady || !tg.initData || didAuth.current) return;
    didAuth.current = true;

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role) setRole(data.role as UserRole);
      })
      .catch(console.error);
  }, [tg.isReady, tg.initData]);

  const value: TelegramContextValue = {
    ...tg,
    role,
    isModerator: role === "ADMIN" || role === "SUPERADMIN",
    isSuperAdmin: role === "SUPERADMIN",
  };

  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}

export function useTelegramContext(): TelegramContextValue {
  const ctx = useContext(TelegramContext);
  if (!ctx) throw new Error("useTelegramContext must be used inside TelegramProvider");
  return ctx;
}
