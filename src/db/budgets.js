import { db } from './database';
import { assertOnline, friendlyCloudError, getSupabase } from '../lib/supabase';
import { budgetFromRow } from '../services/mappers';

function normalizeBudgetData(data = {}) {
  return {
    categoryId: Number(data.categoryId),
    period: data.period,
    amount: Math.max(0, Math.round(Number(data.amount) || 0)),
  };
}

export async function getAllBudgets() {
  return db.budgets.toArray();
}

export async function getBudgetsByPeriod(period) {
  return db.budgets.where('period').equals(period).toArray();
}

export async function getBudgetByCategoryAndPeriod(categoryId, period) {
  return db.budgets
    .where('[categoryId+period]')
    .equals([Number(categoryId), period])
    .first();
}

export async function saveBudget(data) {
  assertOnline();
  const budgetId = data.id == null ? null : Number(data.id);
  const payload = normalizeBudgetData(data);
  const existing = await getBudgetByCategoryAndPeriod(payload.categoryId, payload.period);
  const client = getSupabase();

  if (budgetId) {
    const current = await db.budgets.get(budgetId);
    if (!current) throw new Error('Budget tidak ditemukan.');
    if (existing && Number(existing.id) !== budgetId) {
      throw new Error('Budget untuk kategori dan periode ini sudah ada.');
    }

    const { data: row, error } = await client
      .from('budgets')
      .update({
        category_id: payload.categoryId,
        period: payload.period,
        amount: payload.amount,
      })
      .eq('id', budgetId)
      .select()
      .single();
    if (error) throw new Error(friendlyCloudError(error));

    const budget = budgetFromRow(row);
    await db.budgets.put(budget);
    return budget;
  }

  if (existing) {
    const { data: row, error } = await client
      .from('budgets')
      .update({ amount: payload.amount })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(friendlyCloudError(error));

    const budget = budgetFromRow(row);
    await db.budgets.put(budget);
    return budget;
  }

  const { data: row, error } = await client
    .from('budgets')
    .insert({
      category_id: payload.categoryId,
      period: payload.period,
      amount: payload.amount,
    })
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));

  const budget = budgetFromRow(row);
  await db.budgets.put(budget);
  return budget;
}

export async function deleteBudget(id) {
  assertOnline();
  const key = Number(id);
  const { error } = await getSupabase().from('budgets').delete().eq('id', key);
  if (error) throw new Error(friendlyCloudError(error));
  await db.budgets.delete(key);
}

export async function countBudgets() {
  return db.budgets.count();
}
