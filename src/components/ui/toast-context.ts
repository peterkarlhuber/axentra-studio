import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Shown in small print, e.g. the request id of a failed call. */
  meta?: string;
}

export interface ToastApi {
  show: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string, meta?: string) => void;
  info: (title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}
