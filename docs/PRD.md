# Product Requirements Document (PRD)

## CatatKas v2

**Versi dokumen:** 2.1  
**Tanggal:** 28 Oktober 2026  
**Status:** Implementasi v2 termasuk iklan self-service selesai; QA lokal selesai, checklist produksi belum lengkap

---

## 1. Ringkasan Produk

### 1.1 Visi

Menjadi aplikasi pencatatan keuangan pribadi yang cepat dipakai, mudah dipahami, dan tetap dapat dibaca saat perangkat sedang offline.

### 1.2 Misi

Membantu pengguna memahami arus kas melalui pencatatan transaksi yang sederhana, laporan yang informatif, pengelolaan budget, serta sinkronisasi aman antar perangkat.

### 1.3 Target Pengguna

- Individu yang mencatat keuangan harian
- Pelajar dan mahasiswa yang mengelola uang saku
- Pekerja yang melacak pengeluaran bulanan
- Pengguna yang membutuhkan akses data dari beberapa perangkat
- UMKM, kreator, atau brand kecil yang ingin memasang iklan tanpa akun

### 1.4 Masalah dan Solusi

| Masalah | Solusi CatatKas v2 |
|---|---|
| Pencatatan terasa rumit | Form cepat dengan akun default dan kategori awal |
| Data hanya ada di satu perangkat | Sinkronisasi cloud melalui Supabase |
| Data tidak bisa dibuka tanpa internet | Snapshot IndexedDB untuk mode baca offline |
| Tidak tahu ke mana uang pergi | Grafik, laporan bulanan, dan budget per kategori |
| Data pengguna tercampur | Isolasi per user dengan Row Level Security |
| Operasional membutuhkan pengawasan | Panel admin tunggal dengan akses baca-saja ke keuangan |
| Monetisasi mengganggu privasi | Sponsor terbatas, rotasi sponsor berbayar, dan AdSense dengan consent |
| Pengiklan kecil sulit memasang iklan | Halaman self-service tanpa akun dengan transfer manual dan verifikasi admin |

---

## 2. Peran dan Hak Akses

### 2.1 Pengguna

- Mengelola seluruh data keuangannya sendiri.
- Dapat mengekspor, membackup, dan mereset datanya.
- Tidak dapat membaca data pengguna lain.
- Tidak dapat mengakses route admin.

### 2.2 Admin

- Hanya satu akun admin yang diizinkan.
- Dapat melihat ringkasan agregat seluruh pengguna.
- Dapat membaca data keuangan seluruh pengguna dari panel admin.
- Tidak dapat menambah, mengubah, atau menghapus transaksi, akun, kategori, budget, atau transfer pengguna.
- Dapat menangguhkan, mengaktifkan, dan menghapus akun pengguna.
- Dapat mengelola iklan, paket, pesanan, dan pengaturan pembayaran.
- Dapat memverifikasi pembayaran manual dan menyetujui atau menolak pesanan iklan.
- Aksi administratif dicatat di audit log.

### 2.3 Pengiklan Publik

- Tidak perlu akun CatatKas.
- Dapat memilih paket, mengirim materi iklan, dan mengunggah bukti transfer.
- Mengakses status pesanan hanya melalui link bertoken acak yang diberikan setelah pengiriman.
- Tidak dapat membaca data pengguna, pesanan lain, atau area admin.

### 2.4 Edge Function

Operasi yang membutuhkan service role, terutama suspend/aktifkan/hapus akun auth dan penulisan pesanan publik, dijalankan melalui Edge Function. Client tidak pernah menerima service role key.

---

## 3. Functional Requirements

### 3.1 Autentikasi dan Akun

**Prioritas:** Tinggi

Persyaratan:

