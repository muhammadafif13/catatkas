import { useMemo, useState } from 'react';
import { Pencil, Plus, Target, Trash2 } from 'lucide-react';
import BudgetFormModal from '../components/forms/BudgetFormModal';
import MonthSwitcher from '../components/ui/MonthSwitcher';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { useBudgetProgress } from '../hooks/useBudgetProgress';
import { useBudgetStore } from '../stores/useBudgetStore';
import { toast, useUIStore } from '../stores/useUIStore';
import { formatCurrency, formatPercentage } from '../utils/formatCurrency';
import { getCurrentPeriod } from '../utils/formatDate';
import { getErrorMessage, hexToRgba } from '../utils/helpers';

const statusMeta = {
  safe: { label: 'Aman', className: 'badge--success' },
  warning: { label: 'Mendekati batas', className: 'badge--warning' },
  danger: { label: 'Hampir habis', className: 'badge--danger' },
  over: { label: 'Melebihi budget', className: 'badge--danger' },
};

export default function BudgetPage() {
  const [period, setPeriod] = useState(getCurrentPeriod());
  const budgets = useBudgetProgress(period);
  const removeBudget = useBudgetStore((state) => state.deleteBudget);
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [modal, setModal] = useState({ open: false, budget: null });

  const totals = useMemo(
    () =>
      budgets.reduce(
        (result, item) => ({
          amount: result.amount + (Number(item.amount) || 0),
          spent: result.spent + (Number(item.spent) || 0),
          overCount: result.overCount + (item.isOverBudget ? 1 : 0),
        }),
        { amount: 0, spent: 0, overCount: 0 },
      ),
    [budgets],
  );
  const totalPercentage = totals.amount > 0 ? (totals.spent / totals.amount) * 100 : 0;
  const totalStatus =
    totalPercentage > 100 ? 'over' : totalPercentage >= 80 ? 'danger' : totalPercentage >= 60 ? 'warning' : 'safe';

  const handleDelete = async (budget) => {
    const confirmed = await requestConfirm({
      title: 'Hapus budget?',
      message: `Budget untuk "${budget.category?.name || 'kategori ini'}" akan dihapus. Transaksi tetap tersimpan.`,
      confirmLabel: 'Hapus Budget',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await removeBudget(budget.id);
      toast.success('Budget berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="page">
      <div className="budget-toolbar">
        <MonthSwitcher value={period} onChange={setPeriod} />
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setModal({ open: true, budget: null })}
        >
          <Plus aria-hidden="true" />
          Buat Budget
        </button>
      </div>

      <section className="card budget-overall">
        <div className="budget-overall__top">
          <div>
            <div className="budget-overall__label">Total budget bulan ini</div>
            <div className="budget-overall__value">{formatCurrency(totals.amount)}</div>
            <div className="budget-overall__meta">
              Terpakai {formatCurrency(totals.spent)}
              {totals.amount > 0 ? ` · Sisa ${formatCurrency(Math.max(totals.amount - totals.spent, 0))}` : ''}
            </div>
          </div>
          <div className={`budget-overall__percent ${totalPercentage > 100 ? 'text-expense' : ''}`}>
            {formatPercentage(totalPercentage)}
          </div>
        </div>
        <ProgressBar
          value={totalPercentage}
          status={totalStatus}
          label="Realisasi total budget bulan ini"
        />
        {totals.overCount ? (
          <div className="callout callout--danger">
            <Target aria-hidden="true" />
            <span>
              {totals.overCount} kategori sudah melebihi budget. Tinjau pengeluaran atau sesuaikan
              batas anggaran.
            </span>
          </div>
        ) : null}
      </section>

      {budgets.length ? (
        <div className="budget-list">
          {budgets.map((item) => {
            const status = statusMeta[item.status] || statusMeta.safe;
            return (
              <article
                className={`budget-card${item.isOverBudget ? ' budget-card--over' : ''}`}
                key={item.id}
              >
                <div className="budget-card__header">
                  <span
                    className="budget-card__icon"
                    style={{ backgroundColor: hexToRgba(item.category?.color || '#6366f1', 0.15) }}
                    aria-hidden="true"
                  >
                    {item.category?.icon || '📦'}
                  </span>
                  <div className="budget-card__info">
                    <div className="budget-card__name">{item.category?.name || 'Kategori'}</div>
                    <div className="budget-card__period">Budget bulanan</div>
                  </div>
                  <span className={`badge ${status.className}`}>{status.label}</span>
                </div>

                <div className="budget-card__amounts">
                  <span className="budget-card__spent">{formatCurrency(item.spent)}</span>
                  <span className="budget-card__limit">dari {formatCurrency(item.amount)}</span>
                </div>

                <ProgressBar
                  value={item.percentage}
                  status={item.status}
                  label={`Realisasi budget ${item.category?.name || ''}`}
                />

                <div className="budget-card__footer">
                  <span>{formatPercentage(item.percentage)} terpakai</span>
                  <span className={item.isOverBudget ? 'text-expense' : ''}>
                    {item.isOverBudget
                      ? `Lewat ${formatCurrency(Math.abs(item.remaining))}`
                      : `Sisa ${formatCurrency(item.remaining)}`}
                  </span>
                </div>

                <div className="budget-card__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setModal({ open: true, budget: item })}
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger-soft btn--sm"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card budget-empty">
          <EmptyState
            icon={<Target size={26} />}
            title="Belum ada anggaran. Atur budget-mu!"
            text="Tetapkan batas pengeluaran per kategori dan pantau realisasinya setiap bulan."
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setModal({ open: true, budget: null })}
              >
                <Plus aria-hidden="true" />
                Buat Anggaran
              </button>
            }
          />
        </div>
      )}

      <BudgetFormModal
        open={modal.open}
        budget={modal.budget}
        period={period}
        onClose={() => setModal({ open: false, budget: null })}
      />
    </div>
  );
}
