import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  AppOpenAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  RewardInterstitialAdPluginEvents,
} from '@capacitor-community/admob';

const PRODUCTION_UNITS = {
  appOpen: 'ca-app-pub-5733196874007773/6775871224',
  banner: 'ca-app-pub-5733196874007773/7103174283',
  interstitial: 'ca-app-pub-5733196874007773/7921431931',
  native: 'ca-app-pub-5733196874007773/1707589405',
  rewarded: 'ca-app-pub-5733196874007773/7079123550',
  rewardedInterstitial: 'ca-app-pub-5733196874007773/6113526240',
};

// Google demo units. These intentionally contain the test publisher ID.
const TEST_UNITS = {
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  native: 'ca-app-pub-3940256099942544/2247696110',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
};

const FREQUENCY_KEY = 'catatkas.admob.frequency.v1';
export const AD_FREE_KEY = 'catatkas.admob.adFreeUntil.v1';

const APP_OPEN_MIN_GAP_MS = 4 * 60 * 60 * 1000;
const INTERSTITIAL_MIN_GAP_MS = 3 * 60 * 1000;
const FULLSCREEN_MIN_GAP_MS = 2 * 60 * 1000;
const INTERSTITIAL_DAILY_LIMIT = 3;
const INTERSTITIAL_SESSION_MIN_SAVES = 2;

const envFlag = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

export const isAdMobSupported =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
export const isAdMobTestMode =
  Boolean(import.meta.env.DEV) || envFlag(import.meta.env.VITE_ADMOB_TEST_MODE);
export const isAdMobNativeEnabled =
  String(import.meta.env.VITE_ADMOB_NATIVE_ENABLED ?? 'true').toLowerCase() !== 'false';

let initPromise = null;
let initialized = false;
let canRequestAds = false;
let consentStatus = null;
let privacyOptionsRequired = false;
let listenersBound = false;
let launchRegistered = false;
let sessionSaves = 0;

let appOpenReady = false;
let interstitialReady = false;
let rewardedReady = false;
let rewardedInterstitialReady = false;

function readJSON(key, fallback) {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Frequency caps are best-effort; ads still remain functional.
  }
}

function readNumber(key, fallback = 0) {
  try {
    if (typeof window === 'undefined') return fallback;
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultFrequency() {
  return {
    launches: 0,
    lastAppOpenAt: 0,
    lastInterstitialAt: 0,
    lastFullscreenAt: 0,
    interstitialDay: '',
    interstitialCount: 0,
    suppressedUntil: 0,
  };
}

let frequency = null;

function getFrequency() {
  if (!frequency) {
    frequency = { ...defaultFrequency(), ...readJSON(FREQUENCY_KEY, {}) };
  }
  return frequency;
}

function saveFrequency() {
  writeJSON(FREQUENCY_KEY, getFrequency());
}

function isBrowserOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function readAdFreeUntil() {
  return readNumber(AD_FREE_KEY);
}

export function isAdFreeNow() {
  return readAdFreeUntil() > Date.now();
}

export function adUnit(type) {
  return (isAdMobTestMode ? TEST_UNITS : PRODUCTION_UNITS)[type];
}

export function adMobSnapshot() {
  return {
    supported: isAdMobSupported,
    testMode: isAdMobTestMode,
    initialized,
    canRequestAds,
    consentStatus,
    privacyOptionsRequired,
  };
}

function applyConsentInfo(info) {
  canRequestAds = Boolean(info?.canRequestAds);
  consentStatus = info?.status ?? null;
  privacyOptionsRequired = info?.privacyOptionsRequirementStatus === 'REQUIRED';
}

function scheduleReload(loader, delayMs) {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => {
    void loader().catch(() => {});
  }, delayMs);
}

function bindAdMobListeners() {
  if (listenersBound || !isAdMobSupported) return;
  listenersBound = true;

  void AdMob.addListener(AppOpenAdPluginEvents.Closed, () => {
    appOpenReady = false;
    scheduleReload(prepareAppOpen, 30_000);
  }).catch(() => {});
  void AdMob.addListener(AppOpenAdPluginEvents.FailedToLoad, () => {
    appOpenReady = false;
  }).catch(() => {});

  void AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    interstitialReady = false;
    scheduleReload(prepareInterstitial, 30_000);
  }).catch(() => {});
  void AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
    interstitialReady = false;
  }).catch(() => {});

  void AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
    rewardedReady = false;
    scheduleReload(prepareRewarded, 45_000);
  }).catch(() => {});
  void AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
    rewardedReady = false;
  }).catch(() => {});

  void AdMob.addListener(RewardInterstitialAdPluginEvents.Dismissed, () => {
    rewardedInterstitialReady = false;
    scheduleReload(prepareRewardedInterstitial, 45_000);
  }).catch(() => {});
  void AdMob.addListener(RewardInterstitialAdPluginEvents.FailedToLoad, () => {
    rewardedInterstitialReady = false;
  }).catch(() => {});
}

