import { create } from 'zustand';
import { getAllSettings, setSetting, setSettings } from '../db/settings';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { getErrorMessage } from '../utils/helpers';

export const useSettingsStore = create((set) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const stored = await getAllSettings();
      set({
        settings: { ...DEFAULT_SETTINGS, ...stored },
        loaded: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  updateSetting: async (key, value) => {
    try {
      await setSetting(key, value);
      set((state) => ({ settings: { ...state.settings, [key]: value } }));
      return value;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  updateSettings: async (values) => {
    try {
      await setSettings(values);
      set((state) => ({ settings: { ...state.settings, ...values } }));
      return values;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },
}));
