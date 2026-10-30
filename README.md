# CatatKas v2

CatatKas adalah PWA pencatatan keuangan pribadi multi-user. Data utama disimpan di Supabase, dengan salinan snapshot di IndexedDB untuk membaca data saat offline. Perubahan data memerlukan koneksi internet.

## Stack

- React 18 + Vite
- React Router (BrowserRouter)
- Zustand
- Dexie / IndexedDB
- Chart.js
- Supabase Auth, Postgres, Row Level Security, Storage, dan Edge Functions
- vite-plugin-pwa / Workbox

## Fitur

### Pengguna

- Registrasi tanpa verifikasi email, login manual, lupa password, dan reset password
- Dashboard saldo, grafik, transaksi terbaru, dan ringkasan budget
- CRUD transaksi, kategori, akun/dompet, budget, dan transfer antar akun
- Riwayat dengan filter dan laporan bulanan
- Ekspor CSV, backup/restore JSON, serta reset data
- Tema terang, gelap, atau mengikuti sistem
- PWA installable dengan app shell offline

### Admin

- Satu akun admin pemilik, dipromosikan melalui fungsi database
- Ringkasan pengguna, transaksi, pemasukan, pengeluaran, dan iklan
- Daftar pengguna dan detail data keuangan secara baca-saja
- Suspend, aktifkan, dan hapus akun melalui Edge Function
- Audit log untuk aksi admin
- Tab **Kampanye**, **Paket**, **Pesanan**, dan **Pembayaran** untuk mengelola iklan
- Verifikasi transfer manual, membuka bukti privat lewat tautan sementara, dan menyetujui pesanan
- CRUD iklan sponsor dan slot AdSense

### Iklan publik

- Halaman `/advertise` untuk pengiklan tanpa akun: pilih paket, unggah kreatif, dan buat pesanan
- Pembayaran transfer bank atau QRIS statis dengan nominal unik tiga digit
- Halaman status `/advertise/order/:token` memakai token acak; pengiklan harus menyimpan link
- Bukti transfer disimpan privat dan diverifikasi admin sebelum iklan aktif
- Sponsor berbayar diprioritaskan di atas AdSense dan dirotasi antar sponsor aktif per placement

### Iklan dan privasi

- Placement: beranda, riwayat, laporan, dan menu lainnya
- Sponsor memakai gambar yang diunggah admin atau kreatif pengiklan publik
- AdSense hanya dimuat setelah pengguna memberi persetujuan
- Statistik tayangan/klik disimpan agregat tanpa identitas pengguna
- Formulir publik dilindungi rate limit hash IP/email, honeypot, dan opsional Cloudflare Turnstile

### Alur iklan self-service

1. Admin mengisi paket, rekening, dan gambar QRIS di **Admin → Iklan → Paket/Pembayaran**.
2. Pengunjung membuka `/advertise`, memilih paket, mengisi materi dan kontak, lalu mengirim pesanan.
3. Pesanan mendapat nominal unik dan link status rahasia. Pengiklan mentransfer sesuai nominal.
4. Pengiklan mengunggah bukti lewat halaman status.
5. Admin membuka **Admin → Iklan → Pesanan**, mencocokkan dana, lalu menyetujui atau menolak.
6. Persetujuan mengaktifkan iklan dan mengisi jadwal tayang secara otomatis.

Pengiklan tidak perlu akun. Link status adalah satu-satunya akses ke pesanan dan tidak boleh dibagikan ke publik.

## Arsitektur data

- Supabase adalah sumber data utama.
- Setiap tabel keuangan memiliki `user_id` dan dilindungi RLS.
- Saat login, aplikasi mengambil snapshot data milik user yang sedang masuk dan menyimpannya ke IndexedDB.
- Cache selalu dibatasi dengan `user_id`; cache dibersihkan saat pengguna berganti.
- Operasi tulis langsung ke Supabase, lalu memperbarui cache lokal.
- Saat offline, pengguna dapat membaca snapshot terakhir. Tombol simpan, edit, dan hapus diblokir.
- Admin dapat membaca data keuangan semua pengguna melalui RLS, tetapi sinkronisasi cache pribadi tetap difilter ke `user_id` admin.
- Aksi administratif yang membutuhkan service role dijalankan oleh Edge Function `admin-users`.

## Menjalankan lokal

Prasyarat:

- Node.js 18+
- Docker Desktop
- Supabase CLI (tersedia sebagai dev dependency)

Langkah:

```bash
npm install
npx supabase start
npx supabase status
```

Salin `.env.example` menjadi `.env.local`, lalu isi URL dan anon key dari output `supabase status`.

```powershell
Copy-Item .env.example .env.local
```

Untuk fitur admin dan formulir iklan publik, jalankan seluruh Edge Function di terminal terpisah:

```bash
npx supabase functions serve
```

Function publik yang dipakai halaman `/advertise` adalah `public-ad-config`, `public-ad-submit`,
`public-ad-status`, dan `public-ad-proof`. Function `admin-users` menangani suspend/aktifkan/hapus akun.

Jika ingin mengaktifkan Turnstile di lokal, isi secret function melalui
`supabase/functions/.env` (file ini diabaikan git):

