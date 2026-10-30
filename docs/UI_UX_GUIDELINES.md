# 🎨 Panduan UI/UX
## CatatKas — Aplikasi Pencatatan Keuangan Pribadi

**Versi Dokumen**: 1.0  
**Tanggal**: 26 Oktober 2026  
**Pendekatan**: Mobile-First, Dark Mode Default

---

## 1. Prinsip Desain

### 1.1 Filosofi

> **"Cepat, Bersih, Percaya Diri"**

1. **Cepat (Speed)** — Input transaksi < 5 detik, navigasi tanpa loading
2. **Bersih (Clean)** — Minimalis, tidak membingungkan, fokus pada konten
3. **Percaya Diri (Confident)** — Visual yang meyakinkan, feedback yang jelas

### 1.2 Prinsip Utama

| Prinsip | Implementasi |
|---------|-------------|
| **Mobile-First** | Desain dimulai dari layar kecil (360px), naik ke desktop |
| **Progressive Disclosure** | Tampilkan yang penting dulu, detail bisa di-expand |
| **Consistent** | Pola interaksi yang sama di seluruh aplikasi |
| **Accessible** | Kontras cukup, font size readable, touch target 44px+ |
| **Feedback** | Setiap aksi pengguna mendapat respons visual/haptic |

---

## 2. Design Tokens (CSS Custom Properties)

### 2.1 Color Palette

```css
:root {
  /* === Brand Colors === */
  --color-primary-50:  #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;  /* Primary */
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;

  /* === Semantic Colors === */
  --color-income:     #22c55e;   /* Hijau — Pemasukan */
  --color-income-bg:  #22c55e1a; /* Hijau transparan */
  --color-expense:    #ef4444;   /* Merah — Pengeluaran */
  --color-expense-bg: #ef44441a; /* Merah transparan */
  --color-transfer:   #3b82f6;   /* Biru — Transfer */
  --color-warning:    #f59e0b;   /* Kuning — Peringatan */
  --color-success:    #22c55e;   /* Hijau — Sukses */
  --color-error:      #ef4444;   /* Merah — Error */
  --color-info:       #3b82f6;   /* Biru — Info */
}
```

### 2.2 Dark Theme (Default)

