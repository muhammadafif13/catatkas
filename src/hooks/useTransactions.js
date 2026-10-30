import { useMemo } from 'react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { filterTransactions, getTotals } from '../utils/calculations';

export function useTransactions(filters = {}) {
  const transactions = useTransactionStore((state) => state.transactions);
  const {
    dateFrom = '',
    dateTo = '',
    type = 'all',
    categoryIds = [],
    accountId = 'all',
    minAmount = '',
    maxAmount = '',
    search = '',
  } = filters;
  const categoryKey = categoryIds.join(',');

  return useMemo(() => {
    const selectedCategories = categoryKey
      ? categoryKey.split(',').map(Number).filter(Number.isFinite)
      : [];
    const filtered = filterTransactions(transactions, {
      dateFrom,
      dateTo,
      type,
      categoryIds: selectedCategories,
      accountId,
      minAmount,
      maxAmount,
      search,
    });
    return {
      transactions: filtered,
      totals: getTotals(filtered),
    };
  }, [
    transactions,
    dateFrom,
    dateTo,
    type,
    categoryKey,
    accountId,
    minAmount,
    maxAmount,
    search,
  ]);
}
