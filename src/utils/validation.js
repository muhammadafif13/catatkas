import { isValidISODate } from './formatDate';

export function hasErrors(errors) {
  return Object.keys(errors || {}).length > 0;
}

export function validateTransaction(values = {}) {
  const errors = {};
  if (!['income', 'expense'].includes(values.type)) {
    errors.type = 'Pilih jenis transaksi.';
  }
  const amount = Number(values.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Nominal harus lebih dari 0.';
  }
  if (!values.categoryId) {
    errors.categoryId = 'Pilih kategori transaksi.';
  }
  if (!values.accountId) {
    errors.accountId = 'Pilih akun atau dompet.';
  }
  if (!isValidISODate(values.date)) {
    errors.date = 'Tanggal tidak valid.';
  }
  if (values.note && String(values.note).length > 200) {
    errors.note = 'Catatan maksimal 200 karakter.';
  }
  return errors;
}

export function validateCategory(values = {}, existingCategories = [], currentId = null) {
  const errors = {};
  const name = String(values.name || '').trim();
  if (!name) errors.name = 'Nama kategori wajib diisi.';
  if (name.length > 40) errors.name = 'Nama kategori maksimal 40 karakter.';
  if (!['income', 'expense'].includes(values.type)) errors.type = 'Pilih jenis kategori.';
  if (!values.icon) errors.icon = 'Pilih ikon kategori.';
  if (!/^#[0-9a-f]{6}$/i.test(String(values.color || ''))) {
    errors.color = 'Pilih warna yang valid.';
  }
  const duplicate = (existingCategories || []).find(
    (category) =>
      Number(category.id) !== Number(currentId) &&
      category.type === values.type &&
      String(category.name).trim().toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) errors.name = 'Kategori dengan nama ini sudah ada.';
  return errors;
}

export function validateAccount(values = {}, existingAccounts = [], currentId = null) {
  const errors = {};
  const name = String(values.name || '').trim();
  if (!name) errors.name = 'Nama akun wajib diisi.';
  if (name.length > 40) errors.name = 'Nama akun maksimal 40 karakter.';
  const balance = Number(values.initialBalance);
  if (!Number.isFinite(balance)) errors.initialBalance = 'Saldo awal tidak valid.';
  if (!values.icon) errors.icon = 'Pilih ikon akun.';
  if (!/^#[0-9a-f]{6}$/i.test(String(values.color || ''))) {
    errors.color = 'Pilih warna yang valid.';
  }
  const duplicate = (existingAccounts || []).find(
    (account) =>
      Number(account.id) !== Number(currentId) &&
      String(account.name).trim().toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) errors.name = 'Akun dengan nama ini sudah ada.';
  return errors;
}

export function validateBudget(values = {}) {
  const errors = {};
  if (!values.categoryId) errors.categoryId = 'Pilih kategori pengeluaran.';
  const amount = Number(values.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Batas anggaran harus lebih dari 0.';
  }
  const period = String(values.period || '');
  const [year, month] = period.split('-').map(Number);
  if (!/^\d{4}-\d{2}$/.test(period) || !year || month < 1 || month > 12) {
    errors.period = 'Periode anggaran tidak valid.';
  }
  return errors;
}

export function validateTransfer(values = {}) {
  const errors = {};
  if (!values.fromAccountId) errors.fromAccountId = 'Pilih akun asal.';
  if (!values.toAccountId) errors.toAccountId = 'Pilih akun tujuan.';
  if (
    values.fromAccountId &&
    values.toAccountId &&
    Number(values.fromAccountId) === Number(values.toAccountId)
  ) {
    errors.toAccountId = 'Akun asal dan tujuan harus berbeda.';
  }
  const amount = Number(values.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Nominal transfer harus lebih dari 0.';
  }
  if (!isValidISODate(values.date)) errors.date = 'Tanggal tidak valid.';
  if (values.note && String(values.note).length > 200) {
    errors.note = 'Catatan maksimal 200 karakter.';
  }
  return errors;
}
