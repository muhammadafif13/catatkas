import { db } from './database';
import { nowTime, todayISO } from '../utils/formatDate';
import { assertOnline, friendlyCloudError, getSupabase } from '../lib/supabase';
import { transferFromRow } from '../services/mappers';

function sortTransfers(transfers) {
  return [...transfers].sort((a, b) => {
    if (a.date !== b.date) return String(b.date).localeCompare(String(a.date));
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    if (timeA !== timeB) return timeB.localeCompare(timeA);
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

export async function getAllTransfers() {
  return sortTransfers(await db.transfers.toArray());
}

export async function createTransfer(data) {
  assertOnline();
  const payload = {
    fromAccountId: Number(data.fromAccountId),
    toAccountId: Number(data.toAccountId),
    amount: Math.max(0, Math.round(Number(data.amount) || 0)),
    date: data.date || todayISO(),
    time: data.time || nowTime(),
    note: String(data.note || '').trim(),
  };
  const client = getSupabase();
  const { data: row, error } = await client
    .from('transfers')
    .insert({
      from_account_id: payload.fromAccountId,
      to_account_id: payload.toAccountId,
      amount: payload.amount,
      date: payload.date,
      time: payload.time,
      note: payload.note,
    })
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const transfer = transferFromRow(row);
  await db.transfers.put(transfer);
  return transfer;
}

export async function deleteTransfer(id) {
  assertOnline();
  const key = Number(id);
  const { error } = await getSupabase().from('transfers').delete().eq('id', key);
  if (error) throw new Error(friendlyCloudError(error));
  await db.transfers.delete(key);
}

export async function countTransfers() {
  return db.transfers.count();
}
