import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import FormField from '../../components/forms/FormField';
import { useAuthStore } from '../../stores/useAuthStore';
import { getErrorMessage } from '../../utils/helpers';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((state) => state.signIn);
  const [form, setForm] = useState(() => ({
    email: String(location.state?.email || ''),
    password: '',
  }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(form.email, form.password);
      navigate(from, { replace: true });
    } catch (signInError) {
      setError(getErrorMessage(signInError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Selamat datang kembali"
      subtitle="Masuk untuk melanjutkan mencatat keuanganmu."
    >
      {location.state?.notice ? (
        <AuthAlert type="success">{location.state.notice}</AuthAlert>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? <AuthAlert type="error">{error}</AuthAlert> : null}

        <FormField label="Email" htmlFor="login-email">
          <div className="input-wrap">
            <Mail aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              inputMode="email"
              required
              autoFocus={!form.email}
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="login-password">
          <PasswordInput
            id="login-password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            autoFocus={Boolean(form.email)}
          />
        </FormField>

        <div className="auth-form__meta">
          <Link to="/forgot-password" className="auth-link">
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn--primary auth-form__submit-btn"
          disabled={submitting}
        >
          Masuk <ArrowRight aria-hidden="true" />
        </button>

        <p className="auth-switch">
          <span>Belum punya akun?</span> <Link to="/register" className="auth-link">Daftar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}



