import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  Eye,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import BrandMark from '../components/ui/BrandMark';

const sections = [
  {
    id: 'data-yang-disimpan',
    icon: Database,
    title: 'Data yang disimpan',
    body: 'CatatKas menyimpan nama, email, dan data keuangan yang kamu masukkan: akun, kategori, transaksi, budget, transfer, serta pengaturan tampilan. Data ini dipakai hanya untuk menjalankan fitur aplikasi.',
  },
  {
    id: 'pemisahan-data-pengguna',
    icon: UserRound,
    title: 'Pemisahan data pengguna',
    body: 'Setiap akun memiliki ruang data sendiri. Pengguna lain tidak dapat membaca atau mengubah data keuanganmu. Satu akun admin pemilik dapat meninjau data keuangan seluruh pengguna untuk keperluan operasional dan dukungan.',
  },
  {
    id: 'penyimpanan-dan-keamanan',
    icon: LockKeyhole,
    title: 'Penyimpanan dan keamanan',
    body: 'Data disimpan di Supabase dengan autentikasi dan aturan akses tingkat baris. Password dikelola oleh layanan autentikasi dan tidak pernah disimpan di aplikasi CatatKas. Koneksi ke server menggunakan HTTPS. Bukti transfer pengiklan disimpan di bucket privat dan hanya dibuka admin melalui tautan sementara.',
  },
  {
    id: 'akses-dan-retensi',
    icon: Eye,
    title: 'Akses dan retensi',
    body: 'Kamu dapat mengekspor atau menghapus seluruh data keuanganmu kapan saja. Saat akun dihapus oleh admin, data profil dan data keuangan terkait dihapus dari basis data. Backup yang sudah kamu unduh berada di luar kendali CatatKas.',
  },
  {
    id: 'iklan-dan-pengukuran',
    icon: Megaphone,
    title: 'Iklan dan pengukuran',
    body: 'Iklan sponsor, termasuk iklan berbayar dari pengiklan publik, ditampilkan tanpa mengirim data keuanganmu. Di aplikasi Android, CatatKas memakai Google AdMob (Google Mobile Ads SDK). Setelah preferensi iklan yang diperlukan diberikan melalui Google User Messaging Platform, Google dapat memakai pengenal perangkat atau iklan, alamat IP, perkiraan lokasi, dan data interaksi iklan untuk menampilkan serta mengukur iklan sesuai kebijakannya. Di web/PWA, Google AdSense hanya dimuat setelah kamu memberi persetujuan. Data keuanganmu tidak dibagikan kepada pengiklan. CatatKas hanya menyimpan jumlah tayangan dan klik agregat tanpa mengaitkannya ke identitas pengguna.',
  },
  {
    id: 'pengiklan-publik',
    icon: Wallet,
    title: 'Data pengiklan publik',
    body: 'Jika kamu mengirim pesanan iklan tanpa akun, kami menyimpan nama, email, nomor WhatsApp, materi iklan, paket, nominal, metode pembayaran, dan bukti transfer. Data ini dipakai untuk membuat pesanan, memverifikasi pembayaran, dan memberikan dukungan. Status pesanan diakses melalui link bertoken acak; siapa pun yang memiliki link tersebut dapat melihat status dan detail pembayaran, jadi simpan link itu dengan aman.',
  },
  {
    id: 'keamanan-formulir-publik',
    icon: LockKeyhole,
    title: 'Keamanan formulir publik',
    body: 'Formulir iklan memakai hash IP dan email untuk membatasi percobaan spam, honeypot, serta opsional Cloudflare Turnstile. Hash tersebut tidak dipakai untuk membuat profil iklan. Data pembayaran dan bukti transfer tidak ditampilkan kepada pengunjung lain.',
  },
  {
    id: 'hak-dan-kontak',
    icon: ShieldCheck,
    title: 'Hak dan kontak',
    body: 'Kamu berhak meminta informasi, koreksi, ekspor, atau penghapusan data. Gunakan menu Pengaturan untuk ekspor dan reset data, atau hubungi admin melalui alamat dukungan yang tercantum di aplikasi. Pengiklan publik dapat menghubungi admin untuk mengoreksi atau menghapus data pesanan iklannya.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <div className="privacy-header__inner">
          <Link to="/" className="privacy-header__brand">
            <BrandMark size={36} decorative />
            <span>CatatKas</span>
          </Link>
          <Link to="/login" className="btn btn--ghost btn--sm privacy-header__back">
            <ArrowLeft aria-hidden="true" />
            Kembali
          </Link>
        </div>
      </header>

      <main className="privacy-content">
        <section className="privacy-hero" aria-labelledby="privacy-title">
          <div className="privacy-hero__copy">
            <span className="privacy-kicker">Kebijakan privasi</span>
            <h1 id="privacy-title">Data keuanganmu, dengan batas yang jelas.</h1>
            <p className="privacy-lead">
              CatatKas adalah aplikasi pencatatan keuangan pribadi. Kami berusaha menyimpan hanya
              data yang diperlukan, menjelaskan siapa yang dapat melihatnya, dan memberi kamu
              kendali atas data tersebut.
            </p>
          </div>
          <div className="privacy-hero__meta">
            <span className="privacy-hero__meta-label">Terakhir diperbarui</span>
            <time dateTime="2026-11-04">4 November 2026</time>
          </div>
        </section>

        <div className="privacy-body">
          <aside className="privacy-toc">
            <span className="privacy-toc__label">Di halaman ini</span>
            <nav aria-label="Daftar isi kebijakan privasi">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="privacy-article" aria-label="Isi kebijakan privasi">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="privacy-section"
                  aria-labelledby={`${section.id}-title`}
                >
                  <span className="privacy-section__icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div className="privacy-section__body">
                    <h2 id={`${section.id}-title`}>{section.title}</h2>
                    <p>{section.body}</p>
                  </div>
                </section>
              );
            })}

            <div className="privacy-note" role="note">
              <span className="privacy-note__icon">
                <AlertTriangle size={19} aria-hidden="true" />
              </span>
              <p>
                <strong>Catatan penting:</strong> admin pemilik dapat meninjau isi data keuangan
                seluruh pengguna. Jangan memasukkan informasi rahasia yang tidak ingin kamu bagi
                dengan operator layanan.
              </p>
            </div>

            <div className="privacy-actions">
              <Link to="/register" className="btn btn--primary">
                Buat akun CatatKas
              </Link>
              <Link to="/login" className="btn btn--ghost">
                Sudah punya akun
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
