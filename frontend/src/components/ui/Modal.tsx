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

// Focusable element selectors per WCAG focus-trap spec
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef  = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  /** Element that had focus before the modal opened — restored on close */
  const triggerRef = useRef<Element | null>(null);

  // ---- Save trigger, auto-focus first focusable element ----
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      // Slight delay so the dialog has rendered
      const raf = requestAnimationFrame(() => {
        const el = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        el?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // Restore focus to trigger
      (triggerRef.current as HTMLElement | null)?.focus();
    }
  }, [open]);

  // ---- Escape closes ----
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ---- Tab focus trap ----
  useEffect(() => {
    if (!open) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  // ---- Scroll lock ----
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ---- Click-outside ----
  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/60 backdrop-blur-sm",
        "animate-[fadeIn_150ms_ease-out]"
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
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
            <h2
              id="modal-title"
              className="text-base font-semibold text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
            <button
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