- Registrasi memakai nama lengkap, email, password minimal 8 karakter, dan persetujuan syarat.
- Verifikasi email tidak diwajibkan; akun langsung aktif setelah registrasi.
- Setelah registrasi, sesi otomatis dari Supabase dibuang dan pengguna diarahkan ke halaman login untuk masuk manual.
- Login memakai email dan password.
- Sesi disimpan dan diperbarui otomatis.
- Lupa password mengirim tautan reset; password baru minimal 8 karakter.
- Route pengguna dilindungi dan route login/register dialihkan untuk sesi aktif.
- Callback autentikasi menangani token valid, error hash, dan sesi yang tidak terbentuk.
- Profil pengguna menampilkan status akun dan status suspend.
- Logout membersihkan sesi, profil lokal, cache Dexie, dan store data.
- Akun yang ditangguhkan tidak dapat memakai aplikasi, termasuk jika sesinya masih tersimpan.
- Akun yang dihapus admin tidak dapat login kembali.

Data profil:

| Field | Keterangan |
|---|---|
| `id` | UUID dari `auth.users` |
| `email` | Disalin dari auth |
| `full_name` | Nama tampilan |
| `role` | `user` atau `admin` |
| `is_suspended` | Status penangguhan |
| `created_at` | Waktu registrasi |
| `last_seen_at` | Aktivitas terakhir |

### 3.2 Pencatatan Transaksi

**Prioritas:** Tinggi

Field transaksi:

| Field | Wajib | Keterangan |
|---|---|---|
| Jenis | Ya | Pemasukan atau pengeluaran |
| Nominal | Ya | Rupiah, bilangan bulat positif |
| Kategori | Ya | Milik pengguna dan sesuai jenis |
| Akun | Ya | Milik pengguna |
| Tanggal | Ya | Default hari ini |
| Waktu | Tidak | Default waktu sekarang |
| Catatan | Tidak | Teks singkat |

Kemampuan:

- Tambah, lihat, edit, dan hapus transaksi.
- Transaksi dikelompokkan berdasarkan tanggal.
- Saldo akun dihitung dari saldo awal, pemasukan, pengeluaran, dan transfer.
- Transaksi yang masih dirujuk tidak boleh dihapus jika melanggar aturan data.

### 3.3 Kategori

**Prioritas:** Tinggi

- Kategori awal dibuat otomatis saat registrasi.
- Pengguna dapat menambah, mengubah, dan menghapus kategori.
- Kategori memiliki jenis, nama, ikon, warna, dan urutan.
- Kategori yang masih dipakai transaksi atau budget tidak dapat dihapus tanpa penanganan.

### 3.4 Akun dan Transfer

**Prioritas:** Sedang

- Pengguna dapat mengelola beberapa akun/dompet.
- Setiap akun memiliki nama, ikon, warna, saldo awal, status aktif, dan urutan.
- Satu akun dapat dijadikan akun default.
- Transfer memindahkan saldo antar akun tanpa mengubah total kekayaan.
- Akun asal dan tujuan tidak boleh sama.
- Transfer dapat memiliki tanggal, waktu, dan catatan.

### 3.5 Budget

**Prioritas:** Sedang

- Budget ditetapkan per kategori pengeluaran dan periode bulanan.
- Setiap kategori hanya memiliki satu budget per periode.
- Progress budget dihitung dari realisasi pengeluaran.
- Ambang peringatan default 80%.
- Budget yang masih dipakai tidak boleh terhapus tanpa penanganan.

### 3.6 Dashboard dan Laporan

**Prioritas:** Tinggi

Dashboard:

- Total saldo semua akun.
- Pemasukan bulan berjalan.
- Pengeluaran bulan berjalan.
- Grafik distribusi pengeluaran.
- Grafik arus kas.
- Tren saldo.
- Transaksi terbaru.
- Ringkasan budget.

Laporan:

- Pemasukan, pengeluaran, dan selisih per bulan.
- Breakdown kategori.
- Top pengeluaran.
- Perbandingan dengan bulan sebelumnya.
- Evaluasi budget.
- Filter bulan.

### 3.7 Riwayat dan Filter

**Prioritas:** Sedang

- Filter tanggal, jenis, kategori, akun, rentang nominal, dan pencarian catatan.
- Preset bulan ini, 30 hari, tahun ini, dan semua.
- Pagination atau pemuatan bertahap untuk data besar.
- Navigasi ke detail dan edit transaksi.

### 3.8 Ekspor, Backup, dan Restore

