import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthLayout from '../../components/auth/AuthLayout';
import FormField from '../../components/forms/FormField';
import { useAuthStore } from '../../stores/useAuthStore';
import { getErrorMessage } from '../../utils/helpers';

export default function ForgotPasswordPage() {
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Atur ulang password"
      subtitle="Masukkan email akunmu, kami akan mengirim tautan untuk membuat password baru."
    >
      {sent ? (
        <div className="auth-state">
          <span className="auth-state__icon">
            <Mail size={28} aria-hidden="true" />
          </span>
          <p>
            Jika <strong>{email}</strong> terdaftar, tautan reset password sudah dikirim. Tautan
            berlaku selama 60 menit.
          </p>
          <Link to="/login" className="btn btn--primary btn--block">
            <ArrowLeft aria-hidden="true" />
            Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? <AuthAlert type="error">{error}</AuthAlert> : null}
          <FormField label="Email" htmlFor="forgot-email">
            <div className="input-wrap">
              <Mail aria-hidden="true" />
              <input
                id="forgot-email"
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                inputMode="email"
                required
                autoFocus
              />
            </div>
          </FormField>
          <button
            type="submit"
            className="btn btn--primary btn--block btn--lg"
            disabled={submitting}
          >
            {submitting ? 'Mengirim…' : 'Kirim tautan reset'}
            {!submitting ? <Send aria-hidden="true" /> : null}
          </button>
        </form>
      )}

      {!sent ? (
        <p className="auth-switch">
          Ingat password? <Link to="/login">Masuk</Link>
        </p>
      ) : null}
    </AuthLayout>
  );
}
