import { friendlyCloudError, getSupabase } from '../lib/supabase';
import {
  accountFromRow,
  budgetFromRow,
  categoryFromRow,
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
    if (error) throw new Error(friendlyCloudError(error));
    page = data || [];
    rows.push(...page);
    from += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);

  return rows;
}

export async function getAdminOverview() {
  const { data, error } = await getSupabase().rpc('admin_dashboard_stats');
  if (error) throw new Error(friendlyCloudError(error));
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalUsers: Number(row?.total_users) || 0,
    suspendedUsers: Number(row?.suspended_users) || 0,
    totalTransactions: Number(row?.total_transactions) || 0,
    totalIncome: Number(row?.total_income) || 0,
    totalExpense: Number(row?.total_expense) || 0,
    activeAds: Number(row?.active_ads) || 0,
  };
}

export async function getAdminUsers() {
  const { data, error } = await getSupabase().rpc('admin_user_summaries');
  if (error) throw new Error(friendlyCloudError(error));

  return (data || []).map((row) => ({
    id: row.id,
    email: row.email || '',
    fullName: row.full_name || '',
    role: row.role,
    isSuspended: Boolean(row.is_suspended),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    transactionCount: Number(row.transaction_count) || 0,
    accountCount: Number(row.account_count) || 0,
    lastTransactionAt: row.last_transaction_at,
  }));
}

export async function runAdminUserAction(userId, action) {
  const { data, error } = await getSupabase().functions.invoke('admin-users', {
    body: { userId, action },
  });

  if (error) {
    let message = error.message;
    try {
      const body = await error.context?.json();
      message = body?.error || message;
    } catch {
      // Fall back to the function invocation error.
    }
    throw new Error(message || 'Aksi admin gagal.');
  }

  if (data?.error) throw new Error(data.error);
  return data || { ok: true };
}

export async function getUserFinancialData(userId) {
  const client = getSupabase();
  const [transactions, categories, accounts, budgets, transfers] = await Promise.all([
    fetchAllRows(() =>
      client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
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
        .order('id', { ascending: false }),
    ),
  ]);

  return {
    transactions: transactions.map(transactionFromRow),
    categories: categories.map(categoryFromRow),
    accounts: accounts.map(accountFromRow),
    budgets: budgets.map(budgetFromRow),
    transfers: transfers.map(transferFromRow),
  };
}
