import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const DISMISS_KEY = 'catatkas-install-banner-dismissed';

export default function PWAInstallBanner() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!canInstall || isInstalled || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // abaikan bila localStorage tidak tersedia
    }
  };

  return (
    <div className="pwa-banner" role="region" aria-label="Pasang aplikasi">
      <span className="pwa-banner__icon">
        <Download size={18} aria-hidden="true" />
      </span>
      <div className="pwa-banner__content">
        <div className="pwa-banner__title">Pasang CatatKas</div>
        <div className="pwa-banner__text">Buka lebih cepat dan tetap bisa dipakai offline.</div>
      </div>
      <div className="pwa-banner__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={install}>
          Pasang
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={dismiss}
          aria-label="Tutup ajakan memasang aplikasi"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
