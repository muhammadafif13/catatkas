import { db } from './database';
import { nowTime, todayISO } from '../utils/formatDate';
import { sortTransactionsDesc } from '../utils/calculations';
import { assertOnline, friendlyCloudError, getSupabase } from '../lib/supabase';
import { transactionFromRow, transactionToRow } from '../services/mappers';

function normalizePayload(data = {}) {
  return {
    type: data.type === 'income' ? 'income' : 'expense',
    amount: Math.max(0, Math.round(Number(data.amount) || 0)),
    categoryId: Number(data.categoryId),
    accountId: Number(data.accountId),
    date: data.date || todayISO(),
    time: data.time || nowTime(),
    note: String(data.note || '').trim(),
  };
}

export async function getAllTransactions() {
  return sortTransactionsDesc(await db.transactions.toArray());
}

export async function getTransactionById(id) {
  return db.transactions.get(Number(id));
}

export async function createTransaction(data) {
  assertOnline();
  const payload = normalizePayload(data);
  const client = getSupabase();
  const { data: row, error } = await client
    .from('transactions')
    .insert(transactionToRow(payload))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const transaction = transactionFromRow(row);
  await db.transactions.put(transaction);
  return transaction;
}

export async function updateTransaction(id, data) {
  assertOnline();
  const key = Number(id);
  const existing = await db.transactions.get(key);
  if (!existing) throw new Error('Transaksi tidak ditemukan.');

  const payload = normalizePayload({
    ...existing,
    ...data,
  });
  const client = getSupabase();
  const { data: row, error } = await client
    .from('transactions')
    .update(transactionToRow(payload))
    .eq('id', key)
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const transaction = transactionFromRow(row);
  await db.transactions.put(transaction);
  return transaction;
}

export async function deleteTransaction(id) {
  assertOnline();
  const key = Number(id);
  const { error } = await getSupabase().from('transactions').delete().eq('id', key);
  if (error) throw new Error(friendlyCloudError(error));
  await db.transactions.delete(key);
}

export async function countTransactions() {
  return db.transactions.count();
}
