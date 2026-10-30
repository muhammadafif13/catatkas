import { Link } from 'react-router-dom';
import { ArrowUpRight, LockKeyhole, ShieldCheck, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import BrandMark from '../ui/BrandMark';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-visual">
        <div className="auth-visual__glow auth-visual__glow--one" aria-hidden="true" />
        <div className="auth-visual__glow auth-visual__glow--two" aria-hidden="true" />

        <Link to="/" className="auth-visual__brand">
          <BrandMark size={40} decorative />
          <span>CatatKas</span>
        </Link>

        <div className="auth-visual__copy">
          <span className="auth-visual__eyebrow">KEUANGAN YANG LEBIH TENANG</span>
          <h1 className="auth-visual__title">
            Uangmu punya cerita.
            <br />
            <span>Ayo catat dengan jelas.</span>
          </h1>
          <p className="auth-visual__text">
            Satu tempat untuk mencatat pengeluaran, menjaga budget, dan melihat ke mana uangmu
            pergi — dari perangkat mana pun.
          </p>
        </div>

        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview__head">
            <div>
              <span className="auth-preview__label">Total saldo</span>
              <div className="auth-preview__amount">Rp 12.480.000</div>
            </div>
            <span className="auth-preview__icon">
              <Wallet size={22} />
            </span>
          </div>
          <div className="auth-preview__rows">
            <div className="auth-preview__row">
              <span className="auth-preview__row-icon auth-preview__row-icon--income">
                <TrendingUp size={15} />
              </span>
              <div>
                <span>Pemasukan</span>
                <strong>Rp 8.200.000</strong>
              </div>
              <ArrowUpRight size={15} />
            </div>
            <div className="auth-preview__row">
              <span className="auth-preview__row-icon auth-preview__row-icon--expense">
                <TrendingDown size={15} />
              </span>
              <div>
                <span>Pengeluaran</span>
                <strong>Rp 3.950.000</strong>
              </div>
              <span className="auth-preview__badge">62%</span>
            </div>
          </div>
        </div>

        <div className="auth-visual__trust">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Data keuanganmu terpisah dan hanya bisa diakses akunmu.</span>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card__head">
            <span className="auth-card__kicker">AKUN CATATKAS</span>
            <h2 className="auth-card__title">{title}</h2>
            <p className="auth-card__subtitle">{subtitle}</p>
          </div>
          {children}
        </div>

        <div className="auth-privacy">
          <LockKeyhole size={14} aria-hidden="true" />
          <span>
            Dengan melanjutkan, kamu menyetujui{' '}
            <Link to="/privacy">Kebijakan Privasi</Link> CatatKas.
          </span>
        </div>
      </main>
    </div>
  );
}
