# 🗄️ Database Schema
## CatatKas — IndexedDB via Dexie.js

**Versi Dokumen**: 1.0  
**Tanggal**: 26 Oktober 2026  
**Database Engine**: IndexedDB  
**Wrapper**: Dexie.js v4.x

---

## 1. Overview

CatatKas menggunakan **IndexedDB** sebagai database utama melalui library **Dexie.js**. Semua data tersimpan di browser pengguna secara lokal dan persistent (tidak hilang saat browser ditutup).

### 1.1 Inisialisasi Database

```javascript
import Dexie from 'dexie';

const db = new Dexie('CatatKasDB');

db.version(1).stores({
  transactions: '++id, type, categoryId, accountId, date, createdAt',
  categories:   '++id, type, name, isDefault',
  accounts:     '++id, name, isDefault',
  budgets:      '++id, categoryId, period, [categoryId+period]',
  transfers:    '++id, fromAccountId, toAccountId, date',
  settings:     'key'
});

export default db;
```

---

## 2. Tabel & Skema

### 2.1 `transactions` — Transaksi

Tabel utama untuk menyimpan semua transaksi pemasukan dan pengeluaran.

| Field | Tipe | Index | Wajib | Default | Keterangan |
|-------|------|-------|-------|---------|------------|
| `id` | Number | 🔑 PK (auto) | ✅ | Auto-increment | Primary key |
| `type` | String | ✅ | ✅ | — | `"income"` atau `"expense"` |
| `amount` | Number | ❌ | ✅ | — | Nominal (selalu positif, tanpa desimal) |
| `categoryId` | Number | ✅ | ✅ | — | FK → categories.id |
| `accountId` | Number | ✅ | ✅ | — | FK → accounts.id |
| `date` | String | ✅ | ✅ | Hari ini | Format: `"YYYY-MM-DD"` |
| `time` | String | ❌ | ❌ | Sekarang | Format: `"HH:mm"` |
| `note` | String | ❌ | ❌ | `""` | Catatan (maks 200 karakter) |
| `createdAt` | String | ✅ | ✅ | Auto | ISO 8601: `"2026-10-26T05:30:00.000Z"` |
| `updatedAt` | String | ❌ | ✅ | Auto | ISO 8601: `"2026-10-26T05:30:00.000Z"` |

**Contoh Data:**

```json
{
  "id": 1,
  "type": "expense",
  "amount": 35000,
  "categoryId": 1,
  "accountId": 1,
  "date": "2026-10-26",
  "time": "12:30",
  "note": "Makan siang nasi padang",
  "createdAt": "2026-10-26T05:30:00.000Z",
  "updatedAt": "2026-10-26T05:30:00.000Z"
}
```

**Query yang Sering Digunakan:**

```javascript
// Ambil transaksi bulan ini
db.transactions
  .where('date')
  .between('2026-10-01', '2026-10-31')
  .toArray();

// Ambil semua pengeluaran
db.transactions
  .where('type')
  .equals('expense')
  .toArray();

// Ambil transaksi per kategori
db.transactions
  .where('categoryId')
  .equals(categoryId)
  .toArray();

// Ambil transaksi terbaru (10 terakhir)
db.transactions
  .orderBy('createdAt')
  .reverse()
  .limit(10)
  .toArray();
```

---

### 2.2 `categories` — Kategori

Menyimpan daftar kategori pemasukan dan pengeluaran.

| Field | Tipe | Index | Wajib | Default | Keterangan |
|-------|------|-------|-------|---------|------------|
| `id` | Number | 🔑 PK (auto) | ✅ | Auto-increment | Primary key |
| `type` | String | ✅ | ✅ | — | `"income"` atau `"expense"` |
| `name` | String | ✅ | ✅ | — | Nama kategori |
| `icon` | String | ❌ | ❌ | `"📦"` | Emoji icon |
| `color` | String | ❌ | ❌ | `"#6366f1"` | Warna HEX |
| `isDefault` | Boolean | ✅ | ✅ | `false` | Kategori bawaan (tidak bisa dihapus) |
| `order` | Number | ❌ | ❌ | `0` | Urutan tampil |
| `createdAt` | String | ❌ | ✅ | Auto | ISO 8601 timestamp |

