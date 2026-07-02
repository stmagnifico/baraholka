"use client";

import { useEffect, useState, useCallback } from "react";

export interface TgUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
}

export interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
  accentTextColor: string;
  isDark: boolean;
}

export interface UseTelegramReturn {
  isReady: boolean;
  isTelegramEnv: boolean;
  user: TgUser | null;
  initData: string;
  theme: TelegramTheme;
  webApp: typeof window.Telegram.WebApp | null;
  haptic: {
    impact: (style?: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notification: (type: "error" | "success" | "warning") => void;
    selection: () => void;
  };
}

const DEFAULT_THEME: TelegramTheme = {
  bgColor: "#ffffff",
  textColor: "#111111",
  hintColor: "#888888",
  linkColor: "#2481cc",
  buttonColor: "#2481cc",
  buttonTextColor: "#ffffff",
  secondaryBgColor: "#f0f0f0",
  accentTextColor: "#2481cc",
  isDark: false,
};

function applyThemeVars(params: WebApp["themeParams"]) {
  const root = document.documentElement;
  if (params.bg_color) root.style.setProperty("--tg-theme-bg-color", params.bg_color);
  if (params.text_color) root.style.setProperty("--tg-theme-text-color", params.text_color);
  if (params.hint_color) root.style.setProperty("--tg-theme-hint-color", params.hint_color);
  if (params.link_color) root.style.setProperty("--tg-theme-link-color", params.link_color);
  if (params.button_color) root.style.setProperty("--tg-theme-button-color", params.button_color);
  if (params.button_text_color) root.style.setProperty("--tg-theme-button-text-color", params.button_text_color);
  if (params.secondary_bg_color) root.style.setProperty("--tg-theme-secondary-bg-color", params.secondary_bg_color);
  if (params.accent_text_color) root.style.setProperty("--tg-theme-accent-text-color", params.accent_text_color);
}

// Minimal WebApp typings for what we need
interface WebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
      language_code?: string;
    };
  };
  colorScheme: "light" | "dark";
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    accent_text_color?: string;
  };
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  onEvent: (event: string, callback: () => void) => void;
  offEvent: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

export function useTelegram(): UseTelegramReturn {
  const [isReady, setIsReady] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [user, setUser] = useState<TgUser | null>(null);
  const [initData, setInitData] = useState("");
  const [theme, setTheme] = useState<TelegramTheme>(DEFAULT_THEME);
  const [webApp, setWebApp] = useState<WebApp | null>(null);

  const buildTheme = useCallback((wa: WebApp): TelegramTheme => {
    const p = wa.themeParams;
    return {
      bgColor: p.bg_color ?? DEFAULT_THEME.bgColor,
      textColor: p.text_color ?? DEFAULT_THEME.textColor,
      hintColor: p.hint_color ?? DEFAULT_THEME.hintColor,
      linkColor: p.link_color ?? DEFAULT_THEME.linkColor,
      buttonColor: p.button_color ?? DEFAULT_THEME.buttonColor,
      buttonTextColor: p.button_text_color ?? DEFAULT_THEME.buttonTextColor,
      secondaryBgColor: p.secondary_bg_color ?? DEFAULT_THEME.secondaryBgColor,
      accentTextColor: p.accent_text_color ?? DEFAULT_THEME.accentTextColor,
      isDark: wa.colorScheme === "dark",
    };
  }, []);

  useEffect(() => {
    const inTelegram =
      typeof window !== "undefined" && !!window.Telegram?.WebApp?.initData;

    setIsTelegramEnv(inTelegram);

    if (!inTelegram) {
      setIsReady(true);
      return;
    }

    const wa = window.Telegram.WebApp;
    wa.ready();
    wa.expand();

    const raw = wa.initDataUnsafe.user;
    if (raw) {
      setUser({
        id: raw.id,
        username: raw.username,
        firstName: raw.first_name,
        lastName: raw.last_name,
        photoUrl: raw.photo_url,
        languageCode: raw.language_code,
      });
    }

    setInitData(wa.initData);

    const currentTheme = buildTheme(wa);
    setTheme(currentTheme);
    applyThemeVars(wa.themeParams);

    if (currentTheme.isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleThemeChange = () => {
      const updated = buildTheme(wa);
      setTheme(updated);
      applyThemeVars(wa.themeParams);
      if (updated.isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    wa.onEvent("themeChanged", handleThemeChange);
    setWebApp(wa);
    setIsReady(true);

    return () => {
      wa.offEvent("themeChanged", handleThemeChange);
    };
  }, [buildTheme]);

  const haptic: UseTelegramReturn["haptic"] = {
    impact: (style = "medium") => {
      webApp?.HapticFeedback.impactOccurred(style);
    },
    notification: (type) => {
      webApp?.HapticFeedback.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback.selectionChanged();
    },
  };

  return { isReady, isTelegramEnv, user, initData, theme, webApp, haptic };
}