```dotenv
TURNSTILE_SECRET_KEY=...
RATE_LIMIT_SALT=...
```

Tanpa secret tersebut, formulir publik tetap berjalan dengan rate limit dan honeypot.

Jalankan aplikasi:

```bash
npm run dev
```

Layanan lokal:

| Layanan | URL |
|---|---|
| Aplikasi | `http://localhost:5173` |
| Supabase API | `http://127.0.0.1:54321` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Mailpit | `http://127.0.0.1:54324` |

Email reset password tidak dikirim keluar saat development; buka Mailpit untuk mengambil tautannya. Signup tidak mengirim email verifikasi dan akun langsung aktif.

Jika **Confirm Email** baru dinonaktifkan pada project yang sudah memiliki akun belum terkonfirmasi, konfirmasi akun lama tersebut sekali melalui Admin API `updateUserById(id, { email_confirm: true })` agar dapat login.

### Menjadikan akun sebagai admin

Daftar akun terlebih dahulu, lalu jalankan dari SQL Editor Supabase Studio:

```sql
select public.bootstrap_admin('admin@example.com');
```

Fungsi ini hanya dapat dijalankan dengan akses service role dan tidak tersedia untuk client aplikasi. Sistem hanya mengizinkan satu admin.

## Environment

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | Ya | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Ya | Anon/publishable key |
| `VITE_ADSENSE_CLIENT` | Tidak | Publisher ID AdSense, contoh `ca-pub-...` |
| `VITE_TURNSTILE_SITE_KEY` | Tidak | Site key Cloudflare Turnstile untuk formulir publik |
| `TURNSTILE_SECRET_KEY` | Tidak | Secret Edge Function; wajib jika site key diisi |
| `RATE_LIMIT_SALT` | Tidak | Salt hash rate limit; fallback ke service role key |

Jangan menaruh service role key di variabel `VITE_*`. File `.env.local`, `supabase/functions/.env`, dan
`.env.admin.local` tidak boleh di-commit.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Build production ke `dist/` |
| `npm run preview` | Preview build production |
| `npm run lint` | ESLint |
| `npm test` | Unit test Vitest |
| `npm run icons` | Generate ulang ikon PWA |
| `npm run supabase:start` | Jalankan Supabase lokal |
| `npm run supabase:stop` | Hentikan Supabase lokal |
| `npm run supabase:status` | Status dan kredensial lokal |
| `npm run supabase:push` | Terapkan migrasi ke project tertaut |
| `npm run supabase:reset` | Reset database lokal |

`npm run supabase:reset` bersifat destruktif dan menghapus seluruh data lokal.

## Build dan deploy

1. Buat project Supabase production dan jalankan migrasi:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   npx supabase functions deploy
   npx supabase secrets set TURNSTILE_SECRET_KEY=... RATE_LIMIT_SALT=...
   ```

   Isi secret Turnstile hanya jika `VITE_TURNSTILE_SITE_KEY` dipakai. Deploy `functions` akan
   mengirim seluruh function, termasuk empat function publik iklan.

2. Atur **Site URL** dan **Redirect URLs** di Supabase Auth ke domain production, termasuk `/auth/callback` dan `/reset-password`. Nonaktifkan **Confirm Email** di **Authentication → Providers → Email** agar akun langsung aktif setelah mendaftar.
3. Isi environment production, lalu jalankan `npm run build`.
4. Deploy isi `dist/` ke hosting statis.
5. Konfigurasikan SPA rewrite semua route ke `/index.html`. Aplikasi memakai BrowserRouter.
6. Aktifkan HTTPS agar service worker dan PWA dapat berjalan.
7. Untuk AdSense, isi `VITE_ADSENSE_CLIENT`, siapkan slot, dan publikasikan `ads.txt`.
8. Atur SMTP production agar email reset password terkirim.

## Struktur

```text
src/
├── components/   # layout, auth, forms, charts, iklan, UI
├── pages/        # halaman pengguna, auth, dan admin
├── hooks/        # logika turunan dan PWA
├── stores/       # Zustand stores
├── db/           # repository cloud, cache Dexie, migrasi data lama
├── services/     # sinkronisasi, admin, mapper
├── lib/          # client Supabase
├── utils/        # format, kalkulasi, validasi, ekspor
└── styles/       # design token dan stylesheet

supabase/
├── functions/admin-users/
├── migrations/
├── seed.sql
└── config.toml
```

## Pengujian

```bash
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Gunakan build preview untuk menguji service worker, mode offline, dan install PWA. Perubahan data saat offline memang diblokir; pastikan pesan koneksi tampil dan data kembali tersedia setelah online.

## Privasi dan backup

Data keuangan disimpan di Supabase dan disalin ke cache perangkat. Admin pemilik dapat meninjau data keuangan seluruh pengguna untuk operasional dan dukungan, tetapi tidak dapat mengubah data keuangan pengguna.

Pengguna dapat mengunduh backup JSON dan mengekspor CSV dari menu Ekspor. Reset data menghapus data keuangan pengguna dan membuat data awal baru. Backup yang sudah diunduh berada di luar kendali CatatKas.
