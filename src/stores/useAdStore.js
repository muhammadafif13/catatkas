import { create } from 'zustand';
import {
  createAd as createAdDB,
  deleteAd as deleteAdDB,
  getActiveAds,
  getAllAds,
  getAdStats,
  updateAd as updateAdDB,
} from '../db/ads';
import { getErrorMessage } from '../utils/helpers';

export const useAdStore = create((set, get) => ({
  ads: [],
  adminAds: [],
  stats: new Map(),
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchAds: async () => {
    set({ isLoading: true, error: null });
    try {
      const ads = await getActiveAds();
      set({ ads, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false, hasLoaded: true });
    }
  },

  fetchAdminAds: async () => {
    set({ isLoading: true, error: null });
    try {
      const [adminAds, stats] = await Promise.all([getAllAds(), getAdStats()]);
      set({ adminAds, stats, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  addAd: async (data) => {
    const ad = await createAdDB(data);
    set((state) => ({ adminAds: [ad, ...state.adminAds] }));
    return ad;
  },

  editAd: async (id, data) => {
    const ad = await updateAdDB(id, data);
    set((state) => ({
      adminAds: state.adminAds.map((item) => (item.id === ad.id ? ad : item)),
      ads: state.ads.map((item) => (item.id === ad.id ? ad : item)),
    }));
    return ad;
  },

  removeAd: async (id) => {
    await deleteAdDB(id);
    set((state) => ({
      adminAds: state.adminAds.filter((item) => item.id !== Number(id)),
      ads: state.ads.filter((item) => item.id !== Number(id)),
    }));
  },

  refreshStats: async () => {
    const stats = await getAdStats();
    set({ stats });
    return stats;
  },

  getAdsForPlacement: (placement) =>
    get().ads.filter((ad) => ad.placement === placement).slice(0, 3),
}));
