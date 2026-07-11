import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] " +
    "active:bg-[var(--color-accent-700)] shadow-sm",
  secondary:
    "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] " +
    "border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] " +
    "hover:border-[var(--color-border-focus)]",
  ghost:
    "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] " +
    "hover:bg-[var(--color-bg-hover)]",
  danger:
    "bg-[var(--color-error)] text-white hover:opacity-90 active:opacity-80 shadow-sm",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-7 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-9 px-4 text-sm gap-2 rounded-[var(--radius-default)]",
  lg: "h-11 px-6 text-base gap-2.5 rounded-[var(--radius-default)]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-medium",
        "transition-all duration-[var(--duration-normal)] cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading && <Loader2 className="animate-spin" size={size === "sm" ? 12 : 15} />}
      {children}
    </button>
  );
}
