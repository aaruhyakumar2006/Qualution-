import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  text: string;
  durationMs?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const content = (
    <div className="toast-portal-container" data-testid="toast-container">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'warning'
            ? AlertTriangle
            : toast.type === 'error'
            ? AlertCircle
            : Info;

        return (
          <div
            key={toast.id}
            className={`toast-item ${toast.type}`}
            role="alert"
            data-testid={`toast-${toast.type}`}
          >
            <Icon size={15} className="toast-icon" />
            <span className="toast-text">{toast.text}</span>
            <button
              type="button"
              className="btn-toast-dismiss"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss Notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
