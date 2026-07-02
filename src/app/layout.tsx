import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/context/TelegramContext";
import { BottomNav } from "@/components/BottomNav";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Гіперлокальна барахолка для мешканців ЖК",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <TelegramProvider>
          <main className="min-h-screen pb-24 max-w-lg mx-auto">
            {children}
          </main>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