**Prioritas:** Sedang

- Ekspor CSV untuk transaksi.
- Backup JSON untuk seluruh data keuangan pengguna.
- Restore JSON memakai RPC server yang memetakan ID lama ke ID baru.
- Restore bersifat mengganti seluruh data pengguna, bukan menggabungkan.
- Reset data menghapus data keuangan pengguna lalu membuat akun dan kategori awal baru.
- Restore dan reset memerlukan koneksi internet.
- Data yang tidak valid ditolak tanpa mengubah data lama.

### 3.9 Mode Offline dan PWA

**Prioritas:** Tinggi

- Aplikasi dapat di-install sebagai PWA.
- App shell dan aset statis tersedia melalui service worker.
- Setelah login online, snapshot data pengguna tersedia di IndexedDB.
- Saat offline, pengguna dapat membuka aplikasi dan membaca snapshot terakhir.
- Cache hanya berlaku untuk pemilik terakhir; pergantian user membersihkan cache.
- Semua operasi tulis diblokir saat offline dengan pesan yang jelas.
- Iklan tidak ditampilkan saat offline.
- Setelah koneksi kembali, pengguna dapat menyinkronkan ulang data.
- Tidak ada antrean write offline pada versi ini.

### 3.10 Pengaturan

**Prioritas:** Sedang

- Tema terang, gelap, atau mengikuti sistem.
- Akun default.
- Bahasa antarmuka Indonesia.
- Ambang peringatan budget.
- Informasi akun dan status akun.
- Preferensi iklan/consent.
- Install PWA dan informasi versi.
- Ekspor, backup, restore, reset, dan logout.

### 3.11 Panel Admin

**Prioritas:** Tinggi

Ringkasan:

- Total pengguna dan jumlah ditangguhkan.
- Total transaksi.
- Total pemasukan dan pengeluaran seluruh pengguna.
- Jumlah iklan aktif.
- Pengguna aktif tujuh hari terakhir.
- Daftar pengguna terbaru.

Pengguna:

- Pencarian dan filter status.
- Detail profil dan status.
- Ringkasan jumlah transaksi dan akun.
- Data keuangan baca-saja.
- Suspend dan aktifkan akun.
- Hapus akun dengan konfirmasi.
- Admin tidak dapat menangguhkan atau menghapus dirinya sendiri.

Iklan:

- Tab **Kampanye**: membuat iklan sponsor atau AdSense, mengatur placement, prioritas, jadwal tayang, dan status aktif.
- Tab **Paket**: CRUD paket publik berisi nama, penempatan, durasi, harga, prioritas, dan status tampil.
- Tab **Pesanan**: mencari, memfilter, membuka detail, melihat bukti privat lewat tautan sementara, lalu menyetujui atau menolak.
- Tab **Pembayaran**: mengisi rekening, mengunggah QRIS statis, menulis instruksi, dan membuka/menutup pemesanan.
- Statistik tayangan dan klik agregat.
- Edit, aktifkan/nonaktifkan, dan hapus iklan.
- Menghapus kreatif storage saat iklan dihapus atau gambar diganti.

### 3.12 Iklan Self-Service Publik

**Prioritas:** Tinggi

- Halaman `/advertise` dapat diakses tanpa login.
- Menampilkan paket aktif dari admin, termasuk penempatan, durasi, harga, dan deskripsi.
- Formulir meminta nama, email, WhatsApp, judul, deskripsi opsional, URL HTTPS, label tombol, dan gambar kreatif.
- Gambar kreatif JPG/PNG/WebP maksimal 2 MB.
- Metode pembayaran: transfer bank atau QRIS statis sesuai konfigurasi admin.
- Nominal order = harga paket + kode unik tiga digit; kode dijaga unik selama order menunggu.
- Status order: `awaiting_payment`, `awaiting_review`, `approved`, `rejected`, `expired`, `cancelled`.
- Setelah order dibuat, pengiklan menerima link status bertoken UUID. Tidak ada email otomatis; link harus disimpan.
- Halaman status menampilkan nominal, rekening/QRIS, batas waktu, instruksi, form bukti transfer, progres, dan hasil verifikasi.
- Bukti transfer JPG/PNG/WebP/PDF maksimal 5 MB.
- Admin menyetujui order `awaiting_review`; persetujuan mengaktifkan iklan dan mengisi `starts_at` serta `ends_at`.
- Penolakan wajib memiliki alasan yang terlihat pengiklan.
- Formulir dilindungi rate limit hash IP/email, honeypot `_company`, dan Turnstile opsional.

