import { formatCurrency } from '../../utils/formatCurrency';
import { hexToRgba } from '../../utils/helpers';
import ProgressBar from '../ui/ProgressBar';

const statusLabels = {
  safe: 'Aman',
  warning: 'Mendekati batas',
  danger: 'Hampir habis',
  over: 'Melebihi budget',
};

export default function BudgetItem({ summary, category }) {
  const item = summary?.category ? summary : { ...summary, category };
  const itemCategory = item.category;
  const percentage = Number(item.percentage) || 0;

  return (
    <div className="budget-item">
      <div className="budget-item__header">
        <span
          className="budget-item__icon"
          style={{ backgroundColor: hexToRgba(itemCategory?.color || '#6366f1', 0.14) }}
          aria-hidden="true"
        >
          {itemCategory?.icon || '📦'}
        </span>
        <span className="budget-item__title">{itemCategory?.name || 'Kategori'}</span>
        <span className="budget-item__amounts">
          {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
        </span>
      </div>
      <ProgressBar value={percentage} status={item.status} size="sm" label={`Budget ${itemCategory?.name || ''}`} />
      <div className="budget-item__footer">
        <span className={item.isOverBudget ? 'text-expense budget-item__status' : 'budget-item__status'}>
          {statusLabels[item.status] || 'Aman'}
        </span>
        <span>
          {item.isOverBudget
            ? `Lewat ${formatCurrency(Math.abs(item.remaining))}`
            : `Sisa ${formatCurrency(item.remaining)}`}
        </span>
      </div>
    </div>
  );
}
