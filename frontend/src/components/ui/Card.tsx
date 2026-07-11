import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
        "rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]",
        "transition-shadow duration-[var(--duration-normal)]",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
