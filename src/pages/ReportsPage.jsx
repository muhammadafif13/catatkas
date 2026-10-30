import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartPie,
  Plus,
  ReceiptText,
  Target,
  Wallet,
} from 'lucide-react';
import AdSlot from '../components/ads/AdSlot';
import ComparisonBar from '../components/charts/ComparisonBar';
import ExpenseDonut from '../components/charts/ExpenseDonut';
import BudgetItem from '../components/transactions/BudgetItem';
import EmptyState from '../components/ui/EmptyState';
import MonthSwitcher from '../components/ui/MonthSwitcher';
import StatCard from '../components/ui/StatCard';
import { useBudgetProgress } from '../hooks/useBudgetProgress';
import {
  useExpensePieData,
  useIncomeBreakdown,
  useReportChartData,
} from '../hooks/useChartData';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { getMonthTotals, getTopExpenses } from '../utils/calculations';
import {
  formatCurrency,
  formatPercentage,
  formatSignedCurrency,
} from '../utils/formatCurrency';
import { formatDateShort, getCurrentPeriod } from '../utils/formatDate';
import { hexToRgba } from '../utils/helpers';

function deltaLabel(percent) {
  if (percent === null || percent === undefined) return 'Belum ada data pembanding';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${formatPercentage(percent, { decimals: 1 })} dibanding bulan lalu`;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState(getCurrentPeriod());
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const report = useReportChartData(period);
  const expenseData = useExpensePieData(period);
  const incomeData = useIncomeBreakdown(period);
  const budgets = useBudgetProgress(period);
  const topExpenses = useMemo(
    () => getTopExpenses(transactions, period, 5),
    [transactions, period],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [Number(category.id), category])),
    [categories],
  );
  const totals = getMonthTotals(transactions, period);
  const isEmpty = totals.count === 0;

  return (
    <div className="page">
      <div className="report-toolbar">
        <MonthSwitcher value={period} onChange={setPeriod} />
        <div className="report-toolbar__actions">
          <span className="text-xs text-tertiary">{totals.count} transaksi pada bulan ini</span>
        </div>
      </div>

      <div className="report-summary">
        <StatCard
          icon={<ArrowDownLeft size={19} />}
          label="Pemasukan"
          value={formatCurrency(totals.income)}
          meta={deltaLabel(report.percent.income)}
          variant="income"
        />
        <StatCard
          icon={<ArrowUpRight size={19} />}
          label="Pengeluaran"
          value={formatCurrency(totals.expense)}
          meta={deltaLabel(report.percent.expense)}
          variant="expense"
        />
        <StatCard
          icon={<Wallet size={19} />}
          label={totals.net >= 0 ? 'Surplus' : 'Defisit'}
          value={formatSignedCurrency(Math.abs(totals.net), totals.net >= 0 ? 'income' : 'expense')}
          meta={`${report.current.count} transaksi tercatat`}
          variant={totals.net >= 0 ? 'income' : 'expense'}
        />
      </div>

      <AdSlot placement="reports" />

      {isEmpty ? (
        <div className="card">
          <EmptyState
            icon={<ChartPie size={26} />}
            title="Data belum cukup untuk laporan"
            text="Tambahkan transaksi pada bulan ini untuk melihat breakdown, perbandingan, dan evaluasi budget."
            action={
              <Link to="/add" className="btn btn--primary">
                <Plus aria-hidden="true" />
                Tambah Transaksi
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="report-grid">
            <section className="card report-section">
              <div className="card__header">
                <div className="card__header-main">
                  <h2 className="card__title">Perbandingan bulanan</h2>
                  <p className="card__subtitle">Bulan ini vs bulan sebelumnya</p>
                </div>
                <ChartPie size={18} className="text-tertiary" aria-hidden="true" />
              </div>
              <ComparisonBar
                labels={report.labels}
                income={report.income}
                expense={report.expense}
              />
              <div className="comparison-list">
                <div className="comparison-row">
                  <span className="comparison-row__label">Pemasukan</span>
                  <div className="comparison-row__values">
                    <div className="comparison-row__value">{formatCurrency(report.current.income)}</div>
                    <div className="comparison-row__delta">{deltaLabel(report.percent.income)}</div>
                  </div>
                </div>
                <div className="comparison-row">
                  <span className="comparison-row__label">Pengeluaran</span>
                  <div className="comparison-row__values">
                    <div className="comparison-row__value">{formatCurrency(report.current.expense)}</div>
                    <div className="comparison-row__delta">{deltaLabel(report.percent.expense)}</div>
                  </div>
                </div>
                <div className="comparison-row">
                  <span className="comparison-row__label">Selisih</span>
                  <div className="comparison-row__values">
                    <div className={`comparison-row__value ${report.current.net < 0 ? 'text-expense' : 'text-income'}`}>
                      {formatCurrency(report.current.net)}
                    </div>
                    <div className="comparison-row__delta">{deltaLabel(report.percent.net)}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="card report-section">
              <div className="card__header">
                <div className="card__header-main">
                  <h2 className="card__title">Pengeluaran per kategori</h2>
                  <p className="card__subtitle">Distribusi pengeluaran bulan ini</p>
                </div>
              </div>
              <ExpenseDonut
                labels={expenseData.labels}
                values={expenseData.values}
                colors={expenseData.colors}
                total={expenseData.total}
              />
              {expenseData.breakdown.length ? (
                <div className="chart-legend">
                  {expenseData.breakdown.slice(0, 5).map((item) => (
                    <div key={item.categoryId} className="chart-legend__item">
                      <span className="chart-legend__dot" style={{ backgroundColor: item.color }} />
                      <span className="chart-legend__label">{item.name}</span>
                      <span className="chart-legend__value">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="card report-section">
              <div className="card__header">
                <div className="card__header-main">
                  <h2 className="card__title">Rincian pengeluaran</h2>
                  <p className="card__subtitle">Semua kategori pengeluaran</p>
                </div>
              </div>
              {expenseData.breakdown.length ? (
                <div className="breakdown-list">
                  {expenseData.breakdown.map((item) => (
                    <div className="breakdown-row" key={item.categoryId}>
                      <span
                        className="breakdown-row__icon"
                        style={{ backgroundColor: hexToRgba(item.color, 0.15) }}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <div className="breakdown-row__main">
                        <div className="breakdown-row__top">
                          <span className="breakdown-row__name">{item.name}</span>
                          <span className="breakdown-row__amount">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="breakdown-row__bar">
                          <span style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                      <span className="breakdown-row__percent">
                        {formatPercentage(item.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="report-empty text-sm text-tertiary">Belum ada pengeluaran.</p>
              )}
            </section>

            <section className="card report-section">
              <div className="card__header">
                <div className="card__header-main">
                  <h2 className="card__title">Rincian pemasukan</h2>
                  <p className="card__subtitle">Sumber pemasukan bulan ini</p>
                </div>
              </div>
              {incomeData.breakdown.length ? (
                <div className="breakdown-list">
                  {incomeData.breakdown.map((item) => (
                    <div className="breakdown-row" key={item.categoryId}>
                      <span
                        className="breakdown-row__icon"
                        style={{ backgroundColor: hexToRgba(item.color, 0.15) }}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <div className="breakdown-row__main">
                        <div className="breakdown-row__top">
                          <span className="breakdown-row__name">{item.name}</span>
                          <span className="breakdown-row__amount">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="breakdown-row__bar">
                          <span
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                      <span className="breakdown-row__percent">
                        {formatPercentage(item.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="report-empty text-sm text-tertiary">Belum ada pemasukan.</p>
              )}
            </section>

            <section className="card report-section">
              <div className="card__header">
                <div className="card__header-main">
                  <h2 className="card__title">Top 5 pengeluaran</h2>
                  <p className="card__subtitle">Nominal terbesar bulan ini</p>
                </div>
                <ReceiptText size={18} className="text-tertiary" aria-hidden="true" />
              </div>
              {topExpenses.length ? (
                <div>
                  {topExpenses.map((transaction, index) => {
                    const category = categoryMap.get(Number(transaction.categoryId));
                    return (
                      <div className="top-expense" key={transaction.id}>
                        <span className="top-expense__rank">{index + 1}</span>
                        <div className="top-expense__body">
                          <div className="top-expense__title">
                            {transaction.note || category?.name || 'Pengeluaran'}
                          </div>
                          <div className="top-expense__meta">
                            {category?.name || 'Tanpa kategori'} ·{' '}
                            {formatDateShort(transaction.date)}
                          </div>
                        </div>
                        <span className="top-expense__amount">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="report-empty text-sm text-tertiary">Belum ada pengeluaran.</p>
              )}
            </section>

            <section className="card report-section">
              <div className="card__header">
                <div className="card__header-main">
                  <h2 className="card__title">Realisasi budget</h2>
                  <p className="card__subtitle">Evaluasi budget bulan ini</p>
                </div>
                <Target size={18} className="text-tertiary" aria-hidden="true" />
              </div>
              {budgets.length ? (
                <div className="dashboard-budget-list">
                  {budgets.map((budget) => (
                    <BudgetItem key={budget.id} summary={budget} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={<Target size={20} />}
                  title="Belum ada budget"
                  text="Buat anggaran untuk membandingkan realisasi dengan batas pengeluaran."
                  action={
                    <Link to="/budget" className="btn btn--soft btn--sm">
                      Atur Budget
                    </Link>
                  }
                />
              )}
            </section>
          </div>

          <div className="callout callout--primary">
            <ChartPie aria-hidden="true" />
            <span>
              Laporan dihitung dari transaksi yang tersimpan di perangkat. Data export tidak
              memengaruhi angka pada halaman ini.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
