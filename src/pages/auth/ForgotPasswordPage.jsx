import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Lupa password?"
      subtitle="Password akun hanya bisa diatur ulang oleh admin CatatKas."
    >
      <div className="auth-state">
        <span className="auth-state__icon">
          <KeyRound size={28} aria-hidden="true" />
        </span>
        <p>
          Akun CatatKas memakai <strong>username</strong> sebagai identitas masuk. Jika kamu lupa
          password, hubungi admin CatatKas dengan menyertakan username akunmu untuk mendapat
          bantuan mengatur ulang password.
        </p>
        <Link to="/login" className="btn btn--primary btn--block">
          <ArrowLeft aria-hidden="true" />
          Kembali ke halaman masuk
        </Link>
      </div>
    </AuthLayout>
  );
}