**Data Default (Seed):**

```javascript
const defaultCategories = [
  // Pengeluaran
  { type: 'expense', name: 'Makanan & Minuman', icon: '🍔', color: '#ef4444', isDefault: true, order: 1 },
  { type: 'expense', name: 'Transportasi',      icon: '🚗', color: '#f97316', isDefault: true, order: 2 },
  { type: 'expense', name: 'Belanja',            icon: '🛒', color: '#eab308', isDefault: true, order: 3 },
  { type: 'expense', name: 'Rumah Tangga',       icon: '🏠', color: '#22c55e', isDefault: true, order: 4 },
  { type: 'expense', name: 'Kesehatan',          icon: '💊', color: '#14b8a6', isDefault: true, order: 5 },
  { type: 'expense', name: 'Pendidikan',         icon: '🎓', color: '#3b82f6', isDefault: true, order: 6 },
  { type: 'expense', name: 'Hiburan',            icon: '🎮', color: '#8b5cf6', isDefault: true, order: 7 },
  { type: 'expense', name: 'Pakaian',            icon: '👔', color: '#ec4899', isDefault: true, order: 8 },
  { type: 'expense', name: 'Komunikasi',         icon: '📱', color: '#06b6d4', isDefault: true, order: 9 },
  { type: 'expense', name: 'Transfer Keluar',    icon: '🔄', color: '#64748b', isDefault: true, order: 10 },
  { type: 'expense', name: 'Lainnya',            icon: '📦', color: '#94a3b8', isDefault: true, order: 11 },

  // Pemasukan
  { type: 'income', name: 'Gaji',              icon: '💼', color: '#22c55e', isDefault: true, order: 1 },
  { type: 'income', name: 'Bonus',             icon: '💰', color: '#16a34a', isDefault: true, order: 2 },
  { type: 'income', name: 'Hadiah',            icon: '🎁', color: '#a855f7', isDefault: true, order: 3 },
  { type: 'income', name: 'Investasi',         icon: '📈', color: '#0ea5e9', isDefault: true, order: 4 },
  { type: 'income', name: 'Transfer Masuk',    icon: '🔄', color: '#64748b', isDefault: true, order: 5 },
  { type: 'income', name: 'Lainnya',           icon: '📦', color: '#94a3b8', isDefault: true, order: 6 },
];
```

---

### 2.3 `accounts` — Akun / Dompet

Menyimpan daftar akun keuangan pengguna.

| Field | Tipe | Index | Wajib | Default | Keterangan |
|-------|------|-------|-------|---------|------------|
| `id` | Number | 🔑 PK (auto) | ✅ | Auto-increment | Primary key |
| `name` | String | ✅ | ✅ | — | Nama akun |
| `icon` | String | ❌ | ❌ | `"💵"` | Emoji icon |
| `color` | String | ❌ | ❌ | `"#6366f1"` | Warna HEX |
| `initialBalance` | Number | ❌ | ✅ | `0` | Saldo awal (Rupiah) |
| `isDefault` | Boolean | ✅ | ✅ | `false` | Akun bawaan |
| `isActive` | Boolean | ❌ | ✅ | `true` | Aktif / non-aktif |
| `order` | Number | ❌ | ❌ | `0` | Urutan tampil |
| `createdAt` | String | ❌ | ✅ | Auto | ISO 8601 timestamp |

**Data Default (Seed):**

```javascript
const defaultAccounts = [
  { name: 'Kas / Tunai', icon: '💵', color: '#22c55e', initialBalance: 0, isDefault: true, isActive: true, order: 1 },
  { name: 'Bank',        icon: '🏦', color: '#3b82f6', initialBalance: 0, isDefault: true, isActive: true, order: 2 },
  { name: 'E-Wallet',    icon: '📱', color: '#8b5cf6', initialBalance: 0, isDefault: true, isActive: true, order: 3 },
];
```

**Menghitung Saldo Akun:**

