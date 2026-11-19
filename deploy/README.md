# Deployment CatatKas — Supabase Cloud + VPS statis

Panduan ini memasang **frontend** dan **halaman privacy** di VPS, sementara database, auth, storage, dan Edge Functions tetap di Supabase Cloud. PHP tidak dipakai.

## Arsitektur

```text
app.domain.com  → Nginx/Apache → /var/www/catatkas/current
                                   ├── index.html + assets/   (React)
                                   └── privacy/index.html     (HTML statis)
                                              │
                                              └── HTTPS → Supabase Cloud
```

## 1. Prasyarat

- Domain/subdomain, misalnya `app.domain.com`, sudah mengarah ke IP VPS.
- Project Supabase Cloud sudah dibuat (region **Singapore**).
- Node.js 18+ di VPS (untuk build) dan akses SSH.
- Nginx **atau** Apache sudah terpasang.
- Port 80 dan 443 terbuka.
- Untuk production, gunakan paket Supabase berbayar. Project free tier dapat di-pause saat tidak aktif.

Simpan nilai berikut di tempat aman:

| Nilai | Lokasi |
|---|---|
| Project URL | Supabase Dashboard → Project Settings → API |
| Anon/publishable key | Supabase Dashboard → Project Settings → API |
| Service role key | **Hanya server/CLI**, jangan pernah masuk frontend |
| Database password | Saat membuat project |

## 2. Siapkan Supabase Cloud

Jalankan dari laptop (lebih mudah karena login browser) atau VPS dengan `SUPABASE_ACCESS_TOKEN`.

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push --db-url "$SUPABASE_DB_URL"
npx supabase functions deploy --use-api
npx supabase secrets set TURNSTILE_SECRET_KEY=<secret> RATE_LIMIT_SALT=<random-string>
```

Catatan:

- `db push` menerapkan semua migrasi, termasuk tabel, RLS, dan bucket storage.
- `--use-api` membundel Edge Functions di server Supabase, jadi **Docker tidak diperlukan**.
- Tanpa Turnstile, `TURNSTILE_SECRET_KEY` boleh dikosongkan; rate limit dan honeypot tetap berjalan.
- Jangan set `SUPABASE_SERVICE_ROLE_KEY` sebagai secret function; nilainya sudah tersedia otomatis.
- Untuk `--db-url`, pakai **session pooler** (port **5432**), bukan host `db.<ref>.supabase.co`:
  ```bash
  postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-1-<REGION>.pooler.supabase.com:5432/postgres
  ```
  Host `db.<ref>.supabase.co` hanya IPv6 sehingga sering gagal dari jaringan tanpa IPv6. Transaction
  pooler (port 6543) tidak mendukung DDL, jadi jangan dipakai untuk migrasi. Simpan nilainya di
  `.env.db.local` (diabaikan git) dengan nama `SUPABASE_DB_URL`.

### Pengaturan Auth

Di Supabase Dashboard → Authentication:

1. **Site URL:** `https://app.domain.com`
2. **Redirect URLs:**
   - `https://app.domain.com/auth/callback`
   - `https://app.domain.com/reset-password`
3. Nonaktifkan **Confirm Email** agar akun langsung aktif.
4. Isi **SMTP** production (Brevo, Resend, Mailgun, dan sejenisnya). Email bawaan Supabase hanya untuk uji coba.

### Admin

Daftar akun lewat aplikasi, lalu jalankan di **SQL Editor** Supabase:

```sql
select public.bootstrap_admin('email-admin-anda@gmail.com');
```

## 3. Build frontend

Di VPS:

```bash
cd /path/ke/catatkas
cp deploy/env.production.example .env.production.local
# edit .env.production.local, isi URL dan anon key Supabase Cloud

npm ci
npm run build
```

Jangan memakai `npm run dev` atau `npm run preview` untuk production. Yang di-deploy hanya isi `dist/`.

## 4. Upload ke VPS

Gunakan struktur rilis agar rollback mudah:

```bash
RELEASE=$(date +%Y%m%d-%H%M%S)

ssh user@VPS "sudo mkdir -p /var/www/catatkas/releases/$RELEASE"
rsync -az dist/ user@VPS:/var/www/catatkas/releases/$RELEASE/
rsync -az privacy-site/ user@VPS:/var/www/catatkas/releases/$RELEASE/privacy/
ssh user@VPS "sudo ln -sfn releases/$RELEASE /var/www/catatkas/current && sudo chown -R www-data:www-data /var/www/catatkas"
```

Rollback: arahkan symlink `current` ke folder rilis sebelumnya.

Di Windows, jalankan perintah `rsync` lewat Git Bash/WSL, atau gunakan `scp -r` dengan path rilis yang sama.

## 5. Nginx

Salin `deploy/nginx/catatkas.conf` ke `/etc/nginx/sites-available/catatkas.conf`, ganti `app.domain.com`, lalu:

```bash
sudo ln -s /etc/nginx/sites-available/catatkas.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Aktifkan HTTPS:

```bash
sudo certbot --nginx -d app.domain.com
```

Certbot menambahkan listener 443, sertifikat, dan redirect HTTP → HTTPS secara otomatis. Pilih opsi redirect saat diminta.

## 6. Apache (alternatif)

Aktifkan modul yang diperlukan:

```bash
sudo a2enmod ssl rewrite headers
```

Salin `deploy/apache/catatkas.conf` ke `/etc/apache2/sites-available/catatkas.conf`, ganti domain, lalu:

```bash
sudo a2ensite catatkas
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo certbot --apache -d app.domain.com
```

## 7. Verifikasi

```bash
curl -I https://app.domain.com
curl -I https://app.domain.com/privacy
curl -I https://app.domain.com/assets/<nama-file-dari-dist>.js
```

Checklist manual:

- [ ] Halaman login terbuka dan tidak menampilkan layar “Supabase belum dikonfigurasi”.
- [ ] Register akun baru berhasil dan langsung bisa login.
- [ ] Tambah transaksi, lalu data muncul di Supabase Table Editor.
- [ ] Refresh halaman di route dalam (misalnya `/history`) tidak 404.
- [ ] Reset password mengirim email.
- [ ] Upload bukti iklan masuk ke Storage bucket.
- [ ] `/advertise` dapat memuat paket dari Edge Function.
- [ ] Akun admin bisa membuka `/admin`.
- [ ] `https://app.domain.com/privacy` menampilkan kebijakan privasi.
- [ ] Service worker/PWA aktif setelah HTTPS.

## 8. Update aplikasi

```bash
git pull
npm ci
npm run build
# ulangi langkah upload dengan folder rilis baru
```

Migrasi baru:

```bash
npx supabase db push --db-url "$SUPABASE_DB_URL"
npx supabase functions deploy --use-api
```

## 9. Backup dan keamanan

- Aktifkan backup sesuai paket Supabase; unduh backup JSON dari aplikasi secara berkala.
- Jangan commit `.env.production.local` atau service role key.
- Batasi SSH dengan key, nonaktifkan login password.
- Firewall hanya izinkan `22`, `80`, `443`.
- Update paket sistem dan PHP lain di VPS secara rutin. PHP 7.4 sudah EOL dan tidak dipakai CatatKas.
- Pantau kuota Supabase (database, storage, bandwidth) dan status project.

## 10. Catatan PHP 7.4

Domain CatatKas hanya menyajikan file statis. Tidak ada konfigurasi PHP, `mod_php`, atau PHP-FPM yang diperlukan. Kalau VPS memakai cPanel, tempatkan hasil build di `public_html` atau subdomain, dan pastikan domain tersebut tidak menjalankan aplikasi PHP.
