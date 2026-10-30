import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Search, ReceiptText, X } from 'lucide-react';
import AdSlot from '../components/ads/AdSlot';
import EmptyState from '../components/ui/EmptyState';
import FormField from '../components/forms/FormField';
import TransactionCard from '../components/transactions/TransactionCard';
import { useDebounce } from '../hooks/useDebounce';
import { useTransactions } from '../hooks/useTransactions';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import {
  DATE_FILTER_PRESETS,
  TYPE_OPTIONS,
} from '../utils/constants';
import {
  getActiveFilterCount,
  groupTransactionsByDate,
} from '../utils/calculations';
import { formatCurrency, formatAmountInput, parseCurrencyInput } from '../utils/formatCurrency';
import {
  formatDateShort,
  getCurrentPeriod,
  getLastNDays,
  getRelativeDateLabel,
  todayISO,
} from '../utils/formatDate';

const emptyFilters = {
  dateFrom: '',
  dateTo: '',
  type: 'all',
  categoryIds: [],
  accountId: 'all',
  minAmount: '',
  maxAmount: '',
  search: '',
};

function getPresetRange(preset) {
  const today = todayISO();
  if (preset === 'this-month') {
    const period = getCurrentPeriod();
    const [year, month] = period.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      dateFrom: `${period}-01`,
      dateTo: `${period}-${String(lastDay).padStart(2, '0')}`,
    };
  }
  if (preset === 'last-30') {
    return { dateFrom: getLastNDays(30)[0], dateTo: today };
  }
  if (preset === 'this-year') {
    const year = new Date().getFullYear();
    return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
  }
  return { dateFrom: '', dateTo: '' };
}

