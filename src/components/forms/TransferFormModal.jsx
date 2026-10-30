import { useEffect, useMemo, useState } from 'react';
import AmountInput from './AmountInput';
import FormField from './FormField';
import Modal from '../ui/Modal';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransferStore } from '../../stores/useTransferStore';
import { toast } from '../../stores/useUIStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { nowTime, todayISO } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/helpers';
import { validateTransfer } from '../../utils/validation';
import { useBalances } from '../../hooks/useAccountBalance';

export default function TransferFormModal({ open, onClose }) {
  const accounts = useAccountStore((state) => state.accounts);
  const addTransfer = useTransferStore((state) => state.addTransfer);
  const { items } = useBalances();
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.isActive !== false),
    [accounts],
  );
  const [form, setForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    date: todayISO(),
    time: nowTime(),
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      fromAccountId: activeAccounts[0]?.id || '',
      toAccountId: activeAccounts[1]?.id || '',
      amount: 0,
      date: todayISO(),
      time: nowTime(),
      note: '',
    });
    setErrors({});
  }, [open, activeAccounts]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const sourceBalance = useMemo(() => {
    const found = items.find((item) => Number(item.account.id) === Number(form.fromAccountId));
    return found?.balance ?? 0;
  }, [items, form.fromAccountId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateTransfer(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await addTransfer({
        ...form,
        fromAccountId: Number(form.fromAccountId),
        toAccountId: Number(form.toAccountId),
        amount: Number(form.amount),
      });
      toast.success('Transfer berhasil dicatat.');
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
      title="Transfer antar akun"
      description="Pindahkan saldo tanpa mengubah total pemasukan atau pengeluaran."
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="transfer-form"
            className="btn btn--primary"
            disabled={saving || activeAccounts.length < 2}
          >
            {saving ? 'Menyimpan…' : 'Simpan Transfer'}
          </button>
        </>
      }
    >
      {activeAccounts.length < 2 ? (
        <div className="callout callout--warning">
          <span>Butuh minimal dua akun aktif untuk melakukan transfer.</span>
        </div>
      ) : (
        <form id="transfer-form" className="form-grid" onSubmit={handleSubmit} noValidate>
          <FormField label="Dari akun" htmlFor="transfer-from" error={errors.fromAccountId}>
            <select
              id="transfer-from"
              className="select"
              value={form.fromAccountId}
              onChange={(event) => update('fromAccountId', Number(event.target.value))}
            >
              <option value="">Pilih akun asal</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Ke akun" htmlFor="transfer-to" error={errors.toAccountId}>
            <select
              id="transfer-to"
              className="select"
              value={form.toAccountId}
              onChange={(event) => update('toAccountId', Number(event.target.value))}
            >
              <option value="">Pilih akun tujuan</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id} disabled={Number(account.id) === Number(form.fromAccountId)}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="callout callout--primary form-grid__full">
            <span>Saldo akun asal saat ini: {formatCurrency(sourceBalance)}</span>
          </div>

          <div className="form-grid__full">
            <AmountInput
              value={form.amount}
              onChange={(value) => update('amount', value)}
              error={errors.amount}
            />
          </div>

          <FormField label="Tanggal" htmlFor="transfer-date" error={errors.date}>
            <input
              id="transfer-date"
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => update('date', event.target.value)}
            />
          </FormField>

          <FormField label="Waktu" htmlFor="transfer-time" optional>
            <input
              id="transfer-time"
              className="input"
              type="time"
              value={form.time}
              onChange={(event) => update('time', event.target.value)}
            />
          </FormField>

          <FormField label="Catatan" htmlFor="transfer-note" optional error={errors.note} full>
            <textarea
              id="transfer-note"
              className="textarea"
              maxLength={200}
              placeholder="Contoh: isi saldo GoPay"
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}
