import { db } from './database';
import { getNextOrder, sortByOrder } from '../utils/helpers';
import { assertOnline, friendlyCloudError, getSupabase } from '../lib/supabase';
import { categoryFromRow, categoryToRow } from '../services/mappers';

export async function getAllCategories() {
  return sortByOrder(await db.categories.toArray());
}

export async function getCategoryById(id) {
  return db.categories.get(Number(id));
}

export async function createCategory(data) {
  assertOnline();
  const existing = await db.categories.toArray();
  const type = data.type === 'income' ? 'income' : 'expense';
  const payload = {
    type,
    name: String(data.name || '').trim(),
    icon: data.icon || '📦',
    color: data.color || '#6366f1',
    isDefault: Boolean(data.isDefault),
    order: data.order ?? getNextOrder(existing.filter((category) => category.type === type)),
  };
  const client = getSupabase();
  const { data: row, error } = await client
    .from('categories')
    .insert(categoryToRow(payload))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const category = categoryFromRow(row);
  await db.categories.put(category);
  return category;
}

export async function updateCategory(id, data) {
  assertOnline();
  const key = Number(id);
  const existing = await db.categories.get(key);
  if (!existing) throw new Error('Kategori tidak ditemukan.');

  const payload = {
    ...existing,
    name: String(data.name ?? existing.name).trim(),
    icon: data.icon ?? existing.icon,
    color: data.color ?? existing.color,
    order: data.order ?? existing.order,
  };
  const client = getSupabase();
  const { data: row, error } = await client
    .from('categories')
    .update(categoryToRow(payload))
    .eq('id', key)
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const category = categoryFromRow(row);
  await db.categories.put(category);
  return category;
}

export async function deleteCategory(id) {
  assertOnline();
  const key = Number(id);
  const { error } = await getSupabase().from('categories').delete().eq('id', key);
  if (error) throw new Error(friendlyCloudError(error));
  await db.categories.delete(key);
}

export async function countCategories() {
  return db.categories.count();
}