```javascript
async function getAccountBalance(accountId) {
  const account = await db.accounts.get(accountId);
  
  const incomeTotal = await db.transactions
    .where({ accountId, type: 'income' })
    .toArray()
    .then(txs => txs.reduce((sum, tx) => sum + tx.amount, 0));

  const expenseTotal = await db.transactions
    .where({ accountId, type: 'expense' })
    .toArray()
    .then(txs => txs.reduce((sum, tx) => sum + tx.amount, 0));

  // Transfer masuk ke akun ini
  const transferIn = await db.transfers
    .where('toAccountId').equals(accountId)
    .toArray()
    .then(txs => txs.reduce((sum, tx) => sum + tx.amount, 0));

  // Transfer keluar dari akun ini
  const transferOut = await db.transfers
    .where('fromAccountId').equals(accountId)
    .toArray()
    .then(txs => txs.reduce((sum, tx) => sum + tx.amount, 0));

  return account.initialBalance + incomeTotal - expenseTotal + transferIn - transferOut;
}
```

---

### 2.4 `budgets` — Anggaran

Menyimpan batas anggaran per kategori per periode.

| Field | Tipe | Index | Wajib | Default | Keterangan |
|-------|------|-------|-------|---------|------------|
| `id` | Number | 🔑 PK (auto) | ✅ | Auto-increment | Primary key |
| `categoryId` | Number | ✅ | ✅ | — | FK → categories.id |
| `amount` | Number | ❌ | ✅ | — | Batas anggaran (Rupiah) |
| `period` | String | ✅ | ✅ | — | Format: `"YYYY-MM"` (contoh: `"2026-10"`) |
| `createdAt` | String | ❌ | ✅ | Auto | ISO 8601 timestamp |
| `updatedAt` | String | ❌ | ✅ | Auto | ISO 8601 timestamp |

**Compound Index:** `[categoryId+period]` — Unik per kategori per bulan.

**Menghitung Progress Budget:**

```javascript
async function getBudgetProgress(categoryId, period) {
  const budget = await db.budgets
    .where({ categoryId, period })
    .first();

  if (!budget) return null;

  const [year, month] = period.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  const spent = await db.transactions
    .where('categoryId').equals(categoryId)
    .and(tx => tx.type === 'expense' && tx.date >= startDate && tx.date <= endDate)
    .toArray()
    .then(txs => txs.reduce((sum, tx) => sum + tx.amount, 0));

  return {
    budgetAmount: budget.amount,
    spent,
    remaining: budget.amount - spent,
    percentage: Math.round((spent / budget.amount) * 100),
    isOverBudget: spent > budget.amount,
  };
}
```

---

### 2.5 `transfers` — Transfer Antar Akun

Menyimpan data transfer antar akun/dompet.

| Field | Tipe | Index | Wajib | Default | Keterangan |
|-------|------|-------|-------|---------|------------|
| `id` | Number | 🔑 PK (auto) | ✅ | Auto-increment | Primary key |
| `fromAccountId` | Number | ✅ | ✅ | — | FK → accounts.id (akun asal) |
| `toAccountId` | Number | ✅ | ✅ | — | FK → accounts.id (akun tujuan) |
| `amount` | Number | ❌ | ✅ | — | Nominal transfer (Rupiah) |
| `date` | String | ✅ | ✅ | Hari ini | Format: `"YYYY-MM-DD"` |
| `time` | String | ❌ | ❌ | Sekarang | Format: `"HH:mm"` |
| `note` | String | ❌ | ❌ | `""` | Catatan |
| `createdAt` | String | ❌ | ✅ | Auto | ISO 8601 timestamp |

---

### 2.6 `settings` — Pengaturan Aplikasi

Menyimpan pengaturan umum aplikasi (key-value store).

| Field | Tipe | Index | Wajib | Default | Keterangan |
|-------|------|-------|-------|---------|------------|
| `key` | String | 🔑 PK | ✅ | — | Kunci pengaturan |
| `value` | Any | ❌ | ✅ | — | Nilai pengaturan |

**Setting Keys:**

