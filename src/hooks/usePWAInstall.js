import { useSyncExternalStore } from 'react';
import { toast } from '../stores/useUIStore';
import { isStandaloneMode } from '../utils/helpers';

let deferredPrompt = null;
let initialized = false;
let snapshot = {
  canInstall: false,
  isInstalled: isStandaloneMode(),
};
const subscribers = new Set();

function emit() {
  subscribers.forEach((listener) => listener());
}

function update(next) {
  snapshot = { ...snapshot, ...next };
  emit();
}

function init() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    update({ canInstall: true });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    update({ canInstall: false, isInstalled: true });
    toast.success('CatatKas berhasil di-install.');
  });
}

function subscribe(listener) {
  init();
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

init();

export function usePWAInstall() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const install = async () => {
    const prompt = deferredPrompt;
    if (!prompt) return false;

    prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPrompt = null;
    update({ canInstall: false });

    if (choice.outcome === 'accepted') {
      toast.success('Terima kasih! CatatKas sedang dipasang.');
      return true;
    }

    toast.info('Install dibatalkan. Kamu bisa mencoba lagi nanti.');
    return false;
  };

  return { ...state, install };
}
