import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, ShieldAlert } from 'lucide-react';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import FormField from '../../components/forms/FormField';
import { useAuthStore } from '../../stores/useAuthStore';
import { getErrorMessage } from '../../utils/helpers';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const signOut = useAuthStore((state) => state.signOut);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password belum sama.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      await signOut();
      navigate('/login', {
        replace: true,
        state: { notice: 'Password berhasil diperbarui. Silakan masuk dengan password baru.' },
      });
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== 'authenticated') {
    return (
      <AuthLayout
        title="Tautan tidak valid"
        subtitle="Tautan reset password sudah kedaluwarsa atau pernah dipakai."
      >
        <div className="auth-state">
          <span className="auth-state__icon auth-state__icon--danger">
            <ShieldAlert size={28} aria-hidden="true" />
          </span>
          <p>Minta tautan baru untuk membuat password yang baru.</p>
          <Link to="/forgot-password" className="btn btn--primary btn--block">
            Minta tautan baru
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Buat password baru"
      subtitle="Gunakan minimal 8 karakter dan jangan pakai password yang sama di layanan lain."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? <AuthAlert type="error">{error}</AuthAlert> : null}

        <FormField label="Password baru" htmlFor="reset-password">
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            autoFocus
          />
        </FormField>

        <FormField label="Ulangi password baru" htmlFor="reset-confirm">
          <PasswordInput
            id="reset-confirm"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </FormField>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? 'Menyimpan…' : 'Simpan password baru'}
          {!submitting ? <KeyRound aria-hidden="true" /> : null}
        </button>
      </form>
    </AuthLayout>
  );
}
