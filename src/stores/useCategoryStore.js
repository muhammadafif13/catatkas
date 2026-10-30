import { create } from 'zustand';
import {
  createCategory as createCategoryDB,
  deleteCategory as deleteCategoryDB,
  getAllCategories,
  updateCategory as updateCategoryDB,
} from '../db/categories';
import { sortByOrder } from '../utils/helpers';

export const useCategoryStore = create((set) => ({
  categories: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await getAllCategories();
      set({ categories, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: error.message, isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  addCategory: async (data) => {
    const category = await createCategoryDB(data);
    set((state) => ({ categories: sortByOrder([...state.categories, category]) }));
    return category;
  },

  updateCategory: async (id, data) => {
    const category = await updateCategoryDB(id, data);
    set((state) => ({
      categories: sortByOrder(
        state.categories.map((item) => (item.id === category.id ? category : item)),
      ),
    }));
    return category;
  },

  deleteCategory: async (id) => {
    await deleteCategoryDB(id);
    set((state) => ({
      categories: state.categories.filter((item) => item.id !== Number(id)),
    }));
  },
}));
