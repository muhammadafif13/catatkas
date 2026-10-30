import { TYPE_LABELS } from './constants';
import { sortTransactionsDesc } from './calculations';

export function escapeCSVValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCSV(transactions, categories = [], accounts = []) {
  const categoryMap = new Map(categories.map((category) => [Number(category.id), category]));
  const accountMap = new Map(accounts.map((account) => [Number(account.id), account]));
  const headers = ['Tanggal', 'Waktu', 'Jenis', 'Kategori', 'Akun', 'Jumlah', 'Catatan'];
  const rows = sortTransactionsDesc(transactions).map((transaction) => {
    const category = categoryMap.get(Number(transaction.categoryId));
    const account = accountMap.get(Number(transaction.accountId));
    return [
      transaction.date,
      transaction.time || '',
      TYPE_LABELS[transaction.type] || transaction.type,
      category?.name || 'Tanpa kategori',
      account?.name || 'Tanpa akun',
      Number(transaction.amount) || 0,
      transaction.note || '',
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCSVValue).join(',')).join('\r\n');
}

export function getCSVFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `catatkas-transaksi-${year}-${month}-${day}.csv`;
}
