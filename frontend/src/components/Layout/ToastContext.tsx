import React, { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextProps {
  showToast: (type: ToastType, message: string) => void;
}

export const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext); 