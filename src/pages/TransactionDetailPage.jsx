import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { toast, useUIStore } from '../stores/useUIStore';
import { formatSignedCurrency } from '../utils/formatCurrency';
import { formatDateTime, formatDayDate } from '../utils/formatDate';
import { getErrorMessage, hexToRgba } from '../utils/helpers';

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const transactions = useTransactionStore((state) => state.transactions);
  const removeTransaction = useTransactionStore((state) => state.deleteTransaction);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const requestConfirm = useUIStore((state) => state.requestConfirm);

  const transaction = transactions.find((item) => item.id === Number(id));
  const category = useMemo(
    () =>
      categories.find(
        (item) => Number(item.id) === Number(transaction?.categoryId),
      ),
    [categories, transaction],
  );
  const account = useMemo(
    () => accounts.find((item) => Number(item.id) === Number(transaction?.accountId)),
    [accounts, transaction],
  );

  if (!transaction) {
    return (
      <div className="page detail-page">
        <div className="card">
          <EmptyState
            title="Transaksi tidak ditemukan"
            text="Transaksi mungkin sudah dihapus atau tautannya tidak valid."
            action={
              <Link to="/history" className="btn btn--primary">
                Kembali ke Riwayat
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    const confirmed = await requestConfirm({
      title: 'Hapus transaksi?',
      message: 'Transaksi ini akan dihapus permanen dan saldo akun akan disesuaikan.',
      confirmLabel: 'Hapus Transaksi',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await removeTransaction(transaction.id);
      toast.success('Transaksi berhasil dihapus.');
      navigate('/history', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const isIncome = transaction.type === 'income';

  return (
    <div className="page detail-page">
      <section className="detail-hero">
        <span
          className="detail-hero__icon"
          style={{ backgroundColor: hexToRgba(category?.color || '#6366f1', 0.16) }}
          aria-hidden="true"
        >
          {category?.icon || '📦'}
        </span>
        <div className="detail-hero__category">{category?.name || 'Tanpa kategori'}</div>
        <div className={`detail-hero__amount ${isIncome ? 'text-income' : 'text-expense'}`}>
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </div>
        {transaction.note ? <p className="detail-hero__note">{transaction.note}</p> : null}
        <span
          className={`badge ${isIncome ? 'badge--income' : 'badge--expense'} detail-hero__badge`}
        >
          {isIncome ? <ArrowDownLeft aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
        </span>
      </section>

      <div className="detail-actions">
        <Link to={`/transaction/${transaction.id}/edit`} className="btn btn--primary">
          <Pencil aria-hidden="true" />
          Edit Transaksi
        </Link>
        <button type="button" className="btn btn--danger-soft" onClick={handleDelete}>
          <Trash2 aria-hidden="true" />
          Hapus
        </button>
      </div>

      <section className="card">
        <div className="card__header">
          <div className="card__header-main">
            <h2 className="card__title">Rincian transaksi</h2>
            <p className="card__subtitle">Informasi lengkap catatan ini</p>
          </div>
        </div>
        <div className="detail-list">
          <div className="detail-row">
            <span className="detail-row__label">Tanggal</span>
            <span className="detail-row__value">{formatDayDate(transaction.date)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Waktu</span>
            <span className="detail-row__value">{transaction.time || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Akun</span>
            <span className="detail-row__value">
              {account ? `${account.icon} ${account.name}` : 'Tanpa akun'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Kategori</span>
            <span className="detail-row__value">{category?.name || 'Tanpa kategori'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Jenis</span>
            <span className="detail-row__value">{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
          </div>
        </div>
        <div className="detail-timestamps">
          <span>Dibuat {formatDateTime(transaction.createdAt)}</span>
          {transaction.updatedAt ? <span>Diperbarui {formatDateTime(transaction.updatedAt)}</span> : null}
        </div>
      </section>
    </div>
  );
}
