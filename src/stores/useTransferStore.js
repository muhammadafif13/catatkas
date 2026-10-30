import { create } from 'zustand';
import {
  createTransfer as createTransferDB,
  deleteTransfer as deleteTransferDB,
  getAllTransfers,
} from '../db/transfers';

export const useTransferStore = create((set) => ({
  transfers: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchTransfers: async () => {
    set({ isLoading: true, error: null });
    try {
      const transfers = await getAllTransfers();
      set({ transfers, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: error.message, isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  addTransfer: async (data) => {
    const transfer = await createTransferDB(data);
    set((state) => ({
      transfers: [transfer, ...state.transfers].sort((a, b) => {
        if (a.date !== b.date) return String(b.date).localeCompare(String(a.date));
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      }),
    }));
    return transfer;
  },

  deleteTransfer: async (id) => {
    await deleteTransferDB(id);
    set((state) => ({
      transfers: state.transfers.filter((item) => item.id !== Number(id)),
    }));
  },
}));
