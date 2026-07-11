import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
  rounded?: "sm" | "default" | "lg" | "pill";
}

const roundedStyles = {
  sm: "rounded-[var(--radius-sm)]",
  default: "rounded-[var(--radius-default)]",
  lg: "rounded-[var(--radius-lg)]",
  pill: "rounded-[var(--radius-pill)]",
};

/**
 * Single skeleton pulse block.
 */
export function Skeleton({
  className,
  height = "h-4",
  width = "w-full",
  rounded = "default",
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse bg-[var(--color-bg-hover)]",
        height,
        width,
        roundedStyles[rounded],
        className
      )}
    />
  );
}

/**
 * A pre-built skeleton that matches the candidate table row layout.
 */
export function CandidateRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)]">
      <Skeleton width="w-40" />
      <Skeleton width="w-48" />
      <Skeleton width="w-16" rounded="pill" />
      <Skeleton width="w-20" />
      <Skeleton width="w-24" rounded="pill" />
    </div>
  );
}

/**
 * A pre-built skeleton for a stat card on the dashboard.
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-3">
      <Skeleton width="w-24" height="h-3" />
      <Skeleton width="w-16" height="h-8" />
    </div>
  );
}
