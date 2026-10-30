import { describe, expect, it } from 'vitest';
import {
  filterTransactions,
  getAccountBalance,
  getActiveFilterCount,
  getBalanceTrend,
  getBudgetProgress,
  getCategoryBreakdown,
  getCategoryUsage,
  getDailyCashflow,
  getMonthTotals,
  getMonthlyComparison,
  getTopExpenses,
  getTotalBalance,
  getTotals,
  groupTransactionsByDate,
  sortTransactionsDesc,
} from '../calculations';

const categories = [
  { id: 1, name: 'Makanan', icon: '🍔', color: '#ef4444', type: 'expense' },
  { id: 2, name: 'Transportasi', icon: '🚗', color: '#f97316', type: 'expense' },
  { id: 3, name: 'Gaji', icon: '💵', color: '#22c55e', type: 'income' },
];

const transactions = [
  {
    id: 1,
    type: 'expense',
    amount: 50000,
    categoryId: 1,
    accountId: 1,
    date: '2026-10-02',
    time: '12:30',
    note: 'Makan siang',
    createdAt: '2026-10-02T05:30:00.000Z',
  },
  {
    id: 2,
    type: 'income',
    amount: 1000000,
    categoryId: 3,
    accountId: 2,
    date: '2026-10-01',
    time: '08:00',
    note: 'Gaji bulanan',
    createdAt: '2026-10-01T01:00:00.000Z',
  },
  {
    id: 3,
    type: 'expense',
    amount: 20000,
    categoryId: 2,
    accountId: 1,
    date: '2026-09-30',
    time: '18:00',
    note: 'Parkir',
    createdAt: '2026-09-30T11:00:00.000Z',
  },
  {
    id: 4,
    type: 'expense',
    amount: 70000,
    categoryId: 1,
    accountId: 1,
    date: '2026-10-02',
    time: '19:00',
    note: 'Makan malam',
    createdAt: '2026-10-02T12:00:00.000Z',
  },
];

describe('calculations', () => {
  it('sorts transactions newest first with time as tie-breaker', () => {
    expect(sortTransactionsDesc(transactions).map((item) => item.id)).toEqual([4, 1, 2, 3]);
  });

  it('filters by period, type, category, account, amount, and note', () => {
    expect(
      filterTransactions(transactions, {
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
      }),
    ).toHaveLength(3);

    expect(filterTransactions(transactions, { type: 'income' }).map((item) => item.id)).toEqual([
      2,
    ]);
    expect(
      filterTransactions(transactions, { categoryIds: [1] }).map((item) => item.id),
    ).toEqual([1, 4]);
    expect(
      filterTransactions(transactions, { accountId: 2 }).map((item) => item.id),
    ).toEqual([2]);
    expect(
      filterTransactions(transactions, { minAmount: 30000, maxAmount: 80000 }).map(
        (item) => item.id,
      ),
    ).toEqual([1, 4]);
    expect(filterTransactions(transactions, { search: 'parkir' }).map((item) => item.id)).toEqual([
      3,
    ]);
  });

  it('calculates income, expense, and net totals', () => {
    expect(getTotals(transactions)).toEqual({
      income: 1000000,
      expense: 140000,
      net: 860000,
      count: 4,
    });
  });

  it('calculates totals for a specific month', () => {
    expect(getMonthTotals(transactions, '2026-10')).toEqual({
      income: 1000000,
      expense: 120000,
      net: 880000,
      count: 3,
    });
  });

  it('calculates account balances including transfers', () => {
    const account = { id: 1, initialBalance: 200000 };
    const transfers = [
      { fromAccountId: 1, toAccountId: 2, amount: 15000 },
      { fromAccountId: 2, toAccountId: 1, amount: 5000 },
    ];
    expect(getAccountBalance(account, transactions, transfers)).toBe(50000);
    expect(getAccountBalance(null, transactions)).toBe(0);
    expect(
      getTotalBalance(
        [
          { id: 1, initialBalance: 200000 },
          { id: 2, initialBalance: 0 },
        ],
        transactions,
        transfers,
      ),
    ).toBe(1060000);
  });

  it('counts category usage in transactions and budgets', () => {
    expect(
      getCategoryUsage(transactions, [{ categoryId: 1 }], 1),
    ).toEqual({
      transactionCount: 2,
      budgetCount: 1,
    });
  });

  it('calculates budget progress and status', () => {
    const budget = { id: 1, categoryId: 1, amount: 100000, period: '2026-10' };
    const progress = getBudgetProgress(budget, transactions);
    expect(progress.spent).toBe(120000);
    expect(progress.percentage).toBe(120);
    expect(progress.cappedPercentage).toBe(100);
    expect(progress.status).toBe('over');
    expect(progress.isOverBudget).toBe(true);
    expect(progress.remaining).toBe(-20000);
  });

  it('builds category breakdown sorted by amount', () => {
    const breakdown = getCategoryBreakdown(transactions, categories, '2026-10', 'expense');
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toMatchObject({
      categoryId: 1,
      name: 'Makanan',
      amount: 120000,
      count: 2,
    });
    expect(breakdown[0].percentage).toBe(100);
  });

  it('compares current month against the previous month', () => {
    const comparison = getMonthlyComparison(transactions, '2026-10');
    expect(comparison.current.expense).toBe(120000);
    expect(comparison.previous.expense).toBe(20000);
    expect(comparison.delta.expense).toBe(100000);
    expect(comparison.percent.expense).toBe(500);
    expect(comparison.previousPeriod).toBe('2026-09');
  });

  it('groups transactions by date with daily totals', () => {
    const groups = groupTransactionsByDate(transactions);
    expect(groups.map((group) => group.date)).toEqual(['2026-10-02', '2026-10-01', '2026-09-30']);
    expect(groups[0].transactions).toHaveLength(2);
    expect(groups[0].totals.expense).toBe(120000);
  });

  it('returns the most recent transactions and top expenses', () => {
    expect(sortTransactionsDesc(transactions).slice(0, 2).map((item) => item.id)).toEqual([4, 1]);
    expect(getTopExpenses(transactions, '2026-10', 2).map((item) => item.id)).toEqual([4, 1]);
  });

  it('counts active filters', () => {
    expect(
      getActiveFilterCount({
        dateFrom: '2026-10-01',
        type: 'expense',
        categoryIds: [1],
        accountId: 2,
        minAmount: 1000,
        maxAmount: 5000,
        search: 'makan',
      }),
    ).toBe(7);
    expect(getActiveFilterCount({})).toBe(0);
  });

  it('builds daily cashflow for a fixed date range', () => {
    const cashflow = getDailyCashflow(transactions, 2, new Date(2026, 9, 2));
    expect(cashflow.dates).toEqual(['2026-10-01', '2026-10-02']);
    expect(cashflow.income).toEqual([1000000, 0]);
    expect(cashflow.expense).toEqual([0, 120000]);
  });

  it('builds balance trend including transactions before the window', () => {
    const accounts = [{ id: 1, initialBalance: 100000 }];
    const trend = getBalanceTrend(accounts, transactions, 2, new Date(2026, 9, 2));
    expect(trend.dates).toEqual(['2026-10-01', '2026-10-02']);
    expect(trend.values[0]).toBe(1080000);
    expect(trend.values[1]).toBe(960000);
  });
});