### 3.13 Iklan dan Consent

**Prioritas:** Sedang

- Placement: dashboard, history, reports, more.
- Sponsor memakai gambar dan tautan `http`/`https`.
- Sponsor berbayar diprioritaskan di atas AdSense pada placement yang sama.
- Jika ada beberapa sponsor aktif, tampilan dirotasi per placement.
- AdSense memakai publisher ID dari environment dan slot dari data iklan.
- HTML atau script bebas tidak diizinkan.
- Iklan hanya tampil jika aktif, dalam jadwal, dan pengguna online.
- AdSense hanya dimuat setelah consent.
- Statistik iklan tidak menyimpan identitas pengguna.
- Publisher AdSense kosong harus ditangani sebagai status belum dikonfigurasi.

### 3.14 Halaman Privasi

**Prioritas:** Rendah

- Menjelaskan data yang disimpan, termasuk data pengiklan publik dan bukti pembayaran.
- Menjelaskan pemisahan data dan akses admin.
- Menjelaskan penggunaan iklan dan cookie.
- Menjelaskan hash IP/email untuk anti-spam dan penyimpanan bukti privat.
- Menjelaskan hak ekspor, reset, dan penghapusan.
- Dapat diakses tanpa login.

---

## 4. Halaman dan Route

| Route | Halaman | Akses |
|---|---|---|
| `/login` | Login | Publik |
| `/register` | Registrasi | Publik |
| `/forgot-password` | Lupa password | Publik |
| `/reset-password` | Reset password | Publik |
| `/auth/callback` | Callback autentikasi | Publik |
| `/privacy` | Kebijakan privasi | Publik |
| `/advertise` | Pasang iklan | Publik |
| `/advertise/order` | Pencarian status pesanan | Publik |
| `/advertise/order/:token` | Status pesanan iklan | Publik (token) |
| `/` | Dashboard | Pengguna |
| `/add` | Tambah transaksi | Pengguna |
| `/history` | Riwayat | Pengguna |
| `/transaction/:id` | Detail transaksi | Pengguna |
| `/transaction/:id/edit` | Edit transaksi | Pengguna |
| `/reports` | Laporan | Pengguna |
| `/budget` | Budget | Pengguna |
| `/accounts` | Akun dan dompet | Pengguna |
| `/categories` | Kategori | Pengguna |
| `/settings` | Pengaturan | Pengguna |
| `/export` | Ekspor dan impor | Pengguna |
| `/more` | Menu lainnya | Pengguna |
| `/admin` | Ringkasan admin | Admin |
| `/admin/users` | Daftar pengguna | Admin |
| `/admin/users/:id` | Detail pengguna | Admin |
| `/admin/ads` | Kampanye iklan | Admin |
| `/admin/ads/packages` | Paket iklan | Admin |
| `/admin/ads/orders` | Pesanan iklan | Admin |
| `/admin/ads/payments` | Pembayaran iklan | Admin |
| `*` | Tidak ditemukan | Publik |

---

## 5. Model Data

Tabel utama:

| Tabel | Keterangan |
|---|---|
| `profiles` | Profil, role, status suspend, aktivitas terakhir |
| `accounts` | Akun/dompet milik pengguna |
| `categories` | Kategori pemasukan/pengeluaran |
| `transactions` | Transaksi keuangan |
| `transfers` | Transfer antar akun |
| `budgets` | Budget per kategori dan periode |
| `settings` | Preferensi pengguna dalam JSONB |
| `ads` | Data iklan sponsor/AdSense, termasuk `source`, `package_id`, dan `advertiser_id` |
| `ad_daily_stats` | Agregat tayangan/klik per hari |
| `ad_packages` | Paket iklan publik |
| `ad_orders` | Pesanan iklan publik, nominal unik, status, dan hasil review |
| `ad_payment_settings` | Rekening, QRIS, instruksi, dan saklar pemesanan |
| `ad_public_rate_limits` | Hash rate limit formulir publik |
| `admin_audit_log` | Jejak aksi admin |

