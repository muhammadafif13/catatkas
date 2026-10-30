# 🔧 Spesifikasi Teknis (Tech Spec)
## CatatKas — Aplikasi Pencatatan Keuangan Pribadi

**Versi Dokumen**: 1.1  
**Tanggal**: 26 Oktober 2026  
**Status**: Draft  
**Framework**: React (Vite)

---

## 1. Arsitektur Aplikasi

### 1.1 Overview

```
┌─────────────────────────────────────────────────┐
│                 CatatKas PWA                     │
│              (Vite + React 18)                   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   React   │  │  Zustand │  │   Service     │  │
│  │ Components│◄─┤  Store   │  │   Worker      │  │
│  │ (Pages)   │  │          │  │ (Cache/Offline)│ │
│  └──────────┘  └────┬─────┘  └───────────────┘  │
│                      │                            │
│              ┌───────▼───────┐                    │
│              │   IndexedDB   │                    │
│              │  (via Dexie)  │                    │
│              └───────────────┘                    │
└─────────────────────────────────────────────────┘
```

### 1.2 Prinsip Arsitektur

1. **Offline-First** — Semua data dan asset di-cache secara lokal
2. **Component-Based** — UI dipecah menjadi komponen yang reusable
3. **Unidirectional Data Flow** — Data mengalir satu arah: Store → Component → Action → Store
4. **Single Responsibility** — Setiap modul punya satu tanggung jawab utama
5. **React 18** — Concurrent features, automatic batching, dan Suspense

### 1.3 Pola Desain yang Digunakan

| Pattern | Penggunaan |
|---------|------------|
| **Container/Presentational** | Pisahkan logika bisnis (hooks) dari UI (komponen) |
| **Repository Pattern** | Database layer — abstraksi akses data IndexedDB |
| **Custom Hooks** | Reusable logic via React hooks (useTransactions, useBudget, dll.) |
| **Strategy Pattern** | Ekspor data — strategi berbeda untuk CSV dan JSON |
| **Flux Pattern** | State management via Zustand — action → state → view |

---

## 2. Technology Stack

### 2.1 Frontend

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | ^18.x | UI library (komponen, hooks, JSX) |
| React Router | ^6.x | Client-side routing (SPA) |
| CSS3 (Vanilla / CSS Modules) | — | Styling, animasi, responsive design |
| CSS Custom Properties | — | Design tokens / theming |

### 2.2 Storage & Data

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| IndexedDB | 2.0 | Database utama (persistent storage) |
| Dexie.js | ^4.x | Wrapper IndexedDB yang mudah digunakan |
| Zustand | ^4.x | Global state management (ringan, hooks-based) |
| localStorage | — | Penyimpanan pengaturan sederhana (tema, bahasa) |

### 2.3 Visualisasi

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Chart.js | ^4.x | Grafik pie, bar, line |

### 2.4 PWA

| Teknologi | Kegunaan |
|-----------|----------|
| Service Worker | Caching asset & data untuk offline |
| Web App Manifest | Install di home screen, splash screen |
| Cache API | Strategi caching (Cache First, Network First) |

### 2.5 Build & Development

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Vite | ^5.x | Dev server & bundler |
| @vitejs/plugin-react | ^4.x | React Fast Refresh & JSX |
| vite-plugin-pwa | ^0.x | PWA support (auto-generate SW) |
| ESLint | ^8.x | Linting JavaScript + React rules |
| Prettier | ^3.x | Code formatting |

---

## 3. Struktur File Detail

