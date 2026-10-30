import { CHART_FALLBACK_COLORS } from './constants';
import {
  formatDateShort,
  formatDayMonth,
  formatWeekdayShort,
  getLastNDays,
  getMonthRange,
  getCurrentPeriod,
  shiftMonth,
} from './formatDate';
import { sortByOrder } from './helpers';

export function sortTransactionsDesc(transactions) {
  return [...(transactions || [])].sort((a, b) => {
    if (a.date !== b.date) return String(b.date).localeCompare(String(a.date));
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    if (timeA !== timeB) return timeB.localeCompare(timeA);
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

export function sortTransactionsAsc(transactions) {
  return [...(transactions || [])].sort((a, b) => {
    if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });
}

export function filterTransactions(transactions, filters = {}) {
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

  const selectedCategories = Array.isArray(categoryIds)
    ? categoryIds.map(Number).filter(Number.isFinite)
    : [];
  const selectedAccount = accountId === 'all' || accountId === '' ? null : Number(accountId);
  const min = minAmount === '' || minAmount === null ? null : Number(minAmount);
  const max = maxAmount === '' || maxAmount === null ? null : Number(maxAmount);
  const query = String(search || '').trim().toLowerCase();

  return (transactions || []).filter((transaction) => {
    if (dateFrom && transaction.date < dateFrom) return false;
    if (dateTo && transaction.date > dateTo) return false;
    if (type !== 'all' && transaction.type !== type) return false;
    if (selectedCategories.length && !selectedCategories.includes(Number(transaction.categoryId))) {
      return false;
    }
    if (selectedAccount !== null && Number(transaction.accountId) !== selectedAccount) return false;
    if (min !== null && Number.isFinite(min) && Number(transaction.amount) < min) return false;
    if (max !== null && Number.isFinite(max) && Number(transaction.amount) > max) return false;
    if (query && !String(transaction.note || '').toLowerCase().includes(query)) return false;
    return true;
  });
}

export function getTotals(transactions) {
  const result = { income: 0, expense: 0, net: 0, count: 0 };
  (transactions || []).forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    result.count += 1;
    if (transaction.type === 'income') result.income += amount;
    if (transaction.type === 'expense') result.expense += amount;
  });
  result.net = result.income - result.expense;
  return result;
}

export function getMonthTransactions(transactions, period) {
  const { start, end } = getMonthRange(period);
  if (!start || !end) return [];
  return (transactions || []).filter(
    (transaction) => transaction.date >= start && transaction.date <= end,
  );
}

export function getMonthTotals(transactions, period) {
  return getTotals(getMonthTransactions(transactions, period));
}

export function getAccountBalance(account, transactions, transfers = []) {
  if (!account) return 0;
  const accountId = Number(account.id);
  let balance = Number(account.initialBalance) || 0;

  (transactions || []).forEach((transaction) => {
    if (Number(transaction.accountId) !== accountId) return;
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'income') balance += amount;
    if (transaction.type === 'expense') balance -= amount;
  });

  (transfers || []).forEach((transfer) => {
    const amount = Number(transfer.amount) || 0;
    if (Number(transfer.fromAccountId) === accountId) balance -= amount;
    if (Number(transfer.toAccountId) === accountId) balance += amount;
  });

  return balance;
}

export function getAccountBalances(accounts, transactions, transfers = []) {
  return sortByOrder(accounts || []).map((account) => ({
    account,
    balance: getAccountBalance(account, transactions, transfers),
  }));
}

export function getTotalBalance(accounts, transactions, transfers = []) {
  return getAccountBalances(accounts, transactions, transfers).reduce(
    (total, item) => total + item.balance,
    0,
  );
}

export function getCategoryUsage(transactions, budgets, categoryId) {
  const id = Number(categoryId);
  return {
    transactionCount: (transactions || []).filter((item) => Number(item.categoryId) === id).length,
    budgetCount: (budgets || []).filter((item) => Number(item.categoryId) === id).length,
  };
}

export function getAccountUsage(transactions, transfers, accountId) {
  const id = Number(accountId);
  return {
    transactionCount: (transactions || []).filter((item) => Number(item.accountId) === id).length,
    transferCount: (transfers || []).filter(
      (item) => Number(item.fromAccountId) === id || Number(item.toAccountId) === id,
    ).length,
  };
}

export function getBudgetProgress(budget, transactions) {
  if (!budget) {
    return {
      spent: 0,
      remaining: 0,
      percentage: 0,
      cappedPercentage: 0,
      status: 'safe',
      isOverBudget: false,
    };
  }
  const { start, end } = getMonthRange(budget.period);
  const spent = (transactions || [])
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        Number(transaction.categoryId) === Number(budget.categoryId) &&
        transaction.date >= start &&
        transaction.date <= end,
    )
    .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);

  const budgetAmount = Number(budget.amount) || 0;
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  const isOverBudget = spent > budgetAmount;
  let status = 'safe';
  if (isOverBudget) status = 'over';
  else if (percentage >= 80) status = 'danger';
  else if (percentage >= 60) status = 'warning';

  return {
    ...budget,
    budgetAmount,
    spent,
    remaining: budgetAmount - spent,
    percentage,
    cappedPercentage: Math.min(percentage, 100),
    status,
    isOverBudget,
  };
}

