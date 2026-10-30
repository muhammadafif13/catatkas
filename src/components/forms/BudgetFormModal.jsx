import { useEffect, useMemo, useState } from 'react';
import FormField from './FormField';
import Modal from '../ui/Modal';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { toast } from '../../stores/useUIStore';
import { formatAmountInput, parseCurrencyInput } from '../../utils/formatCurrency';
import { getCurrentPeriod } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/helpers';
import { validateBudget } from '../../utils/validation';

export default function BudgetFormModal({ open, onClose, budget = null, period }) {
  const categories = useCategoryStore((state) => state.categories);
  const saveBudget = useBudgetStore((state) => state.saveBudget);
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  );
  const [form, setForm] = useState({ categoryId: '', amount: 0, period: period || getCurrentPeriod() });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      categoryId: budget?.categoryId || '',
      amount: budget?.amount || 0,
      period: budget?.period || period || getCurrentPeriod(),
    });
    setErrors({});
  }, [open, budget, period]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateBudget(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await saveBudget({
        id: budget?.id,
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        period: form.period,
      });
      toast.success(budget ? 'Budget berhasil diperbarui.' : 'Budget berhasil dibuat.');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={budget ? 'Edit budget' : 'Buat budget'}
      description="Tetapkan batas pengeluaran untuk satu kategori pada bulan tertentu."
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="budget-form"
            className="btn btn--primary"
            disabled={saving || !expenseCategories.length}
          >
            {saving ? 'Menyimpan…' : 'Simpan Budget'}
          </button>
        </>
      }
    >
      <form id="budget-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Kategori pengeluaran"
          htmlFor="budget-category"
          error={errors.categoryId}
          full
        >
          <select
            id="budget-category"
            className="select"
            value={form.categoryId}
            onChange={(event) => update('categoryId', Number(event.target.value))}
            disabled={Boolean(budget)}
          >
            <option value="">Pilih kategori</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Batas budget" htmlFor="budget-amount" error={errors.amount} full>
          <div className="input-wrap">
            <span className="input-prefix" aria-hidden="true">
              Rp
            </span>
            <input
              id="budget-amount"
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatAmountInput(form.amount)}
              onChange={(event) => update('amount', parseCurrencyInput(event.target.value))}
            />
          </div>
        </FormField>

        <FormField label="Periode" htmlFor="budget-period" error={errors.period} full>
          <input
            id="budget-period"
            className="input"
            type="month"
            value={form.period}
            onChange={(event) => update('period', event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}