```css
[data-theme="dark"] {
  --bg-primary:    #0f172a;   /* Slate 900 */
  --bg-secondary:  #1e293b;   /* Slate 800 */
  --bg-tertiary:   #334155;   /* Slate 700 */
  --bg-card:       #1e293b;
  --bg-input:      #334155;
  --bg-hover:      #334155;

  --text-primary:   #f8fafc;   /* Slate 50 */
  --text-secondary: #94a3b8;   /* Slate 400 */
  --text-tertiary:  #64748b;   /* Slate 500 */
  --text-inverse:   #0f172a;

  --border-primary:   #334155;
  --border-secondary: #475569;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

### 2.3 Light Theme

```css
[data-theme="light"] {
  --bg-primary:    #ffffff;
  --bg-secondary:  #f8fafc;
  --bg-tertiary:   #f1f5f9;
  --bg-card:       #ffffff;
  --bg-input:      #f1f5f9;
  --bg-hover:      #f1f5f9;

  --text-primary:   #0f172a;
  --text-secondary: #475569;
  --text-tertiary:  #94a3b8;
  --text-inverse:   #ffffff;

  --border-primary:   #e2e8f0;
  --border-secondary: #cbd5e1;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### 2.4 Typography

```css
:root {
  /* Font Family */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Size Scale */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */

  /* Font Weight */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line Height */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Letter Spacing */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0;
  --tracking-wide:    0.025em;
}
```

### 2.5 Spacing & Sizing

```css
:root {
  /* Spacing Scale (4px base) */
  --space-0:   0;
  --space-1:   0.25rem;   /* 4px */
  --space-2:   0.5rem;    /* 8px */
  --space-3:   0.75rem;   /* 12px */
  --space-4:   1rem;      /* 16px */
  --space-5:   1.25rem;   /* 20px */
  --space-6:   1.5rem;    /* 24px */
  --space-8:   2rem;      /* 32px */
  --space-10:  2.5rem;    /* 40px */
  --space-12:  3rem;      /* 48px */
  --space-16:  4rem;      /* 64px */
  --space-20:  5rem;      /* 80px */

  /* Border Radius */
  --radius-sm:   0.375rem;  /* 6px */
  --radius-md:   0.5rem;    /* 8px */
  --radius-lg:   0.75rem;   /* 12px */
  --radius-xl:   1rem;      /* 16px */
  --radius-2xl:  1.5rem;    /* 24px */
  --radius-full: 9999px;    /* Pill */

  /* Touch Target */
  --touch-target: 44px;     /* Minimum touch target size */
}
```

### 2.6 Animasi

```css
:root {
  /* Transitions */
  --transition-fast:   150ms ease;
  --transition-base:   200ms ease;
  --transition-slow:   300ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Animasi yang digunakan */
  /* slide-up    — Modal, bottom sheet muncul */
  /* slide-down  — Modal, bottom sheet tertutup */
  /* fade-in     — Elemen muncul */
  /* fade-out    — Elemen menghilang */
  /* scale-in    — FAB press effect */
  /* shake       — Error validation */
  /* pulse       — Loading state */
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}

/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. Komponen UI

### 3.1 Kartu Saldo (Balance Card)

```
┌─────────────────────────────────┐
│  Total Saldo                    │
│  Rp 2.450.000                   │  ← Font besar, tebal
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │ ▲ Income│    │ ▼ Expense│    │
│  │ 5.000.000│  │ 2.550.000│    │
│  └────────┘    └────────┘       │
└─────────────────────────────────┘
```

- Background: Gradient `primary-600` → `primary-800`
- Border radius: `--radius-2xl`
- Padding: `--space-6`
- Income badge: `--color-income` background transparan
- Expense badge: `--color-expense` background transparan

### 3.2 Kartu Transaksi (Transaction Card)

```
┌─────────────────────────────────┐
│ 🍔  Makan siang          -35.000│
│     Makanan • Kas    12:30 siang│
└─────────────────────────────────┘
```

- Icon kategori di kiri (emoji, 32px)
- Nama transaksi / catatan di kiri atas
- Nominal di kanan atas (hijau untuk income, merah untuk expense)
- Metadata di kiri bawah (kategori • akun)
- Waktu di kanan bawah
- Swipe kiri untuk hapus (mobile)
- Klik/tap untuk detail

### 3.3 Form Input Transaksi

```
┌─────────────────────────────────┐
│  [Pemasukan] [Pengeluaran]      │  ← Toggle switch
│                                 │
│  Rp ____________________        │  ← Number input, besar
│                                 │
│  📂 Pilih Kategori    ▼         │  ← Category picker
│  👛 Pilih Akun        ▼         │  ← Account picker
│  📅 26 Oktober 2026   ▼         │  ← Date picker
│  📝 Catatan (opsional)          │  ← Text input
│                                 │
│  ┌─────────────────────────┐    │
│  │      💾 Simpan           │    │  ← Primary button
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

- Input nominal: Font `--text-3xl`, `--font-bold`, autofocus
- Format otomatis dengan pemisah ribuan saat mengetik
- Category picker: Grid emoji cards (3-4 kolom)
- Animasi saat switch income ↔ expense

### 3.4 Bottom Navigation Bar

```
┌──────────────────────────────────────┐
│  🏠        ➕        📋       ⚙️     │
│ Beranda   Tambah   Riwayat   Lainnya │
└──────────────────────────────────────┘
```

- Fixed di bagian bawah layar
- Height: 64px + safe area
- Active tab: `--color-primary-500` dengan ikon yang terisi
- Inactive tab: `--text-tertiary`
- Tombol Tambah (+): Lebih menonjol (FAB style)

### 3.5 Budget Progress Bar

```
┌─────────────────────────────────┐
│ 🍔 Makanan & Minuman            │
│ Rp 450.000 / Rp 800.000        │
│ ████████████░░░░░░░░  56%      │  ← Progress bar
│ Sisa: Rp 350.000               │
└─────────────────────────────────┘
```

- Progress warna: Hijau (0-60%), Kuning (60-80%), Merah (80-100%+)
- Animasi progress bar saat pertama kali ditampilkan
- Badge "Over Budget!" jika > 100%

### 3.6 Toast Notification

```
┌─────────────────────────────────┐
│ ✅ Transaksi berhasil disimpan   │  ← Slide dari atas
└─────────────────────────────────┘
```

- Posisi: Top center, di bawah status bar
- Durasi: 3 detik (auto dismiss)
- Tipe: Success (hijau), Error (merah), Info (biru), Warning (kuning)
- Animasi: Slide down + fade in

---

## 4. Layout & Responsiveness

### 4.1 Breakpoints

```css
/* Mobile (default) */
/* 0 - 639px */

/* Tablet */
@media (min-width: 640px) { /* sm */ }

/* Laptop */
@media (min-width: 1024px) { /* lg */ }

/* Desktop */
@media (min-width: 1280px) { /* xl */ }
```

### 4.2 Layout per Breakpoint

| Breakpoint | Layout |
|------------|--------|
| **Mobile (< 640px)** | Single column, bottom nav, full-width cards |
| **Tablet (640-1023px)** | 2-column grid untuk dashboard, bottom nav |
| **Desktop (≥ 1024px)** | Sidebar nav (kiri, 240px) + main content, max-width 1200px |

### 4.3 Safe Areas (Mobile)

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.bottom-nav {
  padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
}
```

---

## 5. Navigasi & Alur Pengguna

### 5.1 Alur Utama: Tambah Transaksi

```
Dashboard → Tap "+" → Form Transaksi → Pilih Jenis
  → Input Nominal → Pilih Kategori → Pilih Akun
    → (Opsional) Ubah Tanggal → (Opsional) Tambah Catatan
      → Tap "Simpan" → Toast "Berhasil!" → Kembali ke Dashboard
```

### 5.2 Alur: Lihat Laporan

```
Dashboard → Tap "Laporan" (bottom nav) → Laporan Bulan Ini
  → Geser kiri/kanan untuk ganti bulan
    → Tap kategori untuk detail breakdown
```

### 5.3 Alur: Setup Budget

```
Menu "Lainnya" → Budget → Tap "+" → Pilih Kategori
  → Input Batas Anggaran → Simpan → Lihat Progress
```

### 5.4 Gesture Support (Mobile)

| Gesture | Aksi |
|---------|------|
| Swipe kiri pada transaksi | Tampilkan tombol hapus |
| Swipe kanan pada transaksi | Tampilkan tombol edit |
| Pull-to-refresh di riwayat | Refresh data (visual feedback) |
| Swipe antar bulan di laporan | Navigasi bulan |
| Long press pada transaksi | Tampilkan context menu |

---

## 6. Micro-Animations

### 6.1 Daftar Animasi

| Elemen | Trigger | Animasi | Durasi |
|--------|---------|---------|--------|
| Halaman | Route change | Fade + slide up | 200ms |
| Kartu transaksi | Muncul di list | Staggered fade-in | 50ms per item |
| Saldo | Value berubah | Count up animation | 500ms |
| Progress budget | Muncul pertama kali | Width dari 0% ke target | 600ms |
| FAB (Tambah) | Tap | Scale down → up (press effect) | 150ms |
| Toast | Muncul | Slide down + fade in | 200ms |
| Toast | Hilang | Slide up + fade out | 200ms |
| Toggle income/expense | Tap | Slide indicator + color change | 200ms |
| Modal | Buka | Backdrop fade + content slide up | 300ms |
| Modal | Tutup | Content slide down + backdrop fade | 200ms |
| Item dihapus | Swipe confirm | Slide out + collapse height | 300ms |
| Chart | Data load | Draw animation | 600ms |
| Nominal di form | Ketik | Format angka dengan ease | Instant |

### 6.2 Number Count-Up (Saldo)

```javascript
function animateValue(element, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(start + range * eased);
    element.textContent = formatCurrency(current);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
```

---

## 7. Aksesibilitas

### 7.1 Checklist

- [ ] **Kontras warna**: Minimal 4.5:1 untuk text, 3:1 untuk large text
- [ ] **Touch target**: Minimal 44x44px untuk semua elemen interaktif
- [ ] **Focus visible**: Outline yang jelas untuk navigasi keyboard
- [ ] **ARIA labels**: Semua tombol & ikon punya label deskriptif
- [ ] **Screen reader**: Teks alternatif untuk semua elemen visual
- [ ] **Font scaling**: Layout tidak rusak saat font diperbesar 200%
- [ ] **Reduced motion**: Hormati `prefers-reduced-motion`
- [ ] **Semantic HTML**: Gunakan elemen HTML yang sesuai

### 7.2 Contoh ARIA

```html
<!-- Tombol tanpa teks -->
<button aria-label="Tambah transaksi baru" class="fab">
  <span aria-hidden="true">+</span>
</button>

<!-- Saldo -->
<div role="status" aria-live="polite" aria-label="Total saldo Rp 2.450.000">
  <span class="balance-amount">Rp 2.450.000</span>
</div>

<!-- Progress budget -->
<div role="progressbar" 
     aria-valuenow="56" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Budget Makanan terpakai 56%">
</div>
```

---

## 8. Empty States & Error States

### 8.1 Empty States

| Halaman | Pesan | Ikon | CTA |
|---------|-------|------|-----|
| Dashboard (baru) | "Belum ada transaksi. Yuk mulai catat!" | 📝 | "Tambah Transaksi Pertama" |
| Riwayat (kosong) | "Tidak ada transaksi di periode ini" | 🔍 | "Ubah Filter" |
| Budget (kosong) | "Belum ada anggaran. Atur budget-mu!" | 💰 | "Buat Anggaran" |
| Laporan (kosong) | "Data belum cukup untuk laporan" | 📊 | "Tambah Transaksi" |

### 8.2 Error States

| Error | Pesan | Aksi |
|-------|-------|------|
| Database error | "Gagal memuat data. Coba restart aplikasi." | Tombol "Coba Lagi" |
| Validasi form | Highlight field merah + pesan di bawah field | — |
| Hapus gagal | "Gagal menghapus. Silakan coba lagi." | Toast + retry |
| Import gagal | "File tidak valid. Pastikan format JSON benar." | — |
| Storage penuh | "Penyimpanan penuh. Ekspor & hapus data lama." | Link ke Ekspor |

---

## 9. Referensi Visual

### 9.1 Inspirasi Desain

- **Wallet by BudgetBakers** — Layout dashboard yang clean
- **Money Manager** — Category picker yang intuitif  
- **Bluecoins** — Grafik keuangan yang informatif
- **Spendee** — Micro-animations yang halus
- **Apple Wallet** — Kartu saldo dengan gradient premium

### 9.2 Color Usage Guide

| Warna | Penggunaan |
|-------|-----------|
| 🟣 Primary (Indigo) | Brand, active state, CTA buttons, links |
| 🟢 Income (Green) | Pemasukan, saldo positif, success |
| 🔴 Expense (Red) | Pengeluaran, saldo negatif, error, delete |
| 🔵 Transfer (Blue) | Transfer antar akun, info |
| 🟡 Warning (Amber) | Budget mendekati limit, peringatan |
| ⚪ Neutral (Slate) | Text, background, borders, disabled state |