export async function initializeAdMob() {
  if (!isAdMobSupported) return adMobSnapshot();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let consent = await AdMob.requestConsentInfo();

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
    }

    applyConsentInfo(consent);

    if (!canRequestAds) {
      // A later privacy-options change may grant consent; allow a retry.
      initPromise = null;
      return adMobSnapshot();
    }

    await AdMob.initialize(
      isAdMobTestMode ? { initializeForTesting: true } : undefined,
    );
    initialized = true;
    bindAdMobListeners();
    return adMobSnapshot();
  })().catch((error) => {
    initPromise = null;
    console.warn('AdMob initialization failed:', error);
    return adMobSnapshot();
  });

  return initPromise;
}

export async function refreshAdMobConsent() {
  if (!isAdMobSupported) return adMobSnapshot();
  try {
    const consent = await AdMob.requestConsentInfo();
    applyConsentInfo(consent);
    if (canRequestAds && !initialized) {
      initPromise = null;
      await initializeAdMob();
    }
    return adMobSnapshot();
  } catch (error) {
    console.warn('AdMob consent refresh failed:', error);
    return adMobSnapshot();
  }
}

export async function openAdMobPrivacyOptions() {
  if (!isAdMobSupported) return adMobSnapshot();
  await AdMob.showPrivacyOptionsForm();
  return refreshAdMobConsent();
}

export function registerAdMobLaunch() {
  if (!isAdMobSupported || launchRegistered) return;
  launchRegistered = true;
  const current = getFrequency();
  current.launches += 1;
  saveFrequency();
}

export function suppressAdMobFullscreen(durationMs = FULLSCREEN_MIN_GAP_MS) {
  const current = getFrequency();
  current.suppressedUntil = Math.max(current.suppressedUntil, Date.now() + durationMs);
  saveFrequency();
}

function markFullscreenShown() {
  const current = getFrequency();
  const now = Date.now();
  current.lastFullscreenAt = now;
  current.suppressedUntil = Math.max(current.suppressedUntil, now + 30_000);
  saveFrequency();
}

function canShowAppOpen() {
  const current = getFrequency();
  const now = Date.now();
  if (current.launches < 1) return false;
  if (current.suppressedUntil > now) return false;
  if (now - current.lastAppOpenAt < APP_OPEN_MIN_GAP_MS) return false;
  if (now - current.lastFullscreenAt < FULLSCREEN_MIN_GAP_MS) return false;
  return true;
}

function canShowInterstitial() {
  const current = getFrequency();
  const now = Date.now();
  const today = localDayKey();

  if (current.interstitialDay !== today) {
    current.interstitialDay = today;
    current.interstitialCount = 0;
    saveFrequency();
  }

  if (current.suppressedUntil > now) return false;
  if (current.interstitialCount >= INTERSTITIAL_DAILY_LIMIT) return false;
  if (now - current.lastInterstitialAt < INTERSTITIAL_MIN_GAP_MS) return false;
  if (now - current.lastFullscreenAt < FULLSCREEN_MIN_GAP_MS) return false;
  return true;
}

async function ensureAdMobReady() {
  if (!isAdMobSupported || !isBrowserOnline()) return false;
  if (!initialized || !canRequestAds) {
    const snapshot = await initializeAdMob();
    if (!snapshot.initialized || !snapshot.canRequestAds) return false;
  }
  return true;
}

export async function prepareAppOpen() {
  if (!(await ensureAdMobReady()) || appOpenReady) return appOpenReady;
  try {
    await AdMob.loadAppOpen({ adId: adUnit('appOpen') });
    appOpenReady = true;
  } catch {
    appOpenReady = false;
  }
  return appOpenReady;
}

