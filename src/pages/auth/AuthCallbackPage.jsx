import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const callbackError =
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error');

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/', { replace: true });
    }
  }, [status, navigate]);

  if (status === 'authenticated') {
    return (
      <div className="splash-screen">
        <LoadingSpinner label="Membuka CatatKas…" />
      </div>
    );
  }

  if (callbackError || status === 'auth_error' || status === 'unauthenticated') {
    return (
      <AuthLayout
        title="Verifikasi gagal"
        subtitle="Tautan mungkin sudah kedaluwarsa atau sudah pernah digunakan."
      >
        <div className="auth-state">
          <span className="auth-state__icon auth-state__icon--danger">
            <AlertTriangle size={28} aria-hidden="true" />
          </span>
          <p>{callbackError || error || 'Sesi verifikasi tidak dapat dibuka.'}</p>
          <Link to="/login" className="btn btn--primary btn--block">
            Kembali ke halaman masuk
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <div className="splash-screen">
      <LoadingSpinner block label="Memverifikasi akun…" />
    </div>
  );
}
