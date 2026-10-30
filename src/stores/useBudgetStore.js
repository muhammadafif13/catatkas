import { create } from 'zustand';
import {
  deleteBudget as deleteBudgetDB,
  getAllBudgets,
  saveBudget as saveBudgetDB,
} from '../db/budgets';

export const useBudgetStore = create((set) => ({
  budgets: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const budgets = await getAllBudgets();
      set({ budgets, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: error.message, isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  saveBudget: async (data) => {
    const saved = await saveBudgetDB(data);
    set((state) => {
      const exists = state.budgets.some((item) => item.id === saved.id);
      return {
        budgets: exists
          ? state.budgets.map((item) => (item.id === saved.id ? saved : item))
          : [...state.budgets, saved],
      };
    });
    return saved;
  },

  deleteBudget: async (id) => {
    await deleteBudgetDB(id);
    set((state) => ({
      budgets: state.budgets.filter((item) => item.id !== Number(id)),
    }));
  },
}));
