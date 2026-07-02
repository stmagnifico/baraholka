import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--tg-theme-hint-color,#888)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--tg-theme-text-color,#111)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--tg-theme-hint-color,#888)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
