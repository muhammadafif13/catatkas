import { Link } from 'react-router-dom';
import { formatSignedCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/formatDate';
import { classNames, hexToRgba } from '../../utils/helpers';

export default function TransactionCard({ transaction, category, account, showDate = false }) {
  if (!transaction) return null;

  const title = transaction.note?.trim() || category?.name || 'Transaksi';
  const categoryName = category?.name || 'Tanpa kategori';
  const accountName = account?.name || 'Tanpa akun';

  return (
    <Link
      to={`/transaction/${transaction.id}`}
      className="transaction-card"
      aria-label={`${title}, ${formatSignedCurrency(transaction.amount, transaction.type)}`}
    >
      <span
        className="transaction-card__icon"
        style={{ backgroundColor: hexToRgba(category?.color || '#6366f1', 0.14) }}
        aria-hidden="true"
      >
        {category?.icon || '📦'}
      </span>
      <div className="transaction-card__body">
        <div className="transaction-card__top">
          <span className="transaction-card__title">{title}</span>
          <span
            className={classNames(
              'transaction-card__amount',
              transaction.type === 'income' ? 'amount--income' : 'amount--expense',
            )}
          >
            {formatSignedCurrency(transaction.amount, transaction.type)}
          </span>
        </div>
        <div className="transaction-card__meta">
          <span>{categoryName}</span>
          <span className="transaction-card__dot" />
          <span>{accountName}</span>
          {showDate ? (
            <>
              <span className="transaction-card__dot" />
              <span>{formatDateShort(transaction.date)}</span>
            </>
          ) : null}
          <span className="transaction-card__time">{transaction.time || '—'}</span>
        </div>
      </div>
    </Link>
  );
}
