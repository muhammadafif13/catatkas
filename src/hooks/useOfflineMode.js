import { useAuthStore } from '../stores/useAuthStore';

export function useOfflineMode() {
  return useAuthStore((state) => state.offlineMode);
}