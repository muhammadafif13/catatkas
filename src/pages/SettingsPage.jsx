import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Cloud,
  Cookie,
  Download,
  HardDrive,
  Info,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  ShieldHalf,
  Sun,
  Wallet,
} from 'lucide-react';
import ProgressBar from '../components/ui/ProgressBar';
import { useAdFreeActive } from '../hooks/useAdFreeActive';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStorageEstimate } from '../hooks/useStorageEstimate';
import { clearAllData, restoreDatabaseSnapshot } from '../db/backup';
import { getLegacySnapshot, hasLegacyData } from '../db/legacy';
import { isAdMobSupported } from '../services/admob';
import { adsenseClient } from '../lib/supabase';
import { useAccountStore } from '../stores/useAccountStore';
import { useAdMobStore } from '../stores/useAdMobStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useConsentStore } from '../stores/useConsentStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { toast, useUIStore } from '../stores/useUIStore';
import { refreshDataStores } from '../services/sync';
import { APP_NAME, APP_TAGLINE, APP_VERSION, THEME_OPTIONS } from '../utils/constants';
import { formatFileSize, getErrorMessage } from '../utils/helpers';

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LEGACY_IMPORTED_KEY = 'catatkas.legacyImported.v2';

function initials(name, email) {
  const source = String(name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const profile = useAuthStore((state) => state.profile);
  const accountList = useAccountStore((state) => state.accounts);
  const signOut = useAuthStore((state) => state.signOut);
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const adsenseConsent = useConsentStore((state) => state.adsenseConsent);
  const grantAdsense = useConsentStore((state) => state.grantAdsense);
  const denyAdsense = useConsentStore((state) => state.denyAdsense);
  const resetAdsenseConsent = useConsentStore((state) => state.resetAdsenseConsent);
  const adMobStatus = useAdMobStore((state) => state.status);
  const adMobCanRequestAds = useAdMobStore((state) => state.canRequestAds);
  const openAdMobPrivacyOptions = useAdMobStore((state) => state.openPrivacyOptions);
  const adMobAdFree = useAdFreeActive();
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const { canInstall, isInstalled, install } = usePWAInstall();
  const storage = useStorageEstimate();
  const [threshold, setThreshold] = useState(settings.budgetAlertThreshold);
  const [resetting, setResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  const [importingLegacy, setImportingLegacy] = useState(false);
  const [openingPrivacy, setOpeningPrivacy] = useState(false);

  useEffect(() => {
    setThreshold(settings.budgetAlertThreshold);
  }, [settings.budgetAlertThreshold]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    if (window.localStorage.getItem(LEGACY_IMPORTED_KEY) === 'true') return;
    void hasLegacyData().then(setLegacyAvailable);
  }, [profile?.role]);

  const changeSetting = async (key, value) => {
    try {
      await updateSetting(key, value);
      toast.success('Pengaturan disimpan.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const commitThreshold = async () => {
    if (Number(threshold) !== Number(settings.budgetAlertThreshold)) {
      await changeSetting('budgetAlertThreshold', Number(threshold));
    }
  };

  const handleReset = async () => {
    const confirmed = await requestConfirm({
      title: 'Hapus semua data akun?',
      message:
        'Seluruh transaksi, akun, kategori, budget, dan transfer di server akan dihapus lalu diganti dengan data awal. Tindakan ini tidak bisa dibatalkan.',
      confirmLabel: 'Hapus dan Reset',
      danger: true,
    });
    if (!confirmed) return;

    setResetting(true);
    try {
      await clearAllData();
      await refreshDataStores();
      toast.success('Data akun berhasil direset ke kondisi awal.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    const confirmed = await requestConfirm({
      title: 'Keluar dari akun?',
      message:
        'Data di perangkat ini akan dibersihkan. Kamu bisa masuk lagi kapan saja dengan email dan password yang sama.',
      confirmLabel: 'Keluar',
      danger: true,
    });
    if (!confirmed) return;

    setSigningOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    setSendingReset(true);
    try {
      await requestPasswordReset(profile.email);
      toast.success('Tautan ubah password sudah dikirim ke email akunmu.', 4500);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSendingReset(false);
    }
  };

  const handleLegacyImport = async () => {
    const confirmed = await requestConfirm({
      title: 'Impor data CatatKas v1?',
      message:
        'Data lokal v1 akan menggantikan seluruh data akun ini di server. Buat backup akun saat ini terlebih dahulu jika masih dibutuhkan.',
      confirmLabel: 'Impor Data',
      danger: true,
    });
    if (!confirmed) return;

    setImportingLegacy(true);
    try {
      const snapshot = await getLegacySnapshot();
      if (!snapshot) throw new Error('Data CatatKas v1 tidak ditemukan.');
      await restoreDatabaseSnapshot(snapshot);
      await refreshDataStores();
      window.localStorage.setItem(LEGACY_IMPORTED_KEY, 'true');
      setLegacyAvailable(false);
      toast.success('Data CatatKas v1 berhasil diimpor ke akun ini.', 4500);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImportingLegacy(false);
    }
  };

  const handleOpenPrivacyOptions = async () => {
    if (!isAdMobSupported) return;
    setOpeningPrivacy(true);
    try {
      const snapshot = await openAdMobPrivacyOptions();
      if (snapshot.canRequestAds) {
        toast.success('Preferensi iklan diperbarui.');
      } else {
        toast.info('Iklan Google dinonaktifkan sesuai pilihanmu.');
      }
    } catch (error) {
      console.warn('Unable to open AdMob privacy options:', error);
      toast.error('Preferensi iklan belum tersedia. Coba lagi nanti.');
    } finally {
      setOpeningPrivacy(false);
    }
  };

  const usagePercent =
    storage.usage && storage.quota ? (Number(storage.usage) / Number(storage.quota)) * 100 : 0;

  return (
    <div className="page settings-page">
      <section className="settings-section account-panel">
        <div className="account-panel__identity">
          <span className="account-panel__avatar">{initials(profile?.fullName, profile?.email)}</span>
          <div>
            <div className="account-panel__name">{profile?.fullName || 'Pengguna CatatKas'}</div>
            <div className="account-panel__email">{profile?.email}</div>
            <div className="account-panel__badges">
              <span className={`badge ${profile?.role === 'admin' ? 'badge--primary' : 'badge--neutral'}`}>
                {profile?.role === 'admin' ? 'Admin pemilik' : 'Pengguna'}
              </span>
              <span className="badge badge--success">Aktif</span>
            </div>
          </div>
        </div>
        <div className="account-panel__actions">
          {profile?.role === 'admin' ? (
            <Link to="/admin" className="btn btn--soft btn--sm">
              <ShieldHalf aria-hidden="true" />
              Panel admin
            </Link>
          ) : null}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handlePasswordReset}
            disabled={sendingReset}
          >
            <KeyRound aria-hidden="true" />
            {sendingReset ? 'Mengirim…' : 'Ubah password'}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut aria-hidden="true" />
            {signingOut ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Palette aria-hidden="true" />
            Tampilan
          </h2>
          <p className="settings-section__description">
            Pilih tema yang paling nyaman untuk matamu.
          </p>
        </div>
        <div className="theme-grid">
          {THEME_OPTIONS.map((option) => {
            const Icon = themeIcons[option.value] || Monitor;
            return (
              <button
                key={option.value}
                type="button"
                className={`theme-option${settings.theme === option.value ? ' is-selected' : ''}`}
                onClick={() => changeSetting('theme', option.value)}
                aria-pressed={settings.theme === option.value}
              >
                <Icon aria-hidden="true" />
                <span className="theme-option__label">{option.label}</span>
                <span className="theme-option__description">{option.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Wallet aria-hidden="true" />
            Akun & transaksi
          </h2>
          <p className="settings-section__description">
            Atur akun yang dipakai lebih dulu saat mencatat transaksi.
          </p>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row__label">Akun default</div>
            <div className="setting-row__description">
              Langsung terpilih pada form transaksi baru.
            </div>
          </div>
          <div className="setting-row__control">
            <select
              className="select"
              aria-label="Akun default"
              value={settings.defaultAccountId || ''}
              onChange={(event) =>
                changeSetting(
                  'defaultAccountId',
                  event.target.value ? Number(event.target.value) : null,
                )
              }
            >
              <option value="">Pilih otomatis</option>
              {accountList
                .filter((account) => account.isActive !== false)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.icon} {account.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Bell aria-hidden="true" />
            Peringatan budget
          </h2>
          <p className="settings-section__description">
            Tampilkan peringatan saat realisasi budget melewati ambang ini.
          </p>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row__label">Ambang peringatan</div>
            <div className="setting-row__description">
              Peringatan muncul setelah persentase pemakaian budget melewati nilai ini.
            </div>
          </div>
          <div className="setting-row__control" style={{ width: '100%', maxWidth: 280 }}>
            <div className="range-row">
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                onMouseUp={commitThreshold}
                onTouchEnd={commitThreshold}
                onKeyUp={commitThreshold}
                aria-label="Ambang peringatan budget"
              />
              <span className="range-value">{threshold}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Cloud aria-hidden="true" />
            Penyimpanan cloud
          </h2>
          <p className="settings-section__description">
            Data utama tersimpan di server dan disalin ke perangkat untuk dibaca saat offline.
          </p>
        </div>
        <div className="setting-row">
          <div className="storage-meter">
            <div className="storage-meter__meta">
              <span>{storage.supported ? 'Cache lokal perangkat' : 'Estimasi tidak tersedia'}</span>
              <span>
                {storage.supported && storage.usage !== null
                  ? `${formatFileSize(storage.usage)} dari ${formatFileSize(storage.quota)}`
                  : 'Browser tidak mendukung estimasi'}
              </span>
            </div>
            {storage.supported ? <ProgressBar value={usagePercent} size="sm" /> : null}
          </div>
        </div>
        <Link to="/export" className="settings-list-link">
          <span>
            <Download size={17} aria-hidden="true" />
            Ekspor, backup, dan pulihkan data
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
      </section>

      {legacyAvailable ? (
        <section className="settings-section legacy-import">
          <div className="settings-section__header">
            <h2 className="settings-section__title">
              <HardDrive aria-hidden="true" />
              Data CatatKas v1
            </h2>
            <p className="settings-section__description">
              Data lokal dari versi lama terdeteksi di perangkat ini.
            </p>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-row__label">Impor ke akun admin</div>
              <div className="setting-row__description">
                Data lokal v1 akan menggantikan data akun ini. Ekspor backup akun saat ini lebih
                dulu.
              </div>
            </div>
            <div className="setting-row__control">
              <button
                type="button"
                className="btn btn--soft btn--sm"
                onClick={handleLegacyImport}
                disabled={importingLegacy}
              >
                <Download aria-hidden="true" />
                {importingLegacy ? 'Mengimpor…' : 'Impor Data v1'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Cookie aria-hidden="true" />
            Iklan & privasi
          </h2>
          <p className="settings-section__description">
            {isAdMobSupported
              ? 'CatatKas memakai Google AdMob di aplikasi Android. Iklan Google hanya dimuat setelah preferensi yang diperlukan tersedia.'
              : 'Iklan sponsor tetap tampil tanpa cookie. Google AdSense hanya dimuat setelah kamu memberi izin.'}
          </p>
        </div>

        {isAdMobSupported ? (
          <div className="setting-row">
            <div>
              <div className="setting-row__label">Izin iklan Google AdMob</div>
              <div className="setting-row__description">
                {adMobStatus === 'initializing'
                  ? 'Memeriksa preferensi iklan…'
                  : adMobCanRequestAds
                    ? 'Iklan Google diizinkan. Kamu dapat mengubah pilihan kapan saja.'
                    : 'Iklan Google belum diizinkan. Iklan sponsor tetap dapat tampil.'}
                {adMobAdFree ? ' Bebas iklan Google sedang aktif.' : ''}
              </div>
            </div>
            <div className="setting-row__control">
              <button
                type="button"
                className="btn btn--soft btn--sm"
                onClick={handleOpenPrivacyOptions}
                disabled={openingPrivacy || adMobStatus === 'initializing'}
              >
                {openingPrivacy ? 'Membuka…' : 'Kelola preferensi iklan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="setting-row">
            <div>
              <div className="setting-row__label">Izin iklan Google</div>
              <div className="setting-row__description">
                {!adsenseClient
                  ? 'AdSense belum dikonfigurasi untuk aplikasi ini.'
                  : adsenseConsent === 'granted'
                    ? 'Diizinkan. Google dapat memakai cookie untuk menampilkan iklan yang relevan.'
                    : adsenseConsent === 'denied'
                      ? 'Hanya iklan sponsor. Iklan Google tidak dimuat.'
                      : 'Belum dipilih. Kamu akan ditanya saat slot AdSense tersedia.'}
              </div>
            </div>
            <div className="setting-row__control">
              <div className="settings-inline-actions">
                {adsenseConsent === 'granted' ? (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={denyAdsense}>
                    Batalkan izin
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={grantAdsense}
                    disabled={!adsenseClient}
                  >
                    Izinkan AdSense
                  </button>
                )}
                {adsenseConsent ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={resetAdsenseConsent}
                  >
                    Atur ulang
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Download aria-hidden="true" />
            Pasang aplikasi
          </h2>
          <p className="settings-section__description">
            Gunakan CatatKas seperti aplikasi native. Data tetap bisa dibaca saat offline.
          </p>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row__label">
              {isInstalled ? 'Sudah terpasang' : 'Install di perangkat ini'}
            </div>
            <div className="setting-row__description">
              {isInstalled
                ? 'CatatKas berjalan dalam mode standalone.'
                : canInstall
                  ? 'Tambahkan ikon CatatKas ke layar utama.'
                  : 'Gunakan menu browser “Install app” atau “Tambahkan ke layar utama”.'}
            </div>
          </div>
          <div className="setting-row__control">
            {isInstalled ? (
              <span className="badge badge--success">Aktif</span>
            ) : canInstall ? (
              <button type="button" className="btn btn--primary btn--sm" onClick={install}>
                <Download aria-hidden="true" />
                Pasang
              </button>
            ) : (
              <span className="badge badge--neutral">Lewat browser</span>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <Info aria-hidden="true" />
            Tentang
          </h2>
        </div>
        <div className="about-row">
          <span>{APP_NAME}</span>
          <span className="about-version">Versi {APP_VERSION}</span>
        </div>
        <p className="setting-row__description">{APP_TAGLINE}</p>
        <Link to="/privacy" className="settings-list-link">
          <span>
            <ShieldCheck size={17} aria-hidden="true" />
            Kebijakan Privasi
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
        <div className="callout callout--primary">
          <ShieldCheck aria-hidden="true" />
          <span>
            Data keuanganmu dipisahkan per akun. Admin pemilik dapat meninjau data untuk keperluan
            operasional dan dukungan.
          </span>
        </div>
      </section>

      <section className="settings-section danger-zone">
        <div className="settings-section__header">
          <h2 className="settings-section__title">
            <AlertTriangle aria-hidden="true" />
            Zona berbahaya
          </h2>
          <p className="settings-section__description">
            Tindakan di bawah ini menghapus data akunmu di server dan cache lokal.
          </p>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-row__label">Reset data akun</div>
            <div className="setting-row__description">
              Hapus semua catatan dan mulai dari data awal. Buat backup terlebih dahulu.
            </div>
          </div>
          <div className="setting-row__control">
            <button
              type="button"
              className="btn btn--danger-soft btn--sm"
              onClick={handleReset}
              disabled={resetting}
            >
              <AlertTriangle aria-hidden="true" />
              {resetting ? 'Mereset…' : 'Hapus Semua Data'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
