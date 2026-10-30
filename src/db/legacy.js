import Dexie from 'dexie';
import { LEGACY_DATABASE_NAME } from '../utils/constants';

function openLegacyDatabase() {
  const legacy = new Dexie(LEGACY_DATABASE_NAME);
  legacy.version(1).stores({
    transactions: '++id, type, categoryId, accountId, date, createdAt',
    categories: '++id, type, name',
    accounts: '++id, name',
    budgets: '++id, categoryId, period, [categoryId+period]',
    transfers: '++id, fromAccountId, toAccountId, date',
    settings: 'key',
  });
  return legacy;
}

export async function hasLegacyData() {
  if (typeof indexedDB === 'undefined') return false;
  if (!(await Dexie.exists(LEGACY_DATABASE_NAME))) return false;

  const legacy = openLegacyDatabase();
  try {
    await legacy.open();
    const count = await legacy.transactions.count();
    return count > 0;
  } catch {
    return false;
  } finally {
    legacy.close();
  }
}

export async function getLegacySnapshot() {
  if (!(await Dexie.exists(LEGACY_DATABASE_NAME))) return null;
  const legacy = openLegacyDatabase();
  try {
    await legacy.open();
    const [transactions, categories, accounts, budgets, transfers, settingRows] =
      await Promise.all([
        legacy.transactions.toArray(),
        legacy.categories.toArray(),
        legacy.accounts.toArray(),
        legacy.budgets.toArray(),
        legacy.transfers.toArray(),
        legacy.settings.toArray(),
      ]);

    if (!transactions.length && !categories.length && !accounts.length) return null;

    const settings = settingRows.reduce((result, row) => {
      result[row.key] = row.value;
      return result;
    }, {});

    return { transactions, categories, accounts, budgets, transfers, settings };
  } finally {
    legacy.close();
  }
}
