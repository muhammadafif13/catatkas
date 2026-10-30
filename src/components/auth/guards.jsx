import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldOff } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuthStore } from '../../stores/useAuthStore';

export function RequireAuth() {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const location = useLocation();

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'suspended') {
    return (
      <AuthLayout
        title="Akun ditangguhkan"
        subtitle="Akses ke data CatatKas untuk akun ini sedang dibatasi oleh admin."
      >
        <div className="auth-state">
          <span className="auth-state__icon auth-state__icon--danger">
            <ShieldOff size={28} aria-hidden="true" />
          </span>
          <p>
            Akun <strong>{profile?.email}</strong> tidak dapat membuka data saat ini. Hubungi admin
            jika kamu merasa ini keliru.
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={signOut}>
            Keluar dari akun
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return <Outlet />;
}

export function PublicOnly({ children }) {
  const status = useAuthStore((state) => state.status);
  if (status === 'authenticated' || status === 'suspended') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AdminGuard() {
  const profile = useAuthStore((state) => state.profile);
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
