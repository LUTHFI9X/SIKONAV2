export function showConfirm(message, options = {}) {
  const title = options.title || 'Konfirmasi';
  const confirmText = options.confirmText || 'Ya';
  const cancelText = options.cancelText || 'Batal';

  return new Promise((resolve) => {
    const hasCustomConfirm = typeof window !== 'undefined' && window.__appConfirmAvailable === true;

    if (!hasCustomConfirm) {
      // Do not fall back to native browser confirm to keep UX consistent.
      resolve(false);
      return;
    }

    window.dispatchEvent(new CustomEvent('app:confirm', {
      detail: {
        title,
        message: String(message || ''),
        confirmText,
        cancelText,
        resolve,
      },
    }));
  });
}
