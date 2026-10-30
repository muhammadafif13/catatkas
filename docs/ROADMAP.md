# 🗺️ Development Roadmap
## CatatKas — Aplikasi Pencatatan Keuangan Pribadi

**Versi Dokumen**: 1.0  
**Tanggal**: 26 Oktober 2026  
**Metodologi**: Iterative development — build, test, polish, repeat

---

## Timeline Overview

```
Phase 1: Foundation     ████████░░░░░░░░░░░░  Minggu 1-2
Phase 2: Core Features  ░░░░░░░░████████░░░░  Minggu 3-4
Phase 3: Advanced       ░░░░░░░░░░░░░░░░████  Minggu 5-6
Phase 4: Polish & Ship  ░░░░░░░░░░░░░░░░░░██  Minggu 7
```

---

## Phase 1: Foundation (Minggu 1-2)

> **Tujuan**: Setup proyek, design system, database, dan halaman dasar.

### Minggu 1: Setup & Design System

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 1.1 | Inisialisasi proyek (Vite + struktur folder) | 🔴 | 2 jam | ⬜ |
| 1.2 | Setup PWA (manifest.json, service worker dasar) | 🔴 | 2 jam | ⬜ |
| 1.3 | Implementasi CSS design system (variables, reset, base) | 🔴 | 4 jam | ⬜ |
| 1.4 | Setup Dexie.js + schema database | 🔴 | 3 jam | ⬜ |
| 1.5 | Seed data default (kategori & akun) | 🔴 | 2 jam | ⬜ |
| 1.6 | Implementasi hash-based router | 🔴 | 3 jam | ⬜ |
| 1.7 | Implementasi reactive store (Proxy-based) | 🔴 | 3 jam | ⬜ |
| 1.8 | Komponen dasar: Header, Navbar, Toast, Modal | 🔴 | 4 jam | ⬜ |

**Deliverable**: Skeleton app yang bisa navigasi antar halaman kosong.

### Minggu 2: Halaman Dashboard & Form Transaksi

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 2.1 | Komponen BalanceCard (total saldo + income/expense) | 🔴 | 3 jam | ⬜ |
| 2.2 | Komponen TransactionCard (list item) | 🔴 | 2 jam | ⬜ |
| 2.3 | Halaman Dashboard (layout + data binding) | 🔴 | 4 jam | ⬜ |
| 2.4 | Komponen TransactionForm (input nominal, pilih kategori) | 🔴 | 5 jam | ⬜ |
| 2.5 | Komponen CategoryPicker (grid emoji) | 🔴 | 3 jam | ⬜ |
| 2.6 | Komponen AccountPicker | 🔴 | 2 jam | ⬜ |
| 2.7 | Halaman AddTransaction (integrasi form) | 🔴 | 3 jam | ⬜ |
| 2.8 | CRUD transaksi (create, read) + saldo update | 🔴 | 3 jam | ⬜ |
| 2.9 | Format currency Rupiah (utility) | 🔴 | 1 jam | ⬜ |
| 2.10 | Format tanggal Indonesia (utility) | 🔴 | 1 jam | ⬜ |

**Deliverable**: User bisa menambah transaksi dan melihat di dashboard.

---

## Phase 2: Core Features (Minggu 3-4)

> **Tujuan**: Fitur inti lengkap — riwayat, edit/hapus, grafik, dark/light theme.

### Minggu 3: Riwayat & CRUD Lengkap

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 3.1 | Halaman History (daftar transaksi lengkap) | 🔴 | 4 jam | ⬜ |
| 3.2 | Komponen DateFilter (filter tanggal) | 🟡 | 3 jam | ⬜ |
| 3.3 | Filter: jenis transaksi, kategori, akun | 🟡 | 3 jam | ⬜ |
| 3.4 | Pencarian teks di catatan transaksi | 🟡 | 2 jam | ⬜ |
| 3.5 | Halaman TransactionDetail (lihat detail) | 🔴 | 2 jam | ⬜ |
| 3.6 | Edit transaksi (pre-fill form + update) | 🔴 | 3 jam | ⬜ |
| 3.7 | Hapus transaksi (confirm dialog + delete) | 🔴 | 2 jam | ⬜ |
| 3.8 | Swipe to delete (mobile gesture) | 🟢 | 3 jam | ⬜ |
| 3.9 | Empty states untuk semua halaman | 🟡 | 2 jam | ⬜ |
| 3.10 | Dark/Light theme toggle + auto detect | 🟡 | 3 jam | ⬜ |

