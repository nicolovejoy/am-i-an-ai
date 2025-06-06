"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/ToastContainer";
import { ToastType } from "../components/Toast";

interface ToastContextType {
  success: (title: string, message?: string, options?: { duration?: number }) => string;
  error: (title: string, message?: string, options?: { duration?: number }) => string;
  warning: (title: string, message?: string, options?: { duration?: number }) => string;
  info: (title: string, message?: string, options?: { duration?: number }) => string;
  addToast: (
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
  ) => string;
  removeToast: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer
        toasts={toastMethods.toasts}
        onRemoveToast={toastMethods.removeToast}
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};