"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

type ToastSeverity = "success" | "error";
type Toast = { message: string; severity: ToastSeverity } | null;

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide success/error toasts. Mounted once in the root layout (alongside
 * AuthProvider) so every page - not just the guest ordering flow, previously
 * the only Snackbar user in the app - can give feedback after an action.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);

  const show = useCallback((message: string, severity: ToastSeverity) => {
    setToast({ message, severity });
  }, []);

  const success = useCallback((message: string) => show(message, "success"), [show]);
  const error = useCallback((message: string) => show(message, "error"), [show]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            onClose={() => setToast(null)}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