**Deliverable**: CRUD transaksi lengkap dengan riwayat dan filter.

### Minggu 4: Grafik & Visualisasi

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 4.1 | Integrasi Chart.js | 🔴 | 2 jam | ⬜ |
| 4.2 | Komponen ChartPie (pengeluaran per kategori) | 🔴 | 3 jam | ⬜ |
| 4.3 | Komponen ChartBar (income vs expense harian) | 🔴 | 3 jam | ⬜ |
| 4.4 | Komponen ChartLine (tren saldo 30 hari) | 🟡 | 3 jam | ⬜ |
| 4.5 | Dashboard: integrasi grafik | 🔴 | 2 jam | ⬜ |
| 4.6 | Halaman Reports (laporan bulanan) | 🟡 | 5 jam | ⬜ |
| 4.7 | Navigasi antar bulan di laporan | 🟡 | 2 jam | ⬜ |
| 4.8 | Breakdown pengeluaran per kategori (tabel) | 🟡 | 2 jam | ⬜ |
| 4.9 | Perbandingan bulan sebelumnya | 🟢 | 3 jam | ⬜ |
| 4.10 | Chart animation (draw effect) | 🟢 | 2 jam | ⬜ |

**Deliverable**: Dashboard informatif dengan grafik dan laporan bulanan.

---

## Phase 3: Advanced Features (Minggu 5-6)

> **Tujuan**: Fitur lanjutan — multi-akun, budget, ekspor, dan PWA optimize.

### Minggu 5: Multi-Akun & Budget

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 5.1 | Halaman Accounts (kelola akun/dompet) | 🟡 | 4 jam | ⬜ |
| 5.2 | CRUD akun (tambah, edit, hapus, reorder) | 🟡 | 3 jam | ⬜ |
| 5.3 | Saldo per akun (kalkulasi dari transaksi) | 🟡 | 3 jam | ⬜ |
| 5.4 | Transfer antar akun | 🟡 | 4 jam | ⬜ |
| 5.5 | Halaman Budget (kelola anggaran) | 🟡 | 4 jam | ⬜ |
| 5.6 | Komponen BudgetProgress (progress bar) | 🟡 | 3 jam | ⬜ |
| 5.7 | CRUD budget (set/edit budget per kategori) | 🟡 | 3 jam | ⬜ |
| 5.8 | Alert saat mendekati/melebihi budget | 🟢 | 2 jam | ⬜ |
| 5.9 | Dashboard: widget budget overview | 🟢 | 2 jam | ⬜ |
| 5.10 | Halaman Categories (kelola kategori) | 🟡 | 3 jam | ⬜ |

**Deliverable**: Multi-akun, transfer, dan manajemen budget berfungsi.

### Minggu 6: Ekspor, Settings & PWA

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 6.1 | Ekspor data ke CSV | 🟡 | 3 jam | ⬜ |
| 6.2 | Ekspor data ke JSON (backup) | 🟡 | 2 jam | ⬜ |
| 6.3 | Impor data dari JSON (restore) | 🟡 | 3 jam | ⬜ |
| 6.4 | Halaman Export/Import dengan UI | 🟡 | 3 jam | ⬜ |
| 6.5 | Halaman Settings | 🟡 | 3 jam | ⬜ |
| 6.6 | Service Worker: cache strategy lengkap | 🔴 | 4 jam | ⬜ |
| 6.7 | Manifest.json lengkap + icons semua ukuran | 🔴 | 2 jam | ⬜ |
| 6.8 | Offline test (semua fitur jalan offline) | 🔴 | 2 jam | ⬜ |
| 6.9 | Install prompt (A2HS) | 🟡 | 2 jam | ⬜ |
| 6.10 | Splash screen design | 🟢 | 1 jam | ⬜ |

**Deliverable**: Fitur ekspor/impor, settings, PWA siap install.

---

## Phase 4: Polish & Ship (Minggu 7)

> **Tujuan**: Polish UI, optimasi performa, testing, dan deploy.

