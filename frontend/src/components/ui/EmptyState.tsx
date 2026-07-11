import { clsx } from "clsx";
import { FileQuestion } from "lucide-react";
import { Button } from "./Button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]">
        {icon ?? <FileQuestion size={24} />}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
