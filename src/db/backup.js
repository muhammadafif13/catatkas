import { db } from './database';
import { getAllSettings } from './settings';
import {
  assertOnline,
  friendlyCloudError,
  getCurrentUserId,
  getSupabase,
} from '../lib/supabase';
import { syncUserData } from '../services/sync';

export async function getDatabaseSnapshot() {
  const [transactions, categories, accounts, budgets, transfers, settings] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.accounts.toArray(),
    db.budgets.toArray(),
    db.transfers.toArray(),
    getAllSettings(),
  ]);

  return { transactions, categories, accounts, budgets, transfers, settings };
}

export async function restoreDatabaseSnapshot(snapshot) {
  assertOnline();
  const client = getSupabase();
  const { error } = await client.rpc('replace_my_data', { payload: snapshot });
  if (error) throw new Error(friendlyCloudError(error));

  const userId = await getCurrentUserId();
  await syncUserData(userId);
}

export async function clearAllData() {
  assertOnline();
  const client = getSupabase();
  const { error } = await client.rpc('reset_my_data');
  if (error) throw new Error(friendlyCloudError(error));

  const userId = await getCurrentUserId();
  await syncUserData(userId);
}
