"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    toast,
    success: (title, description) => toast({ title, description, tone: "success" }),
    error: (title, description) => toast({ title, description, tone: "error" }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "animate-rise pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-[var(--shadow-card-hover)]",
              t.tone === "success" && "border-emerald-200",
              t.tone === "error" && "border-red-200",
              t.tone === "info" && "border-stone-200",
            )}
          >
            <span className="mt-0.5 text-base" aria-hidden>
              {t.tone === "success" ? "✅" : t.tone === "error" ? "⚠️" : "💡"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-stone-500">{t.description}</p>}
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-1.5 text-xs font-semibold text-brand-700 hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-stone-400 transition hover:text-stone-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
