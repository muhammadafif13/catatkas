import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Megaphone, Sparkles } from 'lucide-react';
import AdConsentPrompt from './AdConsentPrompt';
import AdMobNative from './AdMobNative';
import AdSenseUnit from './AdSenseUnit';
import { getAdImageUrl, recordAdEvent } from '../../db/ads';
import { useAdFreeActive } from '../../hooks/useAdFreeActive';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { isAdMobNativeEnabled, isAdMobSupported } from '../../services/admob';
import { useAdStore } from '../../stores/useAdStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useConsentStore } from '../../stores/useConsentStore';

const IMPRESSION_KEY = 'catatkas.adImpressions.v1';
const ROTATION_KEY = 'catatkas.adRotation.v1';

function nextSponsorIndex(placement, count) {
  if (!count) return 0;
  try {
    const key = `${ROTATION_KEY}:${placement}`;
    const current = Number(window.sessionStorage.getItem(key)) || 0;
    window.sessionStorage.setItem(key, String(current + 1));
    return current % count;
  } catch {
    return 0;
  }
}

function hasSeenImpression(adId) {
  try {
    const seen = JSON.parse(window.sessionStorage.getItem(IMPRESSION_KEY) || '[]');
    return Array.isArray(seen) && seen.includes(String(adId));
  } catch {
    return false;
  }
}

function markImpression(adId) {
  try {
    const seen = JSON.parse(window.sessionStorage.getItem(IMPRESSION_KEY) || '[]');
    const next = [...new Set([...(Array.isArray(seen) ? seen : []), String(adId)])];
    window.sessionStorage.setItem(IMPRESSION_KEY, JSON.stringify(next));
  } catch {
    // Impression de-duplication is best-effort.
  }
}

function trackImpression(ad) {
  if (!ad?.id || hasSeenImpression(ad.id)) return;
  markImpression(ad.id);
  void recordAdEvent(ad.id, 'impression').catch(() => {});
}

function SponsorAd({ ad }) {
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) trackImpression(ad);
  }, [ad, online]);

  const handleClick = () => {
    if (online) void recordAdEvent(ad.id, 'click').catch(() => {});
  };

  const imageUrl = ad.imagePath ? getAdImageUrl(ad.imagePath) : '';

  return (
    <article className="ad-card">
      <div className="ad-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="ad-card__placeholder">
            <Megaphone size={28} aria-hidden="true" />
          </span>
        )}
        <span className="ad-card__label">
          <Sparkles size={12} aria-hidden="true" />
          Sponsor
        </span>
      </div>
      <div className="ad-card__body">
        <div>
          <h3 className="ad-card__title">{ad.title}</h3>
          {ad.body ? <p className="ad-card__text">{ad.body}</p> : null}
        </div>
        <a
          className="ad-card__cta"
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
        >
          {ad.ctaLabel || 'Pelajari'}
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export default function AdSlot({ placement, allowConsentPrompt = false, className = '' }) {
  const online = useOnlineStatus();
  const ads = useAdStore((state) => state.ads);
  const profile = useAuthStore((state) => state.profile);
  const adFree = useAdFreeActive();
  const consent = useConsentStore((state) => state.adsenseConsent);
  const sponsors = useMemo(
    () => ads.filter((ad) => ad.placement === placement && ad.provider === 'sponsor'),
    [ads, placement],
  );
  const adsense = useMemo(
    () => ads.find((ad) => ad.placement === placement && ad.provider === 'adsense'),
    [ads, placement],
  );
  const [rotationIndex, setRotationIndex] = useState(0);

  useEffect(() => {
    if (!sponsors.length) {
      setRotationIndex(0);
      return;
    }
    setRotationIndex(nextSponsorIndex(placement, sponsors.length));
  }, [placement, sponsors.length]);

  if (!online) return null;
  if (profile?.role === 'admin') return null;

  const sponsor = sponsors.length ? sponsors[rotationIndex % sponsors.length] : null;

  // Paid sponsors always take precedence over Google inventory in the same slot.
  if (sponsor) {
    return (
      <section className={`ad-slot ${className}`.trim()} aria-label="Iklan sponsor">
        <SponsorAd ad={sponsor} />
      </section>
    );
  }

  // AdMob is the correct Google inventory for the native Android app. AdSense
  // remains available for the web/PWA build only.
  if (isAdMobSupported) {
    if (adFree || !isAdMobNativeEnabled) return null;
    return <AdMobNative placement={placement} className={className} />;
  }

  if (adsense && consent === 'granted') {
    return (
      <section className={`ad-slot ${className}`.trim()} aria-label="Iklan">
        <div className="ad-slot__head">
          <span>Iklan</span>
          <span>Google AdSense</span>
        </div>
        <AdSenseUnit slot={adsense.adsenseSlot} format={adsense.adsenseFormat} />
      </section>
    );
  }

  if (adsense && allowConsentPrompt && consent === null) {
    return (
      <div className={className}>
        <AdConsentPrompt />
      </div>
    );
  }

  return null;
}
