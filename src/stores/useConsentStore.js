import { create } from 'zustand';

const CONSENT_KEY = 'catatkas.adsConsent.v1';

function readConsent() {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function persistConsent(value) {
  try {
    if (value) window.localStorage.setItem(CONSENT_KEY, value);
    else window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Consent still applies for the current session.
  }
}

export const useConsentStore = create((set) => ({
  adsenseConsent: readConsent(),

  grantAdsense: () => {
    persistConsent('granted');
    set({ adsenseConsent: 'granted' });
  },

  denyAdsense: () => {
    persistConsent('denied');
    set({ adsenseConsent: 'denied' });
  },

  resetAdsenseConsent: () => {
    persistConsent(null);
    set({ adsenseConsent: null });
  },
}));
