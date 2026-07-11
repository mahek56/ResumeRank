"use client";

import { useEffect, useCallback, createContext, useContext, useState, useRef } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { clsx } from "clsx";

// ---- Types ----

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

// ---- Context ----

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ---- Provider ----

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timerMap.current.get(id);
    if (timer) { clearTimeout(timer); timerMap.current.delete(id); }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant, message }]);
      // Auto-dismiss after 4s
      const timer = setTimeout(() => dismiss(id), 4000);
      timerMap.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast portal */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---- Single toast ----

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-[var(--color-success)]/40 text-[var(--color-success)]",
  error: "border-[var(--color-error)]/40 text-[var(--color-error)]",
  info: "border-[var(--color-info)]/40 text-[var(--color-info)]",
  warning: "border-[var(--color-warning)]/40 text-[var(--color-warning)]",
};

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="alert"
      className={clsx(
        "flex items-start gap-3 px-4 py-3",
        "bg-[var(--color-bg-elevated)] border rounded-[var(--radius-default)]",
        "shadow-[var(--shadow-lg)] text-sm",
        "animate-[slideUp_150ms_ease-out]",
        variantStyles[item.variant]
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[item.variant]}</span>
      <p className="flex-1 text-[var(--color-text-primary)]">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss"
        className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
