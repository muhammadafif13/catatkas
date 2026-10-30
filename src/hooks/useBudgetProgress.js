import { useMemo } from 'react';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { getBudgetSummaries } from '../utils/calculations';

export function useBudgetProgress(period) {
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useCategoryStore((state) => state.categories);
  const transactions = useTransactionStore((state) => state.transactions);

  return useMemo(() => {
    const categoryMap = new Map(categories.map((category) => [Number(category.id), category]));
    return getBudgetSummaries(budgets, transactions, period)
      .map((summary) => ({
        ...summary,
        category: categoryMap.get(Number(summary.categoryId)) || null,
      }))
      .sort((a, b) => {
        const orderA = Number(a.category?.order) || 0;
        const orderB = Number(b.category?.order) || 0;
        return orderA - orderB;
      });
  }, [budgets, categories, transactions, period]);
}
