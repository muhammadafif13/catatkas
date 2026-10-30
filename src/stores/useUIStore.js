import { create } from 'zustand';

let toastSequence = 0;

export const useUIStore = create((set, get) => ({
  toasts: [],
  confirmState: null,

  pushToast: (message, type = 'success', duration = 3200) => {
    const id = ++toastSequence;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    if (duration > 0) {
      window.setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toastItem) => toastItem.id !== id) }));
  },

  requestConfirm: (options = {}) =>
    new Promise((resolve) => {
      set({
        confirmState: {
          title: options.title || 'Konfirmasi',
          message: options.message || 'Apakah kamu yakin?',
          confirmLabel: options.confirmLabel || 'Ya, lanjutkan',
          cancelLabel: options.cancelLabel || 'Batal',
          danger: options.danger !== false,
          resolve,
        },
      });
    }),

  resolveConfirm: (result) => {
    const { confirmState } = get();
    if (confirmState?.resolve) confirmState.resolve(result);
    set({ confirmState: null });
  },
}));

export const toast = {
  success: (message, duration = 3200) =>
    useUIStore.getState().pushToast(message, 'success', duration),
  error: (message, duration = 4000) => useUIStore.getState().pushToast(message, 'error', duration),
  warning: (message, duration = 3600) =>
    useUIStore.getState().pushToast(message, 'warning', duration),
  info: (message, duration = 3200) => useUIStore.getState().pushToast(message, 'info', duration),
};
