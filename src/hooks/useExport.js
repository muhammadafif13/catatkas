import { useAccountStore } from '../stores/useAccountStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useTransferStore } from '../stores/useTransferStore';
import { toast } from '../stores/useUIStore';
import { filterTransactions } from '../utils/calculations';
import { buildCSV, getCSVFilename } from '../utils/exportCSV';
import { buildBackup, getJSONFilename } from '../utils/exportJSON';
import { downloadFile } from '../utils/helpers';

export function useExport() {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const budgets = useBudgetStore((state) => state.budgets);
  const transfers = useTransferStore((state) => state.transfers);
  const settings = useSettingsStore((state) => state.settings);
  const updateSetting = useSettingsStore((state) => state.updateSetting);

  const exportCSV = (range = {}) => {
    const filtered = filterTransactions(transactions, {
      dateFrom: range.from || '',
      dateTo: range.to || '',
    });

    if (!filtered.length) {
      toast.warning('Tidak ada transaksi pada rentang tanggal tersebut.');
      return false;
    }

    const csv = buildCSV(filtered, categories, accounts);
    downloadFile(`\uFEFF${csv}`, getCSVFilename(), 'text/csv;charset=utf-8;');
    toast.success(`${filtered.length} transaksi berhasil diekspor ke CSV.`);
    return true;
  };

  const exportBackup = async () => {
    const currentTransactions = useTransactionStore.getState().transactions;
    const currentCategories = useCategoryStore.getState().categories;
    const currentAccounts = useAccountStore.getState().accounts;
    const currentBudgets = useBudgetStore.getState().budgets;
    const currentTransfers = useTransferStore.getState().transfers;
    const currentSettings = useSettingsStore.getState().settings;

    const backup = buildBackup({
      transactions: currentTransactions,
      categories: currentCategories,
      accounts: currentAccounts,
      budgets: currentBudgets,
      transfers: currentTransfers,
      settings: currentSettings,
    });

    downloadFile(
      JSON.stringify(backup, null, 2),
      getJSONFilename(),
      'application/json;charset=utf-8;',
    );

    try {
      await updateSetting('lastBackupDate', new Date().toISOString());
    } catch {
      // Backup tetap valid meskipun status terakhir backup gagal disimpan.
    }

    toast.success('Backup JSON berhasil dibuat.');
    return backup;
  };

  return {
    transactions,
    categories,
    accounts,
    budgets,
    transfers,
    settings,
    exportCSV,
    exportBackup,
  };
}
