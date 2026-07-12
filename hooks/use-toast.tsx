"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "default" | "success" | "error";

export type ToastPayload = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (payload: Omit<ToastPayload, "id">) => void;
  dismiss: (id: string) => void;
  toasts: ToastPayload[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (payload: Omit<ToastPayload, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, ...payload }]);

      window.setTimeout(() => {
        dismiss(id);
      }, 4000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ toast, dismiss, toasts }),
    [dismiss, toast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}

function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={`rounded-3xl border p-4 text-left shadow-xl backdrop-blur transition ${
            toast.variant === "error"
              ? "border-rose-200 bg-rose-50 text-rose-950"
              : toast.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          <div className="text-sm font-semibold">{toast.title}</div>
          {toast.description ? (
            <div className="mt-1 text-xs leading-5 opacity-80">
              {toast.description}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
