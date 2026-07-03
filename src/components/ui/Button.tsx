import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-6",
          {
            "bg-[var(--tg-theme-button-color,#2481cc)] text-[var(--tg-theme-button-text-color,#fff)] hover:opacity-90 shadow-sm":
              variant === "primary",
            "bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-text-color,#111)] hover:opacity-80":
              variant === "secondary",
            "hover:bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-text-color,#111)]":
              variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-11 px-5 text-base": size === "md",
            "h-14 px-6 text-lg w-full": size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
