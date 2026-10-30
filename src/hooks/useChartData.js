import { useMemo } from 'react';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import {
  getBalanceTrend,
  getCategoryBreakdown,
  getDailyCashflow,
  getMonthlyComparison,
  getTotals,
  getMonthTransactions,
} from '../utils/calculations';
import { formatMonthShort } from '../utils/formatDate';

export function useExpensePieData(period) {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);

  return useMemo(() => {
    const breakdown = getCategoryBreakdown(transactions, categories, period, 'expense');
    return {
      breakdown,
      labels: breakdown.map((item) => item.name),
      values: breakdown.map((item) => item.amount),
      colors: breakdown.map((item) => item.color),
      total: breakdown.reduce((sum, item) => sum + item.amount, 0),
    };
  }, [transactions, categories, period]);
}

export function useIncomeBreakdown(period) {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);

  return useMemo(() => {
    const breakdown = getCategoryBreakdown(transactions, categories, period, 'income');
    return {
      breakdown,
      total: breakdown.reduce((sum, item) => sum + item.amount, 0),
    };
  }, [transactions, categories, period]);
}

export function useCashflowChartData(days = 7) {
  const transactions = useTransactionStore((state) => state.transactions);
  return useMemo(() => getDailyCashflow(transactions, days), [transactions, days]);
}

export function useBalanceTrendChartData(days = 30) {
  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);
  return useMemo(
    () => getBalanceTrend(accounts, transactions, days),
    [accounts, transactions, days],
  );
}

export function useReportChartData(period) {
  const transactions = useTransactionStore((state) => state.transactions);

  return useMemo(() => {
    const comparison = getMonthlyComparison(transactions, period);
    const currentTransactions = getMonthTransactions(transactions, period);
    return {
      labels: [formatMonthShort(comparison.previousPeriod), formatMonthShort(period)],
      income: [comparison.previous.income, comparison.current.income],
      expense: [comparison.previous.expense, comparison.current.expense],
      current: comparison.current,
      previous: comparison.previous,
      currentTotals: comparison.current,
      previousTotals: comparison.previous,
      previousPeriod: comparison.previousPeriod,
      percent: comparison.percent,
      currentTransactionTotals: getTotals(currentTransactions),
    };
  }, [transactions, period]);
}