```
catatkas/
├── docs/                            # Dokumentasi
│   ├── README.md
│   ├── PRD.md
│   ├── TECH_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   ├── UI_UX_GUIDELINES.md
│   └── ROADMAP.md
│
├── public/
│   ├── favicon.ico
│   └── icons/
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
│
├── src/
│   ├── main.jsx                     # Entry point React
│   ├── App.jsx                      # Root component + Router
│   ├── index.css                    # Global styles (import all)
│   │
│   ├── styles/
│   │   ├── variables.css            # CSS Custom Properties (design tokens)
│   │   ├── reset.css                # CSS Reset / Normalize
│   │   ├── base.css                 # Base/global styles
│   │   ├── animations.css           # Animasi & transisi
│   │   └── layout.css               # Layout utilities
│   │
│   ├── db/
│   │   ├── database.js              # Inisialisasi Dexie database
│   │   ├── transactions.js          # CRUD transaksi
│   │   ├── categories.js            # CRUD kategori
│   │   ├── accounts.js              # CRUD akun
│   │   ├── budgets.js               # CRUD anggaran
│   │   └── seed.js                  # Data default (kategori, akun awal)
│   │
│   ├── stores/
│   │   ├── useTransactionStore.js   # Zustand store — transaksi
│   │   ├── useCategoryStore.js      # Zustand store — kategori
│   │   ├── useAccountStore.js       # Zustand store — akun
│   │   ├── useBudgetStore.js        # Zustand store — anggaran
│   │   └── useSettingsStore.js      # Zustand store — pengaturan
│   │
│   ├── hooks/
│   │   ├── useTransactions.js       # Custom hook — logika transaksi
│   │   ├── useBudgetProgress.js     # Custom hook — progress anggaran
│   │   ├── useAccountBalance.js     # Custom hook — hitung saldo
│   │   ├── useChartData.js          # Custom hook — data grafik
│   │   ├── useExport.js             # Custom hook — ekspor/impor
│   │   └── useTheme.js              # Custom hook — dark/light mode
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx           # Bottom navigation bar
│   │   │   ├── Header.jsx           # Top app bar
│   │   │   └── PageLayout.jsx       # Wrapper layout halaman
│   │   ├── transaction/
│   │   │   ├── TransactionCard.jsx   # Kartu transaksi
│   │   │   ├── TransactionForm.jsx   # Form input transaksi
│   │   │   └── TransactionList.jsx   # List transaksi (virtualized)
│   │   ├── picker/
│   │   │   ├── CategoryPicker.jsx    # Pemilih kategori (grid emoji)
│   │   │   ├── AccountPicker.jsx     # Pemilih akun
│   │   │   └── DatePicker.jsx        # Pemilih tanggal
│   │   ├── dashboard/
│   │   │   ├── BalanceCard.jsx       # Kartu saldo total
│   │   │   ├── BudgetProgress.jsx    # Progress bar anggaran
│   │   │   └── RecentTransactions.jsx# Transaksi terbaru
│   │   ├── charts/
│   │   │   ├── ChartPie.jsx          # Grafik pie/donut
│   │   │   ├── ChartBar.jsx          # Grafik bar
│   │   │   └── ChartLine.jsx         # Grafik line
│   │   └── ui/
│   │       ├── Modal.jsx             # Modal dialog
│   │       ├── Toast.jsx             # Toast notification
│   │       ├── EmptyState.jsx        # Placeholder saat data kosong
│   │       ├── ConfirmDialog.jsx     # Dialog konfirmasi hapus
│   │       └── LoadingSpinner.jsx    # Loading state
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx            # Halaman dashboard
│   │   ├── AddTransaction.jsx       # Halaman tambah transaksi
│   │   ├── History.jsx              # Halaman riwayat transaksi
│   │   ├── TransactionDetail.jsx    # Halaman detail transaksi
│   │   ├── Reports.jsx              # Halaman laporan
│   │   ├── Budget.jsx               # Halaman anggaran
│   │   ├── Accounts.jsx             # Halaman kelola akun
│   │   ├── Categories.jsx           # Halaman kelola kategori
│   │   ├── Settings.jsx             # Halaman pengaturan
│   │   └── Export.jsx               # Halaman ekspor/impor
│   │
│   ├── utils/
│   │   ├── formatCurrency.js        # Format angka ke Rupiah
│   │   ├── formatDate.js            # Format tanggal Indonesia
│   │   ├── exportCSV.js             # Logika ekspor CSV
│   │   ├── exportJSON.js            # Logika ekspor/impor JSON
│   │   ├── helpers.js               # Fungsi pembantu umum
│   │   └── constants.js             # Konstanta aplikasi
│   │
│   └── assets/
│       ├── images/
│       └── fonts/
│
├── index.html                        # HTML template (Vite entry)
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
└── vite.config.js
```

