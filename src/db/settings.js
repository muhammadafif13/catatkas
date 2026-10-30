import { db } from './database';
import { assertOnline, friendlyCloudError, getCurrentUserId, getSupabase } from '../lib/supabase';

export async function getAllSettings() {
  const rows = await db.settings.toArray();
  return rows.reduce((settings, row) => {
    settings[row.key] = row.value;
    return settings;
  }, {});
}

export async function getSetting(key) {
  const row = await db.settings.get(key);
  return row ? row.value : undefined;
}

export async function setSetting(key, value) {
  assertOnline();
  const userId = await getCurrentUserId();
  const client = getSupabase();
  const { error } = await client
    .from('settings')
    .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' });
  if (error) throw new Error(friendlyCloudError(error));
  await db.settings.put({ key, value });
  return value;
}

export async function setSettings(values) {
  assertOnline();
  const entries = Object.entries(values).map(([key, value]) => ({ key, value }));
  if (!entries.length) return;

  const userId = await getCurrentUserId();
  const client = getSupabase();
  const { error } = await client
    .from('settings')
    .upsert(
      entries.map((entry) => ({ user_id: userId, key: entry.key, value: entry.value })),
      { onConflict: 'user_id,key' },
    );
  if (error) throw new Error(friendlyCloudError(error));
  await db.settings.bulkPut(entries);
}
