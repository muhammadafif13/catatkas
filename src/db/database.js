import Dexie from 'dexie';
import { DATABASE_NAME } from '../utils/constants';

export const db = new Dexie(DATABASE_NAME);

db.version(1).stores({
  transactions: 'id, type, categoryId, accountId, date, createdAt',
  categories: 'id, type, name',
  accounts: 'id, name',
  budgets: 'id, categoryId, period, [categoryId+period]',
  transfers: 'id, fromAccountId, toAccountId, date',
  settings: 'key',
  meta: 'key',
});

export default db;