---

## 4. Routing

### 4.1 React Router v6

Menggunakan **React Router v6** dengan `createBrowserRouter` atau `createHashRouter` (untuk static hosting).

```jsx
// App.jsx
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load pages untuk code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const History = lazy(() => import('./pages/History'));
const TransactionDetail = lazy(() => import('./pages/TransactionDetail'));
const Reports = lazy(() => import('./pages/Reports'));
const Budget = lazy(() => import('./pages/Budget'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Categories = lazy(() => import('./pages/Categories'));
const Settings = lazy(() => import('./pages/Settings'));
const Export = lazy(() => import('./pages/Export'));

const router = createHashRouter([
  {
    path: '/',
    element: <PageLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'add', element: <AddTransaction /> },
      { path: 'history', element: <History /> },
      { path: 'transaction/:id', element: <TransactionDetail /> },
      { path: 'reports', element: <Reports /> },
      { path: 'budget', element: <Budget /> },
      { path: 'accounts', element: <Accounts /> },
      { path: 'categories', element: <Categories /> },
      { path: 'settings', element: <Settings /> },
      { path: 'export', element: <Export /> },
    ],
  },
]);

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
```

### 4.2 Navigasi

- **Bottom Navbar** (mobile): Dashboard, Tambah, Riwayat, Laporan, Lainnya — pakai `<NavLink>`
- **Sidebar** (desktop ≥ 1024px): Semua menu terlihat
- **Floating Action Button**: Shortcut tambah transaksi — pakai `useNavigate()`

---

## 5. State Management

### 5.1 Zustand Store

Menggunakan **Zustand** — library state management yang ringan dan hooks-based, cocok untuk React.

```javascript
// stores/useTransactionStore.js
import { create } from 'zustand';
import * as transactionDB from '../db/transactions';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  // Fetch transaksi dari IndexedDB
  fetchTransactions: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await transactionDB.getAll(filters);
      set({ transactions: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Tambah transaksi baru
  addTransaction: async (transaction) => {
    const id = await transactionDB.create(transaction);
    const newTx = { ...transaction, id };
    set(state => ({
      transactions: [newTx, ...state.transactions],
    }));
    return id;
  },

  // Hapus transaksi
  deleteTransaction: async (id) => {
    await transactionDB.remove(id);
    set(state => ({
      transactions: state.transactions.filter(tx => tx.id !== id),
    }));
  },
}));
```

### 5.2 Custom Hooks (Logika Bisnis)

```jsx
// hooks/useAccountBalance.js
import { useMemo } from 'react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useAccountStore } from '../stores/useAccountStore';

export function useAccountBalance(accountId) {
  const transactions = useTransactionStore(s => s.transactions);
  const account = useAccountStore(s =>
    s.accounts.find(a => a.id === accountId)
  );

  return useMemo(() => {
    if (!account) return 0;
    const income = transactions
      .filter(tx => tx.accountId === accountId && tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = transactions
      .filter(tx => tx.accountId === accountId && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return account.initialBalance + income - expense;
  }, [transactions, account, accountId]);
}
```

### 5.3 Alur Data

```
User Action → React Event Handler → Zustand Action → DB Write → State Update → React Re-render
                                                                    ↑
                                                         Zustand notifies
                                                         subscribed components
```

---

## 6. Service Worker & Caching

### 6.1 Strategi Caching

| Resource | Strategi | Keterangan |
|----------|----------|------------|
| HTML, CSS, JS (App Shell) | Cache First | Selalu dari cache, update di background |
| Font & Icon | Cache First | Asset statis jarang berubah |
| Chart.js / Dexie.js (CDN) | Stale While Revalidate | Gunakan cache tapi update jika online |
| Gambar | Cache First | Cache saat pertama kali diakses |