export default function HistoryPage() {
  const allTransactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const [filters, setFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 250);
  const { transactions: filteredTransactions, totals } = useTransactions({
    ...filters,
    search: debouncedSearch,
  });

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [Number(category.id), category])),
    [categories],
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [Number(account.id), account])),
    [accounts],
  );
  const groups = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );
  const activeFilterCount = getActiveFilterCount({ ...filters, search: '' });

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const updateAmount = (key, value) => {
    const digits = String(value).replace(/\D/g, '');
    setFilters((current) => ({
      ...current,
      [key]: digits ? parseCurrencyInput(digits) : '',
    }));
  };

  const toggleCategory = (categoryId) => {
    setFilters((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  };

  const applyPreset = (preset) => {
    setFilters((current) => ({ ...current, ...getPresetRange(preset) }));
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setShowFilters(false);
  };

  return (
    <div className="page">
      <div className="history-toolbar">
        <div className="history-toolbar__search">
          <div className="input-wrap">
            <Search aria-hidden="true" />
            <input
              type="search"
              className="input"
              placeholder="Cari catatan transaksi…"
              aria-label="Cari catatan transaksi"
              value={filters.search}
              onChange={(event) => update('search', event.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          className={`btn ${activeFilterCount ? 'btn--soft' : 'btn--ghost'} history-toolbar__filter`}
          onClick={() => setShowFilters((current) => !current)}
          aria-expanded={showFilters}
          aria-controls="history-filter-panel"
        >
          <SlidersHorizontal aria-hidden="true" />
          <span className="sr-only">Filter</span>
          {activeFilterCount ? <span className="filter-count">{activeFilterCount}</span> : null}
        </button>
      </div>

      {showFilters ? (
        <div className="card filter-panel" id="history-filter-panel">
          <div className="filter-grid">
            <FormField label="Dari tanggal" htmlFor="filter-from">
              <input
                id="filter-from"
                type="date"
                className="input"
                value={filters.dateFrom}
                onChange={(event) => update('dateFrom', event.target.value)}
              />
            </FormField>
            <FormField label="Sampai tanggal" htmlFor="filter-to">
              <input
                id="filter-to"
                type="date"
                className="input"
                value={filters.dateTo}
                onChange={(event) => update('dateTo', event.target.value)}
              />
            </FormField>
            <FormField label="Jenis" htmlFor="filter-type">
              <select
                id="filter-type"
                className="select"
                value={filters.type}
                onChange={(event) => update('type', event.target.value)}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Akun" htmlFor="filter-account">
              <select
                id="filter-account"
                className="select"
                value={filters.accountId}
                onChange={(event) => update('accountId', event.target.value)}
              >
                <option value="all">Semua akun</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.icon} {account.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Nominal minimum" htmlFor="filter-min" optional>
              <input
                id="filter-min"
                type="text"
                inputMode="numeric"
                className="input"
                placeholder="Contoh: 10.000"
                value={formatAmountInput(filters.minAmount)}
                onChange={(event) => updateAmount('minAmount', event.target.value)}
              />
            </FormField>
            <FormField label="Nominal maksimum" htmlFor="filter-max" optional>
              <input
                id="filter-max"
                type="text"
                inputMode="numeric"
                className="input"
                placeholder="Contoh: 500.000"
                value={formatAmountInput(filters.maxAmount)}
                onChange={(event) => updateAmount('maxAmount', event.target.value)}
              />
            </FormField>

            <div className="filter-grid__full">
              <div className="field__label-row">
                <span className="field__label">Kategori</span>
                {filters.categoryIds.length ? (
                  <button
                    type="button"
                    className="card__link"
                    onClick={() => update('categoryIds', [])}
                  >
                    Hapus pilihan
                  </button>
                ) : null}
              </div>
              <div className="filter-chips">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`chip${filters.categoryIds.includes(category.id) ? ' is-active' : ''}`}
                    onClick={() => toggleCategory(category.id)}
                    aria-pressed={filters.categoryIds.includes(category.id)}
                  >
                    <span aria-hidden="true">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-chips">
            {DATE_FILTER_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className="chip chip--preset"
                onClick={() => applyPreset(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="filter-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={resetFilters}>
              Reset filter
            </button>
            <button
              type="button"
              className="btn btn--soft btn--sm"
              onClick={() => setShowFilters(false)}
            >
              Tutup filter
            </button>
          </div>
        </div>
      ) : null}

      <AdSlot placement="history" />

      <div className="history-summary">
        <div className="summary-card">
          <div className="summary-card__label">Transaksi</div>
          <div className="summary-card__value">{totals.count}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Pemasukan</div>
          <div className="summary-card__value text-income">{formatCurrency(totals.income)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Pengeluaran</div>
          <div className="summary-card__value text-expense">{formatCurrency(totals.expense)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Selisih</div>
          <div className={`summary-card__value ${totals.net < 0 ? 'text-expense' : 'text-income'}`}>
            {formatCurrency(totals.net)}
          </div>
        </div>
      </div>

      {groups.length ? (
        <div className="stack gap-4">
          {groups.map((group) => (
            <section key={group.date} className="date-group">
              <div className="date-group__header">
                <h2 className="date-group__title">{getRelativeDateLabel(group.date)}</h2>
                <div className="date-group__totals">
                  <span>{formatDateShort(group.date)}</span>
                  {group.totals.income ? (
                    <span className="text-income">+{formatCurrency(group.totals.income)}</span>
                  ) : null}
                  {group.totals.expense ? (
                    <span className="text-expense">-{formatCurrency(group.totals.expense)}</span>
                  ) : null}
                </div>
              </div>
              <div className="transaction-list">
                {group.transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    category={categoryMap.get(Number(transaction.categoryId))}
                    account={accountMap.get(Number(transaction.accountId))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<ReceiptText size={26} />}
            title={allTransactions.length ? 'Tidak ada transaksi di periode ini' : 'Belum ada transaksi'}
            text={
              allTransactions.length
                ? 'Coba ubah kata kunci atau filter yang dipilih.'
                : 'Mulai catat pemasukan dan pengeluaran pertamamu.'
            }
            action={
              allTransactions.length ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetFilters}
                >
                  <X aria-hidden="true" />
                  Ubah Filter
                </button>
              ) : (
                <Link to="/add" className="btn btn--primary">
                  Tambah Transaksi
                </Link>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
