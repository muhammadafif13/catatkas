import { getSupabase, isOnline } from '../lib/supabase';
import { replaceCache } from '../db/cache';
import { useAccountStore } from '../stores/useAccountStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useTransferStore } from '../stores/useTransferStore';
import {
  accountFromRow,
  budgetFromRow,
  categoryFromRow,
  settingsRowsToObject,
  transactionFromRow,
  transferFromRow,
} from './mappers';

const PAGE_SIZE = 1000;

async function fetchAllRows(createQuery) {
  const rows = [];
  let from = 0;
  let page = [];

  do {
    const { data, error } = await createQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    page = data || [];
    rows.push(...page);
    from += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);

  return rows;
}

export async function fetchCloudSnapshot(userId) {
  if (!userId) throw new Error('Sesi pengguna tidak ditemukan.');
  const client = getSupabase();
  const [transactions, categories, accounts, budgets, transfers, settings] = await Promise.all([
    fetchAllRows(() =>
      client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false }),
    ),
    fetchAllRows(() =>
      client.from('categories').select('*').eq('user_id', userId).order('sort_order').order('id'),
    ),
    fetchAllRows(() =>
      client.from('accounts').select('*').eq('user_id', userId).order('sort_order').order('id'),
    ),
    fetchAllRows(() =>
      client.from('budgets').select('*').eq('user_id', userId).order('period').order('id'),
    ),
    fetchAllRows(() =>
      client
        .from('transfers')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false }),
    ),
    client.from('settings').select('key,value').eq('user_id', userId),
  ]);

  if (settings.error) throw settings.error;

  return {
    transactions: transactions.map(transactionFromRow),
    categories: categories.map(categoryFromRow),
    accounts: accounts.map(accountFromRow),
    budgets: budgets.map(budgetFromRow),
    transfers: transfers.map(transferFromRow),
    settings: settingsRowsToObject(settings.data || []),
  };
}

export async function syncUserData(userId) {
  if (!isOnline()) return null;
  const snapshot = await fetchCloudSnapshot(userId);
  await replaceCache(snapshot, userId);
  return snapshot;
}

export async function refreshDataStores() {
  await Promise.all([
    useAccountStore.getState().fetchAccounts(),
    useCategoryStore.getState().fetchCategories(),
    useTransactionStore.getState().fetchTransactions(),
    useBudgetStore.getState().fetchBudgets(),
    useTransferStore.getState().fetchTransfers(),
    useSettingsStore.getState().loadSettings(),
  ]);
}

export async function syncAndRefresh(userId) {
  await syncUserData(userId);
  await refreshDataStores();
}
