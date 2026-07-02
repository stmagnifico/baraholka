"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Каталог", Icon: Home },
  { href: "/products/new", label: "Додати", Icon: PlusCircle },
  { href: "/profile", label: "Профіль", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--tg-theme-bg-color,#fff)] border-t border-black/10 dark:border-white/10 pb-safe">
      <div className="flex items-center max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
                active
                  ? "text-[var(--tg-theme-button-color,#2481cc)]"
                  : "text-[var(--tg-theme-hint-color,#888)]"
              )}
            >
              <Icon
                className={cn("w-6 h-6 transition-transform", active && "scale-110")}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
