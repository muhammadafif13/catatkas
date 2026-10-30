import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION } from '../constants';
import { buildCSV, escapeCSVValue, getCSVFilename } from '../exportCSV';
import {
  buildBackup,
  getBackupSummary,
  getJSONFilename,
  validateBackupPayload,
} from '../exportJSON';

const transactions = [
  {
    id: 1,
    type: 'expense',
    amount: 50000,
    categoryId: 1,
    accountId: 1,
    date: '2026-10-02',
    time: '12:30',
    note: 'Makan, minum',
    createdAt: '2026-10-02T05:30:00.000Z',
  },
  {
    id: 2,
    type: 'income',
    amount: 1000000,
    categoryId: 3,
    accountId: 2,
    date: '2026-10-01',
    time: '08:00',
    note: 'Gaji "Oktober"',
    createdAt: '2026-10-01T01:00:00.000Z',
  },
];

const categories = [
  { id: 1, name: 'Makanan' },
  { id: 3, name: 'Gaji' },
];
const accounts = [
  { id: 1, name: 'Kas' },
  { id: 2, name: 'Bank' },
];

describe('exportCSV', () => {
  it('escapes commas, quotes, and line breaks', () => {
    expect(escapeCSVValue('biasa')).toBe('biasa');
    expect(escapeCSVValue('a,b')).toBe('"a,b"');
    expect(escapeCSVValue('a"b')).toBe('"a""b"');
    expect(escapeCSVValue('baris\nbaru')).toBe('"baris\nbaru"');
    expect(escapeCSVValue(null)).toBe('');
  });

  it('builds a UTF-friendly CSV with resolved category and account names', () => {
    const csv = buildCSV(transactions, categories, accounts);
    const rows = csv.split('\r\n');
    expect(rows[0]).toBe('Tanggal,Waktu,Jenis,Kategori,Akun,Jumlah,Catatan');
    expect(rows[1]).toBe('2026-10-02,12:30,Pengeluaran,Makanan,Kas,50000,"Makan, minum"');
    expect(rows[2]).toBe('2026-10-01,08:00,Pemasukan,Gaji,Bank,1000000,"Gaji ""Oktober"""');
  });

  it('creates a dated CSV filename', () => {
    expect(getCSVFilename(new Date(2026, 0, 5))).toBe('catatkas-transaksi-2026-01-05.csv');
  });
});

describe('exportJSON', () => {
  it('builds a versioned backup payload', () => {
    const backup = buildBackup({
      transactions,
      categories,
      accounts,
      budgets: [],
      transfers: [],
      settings: { theme: 'dark' },
    });
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.data.transactions).toHaveLength(2);
    expect(backup.data.categories).toHaveLength(2);
    expect(backup.data.accounts).toHaveLength(2);
    expect(backup.data.settings).toEqual({ theme: 'dark' });
    expect(new Date(backup.exportedAt).toString()).not.toBe('Invalid Date');
  });

  it('creates a dated JSON filename', () => {
    expect(getJSONFilename(new Date(2026, 0, 5))).toBe('catatkas-backup-2026-01-05.json');
  });

  it('validates a complete backup payload', () => {
    const payload = buildBackup({
      transactions,
      categories,
      accounts,
      budgets: [],
      transfers: [],
      settings: {},
    });
    expect(validateBackupPayload(payload)).toEqual({ valid: true, errors: [] });
  });

  it('reports missing or malformed backup sections', () => {
    expect(validateBackupPayload(null).valid).toBe(false);
    expect(
      validateBackupPayload({
        version: BACKUP_VERSION,
        data: { transactions: [], categories: [], accounts: [] },
      }),
    ).toEqual({ valid: true, errors: [] });
    const invalid = validateBackupPayload({
      version: BACKUP_VERSION,
      data: {
        transactions: [{ type: 'transfer', amount: 'x' }],
        categories: [],
        accounts: [],
        budgets: {},
        transfers: 'nope',
      },
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(2);
  });

  it('summarizes backup contents', () => {
    const payload = {
      version: BACKUP_VERSION,
      exportedAt: '2026-10-26T00:00:00.000Z',
      data: {
        transactions: [1, 2],
        categories: [1],
        accounts: [1, 2, 3],
        budgets: [],
        transfers: [1],
      },
    };
    expect(getBackupSummary(payload)).toEqual({
      exportedAt: '2026-10-26T00:00:00.000Z',
      version: BACKUP_VERSION,
      transactions: 2,
      categories: 1,
      accounts: 3,
      budgets: 0,
      transfers: 1,
    });
    expect(getBackupSummary(null)).toMatchObject({ transactions: 0, version: '-' });
  });
});
