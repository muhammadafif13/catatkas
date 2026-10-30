import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'cf-turnstile-script';
let scriptPromise = null;

function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser tidak tersedia.'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
      existing.addEventListener('error', () => reject(new Error('Gagal memuat verifikasi.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Gagal memuat verifikasi.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export default function TurnstileWidget({ siteKey, onToken }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!siteKey) return undefined;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || !turnstile) return;
        widgetRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          language: 'id',
          callback: (token) => {
            setError('');
            onToken(token);
          },
          'expired-callback': () => onToken(''),
          'error-callback': () => {
            setError('Verifikasi keamanan gagal dimuat. Coba muat ulang halaman.');
            onToken('');
          },
        });
      })
      .catch(() => {
        if (!cancelled) setError('Verifikasi keamanan gagal dimuat. Coba muat ulang halaman.');
      });

    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [siteKey, onToken]);

  return (
    <div className="public-turnstile">
      <div ref={containerRef} />
      {error ? (
        <p className="public-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
