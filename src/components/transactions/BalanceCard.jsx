import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function BalanceCard({ total, income, expense, accountCount, monthLabel }) {
  return (
    <section className="balance-card" aria-label="Ringkasan saldo">
      <div className="balance-card__content">
        <div className="balance-card__label">Total Saldo</div>
        <div className="balance-card__amount">{formatCurrency(total)}</div>
        <div className="balance-card__meta">
          <span>{accountCount} akun aktif</span>
          <span className="balance-card__meta-dot" />
          <span>{monthLabel}</span>
        </div>
      </div>
      <div className="balance-card__stats">
        <div className="balance-card__stat">
          <span className="balance-card__stat-icon">
            <ArrowDownLeft aria-hidden="true" />
          </span>
          <div>
            <div className="balance-card__stat-label">Pemasukan</div>
            <div className="balance-card__stat-value">{formatCurrency(income)}</div>
          </div>
        </div>
        <div className="balance-card__stat">
          <span className="balance-card__stat-icon">
            <ArrowUpRight aria-hidden="true" />
          </span>
          <div>
            <div className="balance-card__stat-label">Pengeluaran</div>
            <div className="balance-card__stat-value">{formatCurrency(expense)}</div>
          </div>
        </div>
      </div>
      <span className="sr-only">
        <Wallet aria-hidden="true" />
        Total saldo {formatCurrency(total)}
      </span>
    </section>
  );
}
