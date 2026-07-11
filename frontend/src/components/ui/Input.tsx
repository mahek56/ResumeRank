import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={clsx(
          "h-9 w-full px-3 rounded-[var(--radius-sm)] text-sm",
          "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
          "border transition-colors duration-[var(--duration-micro)]",
          "placeholder:text-[var(--color-text-tertiary)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error
            ? "border-[var(--color-error)] focus:outline-[var(--color-error)]"
            : "border-[var(--color-border)] focus:border-[var(--color-border-focus)]",
          className
        )}
      />
      {error && (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
      )}
    </div>
  );
}