Aturan utama:

- ID tabel keuangan memakai `bigint identity`.
- Semua tabel keuangan memiliki `user_id`.
- Foreign key komposit memastikan kategori/akun berasal dari user yang sama.
- Kombinasi unik mencegah budget ganda untuk kategori dan periode yang sama.
- Profil memiliki indeks unik parsial agar hanya ada satu admin.
- Trigger membuat profil dan data awal saat user auth baru dibuat.
- Trigger melindungi `role`, `is_suspended`, `created_at`, dan email dari perubahan client biasa.
- RLS pengguna hanya mengizinkan data miliknya dan hanya saat tidak ditangguhkan.
- Admin memiliki akses select ke data keuangan, tetapi bukan akses tulis.
- Kebijakan iklan hanya mengizinkan admin untuk insert/update/delete.
- Tabel paket, pesanan, pembayaran, dan rate limit tidak dibuka untuk anon. Semua penulisan publik melewati Edge Function dengan service role.
- RLS admin-only berlaku untuk data pesanan dan pengaturan pembayaran.
- Bucket `ad-creatives` dapat dibaca publik, tetapi hanya admin/Edge Function yang dapat menulis.
- Bucket `ad-payment-assets` menyimpan QRIS publik; `ad-payment-proofs` privat dan hanya diakses admin melalui signed URL.
- Nominal unik dijaga indeks parsial selama order masih menunggu.

RPC server:

- `reset_my_data()`
- `replace_my_data(payload)`
- `admin_dashboard_stats()`
- `admin_user_summaries()`
- `record_ad_event(ad_id, event)`
- `create_public_ad_order(...)`
- `submit_public_ad_proof(...)`
- `admin_review_ad_order(order_id, action, note)`
- `bootstrap_admin(email)` hanya untuk service role

---

## 6. Non-Functional Requirements

### 6.1 Keamanan

- Service role key tidak boleh ada di bundle client.
- Semua tabel terekspos melalui API harus memakai RLS.
- Route admin dilindungi di client dan operasi sensitif diverifikasi kembali di server.
- Edge Function memverifikasi JWT dan role admin.
- Aksi admin terhadap akun sendiri ditolak.
- Koneksi production memakai HTTPS.
- Password minimal 8 karakter dan dikelola Supabase Auth.
- File iklan dibatasi tipe dan ukuran.
- Status pesanan publik memakai token UUID 128-bit; endpoint status tidak menerima pencarian berdasarkan email atau kode order.
- Formulir publik memakai rate limit hash IP/email, honeypot, dan Turnstile opsional.
- Bukti pembayaran disimpan privat dan diakses admin melalui signed URL berumur pendek.
- Respons halaman status memakai `Cache-Control: no-store` dan `X-Robots-Tag: noindex`.

### 6.2 Privasi

- Data keuangan tidak dipakai untuk iklan.
- Statistik iklan hanya agregat.
- Admin dapat membaca data keuangan pengguna; fakta ini dijelaskan di halaman privasi.
- Data pengiklan publik hanya dipakai untuk memproses pesanan dan verifikasi pembayaran.
- Bukti transfer tidak ditampilkan ke pengunjung lain.
- Pengguna dapat mengekspor dan mereset data.
- Pengiklan publik dapat meminta koreksi atau penghapusan data pesanan melalui admin.
- Backup yang diunduh berada di luar kendali aplikasi.

### 6.3 Performa

Target:

- First Contentful Paint di bawah 1,5 detik pada koneksi wajar.
- Time to Interactive di bawah 3 detik.
- Input transaksi selesai di bawah 5 detik untuk penggunaan normal.
- Data besar dimuat bertahap dengan ukuran halaman 1000 baris.
- Build production tidak memiliki error dan tidak memiliki warning import campuran.

