import { clsx } from "clsx";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-error-muted)] text-[var(--color-error)]">
        <AlertCircle size={24} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>
        {message && (
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
