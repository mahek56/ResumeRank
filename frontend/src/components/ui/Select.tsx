import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({
  label,
  options,
  placeholder,
  error,
  id,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...props}
          className={clsx(
            "h-9 w-full pl-3 pr-9 rounded-[var(--radius-sm)] text-sm appearance-none",
            "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
            "border transition-colors duration-[var(--duration-micro)]",
            "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
            error
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border)] focus:border-[var(--color-border-focus)]",
            className
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]"
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
