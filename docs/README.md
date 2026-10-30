# 💰 CatatKas — Aplikasi Pencatatan Keuangan Pribadi

> PWA offline-first untuk mencatat pemasukan & pengeluaran harian dengan mudah dan cepat.

---

## 📋 Deskripsi

**CatatKas** adalah Progressive Web App (PWA) pencatatan keuangan pribadi yang dirancang untuk membantu pengguna melacak arus kas (uang masuk & keluar) secara sederhana namun lengkap. Aplikasi ini bekerja sepenuhnya offline menggunakan IndexedDB, sehingga tidak memerlukan koneksi internet atau server backend.

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📥 Catat Pemasukan | Tambah transaksi uang masuk dengan kategori & catatan |
| 📤 Catat Pengeluaran | Tambah transaksi uang keluar dengan kategori & catatan |
| 🏷️ Kategori | Kelola kategori pemasukan & pengeluaran (custom) |
| 👛 Multi-Akun/Dompet | Kelola beberapa akun (kas, bank, e-wallet, dll.) |
| 📊 Grafik & Chart | Visualisasi keuangan dengan chart interaktif |
| 💰 Budget/Anggaran | Tetapkan anggaran per kategori per bulan |
| 📅 Filter & Pencarian | Filter transaksi berdasarkan tanggal, kategori, akun |
| 📄 Laporan Bulanan | Ringkasan keuangan per bulan |
| 📤 Ekspor Data | Ekspor data ke CSV/JSON |
| 📱 PWA & Offline | Install di HP/desktop, bekerja tanpa internet |

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite)
- **Routing**: React Router v6
- **State Management**: Zustand
- **Storage**: IndexedDB (via Dexie.js)
- **Charts**: Chart.js + react-chartjs-2
- **PWA**: vite-plugin-pwa (Workbox)
- **Styling**: CSS3 (Vanilla / CSS Modules)
- **Icons**: Lucide React

## 🚀 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd catatkas

# Install dependencies (jika menggunakan Vite)
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

## 📁 Struktur Proyek

```
catatkas/
├── docs/                     # Dokumentasi proyek
├── public/                   # Asset statis & PWA icons
├── src/
│   ├── main.jsx              # Entry point React
│   ├── App.jsx               # Root component + Router
│   ├── components/           # React components (JSX)
│   ├── pages/                # Halaman (lazy loaded)
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand stores
│   ├── db/                   # Database layer (Dexie.js)
│   ├── utils/                # Utility functions
│   ├── styles/               # CSS files
│   └── assets/               # Gambar & font
├── index.html                # HTML template (Vite)
├── package.json
└── vite.config.js
```

## 📜 Lisensi

MIT License — Silakan gunakan dan modifikasi sesuai kebutuhan.

---

> **CatatKas** — _Catat keuanganmu, kendalikan hidupmu._ 💪
