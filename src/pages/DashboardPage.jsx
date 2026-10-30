import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChartPie,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import AdSlot from '../components/ads/AdSlot';
import BalanceCard from '../components/transactions/BalanceCard';
import BudgetItem from '../components/transactions/BudgetItem';
import TransactionCard from '../components/transactions/TransactionCard';
import CashflowBar from '../components/charts/CashflowBar';
import BalanceLine from '../components/charts/BalanceLine';
import ExpenseDonut from '../components/charts/ExpenseDonut';
import EmptyState from '../components/ui/EmptyState';
import { useBalances } from '../hooks/useAccountBalance';
import { useBudgetProgress } from '../hooks/useBudgetProgress';
import {
  useBalanceTrendChartData,
  useCashflowChartData,
  useExpensePieData,
} from '../hooks/useChartData';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { getMonthTotals, getRecentTransactions } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';
import { formatMonth, getCurrentPeriod } from '../utils/formatDate';

export default function DashboardPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const period = getCurrentPeriod();
  const monthTotals = getMonthTotals(transactions, period);
  const { total } = useBalances();
  const recent = getRecentTransactions(transactions, 6);
  const budgets = useBudgetProgress(period);
  const expenseData = useExpensePieData(period);
  const cashflow = useCashflowChartData(7);
  const trend = useBalanceTrendChartData(30);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [Number(category.id), category])),
    [categories],
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [Number(account.id), account])),
    [accounts],
  );
  const activeAccountCount = accounts.filter((account) => account.isActive !== false).length;

  const budgetTotals = useMemo(
    () =>
      budgets.reduce(
        (result, item) => ({
          amount: result.amount + (Number(item.amount) || 0),
          spent: result.spent + (Number(item.spent) || 0),
        }),
        { amount: 0, spent: 0 },
      ),
    [budgets],
  );

  const topLegend = expenseData.breakdown.slice(0, 4);

  return (
    <div className="page dashboard-page">
      <BalanceCard
        total={total}
        income={monthTotals.income}
        expense={monthTotals.expense}
        accountCount={activeAccountCount}
        monthLabel={formatMonth(period)}
      />

      {!transactions.length ? (
        <div className="card">
          <EmptyState
            icon={<ReceiptText size={26} />}
            title="Belum ada transaksi. Yuk mulai catat!"
            text="Catat pemasukan atau pengeluaran pertamamu dan lihat ringkasannya di sini."
            action={
              <Link to="/add" className="btn btn--primary">
                <Plus aria-hidden="true" />
                Tambah Transaksi Pertama
              </Link>
            }
          />
        </div>
      ) : null}

      <div className="dashboard-grid dashboard-grid--charts">
        <section className="card chart-card">
          <div className="card__header">
            <div className="card__header-main">
              <h2 className="card__title">Pengeluaran per kategori</h2>
              <p className="card__subtitle">{formatMonth(period)}</p>
            </div>
            <Link to="/reports" className="card__link">
              Laporan
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ExpenseDonut
            labels={expenseData.labels}
            values={expenseData.values}
            colors={expenseData.colors}
            total={expenseData.total}
          />
          {topLegend.length ? (
            <div className="chart-legend dashboard-chart-legend">
              {topLegend.map((item) => (
                <div key={item.categoryId} className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ backgroundColor: item.color }} />
                  <span className="chart-legend__label">{item.name}</span>
                  <span className="chart-legend__value">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="card chart-card">
          <div className="card__header">
            <div className="card__header-main">
              <h2 className="card__title">Arus kas 7 hari</h2>
              <p className="card__subtitle">Pemasukan vs pengeluaran harian</p>
            </div>
            <ChartPie size={18} className="text-tertiary" aria-hidden="true" />
          </div>
          <CashflowBar labels={cashflow.labels} income={cashflow.income} expense={cashflow.expense} />
        </section>

        <section className="card chart-card dashboard-grid__full">
          <div className="card__header">
            <div className="card__header-main">
              <h2 className="card__title">Tren saldo 30 hari</h2>
              <p className="card__subtitle">Pergerakan total saldo dari waktu ke waktu</p>
            </div>
            <TrendingUp size={18} className="text-tertiary" aria-hidden="true" />
          </div>
          <BalanceLine labels={trend.labels} values={trend.values} />
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid--lower">
        <section className="card">
          <div className="card__header">
            <div className="card__header-main">
              <h2 className="card__title">Transaksi terbaru</h2>
              <p className="card__subtitle">6 catatan terakhir</p>
            </div>
            <Link to="/history" className="card__link">
              Lihat semua
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {recent.length ? (
            <div className="transaction-list">
              {recent.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  category={categoryMap.get(Number(transaction.categoryId))}
                  account={accountMap.get(Number(transaction.accountId))}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={<ReceiptText size={20} />}
              title="Belum ada catatan"
              text="Transaksi baru akan tampil di sini."
            />
          )}
        </section>

        <section className="card">
          <div className="card__header">
            <div className="card__header-main">
              <h2 className="card__title">Budget bulan ini</h2>
              <p className="card__subtitle">
                {budgetTotals.amount
                  ? `${formatCurrency(budgetTotals.spent)} dari ${formatCurrency(budgetTotals.amount)}`
                  : 'Pantau batas pengeluaranmu'}
              </p>
            </div>
            <Link to="/budget" className="card__link">
              Kelola
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {budgets.length ? (
            <div className="dashboard-budget-list">
              {budgets.slice(0, 4).map((item) => (
                <BudgetItem key={item.id} summary={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={<Target size={20} />}
              title="Belum ada budget"
              text="Atur anggaran supaya pengeluaran lebih terkendali."
              action={
                <Link to="/budget" className="btn btn--soft btn--sm">
                  <Wallet aria-hidden="true" />
                  Buat Anggaran
                </Link>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