export function getBudgetSummaries(budgets, transactions, period) {
  return (budgets || [])
    .filter((budget) => budget.period === period)
    .map((budget) => getBudgetProgress(budget, transactions));
}

export function getCategoryBreakdown(transactions, categories, period, type = 'expense') {
  const monthTransactions = getMonthTransactions(transactions, period).filter(
    (transaction) => transaction.type === type,
  );
  const total = monthTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0,
  );
  const categoryMap = new Map((categories || []).map((category) => [Number(category.id), category]));
  const groups = new Map();

  monthTransactions.forEach((transaction) => {
    const key = Number(transaction.categoryId);
    const current = groups.get(key) || { categoryId: key, amount: 0, count: 0 };
    current.amount += Number(transaction.amount) || 0;
    current.count += 1;
    groups.set(key, current);
  });

  return [...groups.values()]
    .map((item, index) => {
      const category = categoryMap.get(item.categoryId);
      return {
        ...item,
        category,
        name: category?.name || 'Tanpa kategori',
        icon: category?.icon || '📦',
        color:
          category?.color || CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length],
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function getTopExpenses(transactions, period, limit = 5) {
  return sortTransactionsDesc(
    getMonthTransactions(transactions, period).filter(
      (transaction) => transaction.type === 'expense',
    ),
  ).slice(0, limit);
}

export function getDailyCashflow(transactions, days = 7, endDate = new Date()) {
  const dates = getLastNDays(days, endDate);
  const income = dates.map(() => 0);
  const expense = dates.map(() => 0);
  const indexByDate = new Map(dates.map((date, index) => [date, index]));

  (transactions || []).forEach((transaction) => {
    const index = indexByDate.get(transaction.date);
    if (index === undefined) return;
    if (transaction.type === 'income') income[index] += Number(transaction.amount) || 0;
    if (transaction.type === 'expense') expense[index] += Number(transaction.amount) || 0;
  });

  return {
    dates,
    labels: dates.map((date) => formatWeekdayShort(date)),
    fullLabels: dates.map((date) => formatDateShort(date)),
    income,
    expense,
  };
}

export function getBalanceTrend(accounts, transactions, days = 30, endDate = new Date()) {
  const dates = getLastNDays(days, endDate);
  const startDate = dates[0];
  const endISODate = dates[dates.length - 1];
  const initialBalance = (accounts || []).reduce(
    (total, account) => total + (Number(account.initialBalance) || 0),
    0,
  );
  const sorted = sortTransactionsAsc(transactions).filter(
    (transaction) => transaction.date <= endISODate,
  );

  let running = initialBalance;
  const dayTotals = new Map(dates.map((date) => [date, 0]));

  sorted.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    const signed = transaction.type === 'income' ? amount : -amount;
    if (transaction.date < startDate) {
      running += signed;
      return;
    }
    dayTotals.set(transaction.date, (dayTotals.get(transaction.date) || 0) + signed);
  });

  const values = dates.map((date) => {
    running += dayTotals.get(date) || 0;
    return running;
  });

  return {
    dates,
    labels: dates.map((date) => formatDayMonth(date)),
    fullLabels: dates.map((date) => formatDateShort(date)),
    values,
  };
}

export function getMonthlyComparison(transactions, period) {
  const previousPeriod = shiftMonth(period, -1);
  const current = getMonthTotals(transactions, period);
  const previous = getMonthTotals(transactions, previousPeriod);
  const delta = {
    income: current.income - previous.income,
    expense: current.expense - previous.expense,
    net: current.net - previous.net,
  };
  const percent = (currentValue, previousValue) => {
    if (!previousValue) return null;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  };

  return {
    current,
    previous,
    previousPeriod,
    delta,
    percent: {
      income: percent(current.income, previous.income),
      expense: percent(current.expense, previous.expense),
      net: percent(current.net, previous.net),
    },
  };
}

export function groupTransactionsByDate(transactions) {
  const sorted = sortTransactionsDesc(transactions);
  const groups = new Map();
  sorted.forEach((transaction) => {
    if (!groups.has(transaction.date)) groups.set(transaction.date, []);
    groups.get(transaction.date).push(transaction);
  });
  return [...groups.entries()].map(([date, items]) => ({
    date,
    transactions: items,
    totals: getTotals(items),
  }));
}

export function getRecentTransactions(transactions, limit = 5) {
  return sortTransactionsDesc(transactions).slice(0, limit);
}

export function getActiveFilterCount(filters = {}) {
  let count = 0;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  if (filters.type && filters.type !== 'all') count += 1;
  if (Array.isArray(filters.categoryIds) && filters.categoryIds.length) count += 1;
  if (filters.accountId && filters.accountId !== 'all') count += 1;
  if (filters.minAmount !== '' && filters.minAmount !== undefined && filters.minAmount !== null) {
    count += 1;
  }
  if (filters.maxAmount !== '' && filters.maxAmount !== undefined && filters.maxAmount !== null) {
    count += 1;
  }
  if (filters.search) count += 1;
  return count;
}

export function getPeriodTotals(transactions, period) {
  return getTotals(getMonthTransactions(transactions, period));
}

export function getTodayPeriod() {
  return getCurrentPeriod();
}
