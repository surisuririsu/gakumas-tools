"use client";
import { createContext, useCallback, useMemo, useRef, useState } from "react";
import Toaster from "@/components/Toaster";

const MAX_TOASTS = 3;

const DURATIONS = {
  success: 3000,
  info: 4000,
  error: 6000,
};

const ToastContext = createContext();

export function ToastContextProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((cur) => cur.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, tone = "info", action, duration }) => {
      const id = nextIdRef.current++;
      const toast = {
        id,
        message,
        tone,
        action,
        duration: duration ?? (action ? DURATIONS.error : DURATIONS[tone]),
      };
      setToasts((cur) => [...cur, toast].slice(-MAX_TOASTS));
      return id;
    },
    []
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export default ToastContext;
