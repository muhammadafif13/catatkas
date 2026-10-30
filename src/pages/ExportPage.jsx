import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { useExport } from '../hooks/useExport';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAccountStore } from '../stores/useAccountStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useTransferStore } from '../stores/useTransferStore';
import { toast, useUIStore } from '../stores/useUIStore';
import { restoreDatabaseSnapshot } from '../db/backup';
import { getBackupSummary, validateBackupPayload } from '../utils/exportJSON';
import { formatDateTime } from '../utils/formatDate';
import { formatFileSize, getErrorMessage } from '../utils/helpers';

const MAX_IMPORT_SIZE = 20 * 1024 * 1024;

export default function ExportPage() {
  const { transactions, categories, accounts, budgets, transfers, settings, exportCSV, exportBackup } =
    useExport();
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const online = useOnlineStatus();
  const fileInputRef = useRef(null);
  const [range, setRange] = useState({ from: '', to: '' });
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const refreshStores = async () => {
    await Promise.all([
      useSettingsStore.getState().loadSettings(),
      useCategoryStore.getState().fetchCategories(),
      useAccountStore.getState().fetchAccounts(),
      useTransactionStore.getState().fetchTransactions(),
      useBudgetStore.getState().fetchBudgets(),
      useTransferStore.getState().fetchTransfers(),
    ]);
  };

  const readFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_SIZE) {
      toast.error('File terlalu besar. Maksimum ukuran backup adalah 20 MB.');
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const validation = validateBackupPayload(payload);
      setPreview({
        fileName: file.name,
        size: file.size,
        payload,
        summary: getBackupSummary(payload),
        valid: validation.valid,
        errors: validation.errors,
      });
    } catch {
      setPreview(null);
      toast.error('File tidak valid. Pastikan format JSON benar.');
    }
  };

  const handleFileChange = (event) => {
    const [file] = event.target.files || [];
    readFile(file);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const [file] = event.dataTransfer.files || [];
    readFile(file);
  };

  const handleRestore = async () => {
    if (!preview?.valid) return;
    const confirmed = await requestConfirm({
      title: 'Ganti seluruh data?',
      message:
        'Restore akan menghapus seluruh data keuangan di akun CatatKas ini dan menggantinya dengan isi backup. Pastikan kamu sudah membuat backup terbaru.',
      confirmLabel: 'Restore Sekarang',
      danger: true,
    });
    if (!confirmed) return;

    setRestoring(true);
    try {
      await restoreDatabaseSnapshot(preview.payload.data);
      await refreshStores();
      toast.success(
        `Backup berhasil dipulihkan: ${preview.summary.transactions} transaksi dan ${preview.summary.accounts} akun.`,
        4500,
      );
      setPreview(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRestoring(false);
    }
  };

  const handleExportCSV = () => {
    exportCSV({ from: range.from, to: range.to });
  };

  const handleBackup = async () => {
    await exportBackup();
  };

  return (
    <div className="page">
      <div className="export-grid">
        <section className="export-card">
          <div className="export-card__head">
            <span className="export-card__icon">
              <FileSpreadsheet aria-hidden="true" />
            </span>
            <div>
              <h2 className="export-card__title">Ekspor CSV</h2>
              <p className="export-card__description">
                Buka transaksi di Excel, Numbers, atau Google Sheets.
              </p>
            </div>
          </div>

          <div className="range-grid">
            <label className="field">
              <span className="field__label">Dari tanggal</span>
              <input
                type="date"
                className="input"
                value={range.from}
                onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">Sampai tanggal</span>
              <input
                type="date"
                className="input"
                value={range.to}
                onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))}
              />
            </label>
          </div>

          <div className="data-counts">
            <div className="data-count">
              <div className="data-count__value">{transactions.length}</div>
              <div className="data-count__label">Transaksi</div>
            </div>
            <div className="data-count">
              <div className="data-count__value">{categories.length}</div>
              <div className="data-count__label">Kategori</div>
            </div>
            <div className="data-count">
              <div className="data-count__value">{accounts.length}</div>
              <div className="data-count__label">Akun</div>
            </div>
            <div className="data-count">
              <div className="data-count__value">{budgets.length}</div>
              <div className="data-count__label">Budget</div>
            </div>
          </div>

          <button type="button" className="btn btn--soft" onClick={handleExportCSV}>
            <Download aria-hidden="true" />
            Unduh CSV
          </button>
          <p className="export-note">
            Kosongkan tanggal untuk mengekspor semua transaksi. File CSV memakai pemisah koma dan
            penyandian UTF-8.
          </p>
        </section>

        <section className="export-card">
          <div className="export-card__head">
            <span className="export-card__icon">
              <FileJson aria-hidden="true" />
            </span>
            <div>
              <h2 className="export-card__title">Backup JSON</h2>
              <p className="export-card__description">
                Simpan cadangan data akun untuk dipulihkan kapan saja.
              </p>
            </div>
          </div>

          <div className="data-counts">
            <div className="data-count">
              <div className="data-count__value">{transfers.length}</div>
              <div className="data-count__label">Transfer</div>
            </div>
            <div className="data-count">
              <div className="data-count__value">{accounts.length}</div>
              <div className="data-count__label">Akun</div>
            </div>
            <div className="data-count">
              <div className="data-count__value">{categories.length}</div>
              <div className="data-count__label">Kategori</div>
            </div>
            <div className="data-count">
              <div className="data-count__value">{budgets.length}</div>
              <div className="data-count__label">Budget</div>
            </div>
          </div>

          <div className="file-meta">
            <Database size={15} aria-hidden="true" />
            <span>
              Backup mencakup transaksi, kategori, akun, budget, transfer, dan pengaturan.
            </span>
          </div>
          {settings.lastBackupDate ? (
            <div className="file-meta">
              <CalendarDays size={15} aria-hidden="true" />
              <span>Backup terakhir: {formatDateTime(settings.lastBackupDate)}</span>
            </div>
          ) : (
            <div className="callout callout--warning">
              <AlertTriangle aria-hidden="true" />
              <span>Belum pernah membuat backup. Sebaiknya buat sekarang.</span>
            </div>
          )}

          <button type="button" className="btn btn--primary" onClick={handleBackup}>
            <Download aria-hidden="true" />
            Unduh Backup JSON
          </button>
          <p className="export-note">
            Simpan file backup di tempat aman. File ini berisi seluruh catatan keuanganmu.
          </p>
        </section>

        <section className="export-card export-grid__full">
          <div className="export-card__head">
            <span className="export-card__icon">
              <Upload aria-hidden="true" />
            </span>
            <div>
              <h2 className="export-card__title">Impor backup JSON</h2>
              <p className="export-card__description">
                Pulihkan data dari file backup CatatKas ke akun ini. Data cloud saat ini akan
                diganti.
              </p>
            </div>
          </div>

          <label
            className={`dropzone${dragging ? ' is-dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
            />
            <span className="dropzone__icon">
              <Upload size={20} aria-hidden="true" />
            </span>
            <span className="dropzone__title">Pilih file backup</span>
            <span className="dropzone__hint">atau seret file JSON ke sini · maks. 20 MB</span>
          </label>

          {preview ? (
            <div className="import-preview">
              <div className="import-preview__head">
                <div>
                  <div className="import-preview__title">{preview.fileName}</div>
                  <div className="import-preview__meta">
                    {formatFileSize(preview.size)} · versi {preview.summary.version} ·{' '}
                    {preview.summary.exportedAt
                      ? formatDateTime(preview.summary.exportedAt)
                      : 'tanggal tidak tersedia'}
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPreview(null)}
                  aria-label="Batalkan file impor"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>

              {preview.valid ? (
                <>
                  <div className="data-counts">
                    <div className="data-count">
                      <div className="data-count__value">{preview.summary.transactions}</div>
                      <div className="data-count__label">Transaksi</div>
                    </div>
                    <div className="data-count">
                      <div className="data-count__value">{preview.summary.categories}</div>
                      <div className="data-count__label">Kategori</div>
                    </div>
                    <div className="data-count">
                      <div className="data-count__value">{preview.summary.accounts}</div>
                      <div className="data-count__label">Akun</div>
                    </div>
                    <div className="data-count">
                      <div className="data-count__value">{preview.summary.transfers}</div>
                      <div className="data-count__label">Transfer</div>
                    </div>
                  </div>
                  <div className="callout callout--danger">
                    <AlertTriangle aria-hidden="true" />
                    <span>Restore akan mengganti seluruh data cloud akun ini.</span>
                  </div>
                  {!online ? (
                    <div className="callout callout--warning">
                      <AlertTriangle aria-hidden="true" />
                      <span>Sambungkan internet sebelum memulihkan backup.</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={handleRestore}
                    disabled={restoring || !online}
                  >
                    <RefreshCw aria-hidden="true" />
                    {restoring ? 'Memulihkan…' : 'Restore Data'}
                  </button>
                </>
              ) : (
                <div className="import-errors">
                  {preview.errors.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <p className="export-note">
            Hanya file backup CatatKas yang valid yang dapat dipulihkan. Restore membutuhkan
            koneksi internet dan akan memperbarui data cloud akun ini.
          </p>
        </section>
      </div>
    </div>
  );
}
