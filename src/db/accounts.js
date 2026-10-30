import { db } from './database';
import { getNextOrder, sortByOrder } from '../utils/helpers';
import { assertOnline, friendlyCloudError, getSupabase } from '../lib/supabase';
import { accountFromRow, accountToRow } from '../services/mappers';

export async function getAllAccounts() {
  return sortByOrder(await db.accounts.toArray());
}

export async function getAccountById(id) {
  return db.accounts.get(Number(id));
}

export async function createAccount(data) {
  assertOnline();
  const existing = await db.accounts.toArray();
  const payload = {
    name: String(data.name || '').trim(),
    icon: data.icon || '💵',
    color: data.color || '#6366f1',
    initialBalance: Math.round(Number(data.initialBalance) || 0),
    isDefault: Boolean(data.isDefault),
    isActive: data.isActive !== false,
    order: data.order ?? getNextOrder(existing),
  };
  const client = getSupabase();
  const { data: row, error } = await client
    .from('accounts')
    .insert(accountToRow(payload))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const account = accountFromRow(row);
  await db.accounts.put(account);
  return account;
}

export async function updateAccount(id, data) {
  assertOnline();
  const key = Number(id);
  const existing = await db.accounts.get(key);
  if (!existing) throw new Error('Akun tidak ditemukan.');

  const payload = {
    ...existing,
    name: String(data.name ?? existing.name).trim(),
    icon: data.icon ?? existing.icon,
    color: data.color ?? existing.color,
    initialBalance: Math.round(Number(data.initialBalance ?? existing.initialBalance) || 0),
    isActive: data.isActive ?? existing.isActive,
    order: data.order ?? existing.order,
  };
  const client = getSupabase();
  const { data: row, error } = await client
    .from('accounts')
    .update(accountToRow(payload))
    .eq('id', key)
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const account = accountFromRow(row);
  await db.accounts.put(account);
  return account;
}

export async function deleteAccount(id) {
  assertOnline();
  const key = Number(id);
  const { error } = await getSupabase().from('accounts').delete().eq('id', key);
  if (error) throw new Error(friendlyCloudError(error));
  await db.accounts.delete(key);
}

export async function countAccounts() {
  return db.accounts.count();
}
