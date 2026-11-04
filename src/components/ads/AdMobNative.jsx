import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeAdFeed,
  NativeAdPluginEvents,
  NativeAdTemplate,
} from '@capacitor-community/admob';
import { useAdFreeActive } from '../../hooks/useAdFreeActive';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../hooks/useTheme';
import {
  adUnit,
  initializeAdMob,
  isAdMobNativeEnabled,
  isAdMobSupported,
  isAdMobTestMode,
} from '../../services/admob';
import { useUIStore } from '../../stores/useUIStore';

const NATIVE_SLOT_HEIGHT = 320;
const LOAD_TIMEOUT_MS = 12_000;

function nativeStyles(theme) {
  if (theme === 'light') {
    return {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      headlineColor: '#0f172a',
      bodyColor: '#475569',
      callToActionBackgroundColor: '#4f46e5',
      callToActionTextColor: '#ffffff',
    };
  }
  return {
    backgroundColor: '#111c33',
    borderColor: '#25324d',
    headlineColor: '#f8fafc',
    bodyColor: '#94a3b8',
    callToActionBackgroundColor: '#6366f1',
    callToActionTextColor: '#ffffff',
  };
}

function viewportInset() {
  const header = document.querySelector('.topbar');
  const nav = document.querySelector('.bottom-nav');
  const headerHeight = header?.getBoundingClientRect().height || 64;
  const navHeight = nav?.getBoundingClientRect().height || 66;
  return {
    top: Math.round(headerHeight),
    bottom: Math.round(navHeight),
  };
}

async function createFeed(options) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await NativeAdFeed.create(options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => {
        window.setTimeout(resolve, 200);
      });
    }
  }
  throw lastError;
}

export default function AdMobNative({ placement, className = '' }) {
  const { resolvedTheme } = useTheme();
  const adFree = useAdFreeActive();
  const online = useOnlineStatus();
  const confirmOpen = useUIStore((state) => Boolean(state.confirmState));
  const active =
    isAdMobSupported && isAdMobNativeEnabled && online && !adFree;

  const [feedReady, setFeedReady] = useState(false);
  const [status, setStatus] = useState('idle');
  const feedRef = useRef(null);
  const elementRef = useRef(null);
  const pauseReasons = useRef({ safe: true, modal: false });
  const feedId = useMemo(
    () => `catatkas-${placement}-${Math.random().toString(36).slice(2, 8)}`,
    [placement],
  );
  const slotKey = `${feedId}-slot`;

  const syncFeedVisibility = useCallback(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const reasons = pauseReasons.current;
    if (reasons.safe && !reasons.modal) {
      feed.resume();
    } else {
      void feed.pause().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setStatus('idle');
      setFeedReady(false);
      return undefined;
    }

    let cancelled = false;
    let feed = null;
    let loadTimeout = null;
    const listenerHandles = [];

    const boot = async () => {
      const snapshot = await initializeAdMob();
      if (cancelled || !snapshot.canRequestAds) {
        if (!cancelled) setStatus('failed');
        return;
      }

      try {
        feed = await createFeed({
          feedId,
          adId: adUnit('native'),
          template: NativeAdTemplate.Medium,
          isTesting: isAdMobTestMode,
          androidScrollSnapshot: true,
          style: nativeStyles(resolvedTheme),
        });
      } catch {
        if (!cancelled) setStatus('failed');
        return;
      }

      if (cancelled) {
        await feed.destroy().catch(() => {});
        return;
      }

      feedRef.current = feed;
      setFeedReady(true);
      setStatus('loading');

      loadTimeout = window.setTimeout(() => {
        if (!cancelled) setStatus('failed');
      }, LOAD_TIMEOUT_MS);

      const loadedHandle = await feed
        .addListener(NativeAdPluginEvents.Loaded, () => {
          window.clearTimeout(loadTimeout);
          if (!cancelled) setStatus('loaded');
        })
        .catch(() => null);
      if (loadedHandle) listenerHandles.push(loadedHandle);

      const failureHandle = await feed
        .addListener(NativeAdPluginEvents.FailedToLoad, () => {
          window.clearTimeout(loadTimeout);
          if (!cancelled) setStatus('failed');
        })
        .catch(() => null);
      if (failureHandle) listenerHandles.push(failureHandle);
    };

    void boot();

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      setFeedReady(false);
      feedRef.current = null;
      pauseReasons.current = { safe: true, modal: false };
      void Promise.allSettled(listenerHandles.map((handle) => handle.remove())).then(() => {
        void feed?.destroy().catch(() => {});
      });
    };
  }, [active, feedId, slotKey, resolvedTheme]);

  useEffect(() => {
    if (!feedReady || !elementRef.current) return undefined;
    const feed = feedRef.current;
    if (!feed) return undefined;

    const inset = viewportInset();
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        pauseReasons.current.safe = Boolean(entry && entry.intersectionRatio >= 0.99);
        syncFeedVisibility();
      },
      {
        threshold: [0, 0.99, 1],
        rootMargin: `-${inset.top}px 0px -${inset.bottom}px 0px`,
      },
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [feedReady, syncFeedVisibility]);

  useEffect(() => {
    pauseReasons.current.modal = confirmOpen;
    syncFeedVisibility();
  }, [confirmOpen, syncFeedVisibility]);

  useEffect(() => {
    if (status !== 'failed') return;
    const feed = feedRef.current;
    feedRef.current = null;
    setFeedReady(false);
    void feed?.destroy().catch(() => {});
  }, [status]);

  if (!active || status === 'idle' || status === 'failed') return null;

  return (
    <section className={`ad-slot admob-native ${className}`.trim()} aria-label="Iklan">
      <div className="ad-slot__head">
        <span>Iklan</span>
        <span>Google AdMob</span>
      </div>
      <div
        className="admob-native__frame"
        style={{ minHeight: `${NATIVE_SLOT_HEIGHT}px` }}
      >
        {status !== 'loaded' ? (
          <div
            className="admob-native__loading"
            style={{ height: `${NATIVE_SLOT_HEIGHT}px` }}
          >
            <span>Memuat iklan…</span>
          </div>
        ) : null}
        {feedReady
          ? createElement('capacitor-admob-native', {
              ref: elementRef,
              'feed-id': feedId,
              'slot-key': slotKey,
              style: { height: `${NATIVE_SLOT_HEIGHT}px` },
            })
          : null}
      </div>
    </section>
  );
}
