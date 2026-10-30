import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { classNames } from '../../utils/helpers';

const icons = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export default function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div key={toast.id} className={classNames('toast', `toast--${toast.type}`)}>
            <span className="toast__icon">
              <Icon aria-hidden="true" />
            </span>
            <p className="toast__message">{toast.message}</p>
            <button
              type="button"
              className="toast__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Tutup notifikasi"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
