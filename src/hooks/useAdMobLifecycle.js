import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useAdMobStore } from '../stores/useAdMobStore';
import {
  isAdMobSupported,
  maybeShowAppOpen,
  prepareAppOpen,
  prepareInterstitial,
  registerAdMobLaunch,
  suppressAdMobFullscreen,
} from '../services/admob';

const INIT_DELAY_MS = 900;
const RESUME_MIN_HIDDEN_MS = 30_000;

export function useAdMobLifecycle() {
  const profile = useAuthStore((state) => state.profile);
  const initialize = useAdMobStore((state) => state.initialize);
  const hiddenAtRef = useRef(0);

  useEffect(() => {
    if (!isAdMobSupported || profile?.role === 'admin') return undefined;

    registerAdMobLaunch();
    let cancelled = false;

    const initTimer = window.setTimeout(() => {
      void initialize().then((snapshot) => {
        if (cancelled || !snapshot.canRequestAds) return;
        // Do not interrupt the first paint or a fresh consent flow with an ad.
        suppressAdMobFullscreen(2_000);
        void prepareAppOpen().catch(() => {});
        void prepareInterstitial().catch(() => {});
        void maybeShowAppOpen().catch(() => {});
      });
    }, INIT_DELAY_MS);

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      hiddenAtRef.current = 0;
      if (hiddenFor < RESUME_MIN_HIDDEN_MS) return;
      void maybeShowAppOpen();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(initTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [initialize, profile?.role]);
}
