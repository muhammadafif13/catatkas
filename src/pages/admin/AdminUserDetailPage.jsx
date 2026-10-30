import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  getAdminUsers,
  getUserFinancialData,
  runAdminUserAction,
} from '../../services/admin';
import { getAccountBalances, getBudgetProgress, getTotals } from '../../utils/calculations';
import { formatCurrency, formatSignedCurrency } from '../../utils/formatCurrency';
import { formatDateTime, formatMonth } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/helpers';
import { toast, useUIStore } from '../../stores/useUIStore';

const TABS = [
  { value: 'overview', label: 'Ringkasan' },
  { value: 'transactions', label: 'Transaksi' },
  { value: 'accounts', label: 'Akun' },
  { value: 'budgets', label: 'Budget' },
];

function initials(name, email) {
  return String(name || email || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [users, financial] = await Promise.all([getAdminUsers(), getUserFinancialData(id)]);
        if (!active) return;
        const found = users.find((item) => item.id === id);
        if (!found) throw new Error('Pengguna tidak ditemukan.');
        setUser(found);
        setData(financial);
      } catch (error) {
        if (active) {
          toast.error(getErrorMessage(error));
          navigate('/admin/users', { replace: true });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const categoryMap = useMemo(
    () => new Map((data?.categories || []).map((category) => [Number(category.id), category])),
    [data],
  );
  const accountMap = useMemo(
    () => new Map((data?.accounts || []).map((account) => [Number(account.id), account])),
    [data],
  );
  const totals = useMemo(() => getTotals(data?.transactions || []), [data]);
  const balances = useMemo(
    () => getAccountBalances(data?.accounts || [], data?.transactions || [], data?.transfers || []),
    [data],
  );
  const totalBalance = useMemo(
    () => balances.reduce((total, account) => total + (Number(account.balance) || 0), 0),
    [balances],
  );

  const handleToggleStatus = async () => {
    if (!user) return;
    const suspending = !user.isSuspended;
    const confirmed = await requestConfirm({
      title: suspending ? 'Tangguhkan pengguna?' : 'Aktifkan kembali pengguna?',
      message: suspending
        ? `${user.email} tidak akan bisa masuk atau mengubah data sampai diaktifkan kembali.`
        : `${user.email} akan bisa masuk dan mencatat data kembali.`,
      confirmLabel: suspending ? 'Tangguhkan' : 'Aktifkan',
      danger: suspending,
    });
    if (!confirmed) return;

    setBusy('status');
    try {
      await runAdminUserAction(user.id, suspending ? 'suspend' : 'activate');
      setUser((current) => ({ ...current, isSuspended: suspending }));
      toast.success(suspending ? 'Pengguna ditangguhkan.' : 'Pengguna diaktifkan kembali.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const confirmed = await requestConfirm({
      title: 'Hapus akun pengguna?',
      message: `Akun ${user.email} beserta data keuangan, profil, dan akses login akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus Permanen',
      danger: true,
    });
    if (!confirmed) return;

    setBusy('delete');
    try {
      await runAdminUserAction(user.id, 'delete');
      toast.success('Akun pengguna dihapus.');
      navigate('/admin/users', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner block label="Memuat data pengguna…" />
      </div>
    );
  }

  if (!user || !data) return null;

  return (
    <div className="page admin-page">
      <Link to="/admin/users" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke daftar pengguna
      </Link>

      <section className="admin-profile-card">
        <div className="admin-profile-card__main">
          <span className="admin-avatar admin-avatar--lg">
            {initials(user.fullName, user.email)}
          </span>
          <div>
            <div className="admin-profile-card__name">
              {user.fullName || 'Tanpa nama'}
              {user.role === 'admin' ? (
                <span className="badge badge--primary">
                  <ShieldCheck size={12} aria-hidden="true" />
                  Admin
                </span>
              ) : null}
            </div>
            <div className="admin-profile-card__email">
              <Mail size={14} aria-hidden="true" />
              {user.email}
            </div>
            <div className="admin-profile-card__meta">
              Bergabung {formatDateTime(user.createdAt)} · Terakhir dibuka{' '}
              {formatDateTime(user.lastSeenAt)}
            </div>
          </div>
        </div>
        <div className="admin-profile-card__actions">
          <span className={`badge ${user.isSuspended ? 'badge--danger' : 'badge--success'}`}>
            {user.isSuspended ? 'Ditangguhkan' : 'Akun aktif'}
          </span>
          {user.role !== 'admin' ? (
            <>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={handleToggleStatus}
                disabled={Boolean(busy)}
              >
                {user.isSuspended ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <Ban size={16} aria-hidden="true" />
                )}
                {busy === 'status' ? 'Memproses…' : user.isSuspended ? 'Aktifkan' : 'Tangguhkan'}
              </button>
              <button
                type="button"
                className="btn btn--danger-soft btn--sm"
                onClick={handleDelete}
                disabled={Boolean(busy)}
              >
                <Trash2 size={16} aria-hidden="true" />
                {busy === 'delete' ? 'Menghapus…' : 'Hapus akun'}
              </button>
            </>
          ) : null}
        </div>
      </section>

      <div className="callout callout--primary">
        <ShieldCheck aria-hidden="true" />
        <span>
          Tampilan baca-saja. Admin dapat meninjau data keuangan pengguna, tetapi tidak dapat
          mengubah transaksi, akun, atau budget mereka.
        </span>
      </div>

      <div className="admin-stat-grid admin-stat-grid--four">
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--income">
            <ArrowDownLeft size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Pemasukan</div>
            <div className="admin-stat__value">{formatCurrency(totals.income)}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--expense">
            <ArrowUpRight size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Pengeluaran</div>
            <div className="admin-stat__value">{formatCurrency(totals.expense)}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <Wallet size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Selisih</div>
            <div className="admin-stat__value">
              {formatSignedCurrency(Math.abs(totals.net), totals.net >= 0 ? 'income' : 'expense')}
            </div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <Wallet size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Total saldo akun</div>
            <div className="admin-stat__value">{formatCurrency(totalBalance)}</div>
          </div>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Data pengguna">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={`admin-tab${tab === item.value ? ' is-active' : ''}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="admin-detail-grid">
          <section className="card">
            <div className="card__header">
              <div className="card__header-main">
                <h2 className="card__title">Transaksi terbaru</h2>
                <p className="card__subtitle">Diurutkan dari yang paling baru</p>
              </div>
            </div>
            {data.transactions.length ? (
              <div className="admin-mini-list">
                {data.transactions.slice(0, 8).map((transaction) => {
                  const category = categoryMap.get(Number(transaction.categoryId));
                  return (
                    <div key={transaction.id} className="admin-mini-row">
                      <span className="admin-mini-row__icon">
                        {category?.icon || (transaction.type === 'income' ? '↓' : '↑')}
                      </span>
                      <span className="admin-mini-row__main">
                        <strong>{category?.name || 'Tanpa kategori'}</strong>
                        <small>
                          {transaction.date}
                          {transaction.note ? ` · ${transaction.note}` : ''}
                        </small>
                      </span>
                      <span
                        className={`admin-mini-row__amount admin-mini-row__amount--${transaction.type}`}
                      >
                        {transaction.type === 'income' ? '+' : '−'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Pengguna ini belum mencatat transaksi.</p>
            )}
          </section>

          <section className="card">
            <div className="card__header">
              <div className="card__header-main">
                <h2 className="card__title">Akun dompet</h2>
                <p className="card__subtitle">Saldo saat ini berdasarkan transaksi</p>
              </div>
            </div>
            <div className="admin-account-list">
              {balances.map(({ account, balance }) => (
                <div key={account.id} className="admin-account-row">
                  <span
                    className="admin-account-row__icon"
                    style={{ background: `${account.color}22`, color: account.color }}
                  >
                    {account.icon}
                  </span>
                  <span>
                    <strong>{account.name}</strong>
                    <small>{account.isActive === false ? 'Tidak aktif' : 'Aktif'}</small>
                  </span>
                  <strong className={balance < 0 ? 'text-expense' : ''}>
                    {formatCurrency(balance)}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'transactions' ? (
        <section className="card card--flush admin-data-card">
          <div className="admin-data-card__head">
            <span>Tanggal</span>
            <span>Keterangan</span>
            <span>Akun</span>
            <span>Jumlah</span>
          </div>
          {data.transactions.length ? (
            data.transactions.map((transaction) => {
              const category = categoryMap.get(Number(transaction.categoryId));
              const account = accountMap.get(Number(transaction.accountId));
              return (
                <div key={transaction.id} className="admin-data-row">
                  <span>
                    {transaction.date}
                    <small>{transaction.time || '—'}</small>
                  </span>
                  <span>
                    <strong>
                      {category?.icon} {transaction.note || category?.name || 'Tanpa keterangan'}
                    </strong>
                    <small>
                      {category?.name || 'Tanpa kategori'} ·{' '}
                      {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </small>
                  </span>
                  <span>{account?.name || 'Tanpa akun'}</span>
                  <strong className={`text-${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatCurrency(transaction.amount)}
                  </strong>
                </div>
              );
            })
          ) : (
            <p className="admin-empty">Belum ada transaksi.</p>
          )}
        </section>
      ) : null}

      {tab === 'accounts' ? (
        <section className="card card--flush admin-data-card">
          <div className="admin-data-card__head admin-data-card__head--accounts">
            <span>Akun</span>
            <span>Saldo awal</span>
            <span>Saldo kini</span>
          </div>
          {balances.map(({ account, balance }) => (
            <div key={account.id} className="admin-data-row admin-data-row--accounts">
              <span>
                <strong>
                  {account.icon} {account.name}
                </strong>
                <small>{account.isActive === false ? 'Tidak aktif' : 'Aktif'}</small>
              </span>
              <span>{formatCurrency(account.initialBalance)}</span>
              <strong className={balance < 0 ? 'text-expense' : ''}>
                {formatCurrency(balance)}
              </strong>
            </div>
          ))}
        </section>
      ) : null}

      {tab === 'budgets' ? (
        <section className="card admin-budget-list">
          {data.budgets.length ? (
            data.budgets.map((budget) => {
              const category = categoryMap.get(Number(budget.categoryId));
              const progress = getBudgetProgress(budget, data.transactions);
              return (
                <div key={budget.id} className="admin-budget-row">
                  <span className="admin-budget-row__icon">
                    {category?.icon || '📦'}
                  </span>
                  <div className="admin-budget-row__body">
                    <div className="admin-budget-row__head">
                      <strong>{category?.name || 'Tanpa kategori'}</strong>
                      <span>{formatMonth(budget.period)}</span>
                    </div>
                    <div className="admin-budget-row__amounts">
                      <span>
                        {formatCurrency(progress.spent)} dari {formatCurrency(budget.amount)}
                      </span>
                      <strong className={progress.isOverBudget ? 'text-expense' : ''}>
                        {Math.round(progress.percentage)}%
                      </strong>
                    </div>
                    <div className="admin-budget-row__bar">
                      <span
                        style={{
                          width: `${progress.cappedPercentage}%`,
                          background:
                            progress.status === 'over'
                              ? 'var(--color-expense)'
                              : progress.status === 'danger'
                                ? 'var(--color-warning)'
                                : 'var(--color-primary-500)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="admin-empty">Pengguna ini belum membuat budget.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
