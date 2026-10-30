import { useMemo, useState } from 'react';
import { ArrowLeftRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import AccountFormModal from '../components/forms/AccountFormModal';
import TransferFormModal from '../components/forms/TransferFormModal';
import EmptyState from '../components/ui/EmptyState';
import { useBalances } from '../hooks/useAccountBalance';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useTransferStore } from '../stores/useTransferStore';
import { toast, useUIStore } from '../stores/useUIStore';
import { getAccountUsage } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateShort } from '../utils/formatDate';
import { getErrorMessage, hexToRgba } from '../utils/helpers';

export default function AccountsPage() {
  const accounts = useAccountStore((state) => state.accounts);
  const removeAccount = useAccountStore((state) => state.deleteAccount);
  const transfers = useTransferStore((state) => state.transfers);
  const removeTransfer = useTransferStore((state) => state.deleteTransfer);
  const transactions = useTransactionStore((state) => state.transactions);
  const defaultAccountId = useSettingsStore((state) => state.settings.defaultAccountId);
  const { items, total } = useBalances();
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [accountModal, setAccountModal] = useState({ open: false, account: null });
  const [transferOpen, setTransferOpen] = useState(false);

  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [Number(account.id), account])),
    [accounts],
  );

  const handleDeleteAccount = async (account) => {
    const usage = getAccountUsage(transactions, transfers, account.id);
    if (usage.transactionCount || usage.transferCount) {
      toast.warning(
        `Akun "${account.name}" masih dipakai oleh ${usage.transactionCount} transaksi dan ${usage.transferCount} transfer. Nonaktifkan akun ini sebagai gantinya.`,
        5000,
      );
      return;
    }

    const confirmed = await requestConfirm({
      title: 'Hapus akun?',
      message: `Akun "${account.name}" akan dihapus permanen.`,
      confirmLabel: 'Hapus Akun',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await removeAccount(account.id);
      toast.success('Akun berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteTransfer = async (transfer) => {
    const confirmed = await requestConfirm({
      title: 'Hapus transfer?',
      message: 'Saldo kedua akun akan dikembalikan seperti sebelum transfer.',
      confirmLabel: 'Hapus Transfer',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await removeTransfer(transfer.id);
      toast.success('Transfer berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="page">
      <section className="accounts-total">
        <span className="accounts-total__icon">
          <Wallet aria-hidden="true" />
        </span>
        <div>
          <div className="accounts-total__label">Total saldo semua akun</div>
          <div className="accounts-total__value">{formatCurrency(total)}</div>
        </div>
      </section>

      <div className="page-actions">
        <div>
          <h2 className="section-heading__title">Akun & Dompet</h2>
          <p className="card__subtitle">
            {accounts.filter((account) => account.isActive !== false).length} akun aktif dari{' '}
            {accounts.length} akun
          </p>
        </div>
        <div className="inline-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setTransferOpen(true)}
            disabled={accounts.filter((account) => account.isActive !== false).length < 2}
          >
            <ArrowLeftRight aria-hidden="true" />
            Transfer
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setAccountModal({ open: true, account: null })}
          >
            <Plus aria-hidden="true" />
            Tambah Akun
          </button>
        </div>
      </div>

      {items.length ? (
        <div className="account-grid">
          {items.map(({ account, balance }) => {
            const usage = getAccountUsage(transactions, transfers, account.id);
            return (
              <article
                key={account.id}
                className={`account-card${account.isActive === false ? ' account-card--inactive' : ''}`}
              >
                <div className="account-card__head">
                  <span
                    className="account-card__icon"
                    style={{ backgroundColor: hexToRgba(account.color || '#6366f1', 0.15) }}
                    aria-hidden="true"
                  >
                    {account.icon || '💳'}
                  </span>
                  <div className="account-card__info">
                    <div className="account-card__name">{account.name}</div>
                    <div className="account-card__meta">
                      {account.isActive === false ? 'Nonaktif' : 'Aktif'}
                      {Number(defaultAccountId) === Number(account.id) ? ' · Akun utama' : ''}
                    </div>
                  </div>
                  <div className="account-card__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setAccountModal({ open: true, account })}
                      aria-label={`Edit akun ${account.name}`}
                    >
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDeleteAccount(account)}
                      aria-label={`Hapus akun ${account.name}`}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="account-card__balance-label">Saldo saat ini</div>
                  <div className={`account-card__balance ${balance < 0 ? 'text-expense' : ''}`}>
                    {formatCurrency(balance)}
                  </div>
                </div>
                <div className="account-card__footer">
                  <span>Saldo awal {formatCurrency(account.initialBalance)}</span>
                  <span>{usage.transactionCount} transaksi</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<Wallet size={26} />}
            title="Belum ada akun"
            text="Tambahkan dompet, rekening bank, atau e-wallet untuk mulai mencatat."
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setAccountModal({ open: true, account: null })}
              >
                <Plus aria-hidden="true" />
                Tambah Akun
              </button>
            }
          />
        </div>
      )}

      <section className="card transfer-panel">
        <div className="card__header">
          <div className="card__header-main">
            <h2 className="card__title">Transfer terakhir</h2>
            <p className="card__subtitle">Perpindahan saldo antar akun tidak dihitung sebagai pengeluaran.</p>
          </div>
          <button
            type="button"
            className="btn btn--soft btn--sm"
            onClick={() => setTransferOpen(true)}
            disabled={accounts.filter((account) => account.isActive !== false).length < 2}
          >
            <ArrowLeftRight aria-hidden="true" />
            Transfer
          </button>
        </div>

        {transfers.length ? (
          <div className="transfer-list">
            {transfers.slice(0, 6).map((transfer) => {
              const from = accountMap.get(Number(transfer.fromAccountId));
              const to = accountMap.get(Number(transfer.toAccountId));
              return (
                <div className="transfer-row" key={transfer.id}>
                  <span className="transfer-row__icon">
                    <ArrowLeftRight size={17} aria-hidden="true" />
                  </span>
                  <div className="transfer-row__body">
                    <div className="transfer-row__title">
                      {from?.name || 'Akun asal'} → {to?.name || 'Akun tujuan'}
                    </div>
                    <div className="transfer-row__meta">
                      {formatDateShort(transfer.date)}
                      {transfer.note ? ` · ${transfer.note}` : ''}
                    </div>
                  </div>
                  <span className="transfer-row__amount">{formatCurrency(transfer.amount)}</span>
                  <button
                    type="button"
                    className="icon-btn transfer-row__delete"
                    onClick={() => handleDeleteTransfer(transfer)}
                    aria-label="Hapus transfer"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            compact
            title="Belum ada transfer"
            text="Gunakan transfer saat memindahkan saldo antar akun."
          />
        )}
      </section>

      <AccountFormModal
        open={accountModal.open}
        account={accountModal.account}
        onClose={() => setAccountModal({ open: false, account: null })}
      />
      <TransferFormModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
