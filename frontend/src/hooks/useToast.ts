"use client";

import { useState, useCallback } from "react";
import { ToastData, ToastType } from "../components/Toast";

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration: options?.duration || 5000,
      action: options?.action,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast("success", title, message, options);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast("error", title, message, options);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast("warning", title, message, options);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast("info", title, message, options);
  }, [addToast]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  };
};