import { Suspense, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard } from 'lucide-react';
import BrandMark from '../ui/BrandMark';
import LoadingSpinner from '../ui/LoadingSpinner';
import ToastContainer from '../ui/ToastContainer';
import { useAuthStore } from '../../stores/useAuthStore';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return undefined;
    }

    const id = decodeURIComponent(hash.slice(1));
    let attempts = 0;
    let timeout = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempts < 8) {
        attempts += 1;
        timeout = window.setTimeout(scrollToTarget, 80);
      }
    };
    timeout = window.setTimeout(scrollToTarget, 0);
    return () => window.clearTimeout(timeout);
  }, [pathname, hash]);

  return null;
}

export default function PublicLayout() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';

  return (
    <div className="public-shell">
      <ScrollToTop />
      <header className="public-header">
        <div className="public-header__inner">
          <Link to="/advertise" className="public-brand" aria-label="CatatKas - pasang iklan">
            <BrandMark size={34} decorative />
            <span className="public-brand__name">CatatKas</span>
            <span className="public-brand__divider" aria-hidden="true" />
            <span className="public-brand__section">Pasang iklan</span>
          </Link>

          <nav className="public-nav" aria-label="Navigasi halaman iklan">
            <Link to="/advertise#paket" className="public-nav__link">
              Paket
            </Link>
            <Link to="/advertise#cara-kerja" className="public-nav__link">
              Cara kerja
            </Link>
            <Link to="/advertise/order" className="public-nav__link">
              Status pesanan
            </Link>
          </nav>

          <div className="public-header__actions">
            {isAuthenticated ? (
              <Link to="/" className="btn btn--ghost btn--sm">
                <LayoutDashboard size={16} aria-hidden="true" />
                Buka aplikasi
              </Link>
            ) : (
              <>
                <Link to="/login" className="public-header__login">
                  Masuk
                </Link>
                <Link to="/advertise#pasang" className="btn btn--primary btn--sm">
                  Mulai pasang
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="public-main">
        <Suspense fallback={<LoadingSpinner block label="Memuat halaman..." />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          <div className="public-footer__brand">
            <BrandMark size={30} decorative />
            <div>
              <strong>CatatKas</strong>
              <span>Tempat iklan yang menghargai perhatian.</span>
            </div>
          </div>
          <nav className="public-footer__nav" aria-label="Tautan footer">
            <Link to="/advertise">Pasang iklan</Link>
            <Link to="/advertise/order">Status pesanan</Link>
            <Link to="/privacy">Kebijakan privasi</Link>
            <Link to="/login">Masuk</Link>
          </nav>
          <p className="public-footer__note">
            Pembayaran diverifikasi manual oleh admin CatatKas. Tidak ada biaya berlangganan.
          </p>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
