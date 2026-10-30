import { create } from 'zustand';
import {
  createAccount as createAccountDB,
  deleteAccount as deleteAccountDB,
  getAllAccounts,
  updateAccount as updateAccountDB,
} from '../db/accounts';
import { sortByOrder } from '../utils/helpers';

export const useAccountStore = create((set) => ({
  accounts: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await getAllAccounts();
      set({ accounts, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: error.message, isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  addAccount: async (data) => {
    const account = await createAccountDB(data);
    set((state) => ({ accounts: sortByOrder([...state.accounts, account]) }));
    return account;
  },

  updateAccount: async (id, data) => {
    const account = await updateAccountDB(id, data);
    set((state) => ({
      accounts: sortByOrder(
        state.accounts.map((item) => (item.id === account.id ? account : item)),
      ),
    }));
    return account;
  },

  deleteAccount: async (id) => {
    await deleteAccountDB(id);
    set((state) => ({
      accounts: state.accounts.filter((item) => item.id !== Number(id)),
    }));
  },
}));
