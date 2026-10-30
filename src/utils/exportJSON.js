import { BACKUP_VERSION } from './constants';

export function buildBackup(snapshot) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions: snapshot.transactions || [],
      categories: snapshot.categories || [],
      accounts: snapshot.accounts || [],
      budgets: snapshot.budgets || [],
      transfers: snapshot.transfers || [],
      settings: snapshot.settings || {},
    },
  };
}

export function getJSONFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `catatkas-backup-${year}-${month}-${day}.json`;
}

export function validateBackupPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['File backup tidak valid.'] };
  }
  if (!payload.version || typeof payload.version !== 'string') {
    errors.push('Versi backup tidak ditemukan.');
  }
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    errors.push('Data backup tidak ditemukan.');
  }

  const data = payload.data || {};
  const requiredArrays = ['transactions', 'categories', 'accounts'];
  requiredArrays.forEach((key) => {
    if (!Array.isArray(data[key])) errors.push(`Bagian "${key}" harus berupa array.`);
  });
  ['budgets', 'transfers'].forEach((key) => {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      errors.push(`Bagian "${key}" harus berupa array.`);
    }
  });
  if (data.settings !== undefined && (typeof data.settings !== 'object' || Array.isArray(data.settings))) {
    errors.push('Bagian "settings" harus berupa objek.');
  }

  if (Array.isArray(data.transactions)) {
    data.transactions.forEach((transaction, index) => {
      if (!transaction || typeof transaction !== 'object') {
        errors.push(`Transaksi ke-${index + 1} tidak valid.`);
        return;
      }
      if (!['income', 'expense'].includes(transaction.type)) {
        errors.push(`Jenis transaksi ke-${index + 1} tidak valid.`);
      }
      if (!Number.isFinite(Number(transaction.amount))) {
        errors.push(`Nominal transaksi ke-${index + 1} tidak valid.`);
      }
      if (!transaction.date) {
        errors.push(`Tanggal transaksi ke-${index + 1} tidak valid.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function getBackupSummary(payload) {
  const data = payload?.data || {};
  return {
    exportedAt: payload?.exportedAt || null,
    version: payload?.version || '-',
    transactions: data.transactions?.length || 0,
    categories: data.categories?.length || 0,
    accounts: data.accounts?.length || 0,
    budgets: data.budgets?.length || 0,
    transfers: data.transfers?.length || 0,
  };
}
