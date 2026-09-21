"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border bg-white shadow-dropdown transition-all duration-200 animate-in slide-in-from-right-4 ${
              toast.type === "success"
                ? "border-emerald-200"
                : toast.type === "error"
                ? "border-red-200"
                : toast.type === "warning"
                ? "border-amber-200"
                : "border-blue-200"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <Icon
                name={
                  toast.type === "success"
                    ? "check_circle"
                    : toast.type === "error"
                    ? "error"
                    : toast.type === "warning"
                    ? "warning"
                    : "info"
                }
                className={`text-[18px] ${
                  toast.type === "success"
                    ? "text-emerald-600"
                    : toast.type === "error"
                    ? "text-red-600"
                    : toast.type === "warning"
                    ? "text-amber-600"
                    : "text-blue-600"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-[12px] text-gray-500 mt-0.5 leading-normal">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
            >
              <Icon name="close" className="text-[14px]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (title: string, message?: string) => {
        console.log(`[Toast] ${title}: ${message || ""}`);
      },
      removeToast: () => {},
    };
  }
  return context;
}
