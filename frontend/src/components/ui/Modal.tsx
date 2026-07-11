"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus the close button when modal opens
  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);

  // Trap scroll on body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleOverlayClick}
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/60 backdrop-blur-sm",
        "animate-[fadeIn_150ms_ease-out]"
      )}
    >
      <div
        className={clsx(
          "relative w-full bg-[var(--color-bg-elevated)]",
          "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
          "shadow-[var(--shadow-lg)]",
          "animate-[slideUp_150ms_ease-out]",
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
            <button
              ref={firstFocusRef}
              onClick={onClose}
              aria-label="Close modal"
              className={clsx(
                "rounded-[var(--radius-sm)] p-1 text-[var(--color-text-tertiary)]",
                "hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]",
                "transition-colors duration-[var(--duration-micro)]"
              )}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
