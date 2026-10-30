import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, UserRound } from 'lucide-react';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import FormField from '../../components/forms/FormField';
import { useAuthStore } from '../../stores/useAuthStore';
import { getErrorMessage } from '../../utils/helpers';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Nama minimal 2 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Masukkan alamat email yang valid.';
    }
    if (form.password.length < 8) next.password = 'Password minimal 8 karakter.';
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Konfirmasi password belum sama.';
    }
    if (!form.terms) next.terms = 'Centang persetujuan untuk melanjutkan.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await signUp({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });

      navigate('/login', {
        replace: true,
        state: {
          notice: 'Akun berhasil dibuat. Silakan masuk dengan email dan password kamu.',
          email: result.email,
        },
      });
    } catch (signUpError) {
      setError(getErrorMessage(signUpError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Buat akun CatatKas"
      subtitle="Mulai perjalanan keuangan yang lebih rapi, gratis."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? <AuthAlert type="error">{error}</AuthAlert> : null}

        <FormField label="Nama lengkap" htmlFor="register-name" error={errors.fullName}>
          <div className="input-wrap">
            <UserRound aria-hidden="true" />
            <input
              id="register-name"
              type="text"
              className="input"
              value={form.fullName}
              onChange={(event) => update('fullName', event.target.value)}
              placeholder="Nama kamu"
              autoComplete="name"
              required
              autoFocus
            />
          </div>
        </FormField>

        <FormField label="Email" htmlFor="register-email" error={errors.email}>
          <div className="input-wrap">
            <Mail aria-hidden="true" />
            <input
              id="register-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>
        </FormField>

        <FormField
          label="Password"
          htmlFor="register-password"
          error={errors.password}
          hint="Minimal 8 karakter."
        >
          <PasswordInput
            id="register-password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            autoComplete="new-password"
          />
        </FormField>

        <FormField
          label="Ulangi password"
          htmlFor="register-confirm"
          error={errors.confirmPassword}
        >
          <PasswordInput
            id="register-confirm"
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            autoComplete="new-password"
          />
        </FormField>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(event) => update('terms', event.target.checked)}
          />
          <span>
            Saya setuju dengan <Link to="/privacy">Kebijakan Privasi</Link> dan penggunaan data
            untuk menjalankan akun CatatKas.
          </span>
        </label>
        {errors.terms ? (
          <div className="field__error" role="alert">
            {errors.terms}
          </div>
        ) : null}

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? 'Membuat akun…' : 'Daftar'}
          {!submitting ? <ArrowRight aria-hidden="true" /> : null}
        </button>
      </form>

      <p className="auth-switch">
        Sudah punya akun? <Link to="/login">Masuk</Link>
      </p>
    </AuthLayout>
  );
}