| # | Task | Prioritas | Estimasi | Status |
|---|------|-----------|----------|--------|
| 7.1 | Micro-animations (page transition, list items) | 🟡 | 4 jam | ⬜ |
| 7.2 | Count-up animation untuk saldo | 🟢 | 2 jam | ⬜ |
| 7.3 | Loading states & skeleton screens | 🟡 | 3 jam | ⬜ |
| 7.4 | Responsive testing (mobile, tablet, desktop) | 🔴 | 3 jam | ⬜ |
| 7.5 | Cross-browser testing (Chrome, Safari, Firefox) | 🔴 | 3 jam | ⬜ |
| 7.6 | Lighthouse audit & optimasi | 🔴 | 3 jam | ⬜ |
| 7.7 | Error handling & edge cases | 🔴 | 3 jam | ⬜ |
| 7.8 | Final code review & cleanup | 🟡 | 2 jam | ⬜ |
| 7.9 | Build production & deploy | 🔴 | 2 jam | ⬜ |
| 7.10 | Tulis README final & dokumentasi deploy | 🟡 | 2 jam | ⬜ |

**Deliverable**: Aplikasi siap digunakan dan di-deploy! 🚀

---

## Ringkasan Estimasi

| Phase | Durasi | Total Jam | Jumlah Task |
|-------|--------|-----------|-------------|
| Phase 1: Foundation | 2 minggu | ~54 jam | 18 tasks |
| Phase 2: Core Features | 2 minggu | ~54 jam | 20 tasks |
| Phase 3: Advanced | 2 minggu | ~54 jam | 20 tasks |
| Phase 4: Polish & Ship | 1 minggu | ~27 jam | 10 tasks |
| **Total** | **7 minggu** | **~189 jam** | **68 tasks** |

---

## Milestone & Checkpoint

| Milestone | Target | Kriteria Selesai |
|-----------|--------|-----------------|
| 🏁 **M1: App Skeleton** | Akhir Minggu 1 | Routing, design system, database, komponen dasar |
| 🏁 **M2: MVP** | Akhir Minggu 2 | Bisa tambah transaksi & lihat di dashboard |
| 🏁 **M3: Core Complete** | Akhir Minggu 4 | CRUD lengkap, grafik, laporan, theme |
| 🏁 **M4: Feature Complete** | Akhir Minggu 6 | Semua fitur berfungsi, PWA siap |
| 🚀 **M5: Launch** | Akhir Minggu 7 | Polished, tested, deployed |

---

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|---------|
| IndexedDB quota limit | Data hilang | Fitur ekspor/backup di awal |
| Performa chart dengan data banyak | App lambat | Virtual scrolling, lazy loading chart |
| Kompatibilitas Safari iOS | PWA terbatas | Test awal di Safari, fallback |
| Scope creep (fitur tambahan) | Telat launch | Strict pada scope v1.0, buat backlog |
| Browser update breaking changes | Fitur rusak | Pin versi dependency, regular testing |

---

## Backlog (Post v1.0)

Fitur yang bisa dipertimbangkan setelah v1.0 stabil:

| Fitur | Kompleksitas | Prioritas |
|-------|-------------|-----------|
| 🔁 Recurring transactions (auto) | Tinggi | ⬜ |
| 🌍 Multi-currency support | Tinggi | ⬜ |
| ☁️ Cloud sync (Firebase/Supabase) | Tinggi | ⬜ |
| 📸 Foto struk/nota (attachment) | Sedang | ⬜ |
| 🔐 PIN/password lock | Sedang | ⬜ |
| 📊 Dashboard widgets customizable | Sedang | ⬜ |
| 🏷️ Tags/label pada transaksi | Rendah | ⬜ |
| 🤖 AI categorization (auto-kategori) | Tinggi | ⬜ |
| 📧 Laporan email (summary) | Sedang | ⬜ |
| 👥 Shared budget (keluarga) | Tinggi | ⬜ |
| 🌐 Multi-language (English) | Rendah | ⬜ |
| 📱 Native app (Capacitor/TWA) | Tinggi | ⬜ |

---

## Status Legend

| Ikon | Status |
|------|--------|
| ⬜ | Belum dimulai |
| 🔄 | Sedang dikerjakan |
| ✅ | Selesai |
| ⏸️ | Ditunda |
| ❌ | Dibatalkan |

> **Catatan**: Roadmap ini bersifat fleksibel. Estimasi waktu berdasarkan development solo. Prioritas dan timeline dapat disesuaikan sesuai kebutuhan.
