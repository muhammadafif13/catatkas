import { useEffect, useState } from 'react';
import { Clock3, Gift, PlayCircle, ShieldCheck } from 'lucide-react';
import { useAdFreeActive } from '../../hooks/useAdFreeActive';
import {
  prepareRewarded,
  prepareRewardedInterstitial,
  showRewarded,
  showRewardedInterstitial,
} from '../../services/admob';
import { useAdMobStore } from '../../stores/useAdMobStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../stores/useUIStore';

function formatUntil(value) {
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdMobRewardCard() {
  const supported = useAdMobStore((state) => state.supported);
  const canRequestAds = useAdMobStore((state) => state.canRequestAds);
  const adFreeUntil = useAdMobStore((state) => state.adFreeUntil);
  const grantAdFree = useAdMobStore((state) => state.grantAdFree);
  const profile = useAuthStore((state) => state.profile);
  const adFree = useAdFreeActive();
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!supported || !canRequestAds) return;
    void prepareRewarded().catch(() => {});
    void prepareRewardedInterstitial().catch(() => {});
  }, [supported, canRequestAds]);

  if (!supported || profile?.role === 'admin') return null;

  const remainingHours = Math.max(0, Math.ceil((adFreeUntil - Date.now()) / 3_600_000));

  const watch = async (format) => {
    if (busy) return;
    setBusy(format);
    try {
      if (format === 'rewarded') {
        await showRewarded();
        grantAdFree(24);
        toast.success('Iklan Google nonaktif selama 24 jam. Terima kasih!');
      } else {
        await showRewardedInterstitial();
        grantAdFree(48);
        toast.success('Iklan Google nonaktif selama 48 jam. Terima kasih!');
      }
    } catch {
      toast.error('Iklan belum tersedia. Coba lagi beberapa saat.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card admob-reward" aria-label="Dukung CatatKas">
      <div className="card__header">
        <div className="card__header-main">
          <h2 className="card__title">
            <Gift size={19} aria-hidden="true" />
            Dukung CatatKas
          </h2>
          <p className="card__subtitle">
            Tonton iklan singkat untuk menonaktifkan iklan Google sementara. Iklan sponsor tetap
            tampil.
          </p>
        </div>
        <ShieldCheck size={20} className="text-tertiary" aria-hidden="true" />
      </div>

      {adFree ? (
        <div className="admob-reward__status" role="status">
          <Clock3 size={16} aria-hidden="true" />
          <span>
            Bebas iklan Google aktif · sisa sekitar {remainingHours} jam
            <small>Berakhir {formatUntil(adFreeUntil)}</small>
          </span>
        </div>
      ) : (
        <div className="admob-reward__status admob-reward__status--muted" role="status">
          <Clock3 size={16} aria-hidden="true" />
          <span>Iklan Google sedang aktif di aplikasi.</span>
        </div>
      )}

      <div className="admob-reward__actions">
        <button
          type="button"
          className="btn btn--soft btn--sm"
          onClick={() => watch('rewarded')}
          disabled={Boolean(busy) || !canRequestAds}
        >
          <PlayCircle aria-hidden="true" />
          {busy === 'rewarded' ? 'Menyiapkan…' : 'Tonton iklan · 24 jam'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => watch('rewardedInterstitial')}
          disabled={Boolean(busy) || !canRequestAds}
        >
          <PlayCircle aria-hidden="true" />
          {busy === 'rewardedInterstitial' ? 'Menyiapkan…' : 'Video panjang · 48 jam'}
        </button>
      </div>

      {!canRequestAds ? (
        <p className="admob-reward__note">
          Iklan Google belum diizinkan. Atur preferensi iklan di Pengaturan.
        </p>
      ) : null}
    </section>
  );
}
