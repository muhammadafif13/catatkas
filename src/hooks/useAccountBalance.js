import { useMemo } from 'react';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useTransferStore } from '../stores/useTransferStore';
import { getAccountBalance, getAccountBalances, getTotalBalance } from '../utils/calculations';

export function useAccountBalance(accountId) {
  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);
  const transfers = useTransferStore((state) => state.transfers);

  return useMemo(() => {
    const account = accounts.find((item) => item.id === Number(accountId));
    return getAccountBalance(account, transactions, transfers);
  }, [accounts, transactions, transfers, accountId]);
}

export function useBalances() {
  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);
  const transfers = useTransferStore((state) => state.transfers);

  return useMemo(
    () => ({
      items: getAccountBalances(accounts, transactions, transfers),
      total: getTotalBalance(accounts, transactions, transfers),
    }),
    [accounts, transactions, transfers],
  );
}
