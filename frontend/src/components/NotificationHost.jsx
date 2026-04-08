import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconCheckCircle, IconExclamationCircle, IconClock, IconX } from './Icons';

const MAX_TOASTS = 5;
const AUTO_CLOSE_MS = 4200;

const classifyToastType = (message) => {
  const text = String(message || '').toLowerCase();

  if (text.includes('berhasil') || text.includes('tersimpan') || text.includes('terkirim')) {
    return 'success';
  }

  if (text.includes('gagal') || text.includes('ditolak') || text.includes('tidak dapat') || text.includes('error')) {
    return 'error';
  }

  if (text.includes('peringatan') || text.includes('maksimal') || text.includes('wajib')) {
    return 'warning';
  }

  return 'info';
};

const NotificationHost = () => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const type = classifyToastType(message);
    const toast = { id, type, message: String(message || '') };

    setToasts((prev) => [toast, ...prev].slice(0, MAX_TOASTS));

    window.setTimeout(() => {
      removeToast(id);
    }, AUTO_CLOSE_MS);
  }, [removeToast]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.__appConfirmAvailable = true;

    const handleConfirm = (event) => {
      const detail = event?.detail;
      if (!detail || typeof detail.resolve !== 'function') return;
      setConfirmState(detail);
    };

    window.alert = (message) => {
      pushToast(message);
    };
    window.addEventListener('app:confirm', handleConfirm);

    return () => {
      window.alert = originalAlert;
      window.__appConfirmAvailable = false;
      window.removeEventListener('app:confirm', handleConfirm);
    };
  }, [pushToast]);

  const finishConfirm = (result) => {
    if (confirmState?.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState(null);
  };

  const iconMap = useMemo(() => ({
    success: <IconCheckCircle className="w-4 h-4" />,
    error: <IconExclamationCircle className="w-4 h-4" />,
    warning: <IconClock className="w-4 h-4" />,
    info: <IconExclamationCircle className="w-4 h-4" />,
  }), []);

  if (toasts.length === 0 && !confirmState) return null;

  return (
    <>
      <div className="app-toast-stack" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`app-toast app-toast--${toast.type}`}>
            <div className="app-toast__icon">{iconMap[toast.type]}</div>
            <div className="app-toast__content">
              <p className="app-toast__title">
                {toast.type === 'success' && 'Berhasil'}
                {toast.type === 'error' && 'Terjadi Kendala'}
                {toast.type === 'warning' && 'Perhatian'}
                {toast.type === 'info' && 'Informasi'}
              </p>
              <p className="app-toast__message">{toast.message}</p>
            </div>
            <button type="button" className="app-toast__close" onClick={() => removeToast(toast.id)} aria-label="Tutup notifikasi">
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="app-confirm-overlay" onClick={() => finishConfirm(false)}>
          <div className="app-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <h4 className="app-confirm-title">{confirmState.title}</h4>
            <p className="app-confirm-message">{confirmState.message}</p>
            <div className="app-confirm-actions">
              <button type="button" className="app-confirm-btn app-confirm-btn--cancel" onClick={() => finishConfirm(false)}>
                {confirmState.cancelText}
              </button>
              <button type="button" className="app-confirm-btn app-confirm-btn--confirm" onClick={() => finishConfirm(true)}>
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationHost;
