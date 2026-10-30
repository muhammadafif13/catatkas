import { DEFAULT_SETTINGS } from '../utils/constants';
import { useAccountStore } from './useAccountStore';
import { useAdStore } from './useAdStore';
import { useBudgetStore } from './useBudgetStore';
import { useCategoryStore } from './useCategoryStore';
import { useSettingsStore } from './useSettingsStore';
import { useTransactionStore } from './useTransactionStore';
import { useTransferStore } from './useTransferStore';

export function resetDataStores() {
  useAccountStore.setState({ accounts: [], isLoading: false, hasLoaded: false, error: null });
  useCategoryStore.setState({ categories: [], isLoading: false, hasLoaded: false, error: null });
  useTransactionStore.setState({
    transactions: [],
    isLoading: false,
    hasLoaded: false,
    error: null,
  });
  useBudgetStore.setState({ budgets: [], isLoading: false, hasLoaded: false, error: null });
  useTransferStore.setState({ transfers: [], isLoading: false, hasLoaded: false, error: null });
  useAdStore.setState({
    ads: [],
    adminAds: [],
    stats: new Map(),
    isLoading: false,
    hasLoaded: false,
    error: null,
  });
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    loaded: false,
    isLoading: false,
    error: null,
  });
}
