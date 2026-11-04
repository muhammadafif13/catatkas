import { create } from 'zustand';
import {
  adMobSnapshot,
  AD_FREE_KEY,
  initializeAdMob,
  isAdMobSupported,
  openAdMobPrivacyOptions,
  readAdFreeUntil,
  refreshAdMobConsent,
} from '../services/admob';

function persistAdFreeUntil(value) {
  try {
    if (typeof window === 'undefined') return;
    if (value > Date.now()) window.localStorage.setItem(AD_FREE_KEY, String(value));
    else window.localStorage.removeItem(AD_FREE_KEY);
  } catch {
    // The current session still reflects the in-memory value.
  }
}

export const useAdMobStore = create((set, get) => ({
  supported: isAdMobSupported,
  status: isAdMobSupported ? 'idle' : 'unsupported',
  initialized: false,
  canRequestAds: false,
  consentStatus: null,
  privacyOptionsRequired: false,
  adFreeUntil: readAdFreeUntil(),

  initialize: async () => {
    if (!isAdMobSupported) {
      set({ supported: false, status: 'unsupported' });
      return adMobSnapshot();
    }

    const current = get();
    if (current.status === 'initializing' || current.initialized) {
      return adMobSnapshot();
    }

    set({ status: 'initializing' });
    const snapshot = await initializeAdMob();
    set({
      initialized: snapshot.initialized,
      canRequestAds: snapshot.canRequestAds,
      consentStatus: snapshot.consentStatus,
      privacyOptionsRequired: snapshot.privacyOptionsRequired,
      status:
        snapshot.initialized && snapshot.canRequestAds
          ? 'ready'
          : snapshot.supported
            ? 'consent-required'
            : 'unsupported',
    });
    return snapshot;
  },

  refreshConsent: async () => {
    if (!isAdMobSupported) return adMobSnapshot();
    const snapshot = await refreshAdMobConsent();
    set({
      initialized: snapshot.initialized,
      canRequestAds: snapshot.canRequestAds,
      consentStatus: snapshot.consentStatus,
      privacyOptionsRequired: snapshot.privacyOptionsRequired,
      status:
        snapshot.initialized && snapshot.canRequestAds
          ? 'ready'
          : snapshot.supported
            ? 'consent-required'
            : 'unsupported',
    });
    return snapshot;
  },

  openPrivacyOptions: async () => {
    if (!isAdMobSupported) return adMobSnapshot();
    const snapshot = await openAdMobPrivacyOptions();
    set({
      initialized: snapshot.initialized,
      canRequestAds: snapshot.canRequestAds,
      consentStatus: snapshot.consentStatus,
      privacyOptionsRequired: snapshot.privacyOptionsRequired,
      status:
        snapshot.initialized && snapshot.canRequestAds
          ? 'ready'
          : snapshot.supported
            ? 'consent-required'
            : 'unsupported',
    });
    return snapshot;
  },

  grantAdFree: (hours) => {
    const until = Math.max(Date.now(), get().adFreeUntil) + hours * 60 * 60 * 1000;
    persistAdFreeUntil(until);
    set({ adFreeUntil: until });
    return until;
  },

  clearAdFree: () => {
    persistAdFreeUntil(0);
    set({ adFreeUntil: 0 });
  },
}));
