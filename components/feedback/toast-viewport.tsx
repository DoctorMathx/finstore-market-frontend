"use client";

import { X } from "lucide-react";
import { useToast } from "@/components/providers";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-16 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 lg:bottom-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 ${
            toast.tone === "danger" ? "border-destructive/30 bg-destructive-soft text-destructive" : "border-border bg-foreground text-background"
          }`}
        >
          <p className="flex-1 text-small">{toast.message}</p>
          {toast.action ? (
            <button
              onClick={() => {
                toast.action?.onClick();
                dismiss(toast.id);
              }}
              className="shrink-0 text-small font-semibold underline"
            >
              {toast.action.label}
            </button>
          ) : null}
          <button onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="shrink-0 opacity-70">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
