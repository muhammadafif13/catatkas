import { db } from './database';

const DATA_TABLES = [
  db.transactions,
  db.categories,
  db.accounts,
  db.budgets,
  db.transfers,
  db.settings,
];

export async function clearCache() {
  await db.open();
  await db.transaction('rw', ...DATA_TABLES, db.meta, async () => {
    await Promise.all(DATA_TABLES.map((table) => table.clear()));
    await db.meta.clear();
  });
}

export async function getMeta(key) {
  const row = await db.meta.get(key);
  return row?.value;
}

export async function setMeta(key, value) {
  await db.meta.put({ key, value });
}

export async function prepareCacheForUser(userId) {
  await db.open();
  const owner = await getMeta('ownerId');
  if (owner && owner !== userId) {
    await clearCache();
  }
  await setMeta('ownerId', userId);
}

export async function replaceCache(snapshot, userId) {
  await db.open();
  await db.transaction('rw', ...DATA_TABLES, db.meta, async () => {
    await Promise.all(DATA_TABLES.map((table) => table.clear()));

    if (snapshot.transactions?.length) await db.transactions.bulkPut(snapshot.transactions);
    if (snapshot.categories?.length) await db.categories.bulkPut(snapshot.categories);
    if (snapshot.accounts?.length) await db.accounts.bulkPut(snapshot.accounts);
    if (snapshot.budgets?.length) await db.budgets.bulkPut(snapshot.budgets);
    if (snapshot.transfers?.length) await db.transfers.bulkPut(snapshot.transfers);

    const settingsRows = Object.entries(snapshot.settings || {}).map(([key, value]) => ({
      key,
      value,
    }));
    if (settingsRows.length) await db.settings.bulkPut(settingsRows);

    await db.meta.put({ key: 'ownerId', value: userId });
    await db.meta.put({ key: 'cachedAt', value: new Date().toISOString() });
  });
}

export async function getCachedAt() {
  return getMeta('cachedAt');
}
