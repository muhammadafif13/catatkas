import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Baby,
  Database,
  FileText,
  Globe2,
  HardDrive,
  LockKeyhole,
  Mail,
  Megaphone,
  RefreshCw,
  Scale,
  Share2,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react';
import BrandMark from '../components/ui/BrandMark';

const CONTACT_EMAIL = 'muhammadafifhasyapratama14@gmail.com';

const sections = [
  {
    id: 'tentang',
    icon: FileText,
    title: 'Tentang kebijakan ini',
    body: 'Kebijakan Privasi ini berlaku untuk aplikasi Android CatatKas, situs web CatatKas, dan halaman layanan terkait, termasuk formulir pemesanan iklan publik. Dengan membuat akun atau menggunakan CatatKas, kamu menyetujui praktik yang dijelaskan di halaman ini. CatatKas dikembangkan dan dikelola oleh Aniwall. Jika kamu tidak setuju dengan kebijakan ini, mohon jangan menggunakan aplikasi.',
    items: [
      'CatatKas adalah aplikasi pencatatan manual. Kami tidak terhubung ke rekening bank, e-wallet, atau penyedia pembayaran, dan tidak memindahkan uang milikmu.',
    ],
  },
  {
    id: 'data',
    icon: Database,
    title: 'Data yang dikumpulkan',
    body: 'Kami hanya meminta data yang diperlukan untuk menjalankan aplikasi.',
    items: [
      'Data akun: nama lengkap, alamat email, waktu akun dibuat, dan waktu terakhir aktif.',
      'Kata sandi dikelola oleh layanan autentikasi Supabase dan disimpan dalam bentuk hash; kami tidak dapat melihat kata sandi asli.',
      'Data keuangan: dompet/akun, kategori, transaksi, budget, transfer, serta pengaturan tampilan.',
      'Data teknis: alamat IP, waktu akses, dan log kesalahan untuk keamanan dan stabilitas layanan.',
      'Cache perangkat: snapshot data keuangan di IndexedDB, sesi login, preferensi tema, dan status persetujuan iklan.',
      'Data pengiklan publik: nama, email, nomor WhatsApp, materi iklan, paket, nominal, metode pembayaran, dan bukti transfer.',
      'Data iklan: status persetujuan di perangkat; setelah persetujuan, Google dapat memproses pengenal perangkat/iklan, IP, perkiraan lokasi, dan interaksi iklan.',
    ],
  },
  {
    id: 'penggunaan',
    icon: Target,
    title: 'Cara data digunakan',
    body: 'Data dipakai untuk:',
    items: [
      'Menyediakan fitur pencatatan, perhitungan saldo, laporan, budget, dan transfer.',
      'Menyinkronkan data antar perangkat dan menjaga sesi login tetap aman.',
      'Menyimpan snapshot offline agar data terakhir tetap dapat dibaca tanpa internet.',
      'Mencegah penyalahgunaan, spam, dan akses tidak sah, termasuk pada formulir iklan publik.',
      'Memverifikasi pembayaran iklan dan mengelola pesanan pengiklan.',
      'Menampilkan serta mengukur iklan sponsor dan iklan Google sesuai persetujuan yang berlaku.',
      'Menjawab permintaan dukungan, koreksi, ekspor, atau penghapusan data.',
      'Memenuhi kewajiban hukum yang berlaku.',
    ],
    note: 'Kami tidak menggunakan data keuanganmu untuk membuat profil iklan, dan tidak menjual data pribadi kepada pihak mana pun.',
  },
  {
    id: 'dasar',
    icon: Scale,
    title: 'Dasar pemrosesan',
    body: 'Kami memproses data berdasarkan:',
    items: [
      'Persetujuan, untuk iklan yang dipersonalisasi dan formulir publik tertentu. Persetujuan dapat ditarik kapan saja.',
      'Pelaksanaan layanan, untuk membuat akun, menyimpan data keuangan, dan menyinkronkannya.',
      'Kepentingan yang sah, untuk keamanan, pencegahan penyalahgunaan, dan peningkatan keandalan aplikasi.',
      'Kewajiban hukum, jika ada permintaan yang sah dari otoritas berwenang.',
    ],
  },
  {
    id: 'lokal',
    icon: HardDrive,
    title: 'Penyimpanan lokal di perangkat',
    body: 'Sebagian data disimpan di perangkatmu agar aplikasi cepat dan bisa dibaca saat offline.',
    items: [
      'IndexedDB menyimpan snapshot data keuangan untuk mode baca offline. Data tidak dapat diubah saat offline dan dibatasi per akun.',
      'Local storage menyimpan sesi login, preferensi tema, dan status persetujuan iklan.',
      'Cookie atau teknologi serupa dipakai untuk autentikasi dan, setelah persetujuan, untuk iklan AdSense di web.',
      'Menghapus data aplikasi atau penyimpanan browser akan menghapus cache lokal. Data yang sudah tersinkron tetap tersedia setelah login kembali.',
    ],
  },
  {
    id: 'pihak-ketiga',
    icon: Share2,
    title: 'Pihak ketiga dan pembagian data',
    body: 'Kami hanya membagikan data kepada penyedia yang diperlukan untuk menjalankan layanan. Mereka memproses data sesuai kontrak dan kebijakan privasi masing-masing.',
    items: [
      'Supabase — database, autentikasi, dan penyimpanan file. Data: akun, data keuangan, bukti transfer iklan.',
      'Google AdMob — iklan di aplikasi Android. Data: ID perangkat/iklan, IP, perkiraan lokasi, interaksi iklan.',
      'Google AdSense — iklan di web/PWA. Data: cookie/ID iklan, IP, interaksi iklan setelah persetujuan.',
      'Cloudflare Turnstile — verifikasi anti-bot opsional pada formulir publik. Data: token verifikasi dan data teknis koneksi.',
      'Netlify — hosting halaman kebijakan privasi. Data: log akses web, termasuk alamat IP.',
      'Bukti transfer pengiklan disimpan di bucket privat dan hanya dibuka admin melalui tautan sementara.',
    ],
    note: 'Admin pemilik dapat meninjau data keuangan seluruh pengguna untuk keperluan operasional dan dukungan, tetapi tidak dapat mengubah data keuangan pengguna.',
  },
  {
    id: 'iklan',
    icon: Megaphone,
    title: 'Iklan dan persetujuan',
    body: 'CatatKas menampilkan iklan sponsor dari pengiklan serta iklan Google. Iklan sponsor ditampilkan tanpa mengirim data keuanganmu kepada pengiklan. Kami hanya menyimpan jumlah tayangan dan klik secara agregat tanpa mengaitkannya ke identitas pengguna. Di Android, Google User Messaging Platform (UMP) meminta persetujuan sebelum SDK AdMob meminta iklan. Di web/PWA, AdSense hanya dimuat setelah kamu memberi persetujuan. Kamu dapat membuka kembali preferensi iklan dari Pengaturan → Iklan & privasi. Menolak iklan yang dipersonalisasi tidak menghilangkan iklan, tetapi iklan yang tampil mungkin kurang relevan.',
  },
  {
    id: 'retensi',
    icon: Archive,
    title: 'Retensi data',
    body: 'Kami menyimpan data hanya selama diperlukan.',
    items: [
      'Data akun dan data keuangan disimpan selama akunmu aktif.',
      'Setelah penghapusan akun, data profil dan data keuangan terkait dihapus dari basis data. Salinan cadangan teknis dapat tersimpan sementara sesuai siklus pencadangan sistem, lalu dihapus.',
      'Data pesanan iklan disimpan selama diperlukan untuk verifikasi pembayaran, administrasi, dan kewajiban hukum, lalu dihapus atau dianonimkan.',
      'Hash IP/email untuk pembatasan spam disimpan sementara dan tidak dipakai membuat profil iklan.',
      'Backup yang sudah kamu unduh berada di luar kendali CatatKas.',
    ],
  },
  {
    id: 'keamanan',
    icon: LockKeyhole,
    title: 'Keamanan',
    body: 'Kami memakai HTTPS untuk koneksi ke server, autentikasi Supabase untuk pengelolaan akun, dan Row Level Security agar setiap pengguna hanya dapat mengakses datanya sendiri. Bukti transfer iklan disimpan di bucket privat. Akses admin dibatasi dan dicatat dalam audit log. Tidak ada sistem yang sepenuhnya bebas risiko. Jika terjadi pelanggaran data yang berdampak pada hakmu, kami akan memberi tahu pengguna dan pihak berwenang sesuai ketentuan yang berlaku.',
  },
  {
    id: 'hak',
    icon: UserRound,
    title: 'Hak kamu',
    body: 'Kamu berhak untuk:',
    items: [
      'Meminta informasi tentang data yang kami simpan dan cara penggunaannya.',
      'Memperbaiki nama, email, atau data keuangan yang tidak akurat.',
      'Mengekspor data keuangan melalui menu Ekspor (CSV atau backup JSON).',
      'Menghapus data keuangan melalui menu Pengaturan atau meminta penghapusan akun.',
      'Menarik persetujuan iklan kapan saja melalui preferensi iklan.',
      'Mengajukan keberatan atau keluhan kepada kami dan otoritas perlindungan data yang berwenang.',
    ],
    note: 'Kami akan menanggapi permintaan yang sah paling lambat 30 hari. Kami dapat meminta verifikasi identitas untuk melindungi akunmu.',
  },
  {
    id: 'hapus-akun',
    icon: Trash2,
    title: 'Menghapus akun dan data',
    body: 'Untuk menghapus data keuangan saja, buka Pengaturan → Reset data. Tindakan ini menghapus catatan keuangan dan membuat data awal baru. Untuk menghapus akun beserta data terkait, kirim email dari alamat yang terdaftar dengan subjek “Permintaan Penghapusan Akun CatatKas”. Setelah identitas diverifikasi, akun dan data keuangan akan dihapus. Data yang wajib disimpan untuk kepatuhan hukum dapat dipertahankan untuk periode yang diperlukan.',
    note: 'Penghapusan akun bersifat permanen. Kamu tidak dapat memulihkan transaksi, budget, atau dompet yang sudah dihapus, kecuali dari backup yang kamu unduh sendiri.',
    contact: true,
  },
  {
    id: 'anak',
    icon: Baby,
    title: 'Anak-anak',
    body: 'CatatKas tidak ditujukan untuk anak di bawah 13 tahun. Jika kamu berusia di bawah 18 tahun, gunakan aplikasi dengan izin orang tua atau wali. Jika kami mengetahui adanya data anak di bawah 13 tahun yang dikumpulkan tanpa izin yang sah, kami akan menghapus data tersebut.',
  },
  {
    id: 'internasional',
    icon: Globe2,
    title: 'Transfer data internasional',
    body: 'Supabase, Google, dan penyedia hosting dapat menyimpan atau memproses data di luar Indonesia. Kami memakai penyedia yang menerapkan pengamanan kontraktual dan teknis yang wajar untuk melindungi data selama transfer tersebut.',
  },
  {
    id: 'perubahan',
    icon: RefreshCw,
    title: 'Perubahan kebijakan',
    body: 'Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan penting akan diberitahukan melalui aplikasi atau email sebelum berlaku. Tanggal “Terakhir diperbarui” di bagian atas menunjukkan versi terbaru.',
  },
  {
    id: 'kontak',
    icon: Mail,
    title: 'Kontak',
    body: 'Pertanyaan, permintaan akses, koreksi, atau penghapusan data dapat disampaikan kepada pengelola CatatKas.',
    contact: true,
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
              CatatKas adalah aplikasi pencatatan keuangan pribadi yang dikembangkan dan dikelola oleh{' '}
              <strong>Aniwall</strong>. Halaman ini menjelaskan data apa yang kami kumpulkan, mengapa data itu
              diperlukan, siapa yang dapat melihatnya, dan bagaimana kamu dapat mengakses atau menghapusnya.
            </p>
          </div>
          <div className="privacy-hero__meta">
            <span className="privacy-hero__meta-label">Berlaku sejak</span>
            <time dateTime="2026-11-12">12 November 2026</time>
            <span className="privacy-hero__meta-label">Terakhir diperbarui</span>
            <time dateTime="2026-11-12">12 November 2026</time>
          </div>
        </section>

        <div className="privacy-body">
          <aside className="privacy-toc">
            <span className="privacy-toc__label">Di halaman ini</span>
            <nav aria-label="Daftar isi kebijakan privasi">
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="privacy-article" aria-label="Isi kebijakan privasi">
            {sections.map((section, index) => {
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
                    <h2 id={`${section.id}-title`}>
                      <span className="privacy-section__num">{String(index + 1).padStart(2, '0')}</span>
                      {section.title}
                    </h2>
                    {section.body ? <p>{section.body}</p> : null}

                    {section.items ? (
                      <ul className="privacy-section__list">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}

                    {section.note ? <p className="privacy-section__note">{section.note}</p> : null}

                    {section.contact ? (
                      <div className="privacy-contact">
                        <p>
                          <strong>Developer:</strong> Aniwall
                        </p>
                        <p>
                          <strong>Aplikasi:</strong> CatatKas
                        </p>
                        <p>
                          <strong>Email:</strong>{' '}
                          <a href={`mailto:${CONTACT_EMAIL}?subject=Permintaan%20Penghapusan%20Akun%20CatatKas`}>
                            {CONTACT_EMAIL}
                          </a>
                        </p>
                        <p>
                          <strong>Waktu respons:</strong> paling lambat 30 hari kerja
                        </p>
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}

            <div className="privacy-note" role="note">
              <span className="privacy-note__icon">
                <AlertTriangle size={19} aria-hidden="true" />
              </span>
              <p>
                <strong>Catatan penting:</strong> admin pemilik dapat meninjau isi data keuangan seluruh
                pengguna untuk keperluan operasional dan dukungan, tetapi tidak dapat mengubahnya. Jangan
                memasukkan informasi rahasia yang tidak ingin kamu bagi dengan operator layanan.
              </p>
            </div>

            <div className="privacy-actions">
              <Link to="/register" className="btn btn--primary">
                Buat akun CatatKas
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn--ghost">
                <Mail size={16} aria-hidden="true" />
                Hubungi kami
              </a>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