### 6.4 Aksesibilitas

- Kontras teks minimal 4,5:1 untuk teks normal.
- Semua kontrol memiliki label atau nama aksesibel.
- Navigasi keyboard dan focus state tersedia.
- Dialog memiliki `role="dialog"` dan label.
- Status koneksi dan error diumumkan melalui elemen status.
- Layout responsif pada mobile, tablet, dan desktop.

### 6.5 Kompatibilitas

- Chrome dan Edge versi modern
- Firefox versi modern
- Safari 14+ untuk perangkat yang mendukung PWA
- Android dan iOS
- Desktop 1440 px dan mobile 390 px menjadi acuan QA

---

## 7. Out of Scope

- Lebih dari satu admin
- Role admin granular
- Admin mengedit data keuangan pengguna
- Impersonasi pengguna
- Budget bersama atau keluarga
- Transaksi berulang otomatis
- Multi-currency
- Foto struk
- AI insights
- HTML/script iklan bebas
- Payment gateway otomatis, webhook, atau rekonsiliasi bank otomatis
- Email transaksional otomatis untuk status pesanan
- Persetujuan konten terpisah dari verifikasi pembayaran
- Sinkronisasi write offline dan resolusi konflik
- Push notification budget
- Aplikasi native

---

## 8. Acceptance Criteria

Rilis dianggap siap jika:

1. Registrasi, pengalihan ke login manual, login, logout, lupa password, dan reset password lulus.
2. Pengguna baru mendapatkan akun dan kategori awal.
3. CRUD transaksi, kategori, akun, budget, dan transfer lulus.
4. User tidak dapat membaca atau mengubah data user lain.
5. Admin dapat melihat data seluruh pengguna tanpa dapat mengubah keuangan.
6. Suspend langsung memblokir akses; activate memulihkan akses; delete menghapus akun.
7. Admin tidak dapat menangguhkan atau menghapus dirinya sendiri.
8. Iklan sponsor dan AdSense dapat dikelola, dijadwalkan, dan dihapus.
9. Iklan tidak tampil saat offline atau sebelum consent AdSense.
10. Mode offline dapat membuka snapshot, menolak write, dan pulih setelah online.
11. Restore/reset memetakan ulang ID dan menolak payload invalid.
12. `npm run lint`, `npm test`, dan `npm run build` lulus.
13. Tidak ada error console pada alur utama desktop dan mobile.
14. Layout admin tidak overflow pada desktop, tablet, dan mobile.
15. SPA rewrite, SMTP reset password, environment production, dan domain redirect dikonfigurasi.

Status QA lokal terakhir:

- Unit test: 49 lulus.
- Lint: bersih.
- Build: lulus.
- E2E pengguna, admin, suspend, iklan, RPC, dan offline: lulus.
- Signup tanpa verifikasi, pengalihan ke login manual, logout, dan login ulang: lulus.
- Screenshot visual: desktop 1440 dan mobile 390 diperiksa.
- Kesiapan production: menunggu konfigurasi hosting, SMTP reset password, dan AdSense.

---

## 9. Checklist Produksi

- [ ] Buat project Supabase production
- [ ] Terapkan migrasi dengan `supabase db push`
- [ ] Deploy Edge Function `admin-users`
- [ ] Atur Site URL dan Redirect URLs
- [ ] Nonaktifkan Confirm Email agar signup langsung aktif
- [ ] Konfigurasi SMTP production untuk reset password
- [ ] Promosikan satu akun admin
- [ ] Isi environment production
- [ ] Konfigurasi SPA rewrite ke `index.html`
- [ ] Aktifkan HTTPS dan verifikasi service worker
- [ ] Isi publisher AdSense dan publikasikan `ads.txt`
- [ ] Uji signup, pengalihan ke login manual, reset password, dan login di domain production
- [ ] Uji suspend/activate/delete pengguna
- [ ] Uji backup/restore pada data production non-kritis
- [ ] Triase hasil audit dependency
- [ ] Siapkan kebijakan retensi, dukungan, dan kontak privasi
