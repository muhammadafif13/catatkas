import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { useAdFreeActive } from '../../hooks/useAdFreeActive';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  adUnit,
  initializeAdMob,
  isAdMobSupported,
  isAdMobTestMode,
} from '../../services/admob';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';

const BANNER_PATHS = new Set(['/']);

function getBannerMargin() {
  const nav = document.querySelector('.bottom-nav');
  const navHeight = nav?.getBoundingClientRect().height || 66;
  return Math.round(navHeight);
}

function setBannerInset(height) {
  const root = document.documentElement;
  root.classList.add('admob-banner-active');
  root.style.setProperty('--admob-banner-height', `${Math.max(0, Math.round(height))}px`);
}

function clearBannerInset() {
  const root = document.documentElement;
  root.classList.remove('admob-banner-active');
  root.style.removeProperty('--admob-banner-height');
}

export default function AdMobBanner() {
  const location = useLocation();
  const profile = useAuthStore((state) => state.profile);
  const confirmOpen = useUIStore((state) => Boolean(state.confirmState));
  const online = useOnlineStatus();
  const adFree = useAdFreeActive();
  const [wideViewport, setWideViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024,
  );

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setWideViewport(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const shouldShow = BANNER_PATHS.has(location.pathname);
  console.log('[ADMOB DEBUG] shouldShow=', shouldShow, 'path=', location.pathname);

  useEffect(() => {
    if (!shouldShow) {
      clearBannerInset();
      return undefined;
    }

    let cancelled = false;
    let sizeHandle = null;
    let failureHandle = null;

    const prepareBanner = async () => {
      const snapshot = await initializeAdMob();
      console.log('[ADMOB DEBUG] init snapshot=', snapshot);
      if (cancelled) return;
      if (!snapshot.canRequestAds && !isAdMobTestMode) return;
      if (!snapshot.canRequestAds) console.log('[ADMOB DEBUG] canRequestAds false but test mode on — continuing');

      try {
        sizeHandle = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
          if (!cancelled) setBannerInset(info.height);
        });
        failureHandle = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
          if (!cancelled) clearBannerInset();
        });

        if (cancelled) {
          await sizeHandle?.remove().catch(() => {});
          await failureHandle?.remove().catch(() => {});
          return;
        }

        await AdMob.showBanner({
          adId: adUnit('banner'),
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: getBannerMargin(),
          isTesting: isAdMobTestMode,
        });

        if (cancelled) {
          await AdMob.removeBanner().catch(() => {});
        }
      } catch {
        clearBannerInset();
      }
    };

    const handleVisibility = () => {
      if (cancelled) return;
      if (document.hidden) {
        void AdMob.hideBanner().catch(() => {});
      } else {
        void AdMob.resumeBanner().catch(() => {});
      }
    };

    void prepareBanner();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sizeHandle?.remove().catch(() => {});
      void failureHandle?.remove().catch(() => {});
      void AdMob.removeBanner().catch(() => {});
      clearBannerInset();
    };
  }, [shouldShow]);

  useEffect(() => () => clearBannerInset(), []);

  return null;
}
