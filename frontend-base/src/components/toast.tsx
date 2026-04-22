"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { EXPLORER_TX_URL } from "@/lib/contracts";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "pending";
  message: string;
  txHash?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { ...toast, id }]);
    if (toast.type !== "pending") {
      setTimeout(() => removeToast(id), 5000);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toasts: [], addToast: () => {}, removeToast: () => {} };
  return ctx;
}

const TYPE_STYLES = {
  success: "border-green-400/30  bg-green-400/8  text-green-300",
  error:   "border-red-400/30    bg-red-400/8    text-red-300",
  info:    "border-cyan-400/30   bg-cyan-400/8   text-cyan-300",
  pending: "border-yellow-400/30 bg-yellow-400/8 text-yellow-300",
};

const TYPE_ICONS: Record<Toast["type"], string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
  pending: "⟳",
};

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        TYPE_STYLES[toast.type]
      )}
    >
      <span className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.txHash && (
          <a
            href={EXPLORER_TX_URL(toast.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-xs underline opacity-75 hover:opacity-100 truncate block font-mono"
          >
            {toast.txHash.slice(0, 18)}…
          </a>
        )}
      </div>
      <button onClick={onClose} className="text-sm opacity-50 hover:opacity-100 shrink-0">✕</button>
    </div>
  );
}