### 6.2 Lifecycle

```
Install → Cache app shell & assets
Activate → Hapus cache lama, claim clients
Fetch → Intercept request, serve dari cache / network
```

### 6.3 Versioning

```javascript
const CACHE_VERSION = 'catatkas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  // ... semua asset
];
```

---

## 7. Performa & Optimasi

### 7.1 Target Metrik

| Metrik | Target | Cara Mencapai |
|--------|--------|---------------|
| FCP | < 1.5s | App shell caching, inline critical CSS |
| TTI | < 3s | Lazy loading non-critical modules |
| Bundle size | < 200KB (gzip) | Tree-shaking, no framework overhead |
| Lighthouse Perf | ≥ 90 | Optimasi gambar, font loading |

### 7.2 Teknik Optimasi

1. **Code Splitting** — Lazy load halaman yang tidak aktif
2. **Critical CSS** — Inline CSS yang dibutuhkan untuk first paint
3. **Debounce** — Debounce pencarian & filter input
4. **Virtual Scrolling** — Untuk daftar transaksi yang panjang (> 100 item)
5. **Image Optimization** — Icon dalam format SVG atau WebP
6. **Font Loading** — `font-display: swap` untuk web fonts

---

## 8. Format Data

### 8.1 Transaksi (JSON)

```json
{
  "id": 1,
  "type": "expense",
  "amount": 50000,
  "categoryId": 1,
  "accountId": 1,
  "date": "2026-10-26",
  "time": "12:30",
  "note": "Makan siang di warteg",
  "createdAt": "2026-10-26T05:30:00.000Z",
  "updatedAt": "2026-10-26T05:30:00.000Z"
}
```

### 8.2 Ekspor CSV

```csv
Tanggal,Waktu,Jenis,Kategori,Akun,Jumlah,Catatan
2026-10-26,12:30,Pengeluaran,Makanan & Minuman,Kas,50000,Makan siang di warteg
2026-10-26,09:00,Pemasukan,Gaji,Bank,5000000,Gaji bulan Oktober
```

### 8.3 Backup JSON

```json
{
  "version": "1.0",
  "exportedAt": "2026-10-26T12:00:00.000Z",
  "data": {
    "transactions": [...],
    "categories": [...],
    "accounts": [...],
    "budgets": [...],
    "settings": {...}
  }
}
```

---

## 9. Error Handling

### 9.1 Strategi

| Jenis Error | Penanganan |
|-------------|------------|
| IndexedDB gagal buka | Tampilkan pesan error, sarankan clear browser data |
| Quota storage penuh | Tampilkan peringatan, sarankan ekspor & hapus data lama |
| Service Worker gagal register | Aplikasi tetap jalan, fitur offline terbatas |
| Input validasi gagal | Tampilkan pesan error inline di form |
| Import data gagal | Tampilkan pesan error, jangan overwrite data existing |

### 9.2 Logging

```javascript
// Centralized error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[CatatKas Error]', event.reason);
  showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
});
```

---

## 10. Testing Strategy

| Level | Tools | Cakupan |
|-------|-------|---------|
| Unit Test | Vitest | Utility functions, store logic |
| Component Test | Testing Library | Render & interaksi komponen |
| E2E Test | Playwright | Alur utama (tambah, edit, hapus transaksi) |
| Manual Test | Browser DevTools | Responsiveness, PWA install, offline |

---

## 11. Deployment

### 11.1 Target Platform

- **GitHub Pages** (gratis, mudah)
- **Netlify** (alternatif, CI/CD otomatis)
- **Vercel** (alternatif)

### 11.2 Build & Deploy

```bash
# Build production
npm run build

# Output di /dist — deploy folder ini
```

### 11.3 Checklist Deploy

- [ ] Semua asset ter-cache oleh Service Worker
- [ ] Manifest.json valid (cek di DevTools > Application)
- [ ] HTTPS aktif (wajib untuk PWA)
- [ ] Lighthouse audit score ≥ 90
- [ ] Test install PWA di Android & iOS
- [ ] Test offline functionality
