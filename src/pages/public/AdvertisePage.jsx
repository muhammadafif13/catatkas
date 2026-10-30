import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileImage,
  Megaphone,
  Upload,
} from 'lucide-react';
import { getPublicAdConfig, submitPublicAd } from '../../db/advertising';
import { AD_PAYMENT_METHODS, AD_PLACEMENTS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import FormField from '../../components/forms/FormField';
import PublicSectionHeading from '../../components/public/PublicSectionHeading';
import TurnstileWidget from '../../components/public/TurnstileWidget';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const MAX_CREATIVE_BYTES = 2 * 1024 * 1024;
const CREATIVE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EMPTY_FORM = {
  packageId: '',
  title: '',
  body: '',
  targetUrl: '',
  ctaLabel: 'Kunjungi',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  paymentMethod: 'bank_transfer',
  terms: false,
};

function placementLabel(value) {
  return AD_PLACEMENTS.find((item) => item.value === value)?.label || value;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function FaqItem({ question, children }) {
  return (
    <details className="advertise-faq__item">
      <summary>
        <span>{question}</span>
        <ChevronRight size={18} aria-hidden="true" />
      </summary>
      <p>{children}</p>
    </details>
  );
}

function TurnstileError() {
  return (
    <p className="public-field-error" role="alert">
      Verifikasi keamanan belum dikonfigurasi. Hubungi admin CatatKas.
    </p>
  );
}

export default function AdvertisePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creativeFile, setCreativeFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const packages = config?.packages || [];
  const payment = config?.payment || null;
  const acceptingOrders = Boolean(payment?.acceptingOrders);
  const hasBank =
    payment?.hasBank !== undefined
      ? Boolean(payment.hasBank)
      : Boolean(payment?.bankName && payment?.accountNumber);
  const hasQris =
    payment?.hasQris !== undefined
      ? Boolean(payment.hasQris)
      : Boolean(payment?.qrisPath || payment?.qrisImagePath);
  const turnstileEnabled = Boolean(config?.turnstileEnabled);

  const availablePaymentMethods = useMemo(
    () =>
      AD_PAYMENT_METHODS.filter((method) =>
        method.value === 'bank_transfer' ? hasBank : hasQris,
      ),
    [hasBank, hasQris],
  );

  const selectedPackage = useMemo(
    () => packages.find((item) => String(item.id) === String(form.packageId)) || null,
    [form.packageId, packages],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingConfig(true);
    getPublicAdConfig()
      .then((data) => {
        if (cancelled) return;
        setConfig(data);
        const firstPackage = data.packages[0];
        const bankAvailable =
          data.payment?.hasBank !== undefined
            ? Boolean(data.payment.hasBank)
            : Boolean(data.payment?.bankName && data.payment?.accountNumber);
        const qrisAvailable =
          data.payment?.hasQris !== undefined
            ? Boolean(data.payment.hasQris)
            : Boolean(data.payment?.qrisPath || data.payment?.qrisImagePath);
        setForm((current) => ({
          ...current,
          packageId: current.packageId || (firstPackage ? String(firstPackage.id) : ''),
          paymentMethod: bankAvailable
            ? 'bank_transfer'
            : qrisAvailable
              ? 'qris'
              : current.paymentMethod,
        }));
      })
      .catch((error) => {
        if (!cancelled) setConfigError(error.message || 'Gagal memuat paket iklan.');
      })
      .finally(() => {
        if (!cancelled) setLoadingConfig(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Pasang iklan · CatatKas';
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!CREATIVE_TYPES.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        creative: 'Gunakan gambar JPG, PNG, atau WebP.',
      }));
      return;
    }
    if (file.size > MAX_CREATIVE_BYTES) {
      setErrors((current) => ({ ...current, creative: 'Ukuran gambar maksimal 2 MB.' }));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCreativeFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, creative: '' }));
  }

  function scrollToForm(packageId) {
    if (packageId) updateField('packageId', String(packageId));
    document.getElementById('pasang')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validate() {
    const next = {};
    if (!form.packageId) next.packageId = 'Pilih paket iklan.';
    if (form.contactName.trim().length < 2) next.contactName = 'Nama minimal 2 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      next.contactEmail = 'Masukkan email yang valid.';
    }
    const phone = form.contactPhone.replace(/[\s-]/g, '');
    if (!/^(\+?62|0)8[1-9][0-9]{6,11}$/.test(phone)) {
      next.contactPhone = 'Gunakan nomor WhatsApp Indonesia yang valid.';
    }
    if (form.title.trim().length < 4) next.title = 'Judul minimal 4 karakter.';
    if (!isValidUrl(form.targetUrl.trim())) {
      next.targetUrl = 'Gunakan URL lengkap yang diawali https://.';
    }
    if (!creativeFile) next.creative = 'Unggah gambar kreatif iklan.';
    if (!form.terms) next.terms = 'Setujui ketentuan iklan sebelum melanjutkan.';
    if (!availablePaymentMethods.some((method) => method.value === form.paymentMethod)) {
      next.paymentMethod = 'Pilih metode pembayaran yang tersedia.';
    }
    if (turnstileEnabled && !turnstileToken) {
      next.turnstile = 'Selesaikan verifikasi keamanan.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    if (!acceptingOrders) {
      setSubmitError('Pemesanan iklan sedang ditutup.');
      return;
    }
    if (!validate()) {
      const firstError = document.querySelector('.public-field-error, [aria-invalid="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPublicAd(
        {
          ...form,
          packageId: Number(form.packageId),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim().toLowerCase(),
          contactPhone: form.contactPhone.trim(),
          title: form.title.trim(),
          body: form.body.trim(),
          targetUrl: form.targetUrl.trim(),
          ctaLabel: form.ctaLabel.trim() || 'Kunjungi',
          turnstileToken,
        },
        creativeFile,
      );
      navigate(`/advertise/order/${result.order.token}`);
    } catch (error) {
      setSubmitError(error.message || 'Pesanan gagal dibuat. Coba lagi.');
      if (turnstileEnabled && window.turnstile) {
        window.turnstile.reset();
        setTurnstileToken('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="advertise-page">
      <section className="advertise-hero">
        <div className="public-container advertise-hero__inner">
          <div className="advertise-hero__copy">
            <span
              className={`advertise-status ${acceptingOrders ? 'is-open' : 'is-closed'}`}
            >
              <span className="advertise-status__dot" aria-hidden="true" />
              {acceptingOrders ? 'Pemesanan dibuka' : 'Pemesanan ditutup'}
            </span>
            <h1>Temui orang saat mereka sedang mengatur uang.</h1>
            <p className="advertise-hero__lead">
              CatatKas menampilkan satu sponsor yang rapi di halaman yang rutin dibuka.
              Pilih paket, transfer, unggah bukti. Iklan tayang setelah pembayaran
              diverifikasi admin.
            </p>
            <div className="advertise-hero__actions">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={() => scrollToForm()}
                disabled={!acceptingOrders || packages.length === 0}
              >
                Lihat paket
              </button>
              <Link to="/advertise/order" className="advertise-hero__text-link">
                Sudah pesan? Cek status
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="advertise-hero__notes">
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Tanpa langganan
              </span>
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Satu sponsor per slot
              </span>
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Tidak menutupi catatan
              </span>
            </div>
          </div>

          <aside className="advertise-preview" aria-label="Pratinjau slot sponsor">
            <div className="advertise-preview__head">
              <span>Pratinjau penempatan</span>
              <span className="advertise-preview__badge">Sponsor</span>
            </div>
            <div className="advertise-preview__media" aria-hidden="true">
              <div className="advertise-preview__grid" />
              <span className="advertise-preview__brand">Brand kamu</span>
              <span className="advertise-preview__media-note">ruang kreatif 16:9</span>
            </div>
            <div className="advertise-preview__body">
              <span className="advertise-preview__label">Iklan</span>
              <h2>Judul penawaran yang singkat dan jelas</h2>
              <p>Satu kalimat tentang manfaat yang relevan untuk pembaca.</p>
              <span className="advertise-preview__cta">Kunjungi</span>
            </div>
            <p className="advertise-preview__caption">
              Slot sponsor mengikuti lebar konten dan tetap terpisah dari catatan
              keuangan pengguna.
            </p>
          </aside>
        </div>
      </section>

      <section className="advertise-inventory">
        <div className="public-container advertise-inventory__inner">
          <p className="advertise-inventory__label">Penempatan yang tersedia</p>
          <ul className="advertise-inventory__list">
            {AD_PLACEMENTS.map((placement) => (
              <li key={placement.value}>
                <Megaphone size={15} aria-hidden="true" />
                {placement.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="paket" className="advertise-section advertise-section--packages">
        <div className="public-container">
          <PublicSectionHeading
            eyebrow="Paket"
            title="Pilih masa tayang, bukan paket kotak."
            description="Harga sudah termasuk penempatan selama masa tayang. Tidak ada biaya setup atau perpanjangan otomatis."
          />

          {loadingConfig ? (
            <div className="advertise-rate-card advertise-rate-card--loading" aria-busy="true">
              {[1, 2, 3].map((item) => (
                <div className="advertise-rate-skeleton" key={item}>
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : configError ? (
            <div className="public-callout public-callout--error" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>Paket belum dapat dimuat.</strong>
                <p>{configError}</p>
              </div>
            </div>
          ) : packages.length === 0 ? (
            <div className="public-callout">
              <Megaphone size={18} aria-hidden="true" />
              <div>
                <strong>Belum ada paket yang dibuka.</strong>
                <p>Admin sedang menyiapkan paket iklan. Silakan kembali lagi nanti.</p>
              </div>
            </div>
          ) : (
            <div className="advertise-rate-card" role="list">
              <div className="advertise-rate-card__head" aria-hidden="true">
                <span>Paket</span>
                <span>Penempatan</span>
                <span>Durasi</span>
                <span>Harga</span>
                <span>Pilih</span>
              </div>
              {packages.map((item) => {
                const isSelected = String(item.id) === String(form.packageId);
                return (
                  <article
                    key={item.id}
                    className={`advertise-rate-card__row ${isSelected ? 'is-selected' : ''}`}
                    role="listitem"
                  >
                    <div className="advertise-rate-card__name">
                      <h3>{item.name}</h3>
                      <p>{item.description || 'Penempatan sponsor di CatatKas.'}</p>
                    </div>
                    <span data-label="Penempatan">{placementLabel(item.placement)}</span>
                    <span data-label="Durasi">{item.durationDays} hari</span>
                    <strong data-label="Harga" className="advertise-rate-card__price">
                      {formatCurrency(item.priceIdr)}
                    </strong>
                    <button
                      type="button"
                      className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => scrollToForm(item.id)}
                      disabled={!acceptingOrders}
                    >
                      {isSelected ? 'Dipilih' : 'Pilih'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="cara-kerja" className="advertise-process">
        <div className="public-container">
          <PublicSectionHeading
            eyebrow="Cara kerja"
            title="Tiga langkah, satu konfirmasi manusia."
            description="Kami memeriksa pembayaran secara manual agar tidak ada tagihan yang salah masuk."
            tone="inverse"
          />
          <ol className="advertise-process__steps">
            <li>
              <span className="advertise-process__number">1</span>
              <div>
                <h3>Pilih paket dan isi materi</h3>
                <p>
                  Tentukan penempatan, unggah gambar, lalu isi teks dan URL tujuan
                  iklan. Tidak perlu membuat akun.
                </p>
              </div>
            </li>
            <li>
              <span className="advertise-process__number">2</span>
              <div>
                <h3>Transfer nominal yang tertera</h3>
                <p>
                  Setiap pesanan mendapat kode unik tiga digit. Transfer sesuai nominal
                  akhir agar pembayaran mudah dicocokkan.
                </p>
              </div>
            </li>
            <li>
              <span className="advertise-process__number">3</span>
              <div>
                <h3>Unggah bukti, tunggu verifikasi</h3>
                <p>
                  Admin memverifikasi dana dan menjadwalkan tayang. Pantau status lewat
                  link pesanan yang diberikan setelah pengiriman.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section id="pasang" className="advertise-section advertise-form-section">
        <div className="public-container">
          <PublicSectionHeading
            eyebrow="Formulir"
            title="Siapkan satu materi, sisanya kami urus."
            description="Isi data dengan benar. Link status pesanan akan muncul setelah formulir terkirim—simpan link tersebut."
          />

          {!acceptingOrders && !loadingConfig ? (
            <div className="public-callout public-callout--warning" role="status">
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>Pemesanan sedang ditutup.</strong>
                <p>
                  Kamu tetap bisa membaca paket dan cara kerja. Silakan kembali saat
                  pemesanan dibuka.
                </p>
              </div>
            </div>
          ) : null}

          <div className="advertise-form-layout">
            <form className="advertise-form" onSubmit={handleSubmit} noValidate>
              <fieldset className="advertise-form__group">
                <legend>
                  <span>01</span>
                  Materi iklan
                </legend>

                <FormField
                  label="Paket iklan"
                  htmlFor="advertise-package"
                  error={errors.packageId}
                  required
                >
                  <select
                    id="advertise-package"
                    className="input"
                    value={form.packageId}
                    onChange={(event) => updateField('packageId', event.target.value)}
                    disabled={loadingConfig || packages.length === 0}
                    aria-invalid={Boolean(errors.packageId)}
                  >
                    {packages.length === 0 ? <option value="">Belum ada paket</option> : null}
                    {packages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.durationDays} hari ·{' '}
                        {formatCurrency(item.priceIdr)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="advertise-form__row">
                  <FormField
                    label="Judul iklan"
                    htmlFor="advertise-title"
                    error={errors.title}
                    hint="Maksimal 80 karakter."
                    required
                  >
                    <input
                      id="advertise-title"
                      className="input"
                      value={form.title}
                      maxLength={80}
                      onChange={(event) => updateField('title', event.target.value)}
                      placeholder="Contoh: Catat pengeluaran tanpa ribet"
                      aria-invalid={Boolean(errors.title)}
                    />
                  </FormField>
                  <FormField
                    label="Label tombol"
                    htmlFor="advertise-cta"
                    error={errors.ctaLabel}
                    hint="Muncul di tombol iklan."
                  >
                    <input
                      id="advertise-cta"
                      className="input"
                      value={form.ctaLabel}
                      maxLength={28}
                      onChange={(event) => updateField('ctaLabel', event.target.value)}
                      placeholder="Kunjungi"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Deskripsi singkat"
                  htmlFor="advertise-body"
                  error={errors.body}
                  hint="Opsional, maksimal 260 karakter."
                >
                  <textarea
                    id="advertise-body"
                    className="input textarea"
                    rows={3}
                    value={form.body}
                    maxLength={260}
                    onChange={(event) => updateField('body', event.target.value)}
                    placeholder="Satu atau dua kalimat tentang penawaranmu."
                  />
                </FormField>

                <FormField
                  label="URL tujuan"
                  htmlFor="advertise-url"
                  error={errors.targetUrl}
                  hint="Wajib HTTPS."
                  required
                >
                  <input
                    id="advertise-url"
                    type="url"
                    className="input"
                    value={form.targetUrl}
                    onChange={(event) => updateField('targetUrl', event.target.value)}
                    placeholder="https://contoh.com/penawaran"
                    aria-invalid={Boolean(errors.targetUrl)}
                  />
                </FormField>

                <FormField label="Gambar kreatif" error={errors.creative} required>
                  <div className="advertise-upload">
                    <button
                      type="button"
                      className={`advertise-upload__button ${previewUrl ? 'has-image' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="Pratinjau gambar kreatif" />
                      ) : (
                        <>
                          <span className="advertise-upload__icon">
                            <FileImage size={22} aria-hidden="true" />
                          </span>
                          <span>
                            <strong>Pilih gambar kreatif</strong>
                            <small>JPG, PNG, atau WebP · maks. 2 MB</small>
                          </span>
                          <Upload size={17} aria-hidden="true" />
                        </>
                      )}
                    </button>
                    {previewUrl ? (
                      <button
                        type="button"
                        className="advertise-upload__replace"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Ganti gambar
                      </button>
                    ) : null}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={CREATIVE_TYPES.join(',')}
                      onChange={handleFile}
                      className="sr-only"
                      aria-label="Unggah gambar kreatif"
                    />
                  </div>
                </FormField>
              </fieldset>

              <fieldset className="advertise-form__group">
                <legend>
                  <span>02</span>
                  Kontak pengiklan
                </legend>
                <div className="advertise-form__row">
                  <FormField
                    label="Nama"
                    htmlFor="advertise-name"
                    error={errors.contactName}
                    required
                  >
                    <input
                      id="advertise-name"
                      className="input"
                      autoComplete="name"
                      value={form.contactName}
                      onChange={(event) => updateField('contactName', event.target.value)}
                      aria-invalid={Boolean(errors.contactName)}
                    />
                  </FormField>
                  <FormField
                    label="WhatsApp"
                    htmlFor="advertise-phone"
                    error={errors.contactPhone}
                    hint="Dipakai admin jika ada pertanyaan."
                    required
                  >
                    <input
                      id="advertise-phone"
                      className="input"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.contactPhone}
                      onChange={(event) => updateField('contactPhone', event.target.value)}
                      placeholder="08xxxxxxxxxx"
                      aria-invalid={Boolean(errors.contactPhone)}
                    />
                  </FormField>
                </div>
                <FormField
                  label="Email"
                  htmlFor="advertise-email"
                  error={errors.contactEmail}
                  required
                >
                  <input
                    id="advertise-email"
                    type="email"
                    className="input"
                    autoComplete="email"
                    value={form.contactEmail}
                    onChange={(event) => updateField('contactEmail', event.target.value)}
                    aria-invalid={Boolean(errors.contactEmail)}
                  />
                </FormField>
              </fieldset>

              <fieldset className="advertise-form__group">
                <legend>
                  <span>03</span>
                  Pembayaran
                </legend>

                {availablePaymentMethods.length > 0 ? (
                  <div className="advertise-payment-options" role="radiogroup" aria-label="Metode pembayaran">
                    {availablePaymentMethods.map((method) => (
                      <label
                        key={method.value}
                        className={`advertise-payment-option ${
                          form.paymentMethod === method.value ? 'is-selected' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={form.paymentMethod === method.value}
                          onChange={(event) => updateField('paymentMethod', event.target.value)}
                        />
                        <span>
                          <strong>{method.label}</strong>
                          <small>
                            {method.value === 'bank_transfer'
                              ? 'Transfer ke rekening yang tertera di halaman status.'
                              : 'Pindai QRIS dan masukkan nominal akhir secara manual.'}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="public-callout public-callout--warning">
                    <AlertTriangle size={18} aria-hidden="true" />
                    <div>
                      <strong>Metode pembayaran belum tersedia.</strong>
                      <p>Admin belum mengisi rekening atau QRIS.</p>
                    </div>
                  </div>
                )}
                {errors.paymentMethod ? (
                  <p className="public-field-error" role="alert">
                    {errors.paymentMethod}
                  </p>
                ) : null}

                <label className={`advertise-checkbox ${errors.terms ? 'has-error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(event) => updateField('terms', event.target.checked)}
                    aria-invalid={Boolean(errors.terms)}
                  />
                  <span>
                    Saya menyetujui ketentuan iklan dan memahami bahwa pembayaran
                    diverifikasi manual oleh admin.
                  </span>
                </label>
                {errors.terms ? (
                  <p className="public-field-error" role="alert">
                    {errors.terms}
                  </p>
                ) : null}

                {turnstileEnabled ? (
                  <div className="advertise-turnstile">
                    {TURNSTILE_SITE_KEY ? (
                      <TurnstileWidget
                        siteKey={TURNSTILE_SITE_KEY}
                        onToken={setTurnstileToken}
                      />
                    ) : (
                      <TurnstileError />
                    )}
                  </div>
                ) : null}
                {errors.turnstile ? (
                  <p className="public-field-error" role="alert">
                    {errors.turnstile}
                  </p>
                ) : null}
              </fieldset>

              {submitError ? (
                <div className="public-callout public-callout--error" role="alert">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <div>
                    <strong>Pesanan belum terkirim.</strong>
                    <p>{submitError}</p>
                  </div>
                </div>
              ) : null}

              <div className="advertise-form__submit">
                <button
                  type="submit"
                  className="btn btn--primary btn--lg"
                  disabled={
                    submitting ||
                    !acceptingOrders ||
                    packages.length === 0 ||
                    availablePaymentMethods.length === 0
                  }
                >
                  {submitting ? 'Membuat pesanan...' : 'Buat pesanan'}
                </button>
                <p>
                  Dengan melanjutkan, kamu akan menerima link status pesanan. Link itu
                  adalah satu-satunya cara mengakses pesanan.
                </p>
              </div>
            </form>

            <aside className="advertise-summary">
              <p className="advertise-summary__eyebrow">Ringkasan pesanan</p>
              {selectedPackage ? (
                <>
                  <h2>{selectedPackage.name}</h2>
                  <dl className="advertise-summary__list">
                    <div>
                      <dt>Penempatan</dt>
                      <dd>{placementLabel(selectedPackage.placement)}</dd>
                    </div>
                    <div>
                      <dt>Masa tayang</dt>
                      <dd>{selectedPackage.durationDays} hari</dd>
                    </div>
                    <div>
                      <dt>Metode bayar</dt>
                      <dd>
                        {availablePaymentMethods.find(
                          (method) => method.value === form.paymentMethod,
                        )?.label || 'Belum dipilih'}
                      </dd>
                    </div>
                  </dl>
                  <div className="advertise-summary__price">
                    <span>Harga paket</span>
                    <strong>{formatCurrency(selectedPackage.priceIdr)}</strong>
                  </div>
                  <p className="advertise-summary__unique">
                    Ditambah kode unik 3 digit. Nominal akhir muncul di halaman status
                    setelah pesanan dibuat.
                  </p>
                  <div className="advertise-summary__note">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Iklan mulai tayang setelah pembayaran diverifikasi.
                  </div>
                </>
              ) : (
                <p className="advertise-summary__empty">Pilih paket untuk melihat ringkasan.</p>
              )}
              <Link to="/advertise/order" className="advertise-summary__link">
                Sudah punya pesanan? Buka status
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="advertise-section advertise-section--specs">
        <div className="public-container advertise-specs">
          <div>
            <PublicSectionHeading
              eyebrow="Ketentuan materi"
              title="Biar cepat lolos verifikasi."
              description="Materi yang tidak memenuhi ketentuan akan ditolak dan pembayaran dikembalikan secara manual."
            />
          </div>
          <div>
            <ul className="advertise-specs__list">
              <li>
                <span>01</span>
                <p>
                  Gambar JPG, PNG, atau WebP dengan rasio 16:9, ukuran maksimal 2 MB,
                  dan tidak mengandung teks yang terlalu kecil.
                </p>
              </li>
              <li>
                <span>02</span>
                <p>
                  Judul maksimal 80 karakter, deskripsi maksimal 260 karakter, dan URL
                  tujuan harus menggunakan HTTPS.
                </p>
              </li>
              <li>
                <span>03</span>
                <p>
                  Tidak menampilkan klaim yang menyesatkan, judi, pinjaman ilegal,
                  konten dewasa, atau produk yang melanggar hukum di Indonesia.
                </p>
              </li>
              <li>
                <span>04</span>
                <p>
                  CatatKas berhak menolak materi yang tidak relevan dengan pengguna
                  aplikasi keuangan pribadi.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="advertise-section advertise-section--faq">
        <div className="public-container advertise-faq">
          <div className="advertise-faq__intro">
            <PublicSectionHeading
              eyebrow="Pertanyaan umum"
              title="Hal yang sering ditanyakan."
              description="Jika masih ada yang ingin ditanyakan, hubungi admin melalui kontak yang tertera di aplikasi."
            />
          </div>
          <div className="advertise-faq__list">
            <FaqItem question="Apakah harus punya akun CatatKas?">
              Tidak. Pengiklan tidak perlu membuat akun. Setelah formulir terkirim, kamu
              menerima link status pesanan yang harus disimpan.
            </FaqItem>
            <FaqItem question="Kapan iklan mulai tayang?">
              Iklan dijadwalkan tayang setelah admin memverifikasi pembayaran. Masa
              tayang dihitung mulai tanggal dan jam persetujuan.
            </FaqItem>
            <FaqItem question="Bagaimana cara membayar?">
              Pilih transfer bank atau QRIS saat mengisi formulir. Nominal akhir
              mencakup kode unik tiga digit. Detail rekening atau QRIS tersedia di
              halaman status setelah pesanan dibuat.
            </FaqItem>
            <FaqItem question="Apa yang terjadi jika materi ditolak?">
              Admin akan menuliskan alasan di halaman status. Kamu dapat menghubungi
              admin untuk memperbaiki materi atau memproses pengembalian dana secara
              manual.
            </FaqItem>
            <FaqItem question="Bisakah mengganti kreatif setelah pesanan dibuat?">
              Sebelum disetujui, admin dapat menolak materi dan meminta perbaikan. Setelah
              iklan aktif, perubahan materi perlu diproses manual oleh admin.
            </FaqItem>
          </div>
        </div>
      </section>
    </div>
  );
}
