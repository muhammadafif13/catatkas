import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ImagePlus,
  QrCode,
  RefreshCw,
  Save,
  Trash2,
  Wallet,
} from 'lucide-react';
import AdminAdsTabs from '../../components/admin/AdminAdsTabs';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  deletePaymentQris,
  getAdminPaymentSettings,
  getPaymentAssetUrl,
  saveAdminPaymentSettings,
  uploadPaymentQris,
} from '../../db/advertising';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../stores/useUIStore';
import { getErrorMessage } from '../../utils/helpers';

const MAX_QRIS_BYTES = 2 * 1024 * 1024;

const EMPTY_FORM = {
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  qrisImagePath: '',
  instructions: '',
  acceptingOrders: false,
};

export default function AdminAdPaymentsPage() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisBlobUrl, setQrisBlobUrl] = useState('');
  const [clearQris, setClearQris] = useState(false);

  useEffect(() => {
    if (!qrisBlobUrl) return undefined;
    return () => URL.revokeObjectURL(qrisBlobUrl);
  }, [qrisBlobUrl]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const settings = await getAdminPaymentSettings();
      setForm({ ...EMPTY_FORM, ...settings });
      setQrisFile(null);
      setClearQris(false);
      setQrisBlobUrl('');
      if (isRefresh) toast.success('Pengaturan pembayaran diperbarui.');
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      if (isRefresh) toast.error(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const qrisPreview = useMemo(() => {
    if (qrisBlobUrl) return qrisBlobUrl;
    if (clearQris || !form.qrisImagePath) return '';
    return getPaymentAssetUrl(form.qrisImagePath);
  }, [clearQris, form.qrisImagePath, qrisBlobUrl]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleQris(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFieldErrors((current) => ({ ...current, qris: 'Gunakan JPG, PNG, atau WebP.' }));
      return;
    }
    if (file.size > MAX_QRIS_BYTES) {
      setFieldErrors((current) => ({ ...current, qris: 'Ukuran QRIS maksimal 2 MB.' }));
      return;
    }
    if (qrisBlobUrl) URL.revokeObjectURL(qrisBlobUrl);
    setQrisBlobUrl(URL.createObjectURL(file));
    setQrisFile(file);
    setClearQris(false);
    setFieldErrors((current) => ({ ...current, qris: '', payment: '' }));
  }

  function removeQris() {
    if (qrisBlobUrl) URL.revokeObjectURL(qrisBlobUrl);
    setQrisBlobUrl('');
    setQrisFile(null);
    setClearQris(true);
    setForm((current) => ({ ...current, qrisImagePath: '' }));
  }

  function validate() {
    const next = {};
    const bankFilled = Boolean(
      form.bankName.trim() || form.accountNumber.trim() || form.accountHolder.trim(),
    );
    const hasQris = Boolean(qrisFile || (!clearQris && form.qrisImagePath));

    if (bankFilled) {
      if (!form.bankName.trim()) next.bankName = 'Isi nama bank.';
      if (!form.accountNumber.trim()) next.accountNumber = 'Isi nomor rekening.';
      if (!form.accountHolder.trim()) next.accountHolder = 'Isi nama pemilik rekening.';
    }
    if (form.acceptingOrders && !hasQris && !(form.bankName.trim() && form.accountNumber.trim())) {
      next.payment = 'Isi rekening bank atau unggah QRIS sebelum membuka pemesanan.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) {
      toast.warning('Lengkapi pengaturan pembayaran terlebih dahulu.');
      return;
    }
    setSaving(true);
    const oldQrisPath = form.qrisImagePath;
    let uploadedPath = '';
    try {
      let qrisImagePath = clearQris ? '' : form.qrisImagePath || '';
      if (qrisFile) {
        uploadedPath = await uploadPaymentQris(qrisFile);
        qrisImagePath = uploadedPath;
      }
      const saved = await saveAdminPaymentSettings({
        ...form,
        qrisImagePath,
        updatedBy: user?.id || null,
      });
      if (oldQrisPath && oldQrisPath !== saved.qrisImagePath) {
        await deletePaymentQris(oldQrisPath);
      }
      setForm({ ...EMPTY_FORM, ...saved });
      setQrisFile(null);
      setClearQris(false);
      setQrisBlobUrl('');
      setFieldErrors({});
      toast.success('Pengaturan pembayaran disimpan.');
    } catch (saveError) {
      if (uploadedPath && uploadedPath !== oldQrisPath) {
        await deletePaymentQris(uploadedPath).catch(() => {});
      }
      toast.error(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page admin-page">
        <AdminAdsTabs />
        <LoadingSpinner block label="Memuat pengaturan pembayaran…" />
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <AdminAdsTabs />
      <section className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">
            <Wallet size={14} aria-hidden="true" />
            PEMBAYARAN MANUAL
          </span>
          <h1>Rekening & QRIS</h1>
          <p>
            Pengiklan publik akan melihat detail ini di halaman status pesanan. Nominal
            akhir ditambah kode unik tiga digit dan diverifikasi manual oleh admin.
          </p>
        </div>
        <div className="admin-hero__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => load(true)}
            disabled={refreshing || saving}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {refreshing ? 'Memuat…' : 'Muat ulang'}
          </button>
        </div>
      </section>

      {error ? (
        <div className="callout callout--danger">
          <AlertTriangle aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form className="admin-payment-layout" onSubmit={handleSubmit}>
        <div className="card admin-payment-form">
          <div className="admin-payment-form__head">
            <div>
              <h2>Metode pembayaran</h2>
              <p>Isi salah satu atau keduanya. Pengiklan memilih metode saat membuat pesanan.</p>
            </div>
            <label className={`admin-payment-toggle ${form.acceptingOrders ? 'is-on' : ''}`}>
              <span>
                <strong>{form.acceptingOrders ? 'Pemesanan dibuka' : 'Pemesanan ditutup'}</strong>
                <small>Halaman publik tidak menerima pesanan saat ditutup.</small>
              </span>
              <input
                type="checkbox"
                checked={form.acceptingOrders}
                onChange={(event) => update('acceptingOrders', event.target.checked)}
              />
              <span className="admin-switch__track" aria-hidden="true" />
            </label>
          </div>

          <section className="admin-payment-section">
            <div className="admin-payment-section__title">
              <CreditCard size={18} aria-hidden="true" />
              <div>
                <h3>Transfer bank</h3>
                <p>Ditampilkan pada pesanan yang memilih transfer bank.</p>
              </div>
            </div>
            <div className="form-grid admin-form-grid">
              <FormField label="Nama bank" htmlFor="pay-bank" error={fieldErrors.bankName}>
                <input
                  id="pay-bank"
                  className="input"
                  value={form.bankName}
                  onChange={(event) => update('bankName', event.target.value)}
                  placeholder="Contoh: BCA"
                  maxLength={80}
                />
              </FormField>
              <FormField label="Nomor rekening" htmlFor="pay-number" error={fieldErrors.accountNumber}>
                <input
                  id="pay-number"
                  className="input"
                  value={form.accountNumber}
                  onChange={(event) => update('accountNumber', event.target.value)}
                  placeholder="Contoh: 1234567890"
                  inputMode="numeric"
                  maxLength={40}
                />
              </FormField>
              <FormField
                label="Atas nama"
                htmlFor="pay-holder"
                error={fieldErrors.accountHolder}
                full
              >
                <input
                  id="pay-holder"
                  className="input"
                  value={form.accountHolder}
                  onChange={(event) => update('accountHolder', event.target.value)}
                  placeholder="Nama pemilik rekening"
                  maxLength={100}
                />
              </FormField>
            </div>
          </section>

          <section className="admin-payment-section">
            <div className="admin-payment-section__title">
              <QrCode size={18} aria-hidden="true" />
              <div>
                <h3>QRIS statis</h3>
                <p>Unggah gambar QRIS resmi. Nominal tidak dicantumkan di gambar.</p>
              </div>
            </div>
            <div className="admin-qris">
              <div className="admin-qris__preview">
                {qrisPreview ? (
                  <img src={qrisPreview} alt="Pratinjau QRIS" />
                ) : (
                  <span>
                    <QrCode size={30} aria-hidden="true" />
                    Belum ada QRIS
                  </span>
                )}
              </div>
              <div className="admin-qris__actions">
                <label className="btn btn--ghost btn--sm">
                  <ImagePlus size={15} aria-hidden="true" />
                  {qrisPreview ? 'Ganti QRIS' : 'Unggah QRIS'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleQris}
                  />
                </label>
                {qrisPreview ? (
                  <button type="button" className="btn btn--danger-soft btn--sm" onClick={removeQris}>
                    <Trash2 size={15} aria-hidden="true" />
                    Hapus
                  </button>
                ) : null}
                <p>JPG, PNG, atau WebP. Maksimal 2 MB. Gunakan gambar yang tajam dan tidak terpotong.</p>
                {fieldErrors.qris ? <p className="field__error">{fieldErrors.qris}</p> : null}
              </div>
            </div>
          </section>

          <section className="admin-payment-section">
            <div className="admin-payment-section__title">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <h3>Instruksi tambahan</h3>
                <p>Ditampilkan di bawah detail pembayaran pada halaman status.</p>
              </div>
            </div>
            <FormField
              label="Instruksi"
              htmlFor="pay-instructions"
              optional
              hint="Contoh: cantumkan kode pesanan pada berita transfer."
            >
              <textarea
                id="pay-instructions"
                className="textarea"
                rows={4}
                maxLength={1000}
                value={form.instructions}
                onChange={(event) => update('instructions', event.target.value)}
                placeholder="Tulis instruksi pembayaran yang jelas untuk pengiklan."
              />
            </FormField>
          </section>

          {fieldErrors.payment ? (
            <div className="budget-alert budget-alert--danger">{fieldErrors.payment}</div>
          ) : null}

          <div className="admin-payment-form__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
            </button>
          </div>
        </div>

        <aside className="admin-payment-preview">
          <p className="admin-payment-preview__eyebrow">Pratinjau halaman publik</p>
          <h2>Pembayaran pesanan</h2>
          <div className="admin-payment-preview__amount">
            <span>Total transfer</span>
            <strong>Rp100.123</strong>
            <small>Rp100.000 + kode unik 123</small>
          </div>
          {form.bankName || form.accountNumber ? (
            <dl>
              <div>
                <dt>Bank</dt>
                <dd>{form.bankName || '—'}</dd>
              </div>
              <div>
                <dt>Nomor rekening</dt>
                <dd>{form.accountNumber || '—'}</dd>
              </div>
              <div>
                <dt>Atas nama</dt>
                <dd>{form.accountHolder || '—'}</dd>
              </div>
            </dl>
          ) : null}
          {qrisPreview ? (
            <div className="admin-payment-preview__qris">
              <img src={qrisPreview} alt="" />
              <span>QRIS aktif</span>
            </div>
          ) : null}
          {form.instructions ? <p className="admin-payment-preview__note">{form.instructions}</p> : null}
          <div className="admin-payment-preview__status">
            <span className={form.acceptingOrders ? 'is-open' : ''} />
            {form.acceptingOrders ? 'Pemesanan dibuka' : 'Pemesanan ditutup'}
          </div>
        </aside>
      </form>

      <div className="callout callout--primary">
        <Wallet aria-hidden="true" />
        <span>
          Jangan pernah meminta pengiklan mengirim bukti ke luar halaman status. Bukti
          tersimpan privat dan admin membukanya lewat tautan sementara.
        </span>
      </div>
    </div>
  );
}
