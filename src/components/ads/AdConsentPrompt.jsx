import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck } from 'lucide-react';
import { useConsentStore } from '../../stores/useConsentStore';

export default function AdConsentPrompt() {
  const grantAdsense = useConsentStore((state) => state.grantAdsense);
  const denyAdsense = useConsentStore((state) => state.denyAdsense);

  return (
    <section className="ad-consent" aria-label="Persetujuan iklan">
      <span className="ad-consent__icon">
        <Cookie size={21} aria-hidden="true" />
      </span>
      <div className="ad-consent__body">
        <strong>Tampilkan iklan Google?</strong>
        <p>
          Dengan izinmu, Google dapat memakai cookie untuk menampilkan iklan yang relevan. Data
          keuanganmu tidak dibagikan. Baca <Link to="/privacy">Kebijakan Privasi</Link>.
        </p>
        <div className="ad-consent__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={grantAdsense}>
            Izinkan iklan
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={denyAdsense}>
            Hanya sponsor
          </button>
        </div>
      </div>
      <ShieldCheck className="ad-consent__shield" size={18} aria-hidden="true" />
    </section>
  );
}
