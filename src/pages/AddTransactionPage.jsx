import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Wallet } from 'lucide-react';
import AmountInput from '../components/forms/AmountInput';
import CategoryPicker from '../components/forms/CategoryPicker';
import FormField from '../components/forms/FormField';
import TypeToggle from '../components/forms/TypeToggle';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { toast } from '../stores/useUIStore';
import { getErrorMessage } from '../utils/helpers';
import { nowTime, toISODate, todayISO } from '../utils/formatDate';
import { validateTransaction } from '../utils/validation';

function getYesterdayISO() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toISODate(date);
}

export default function AddTransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const settings = useSettingsStore((state) => state.settings);
  const existing = isEdit
    ? transactions.find((transaction) => transaction.id === Number(id))
    : null;

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.isActive !== false),
    [accounts],
  );

  const defaultAccountId = useMemo(() => {
    const preferred = activeAccounts.find(
      (account) => Number(account.id) === Number(settings.defaultAccountId),
    );
    return preferred?.id || activeAccounts[0]?.id || '';
  }, [activeAccounts, settings.defaultAccountId]);

  const [form, setForm] = useState(() => ({
    type: existing?.type || 'expense',
    amount: existing?.amount || 0,
    categoryId: existing?.categoryId || '',
    accountId: existing?.accountId || defaultAccountId,
    date: existing?.date || todayISO(),
    time: existing?.time || nowTime(),
    note: existing?.note || '',
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type],
  );

  const clearError = (key) => {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearError(key);
  };

  const handleTypeChange = (nextType) => {
    setForm((current) => {
      const valid = categories.some(
        (category) =>
          category.type === nextType && Number(category.id) === Number(current.categoryId),
      );
      return {
        ...current,
        type: nextType,
        categoryId: valid ? current.categoryId : '',
      };
    });
    clearError('type');
    clearError('categoryId');
  };

  if (isEdit && !existing) {
    return (
      <div className="page add-page">
        <div className="card">
          <div className="empty-state">
            <h1 className="empty-state__title">Transaksi tidak ditemukan</h1>
            <p className="empty-state__text">
              Transaksi mungkin sudah dihapus atau tautannya tidak valid.
            </p>
            <Link to="/history" className="btn btn--primary">
              Kembali ke Riwayat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateTransaction(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        categoryId: Number(form.categoryId),
        accountId: Number(form.accountId),
      };
      if (isEdit) {
        await updateTransaction(existing.id, payload);
        toast.success('Perubahan transaksi berhasil disimpan.');
        navigate(`/transaction/${existing.id}`, { replace: true });
      } else {
        await addTransaction(payload);
        toast.success('Transaksi berhasil disimpan.');
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page add-page">
      <div className="add-page__intro">
        <h1 className="add-page__title">
          {isEdit ? 'Perbarui catatan' : 'Catat transaksi baru'}
        </h1>
        <p className="add-page__text">
          Isi nominal, pilih kategori dan akun. Catatan bersifat opsional.
        </p>
      </div>

      {!activeAccounts.length ? (
        <div className="callout callout--warning">
          <Wallet aria-hidden="true" />
          <span>
            Belum ada akun aktif. <Link to="/accounts">Tambahkan akun</Link> sebelum mencatat
            transaksi.
          </span>
        </div>
      ) : null}

      <form className="card transaction-form" onSubmit={handleSubmit} noValidate>
        <TypeToggle value={form.type} onChange={handleTypeChange} />

        <AmountInput
          value={form.amount}
          onChange={(value) => updateField('amount', value)}
          error={errors.amount}
          autoFocus={!isEdit}
        />

        <FormField label="Kategori" error={errors.categoryId}>
          <CategoryPicker
            categories={typeCategories}
            value={form.categoryId}
            onChange={(value) => updateField('categoryId', value)}
            emptyText={`Belum ada kategori ${form.type === 'income' ? 'pemasukan' : 'pengeluaran'}. Tambahkan lewat halaman Kategori.`}
          />
          {!typeCategories.length ? (
            <Link to="/categories" className="card__link">
              Kelola kategori
            </Link>
          ) : null}
        </FormField>

        <div className="form-grid">
          <FormField label="Akun / Dompet" htmlFor="transaction-account" error={errors.accountId}>
            <select
              id="transaction-account"
              className="select"
              value={form.accountId}
              onChange={(event) => updateField('accountId', Number(event.target.value))}
            >
              <option value="">Pilih akun</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Tanggal" htmlFor="transaction-date" error={errors.date}>
            <input
              id="transaction-date"
              type="date"
              className="input"
              value={form.date}
              onChange={(event) => updateField('date', event.target.value)}
            />
            <div className="date-hints">
              <button
                type="button"
                className="date-hint"
                onClick={() => updateField('date', todayISO())}
              >
                Hari ini
              </button>
              <button
                type="button"
                className="date-hint"
                onClick={() => updateField('date', getYesterdayISO())}
              >
                Kemarin
              </button>
            </div>
          </FormField>

          <FormField label="Waktu" htmlFor="transaction-time" optional>
            <input
              id="transaction-time"
              type="time"
              className="input"
              value={form.time}
              onChange={(event) => updateField('time', event.target.value)}
            />
          </FormField>

          <FormField
            label="Catatan"
            htmlFor="transaction-note"
            optional
            error={errors.note}
            hint={`${form.note.length}/200 karakter`}
            className="form-grid__full"
          >
            <textarea
              id="transaction-note"
              className="textarea"
              maxLength={200}
              placeholder="Contoh: makan siang, bensin, gaji bulan ini…"
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
            />
          </FormField>
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/transaction/${existing.id}` : '/'} className="btn btn--ghost">
            Batal
          </Link>
          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={saving || !activeAccounts.length}
          >
            <Save aria-hidden="true" />
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </div>
  );
}
