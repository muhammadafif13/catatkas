import { create } from 'zustand';
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from '../db/transactions';
import { sortTransactionsDesc } from '../utils/calculations';
import { getErrorMessage } from '../utils/helpers';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await getAllTransactions();
      set({ transactions, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  addTransaction: async (data) => {
    const transaction = await createTransaction(data);
    set((state) => ({
      transactions: sortTransactionsDesc([transaction, ...state.transactions]),
    }));
    return transaction;
  },

  updateTransaction: async (id, data) => {
    const transaction = await updateTransaction(id, data);
    set((state) => ({
      transactions: sortTransactionsDesc(
        state.transactions.map((item) => (item.id === transaction.id ? transaction : item)),
      ),
    }));
    return transaction;
  },

  deleteTransaction: async (id) => {
    await deleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((item) => item.id !== Number(id)),
    }));
  },

  getTransactionById: (id) =>
    get().transactions.find((transaction) => transaction.id === Number(id)) || null,
}));
