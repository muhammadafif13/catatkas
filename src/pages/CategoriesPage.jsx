import { useMemo, useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import CategoryFormModal from '../components/forms/CategoryFormModal';
import EmptyState from '../components/ui/EmptyState';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { toast, useUIStore } from '../stores/useUIStore';
import { getCategoryUsage } from '../utils/calculations';
import { getErrorMessage, hexToRgba } from '../utils/helpers';

export default function CategoriesPage() {
  const categories = useCategoryStore((state) => state.categories);
  const removeCategory = useCategoryStore((state) => state.deleteCategory);
  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [activeType, setActiveType] = useState('expense');
  const [modal, setModal] = useState({ open: false, category: null });

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === 'income'),
    [categories],
  );
  const visibleCategories = activeType === 'income' ? incomeCategories : expenseCategories;

  const handleDelete = async (category) => {
    if (category.isDefault) {
      toast.info('Kategori bawaan tidak bisa dihapus. Kamu tetap bisa mengubah nama, ikon, dan warnanya.');
      return;
    }
    const usage = getCategoryUsage(transactions, budgets, category.id);
    if (usage.transactionCount || usage.budgetCount) {
      toast.warning(
        `Kategori "${category.name}" masih dipakai oleh ${usage.transactionCount} transaksi dan ${usage.budgetCount} budget.`,
        5000,
      );
      return;
    }

    const confirmed = await requestConfirm({
      title: 'Hapus kategori?',
      message: `Kategori "${category.name}" akan dihapus permanen.`,
      confirmLabel: 'Hapus Kategori',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await removeCategory(category.id);
      toast.success('Kategori berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="page">
      <div className="page-actions">
        <div className="category-tabs" role="tablist" aria-label="Jenis kategori">
          <button
            type="button"
            role="tab"
            aria-selected={activeType === 'expense'}
            className={`category-tabs__button${activeType === 'expense' ? ' is-active' : ''}`}
            onClick={() => setActiveType('expense')}
          >
            Pengeluaran
            <span className="category-tabs__count">{expenseCategories.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeType === 'income'}
            className={`category-tabs__button${activeType === 'income' ? ' is-active' : ''}`}
            onClick={() => setActiveType('income')}
          >
            Pemasukan
            <span className="category-tabs__count">{incomeCategories.length}</span>
          </button>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setModal({ open: true, category: null })}
        >
          <Plus aria-hidden="true" />
          Tambah Kategori
        </button>
      </div>

      {visibleCategories.length ? (
        <div className="category-manage-grid">
          {visibleCategories.map((category) => {
            const usage = getCategoryUsage(transactions, budgets, category.id);
            return (
              <article className="category-manage-card" key={category.id}>
                <span
                  className="category-manage-card__icon"
                  style={{ backgroundColor: hexToRgba(category.color, 0.15) }}
                  aria-hidden="true"
                >
                  {category.icon}
                </span>
                <div className="category-manage-card__info">
                  <div className="category-manage-card__name">
                    <span>{category.name}</span>
                    {category.isDefault ? <span className="badge badge--neutral">Bawaan</span> : null}
                  </div>
                  <div className="category-manage-card__usage">
                    {usage.transactionCount} transaksi · {usage.budgetCount} budget
                  </div>
                </div>
                <div className="category-manage-card__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setModal({ open: true, category })}
                    aria-label={`Edit kategori ${category.name}`}
                  >
                    <Pencil size={17} aria-hidden="true" />
                  </button>
                  {!category.isDefault ? (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDelete(category)}
                      aria-label={`Hapus kategori ${category.name}`}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<Tags size={26} />}
            title={`Belum ada kategori ${activeType === 'income' ? 'pemasukan' : 'pengeluaran'}`}
            text="Buat kategori agar transaksi lebih mudah dikelompokkan."
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setModal({ open: true, category: null })}
              >
                <Plus aria-hidden="true" />
                Tambah Kategori
              </button>
            }
          />
        </div>
      )}

      <CategoryFormModal
        open={modal.open}
        category={modal.category}
        defaultType={activeType}
        onClose={() => setModal({ open: false, category: null })}
      />
    </div>
  );
}
