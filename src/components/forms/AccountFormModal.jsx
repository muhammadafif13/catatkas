import { useEffect, useState } from 'react';
import FormField from './FormField';
import Modal from '../ui/Modal';
import { useAccountStore } from '../../stores/useAccountStore';
import { toast } from '../../stores/useUIStore';
import { COLOR_OPTIONS, EMOJI_OPTIONS } from '../../utils/constants';
import { formatAmountInput, parseCurrencyInput } from '../../utils/formatCurrency';
import { getErrorMessage } from '../../utils/helpers';
import { validateAccount } from '../../utils/validation';

export default function AccountFormModal({ open, onClose, account = null }) {
  const accounts = useAccountStore((state) => state.accounts);
  const addAccount = useAccountStore((state) => state.addAccount);
  const updateAccount = useAccountStore((state) => state.updateAccount);
  const [form, setForm] = useState({
    name: '',
    icon: EMOJI_OPTIONS[0],
    color: '#6366f1',
    initialBalance: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: account?.name || '',
      icon: account?.icon || EMOJI_OPTIONS[0],
      color: account?.color || '#6366f1',
      initialBalance: account?.initialBalance || 0,
      isActive: account?.isActive !== false,
    });
    setErrors({});
  }, [open, account]);

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
    const validationErrors = validateAccount(form, accounts, account?.id || null);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (account) {
        await updateAccount(account.id, form);
        toast.success('Akun berhasil diperbarui.');
      } else {
        await addAccount(form);
        toast.success('Akun berhasil ditambahkan.');
      }
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
      title={account ? 'Edit akun' : 'Tambah akun'}
      description="Saldo saat ini dihitung otomatis dari saldo awal dan transaksi."
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="account-form" className="btn btn--primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Akun'}
          </button>
        </>
      }
    >
      <form id="account-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <FormField label="Nama akun" htmlFor="account-name" error={errors.name} full>
          <input
            id="account-name"
            className="input"
            type="text"
            maxLength={40}
            placeholder="Contoh: BCA, GoPay, Dompet"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </FormField>

        <FormField label="Saldo awal" htmlFor="account-balance" error={errors.initialBalance} full>
          <div className="input-wrap">
            <span className="input-prefix" aria-hidden="true">
              Rp
            </span>
            <input
              id="account-balance"
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatAmountInput(form.initialBalance)}
              onChange={(event) =>
                update('initialBalance', parseCurrencyInput(event.target.value))
              }
            />
          </div>
        </FormField>

        <FormField label="Ikon" error={errors.icon} full>
          <div className="emoji-grid">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-option${form.icon === emoji ? ' is-selected' : ''}`}
                onClick={() => update('icon', emoji)}
                aria-pressed={form.icon === emoji}
                aria-label={`Pilih ikon ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Warna" error={errors.color} full>
          <div className="color-grid">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-option${form.color === color ? ' is-selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => update('color', color)}
                aria-pressed={form.color === color}
                aria-label={`Pilih warna ${color}`}
              />
            ))}
          </div>
        </FormField>

        {account ? (
          <label className="checkbox-row form-grid__full">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => update('isActive', event.target.checked)}
            />
            <span>
              Akun aktif
              <span className="field__hint">
                Akun nonaktif tetap menyimpan datanya, tetapi tidak muncul di pilihan transaksi.
              </span>
            </span>
          </label>
        ) : null}
      </form>
    </Modal>
  );
}
