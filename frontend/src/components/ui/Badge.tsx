import { clsx } from "clsx";
import type { CandidateStatus } from "@/lib/types";

type BadgeVariant = CandidateStatus | "info" | "default" | "success" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending:
    "bg-[var(--color-warning-muted)] text-[var(--color-warning)] border border-[var(--color-warning)]/30",
  shortlisted:
    "bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/30",
  rejected:
    "bg-[var(--color-error-muted)] text-[var(--color-error)] border border-[var(--color-error)]/30",
  info:
    "bg-[var(--color-info-muted)] text-[var(--color-info)] border border-[var(--color-info)]/30",
  default:
    "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
  success:
    "bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/30",
  error:
    "bg-[var(--color-error-muted)] text-[var(--color-error)] border border-[var(--color-error)]/30",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5",
        "text-xs font-medium rounded-[var(--radius-pill)]",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
