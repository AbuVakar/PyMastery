import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((previousToasts) => previousToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id, duration: toast.duration || 5000 };

    setToasts((previousToasts) => [...previousToasts, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>{children}</ToastContext.Provider>;
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'OK';
      case 'error':
        return 'X';
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      default:
        return 'i';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[300px] max-w-md transform rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out ${getToastStyles(
            toast.type
          )}`}
        >
          <div className="flex items-start">
            <span className="mr-3 flex-shrink-0 text-lg font-bold">{getToastIcon(toast.type)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 flex-shrink-0 text-white transition-opacity hover:opacity-80"
              aria-label="Dismiss notification"
            >
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
