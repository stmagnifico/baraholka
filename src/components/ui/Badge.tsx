import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "success" | "sold";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400": variant === "default",
          "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300": variant === "secondary",
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400": variant === "success",
          "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 line-through": variant === "sold",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
