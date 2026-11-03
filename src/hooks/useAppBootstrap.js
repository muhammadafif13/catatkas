import { useEffect } from 'react';
import { isOnline } from '../lib/supabase';
import { useAdStore } from '../stores/useAdStore';
import { useAuthStore } from '../stores/useAuthStore';
import { syncAndRefresh } from '../services/sync';
import { getErrorMessage } from '../utils/helpers';

export function useAppBootstrap() {
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const retry = useAuthStore((state) => state.retry);
  const setOfflineMode = useAuthStore((state) => state.setOfflineMode);

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void useAdStore.getState().fetchAds();
  }, [status]);

  useEffect(() => {
    const synchronize = async () => {
      const state = useAuthStore.getState();
      if (!state.user || !isOnline()) return;

      await state.refreshProfile();
      const next = useAuthStore.getState();
      if (next.status !== 'authenticated') return;

      try {
        await syncAndRefresh(next.user.id);
        next.setSyncError(null);
        next.setOfflineMode(false);
      } catch (syncError) {
        next.setSyncError(getErrorMessage(syncError));
      }
    };

    const handleOnline = () => {
      void synchronize();
    };

    const handleOffline = () => {
      useAuthStore
        .getState()
        .setSyncError('Mode offline: kamu dapat membaca data, tetapi perubahan dinonaktifkan.');
      useAuthStore.getState().setOfflineMode(true);
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible' && isOnline()) {
        void useAuthStore.getState().refreshProfile();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  return { status, error, retry };
}
