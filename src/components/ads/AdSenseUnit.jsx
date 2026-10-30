import { useEffect, useRef } from 'react';
import { adsenseClient } from '../../lib/supabase';

let scriptPromise = null;

function loadAdSenseScript(client) {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-catatkas-adsense]');
    if (existing) {
      if (window.adsbygoogle) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.catatkasAdsense = 'true';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Gagal memuat Google AdSense.')), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export default function AdSenseUnit({ slot, format = 'auto' }) {
  const pushedRef = useRef(false);
  const unitRef = useRef(null);

  useEffect(() => {
    if (!adsenseClient || !slot || pushedRef.current) return;

    let cancelled = false;
    loadAdSenseScript(adsenseClient)
      .then(() => {
        if (cancelled || pushedRef.current || !unitRef.current) return;
        pushedRef.current = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // AdSense can reject a placement; never break the page for an ad.
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slot]);

  if (!adsenseClient || !slot) return null;

  return (
    <ins
      ref={unitRef}
      className="adsbygoogle ad-slot__adsense"
      style={{ display: 'block' }}
      data-ad-client={adsenseClient}
      data-ad-slot={slot}
      data-ad-format={format || 'auto'}
      data-full-width-responsive="true"
    />
  );
}