export async function maybeShowAppOpen() {
  if (!isAdMobSupported || isAdFreeNow() || !isBrowserOnline()) return false;
  if (!(await ensureAdMobReady())) return false;
  if (!canShowAppOpen()) return false;

  if (!appOpenReady) {
    const loaded = await prepareAppOpen();
    if (!loaded) return false;
  }

  if (!canShowAppOpen()) return false;

  try {
    await AdMob.showAppOpen({ adId: adUnit('appOpen') });
    appOpenReady = false;
    const current = getFrequency();
    current.lastAppOpenAt = Date.now();
    saveFrequency();
    markFullscreenShown();
    return true;
  } catch {
    appOpenReady = false;
    return false;
  }
}

export async function prepareInterstitial() {
  if (!(await ensureAdMobReady()) || interstitialReady) return interstitialReady;
  try {
    await AdMob.prepareInterstitial({
      adId: adUnit('interstitial'),
      isTesting: isAdMobTestMode,
    });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
  return interstitialReady;
}

export async function maybeShowInterstitial() {
  if (!isAdMobSupported || isAdFreeNow() || !isBrowserOnline()) return false;
  if (!(await ensureAdMobReady())) return false;
  if (!canShowInterstitial()) return false;

  if (!interstitialReady) {
    const loaded = await prepareInterstitial();
    if (!loaded) return false;
  }

  if (!canShowInterstitial()) return false;

  try {
    await AdMob.showInterstitial({ adId: adUnit('interstitial') });
    interstitialReady = false;
    const current = getFrequency();
    current.lastInterstitialAt = Date.now();
    current.interstitialCount += 1;
    saveFrequency();
    markFullscreenShown();
    return true;
  } catch {
    interstitialReady = false;
    return false;
  }
}

export async function handleAdMobTransactionSaved() {
  if (!isAdMobSupported || isAdFreeNow()) return false;
  sessionSaves += 1;
  if (sessionSaves < INTERSTITIAL_SESSION_MIN_SAVES) return false;
  return maybeShowInterstitial();
}

export async function prepareRewarded() {
  if (!(await ensureAdMobReady()) || rewardedReady) return rewardedReady;
  try {
    await AdMob.prepareRewardVideoAd({
      adId: adUnit('rewarded'),
      isTesting: isAdMobTestMode,
      immersiveMode: true,
    });
    rewardedReady = true;
  } catch {
    rewardedReady = false;
  }
  return rewardedReady;
}

export async function showRewarded() {
  if (!(await ensureAdMobReady()) || !isBrowserOnline()) {
    throw new Error('Iklan belum tersedia.');
  }
  if (!rewardedReady) {
    const loaded = await prepareRewarded();
    if (!loaded) throw new Error('Iklan belum tersedia.');
  }

  const reward = await AdMob.showRewardVideoAd({ adId: adUnit('rewarded') });
  rewardedReady = false;
  markFullscreenShown();
  scheduleReload(prepareRewarded, 45_000);
  return reward;
}

export async function prepareRewardedInterstitial() {
  if (!(await ensureAdMobReady()) || rewardedInterstitialReady) {
    return rewardedInterstitialReady;
  }
  try {
    await AdMob.prepareRewardInterstitialAd({
      adId: adUnit('rewardedInterstitial'),
      isTesting: isAdMobTestMode,
      immersiveMode: true,
    });
    rewardedInterstitialReady = true;
  } catch {
    rewardedInterstitialReady = false;
  }
  return rewardedInterstitialReady;
}

export async function showRewardedInterstitial() {
  if (!(await ensureAdMobReady()) || !isBrowserOnline()) {
    throw new Error('Iklan belum tersedia.');
  }
  if (!rewardedInterstitialReady) {
    const loaded = await prepareRewardedInterstitial();
    if (!loaded) throw new Error('Iklan belum tersedia.');
  }

  const reward = await AdMob.showRewardInterstitialAd({
    adId: adUnit('rewardedInterstitial'),
  });
  rewardedInterstitialReady = false;
  markFullscreenShown();
  scheduleReload(prepareRewardedInterstitial, 45_000);
  return reward;
}
