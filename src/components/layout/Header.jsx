import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { PAGE_TITLES } from '../../utils/constants';
import { todayISO, formatDayDate } from '../../utils/formatDate';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { toast } from '../../stores/useUIStore';
import BrandMark from '../ui/BrandMark';

const subtitles = {
  '/': formatDayDate(todayISO()),
  '/add': 'Catat dalam beberapa detik',
  '/history': 'Semua catatan keuanganmu',
  '/reports': 'Ringkasan dan perbandingan bulanan',
  '/budget': 'Kendalikan pengeluaran per kategori',
  '/accounts': 'Dompet, saldo, dan transfer',
  '/categories': 'Atur kategori pemasukan dan pengeluaran',
  '/settings': 'Preferensi aplikasi dan data',
  '/export': 'Backup, ekspor, dan impor data',
  '/more': 'Semua menu CatatKas',
  '/admin': 'Ringkasan seluruh pengguna dan iklan',
  '/admin/users': 'Status akun dan data pengguna',
  '/admin/ads': 'Sponsor dan slot AdSense',
  '/admin/ads/packages': 'Paket yang tampil di halaman publik',
  '/admin/ads/orders': 'Verifikasi pembayaran dan aktivasi iklan',
  '/admin/ads/payments': 'Rekening, QRIS, dan instruksi',
};

// Halaman tab utama — tidak perlu tombol kembali, tampilkan logo brand sebagai gantinya
const ROOT_PATHS = new Set(['/', '/history', '/reports', '/more']);

function getPageMeta(pathname) {
  if (pathname.startsWith('/transaction/')) {
    const isEdit = pathname.endsWith('/edit');
    return {
      title: isEdit ? 'Edit Transaksi' : 'Detail Transaksi',
      subtitle: isEdit ? 'Perbarui catatan transaksi' : 'Rincian catatan keuangan',
    };
  }
  if (/^\/admin\/users\/[^/]+$/.test(pathname)) {
    return {
      title: 'Detail Pengguna',
      subtitle: 'Tinjauan data keuangan baca-saja',
    };
  }
  return {
    title: PAGE_TITLES[pathname] || (pathname === '/more' ? 'Menu Lainnya' : 'CatatKas'),
    subtitle: subtitles[pathname] || 'Catat keuanganmu, kendalikan hidupmu.',
  };
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const { title, subtitle } = getPageMeta(location.pathname);

  // Tampilkan tombol kembali di semua halaman kecuali tab navigasi utama
  const showBack = !ROOT_PATHS.has(location.pathname);

  const toggleTheme = async () => {
    try {
      await updateSetting('theme', resolvedTheme === 'dark' ? 'light' : 'dark');
    } catch {
      toast.error('Gagal mengubah tema. Coba lagi.');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        {showBack ? (
          <button
            type="button"
            className="topbar__back"
            onClick={() => navigate(-1)}
            aria-label="Kembali ke halaman sebelumnya"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        ) : (
          <Link to="/" className="topbar__brand" aria-label="CatatKas, ke beranda">
            <BrandMark size={38} decorative />
          </Link>
        )}
        <div className="topbar__title-wrap">
          <div className="topbar__title">{title}</div>
          <div className="topbar__subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="topbar__actions">
        <button
          type="button"
          className="topbar__icon-btn"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
          title={resolvedTheme === 'dark' ? 'Tema terang' : 'Tema gelap'}
        >
          {resolvedTheme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
