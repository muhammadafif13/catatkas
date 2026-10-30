import { Link } from 'react-router-dom';
import { ChevronRight, Cloud, Download, ShieldCheck, ShieldHalf, Smartphone } from 'lucide-react';
import AdSlot from '../components/ads/AdSlot';
import PageIntro from '../components/ui/PageIntro';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAuthStore } from '../stores/useAuthStore';
import {
  ADMIN_NAV_ITEMS,
  APP_TAGLINE,
  APP_VERSION,
  MORE_NAV_ITEMS,
} from '../utils/constants';
import { getNavIcon } from '../components/layout/navIcons';

const descriptions = {
  '/budget': 'Tetapkan batas pengeluaran per kategori',
  '/accounts': 'Kelola dompet, saldo, dan transfer',
  '/categories': 'Atur kategori pemasukan dan pengeluaran',
  '/export': 'Backup, ekspor CSV, dan impor data',
  '/settings': 'Akun, tema, dan pengelolaan data',
};

const adminDescriptions = {
  '/admin': 'Ringkasan seluruh pengguna',
  '/admin/users': 'Status dan data pengguna',
  '/admin/ads': 'Sponsor dan slot AdSense',
};

export default function MorePage() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const profile = useAuthStore((state) => state.profile);

  return (
    <div className="page">
      <PageIntro
        title="Menu lainnya"
        text="Akses pengaturan, kategori, budget, dan pengelolaan data CatatKas."
      />

      <Link to="/settings" className="account-mini">
        <span className="account-mini__avatar">
          {(profile?.fullName || profile?.email || '?').slice(0, 1).toUpperCase()}
        </span>
        <span className="account-mini__body">
          <strong>{profile?.fullName || 'Pengguna CatatKas'}</strong>
          <small>{profile?.email}</small>
        </span>
        <span className="badge badge--neutral">{profile?.role === 'admin' ? 'Admin' : 'Akun'}</span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>

      <AdSlot placement="more" />

      <section className="card">
        <nav className="more-nav" aria-label="Menu lainnya">
          {MORE_NAV_ITEMS.map((item) => {
            const Icon = getNavIcon(item.icon);
            return (
              <Link key={item.to} to={item.to} className="more-nav__item">
                <span className="more-nav__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="more-nav__body">
                  <span className="more-nav__title">{item.label}</span>
                  <span className="more-nav__description">{descriptions[item.to]}</span>
                </span>
                <ChevronRight className="more-nav__chevron" size={18} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </section>

      {profile?.role === 'admin' ? (
        <section className="card">
          <div className="card__header">
            <div className="card__header-main">
              <h2 className="card__title">Panel admin</h2>
              <p className="card__subtitle">Akses khusus pemilik CatatKas.</p>
            </div>
            <ShieldHalf size={20} className="text-tertiary" aria-hidden="true" />
          </div>
          <nav className="more-nav" aria-label="Menu admin">
            {ADMIN_NAV_ITEMS.filter((item) => item.to !== '/admin/ads').map((item) => {
              const Icon = getNavIcon(item.icon);
              return (
                <Link key={item.to} to={item.to} className="more-nav__item">
                  <span className="more-nav__icon more-nav__icon--admin">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="more-nav__body">
                    <span className="more-nav__title">{item.label}</span>
                    <span className="more-nav__description">{adminDescriptions[item.to]}</span>
                  </span>
                  <ChevronRight className="more-nav__chevron" size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </section>
      ) : null}

      <section className="card">
        <div className="card__header">
          <div className="card__header-main">
            <h2 className="card__title">CatatKas di perangkatmu</h2>
            <p className="card__subtitle">
              Pasang aplikasi agar bisa dibuka lebih cepat dan data tetap bisa dibaca offline.
            </p>
          </div>
          <Smartphone size={20} className="text-tertiary" aria-hidden="true" />
        </div>
        <div className="page-actions">
          <div className="file-meta">
            <Cloud size={15} aria-hidden="true" />
            <span>Data utama tersimpan di cloud dan disalin ke perangkat.</span>
          </div>
          {isInstalled ? (
            <span className="badge badge--success">Sudah terpasang</span>
          ) : canInstall ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={install}>
              <Download aria-hidden="true" />
              Pasang Aplikasi
            </button>
          ) : (
            <span className="badge badge--neutral">Gunakan menu browser</span>
          )}
        </div>
      </section>

      <div className="callout callout--primary">
        <ShieldCheck aria-hidden="true" />
        <span>
          Data keuanganmu terpisah per akun. Saat offline, catatan tetap bisa dibaca, tetapi
          perubahan memerlukan koneksi internet.
        </span>
      </div>

      <p className="text-xs text-tertiary text-center">
        CatatKas v{APP_VERSION} · {APP_TAGLINE}
      </p>
    </div>
  );
}