| Key | Tipe | Default | Keterangan |
|-----|------|---------|------------|
| `theme` | String | `"system"` | `"light"`, `"dark"`, `"system"` |
| `currency` | String | `"IDR"` | Kode mata uang |
| `currencySymbol` | String | `"Rp"` | Simbol mata uang |
| `defaultAccountId` | Number | `1` | Akun default saat input |
| `language` | String | `"id"` | Bahasa: `"id"` (Indonesia) |
| `firstDayOfWeek` | Number | `1` | 0=Minggu, 1=Senin |
| `isFirstLaunch` | Boolean | `true` | Tandai apakah pertama kali buka |
| `lastBackupDate` | String | `null` | Tanggal backup terakhir |
| `budgetAlertThreshold` | Number | `80` | Persentase alert budget (80%) |

---

## 3. Diagram Relasi

```
┌──────────────┐       ┌──────────────┐
│  categories  │       │   accounts   │
│──────────────│       │──────────────│
│ id (PK)      │◄──┐   │ id (PK)      │◄──┐
│ type         │   │   │ name         │   │
│ name         │   │   │ initialBalance│   │
│ icon         │   │   │ ...          │   │
│ color        │   │   └──────────────┘   │
│ ...          │   │                      │
└──────────────┘   │                      │
                   │                      │
┌──────────────┐   │   ┌──────────────┐   │
│ transactions │   │   │  transfers   │   │
│──────────────│   │   │──────────────│   │
│ id (PK)      │   │   │ id (PK)      │   │
│ type         │   │   │ fromAccountId│───┘
│ amount       │   │   │ toAccountId  │───┘
│ categoryId   │───┘   │ amount       │
│ accountId    │───┘   │ date         │
│ date         │       │ ...          │
│ note         │       └──────────────┘
│ ...          │
└──────────────┘       ┌──────────────┐
                       │   budgets    │
┌──────────────┐       │──────────────│
│   settings   │       │ id (PK)      │
│──────────────│       │ categoryId   │───┐
│ key (PK)     │       │ amount       │   │
│ value        │       │ period       │   │
└──────────────┘       │ ...          │   │
                       └──────────────┘   │
                              ▼           │
                       ┌──────────────┐   │
                       │  categories  │◄──┘
                       └──────────────┘
```

---

## 4. Migrasi & Versioning

### 4.1 Versi Database

```javascript
// Versi 1 — Initial schema
db.version(1).stores({
  transactions: '++id, type, categoryId, accountId, date, createdAt',
  categories:   '++id, type, name, isDefault',
  accounts:     '++id, name, isDefault',
  budgets:      '++id, categoryId, period, [categoryId+period]',
  transfers:    '++id, fromAccountId, toAccountId, date',
  settings:     'key'
});

// Versi 2 — Contoh migrasi di masa depan
// db.version(2).stores({
//   transactions: '++id, type, categoryId, accountId, date, createdAt, *tags',
// }).upgrade(tx => {
//   return tx.table('transactions').toCollection().modify(txn => {
//     txn.tags = [];
//   });
// });
```

### 4.2 Aturan Migrasi

1. **Jangan pernah** menghapus atau mengubah tipe field yang sudah ada
2. **Selalu** increment nomor versi
3. **Gunakan** `.upgrade()` untuk transformasi data
4. **Backup** data pengguna sebelum migrasi besar
5. **Test** migrasi dengan data existing sebelum deploy

---

## 5. Kapasitas & Limitasi

| Aspek | Detail |
|-------|--------|
| **Ukuran Maksimal DB** | ~50% dari available disk space (browser-dependent) |
| **Chrome** | ~60% dari disk space, atau ~6GB (tergantung device) |
| **Safari** | ~1GB per origin |
| **Firefox** | ~50% dari disk space |
| **Jumlah Record** | Tidak terbatas (tapi performa menurun di > 100.000 records) |
| **Persistensi** | Data bertahan selama tidak di-clear manual oleh user |

> **Rekomendasi**: Sarankan pengguna untuk rutin backup data ke JSON, dan pertimbangkan hapus data yang sudah lebih dari 2 tahun untuk menjaga performa.
