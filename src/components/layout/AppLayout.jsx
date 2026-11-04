import { Suspense, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdMobBanner from '../ads/AdMobBanner';
import BottomNav from './BottomNav';
import ConnectionBanner from './ConnectionBanner';
import Header from './Header';
import Sidebar from './Sidebar';
import ConfirmDialog from '../ui/ConfirmDialog';
import LoadingSpinner from '../ui/LoadingSpinner';
import PWAInstallBanner from '../ui/PWAInstallBanner';
import ToastContainer from '../ui/ToastContainer';
import { useAdMobLifecycle } from '../../hooks/useAdMobLifecycle';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

export default function AppLayout() {
  useAdMobLifecycle();

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="page-container">
          <ConnectionBanner />
          <PWAInstallBanner />
          <Suspense fallback={<LoadingSpinner block label="Memuat halaman..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <AdMobBanner />
      <Link to="/add" className="fab" aria-label="Tambah transaksi baru">
        <Plus size={25} aria-hidden="true" />
      </Link>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}
