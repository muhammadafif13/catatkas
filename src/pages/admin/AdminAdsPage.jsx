import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  Eye,
  ImagePlus,
  Megaphone,
  MousePointerClick,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import AdminAdsTabs from '../../components/admin/AdminAdsTabs';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  deleteAdCreative,
  getAdImageUrl,
  uploadAdCreative,
} from '../../db/ads';
import { useAdStore } from '../../stores/useAdStore';
import { toast, useUIStore } from '../../stores/useUIStore';
import { AD_PLACEMENTS, AD_PROVIDERS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/helpers';

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function placementLabel(value) {
  return AD_PLACEMENTS.find((item) => item.value === value)?.label || value;
}

function adStatus(ad) {
  const now = Date.now();
  if (!ad.isActive) return { label: 'Nonaktif', tone: 'neutral' };
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) {
    return { label: 'Terjadwal', tone: 'warning' };
  }
  if (ad.endsAt && new Date(ad.endsAt).getTime() <= now) {
    return { label: 'Berakhir', tone: 'danger' };
  }
  return { label: 'Tayang', tone: 'success' };
}

const emptyForm = {
  provider: 'sponsor',
  placement: 'dashboard',
  title: '',
  body: '',
  imagePath: '',
  targetUrl: '',
  ctaLabel: 'Pelajari',
  adsenseSlot: '',
  adsenseFormat: 'auto',
  isActive: true,
  priority: 0,
  startsAt: '',
  endsAt: '',
};

function AdFormModal({ editing, onClose, onSaved }) {
  const addAd = useAdStore((state) => state.addAd);
  const editAd = useAdStore((state) => state.editAd);
  const [form, setForm] = useState(() => {
    if (!editing) return emptyForm;
    return {
      ...emptyForm,
      ...editing,
      startsAt: toLocalInput(editing.startsAt),
      endsAt: toLocalInput(editing.endsAt),
    };
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(() =>
    editing?.imagePath ? getAdImageUrl(editing.imagePath) : '',
  );
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, submitting]);

  useEffect(
    () => () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, image: 'Gunakan gambar JPG, PNG, atau WebP.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({ ...current, image: 'Ukuran gambar maksimal 2 MB.' }));
      return;
    }
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, image: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Judul iklan wajib diisi.';
    if (!form.placement) next.placement = 'Pilih penempatan.';
    if (form.provider === 'sponsor') {
      if (!previewUrl) next.image = 'Unggah gambar sponsor.';
      if (!/^https?:\/\/.+/i.test(form.targetUrl.trim())) {
        next.targetUrl = 'Masukkan URL tujuan yang diawali http:// atau https://.';
      }
    } else if (!form.adsenseSlot.trim()) {
      next.adsenseSlot = 'Slot ID AdSense wajib diisi.';
    }
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      next.endsAt = 'Waktu berakhir harus setelah waktu mulai.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    let uploadedPath = '';
    setSubmitting(true);
    try {
      let imagePath = form.provider === 'sponsor' ? form.imagePath : '';
      if (form.provider === 'sponsor' && imageFile) {
        uploadedPath = await uploadAdCreative(imageFile);
        imagePath = uploadedPath;
      }

      const payload = {
        ...form,
        imagePath,
        targetUrl: form.provider === 'sponsor' ? form.targetUrl.trim() : '',
        adsenseSlot: form.provider === 'adsense' ? form.adsenseSlot.trim() : '',
        startsAt: toIso(form.startsAt),
        endsAt: toIso(form.endsAt),
      };

      if (editing?.id) {
        await editAd(editing.id, payload);
        if (editing.imagePath && editing.imagePath !== imagePath) {
          await deleteAdCreative(editing.imagePath);
        }
      } else {
        await addAd(payload);
      }

      onSaved();
    } catch (error) {
      if (uploadedPath) void deleteAdCreative(uploadedPath);
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal modal--lg" role="dialog" aria-modal="true" aria-label="Form iklan">
        <div className="modal__header">
          <div className="modal__title-wrap">
            <h2 className="modal__title">{editing ? 'Edit iklan' : 'Iklan baru'}</h2>
            <p className="modal__description">
              Gunakan kreatif milikmu sendiri. HTML atau script bebas tidak diizinkan.
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body admin-ad-form">
            {submitError ? <div className="budget-alert budget-alert--danger">{submitError}</div> : null}

            <div className="admin-provider-toggle" role="group" aria-label="Jenis iklan">
              {AD_PROVIDERS.map((provider) => (
                <button
                  key={provider.value}
                  type="button"
                  className={`admin-provider${form.provider === provider.value ? ' is-active' : ''}`}
                  onClick={() => update('provider', provider.value)}
                >
                  {provider.label}
                </button>
              ))}
            </div>

            <div className="form-grid admin-form-grid">
              <FormField label="Nama / judul iklan" htmlFor="ad-title" error={errors.title} full>
                <input
                  id="ad-title"
                  className="input"
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder={
                    form.provider === 'adsense' ? 'Contoh: AdSense beranda' : 'Nama kampanye sponsor'
                  }
                  maxLength={120}
                />
              </FormField>

              <FormField label="Penempatan" htmlFor="ad-placement" error={errors.placement}>
                <select
                  id="ad-placement"
                  className="select"
                  value={form.placement}
                  onChange={(event) => update('placement', event.target.value)}
                >
                  {AD_PLACEMENTS.map((placement) => (
                    <option key={placement.value} value={placement.value}>
                      {placement.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Prioritas" htmlFor="ad-priority" hint="Angka lebih besar tampil lebih dulu.">
                <input
                  id="ad-priority"
                  type="number"
                  className="input"
                  value={form.priority}
                  onChange={(event) => update('priority', Number(event.target.value))}
                />
              </FormField>

              {form.provider === 'sponsor' ? (
                <>
                  <FormField label="Deskripsi singkat" htmlFor="ad-body" optional full>
                    <textarea
                      id="ad-body"
                      className="textarea"
                      rows={3}
                      value={form.body}
                      onChange={(event) => update('body', event.target.value)}
                      placeholder="Satu atau dua kalimat tentang penawaran."
                      maxLength={260}
                    />
                  </FormField>

                  <FormField label="URL tujuan" htmlFor="ad-url" error={errors.targetUrl} full>
                    <input
                      id="ad-url"
                      type="url"
                      className="input"
                      value={form.targetUrl}
                      onChange={(event) => update('targetUrl', event.target.value)}
                      placeholder="https://contoh.com/promo"
                    />
                  </FormField>

                  <FormField
                    label="Label tombol"
                    htmlFor="ad-cta"
                    hint="Contoh: Pelajari, Coba gratis, Lihat promo."
                  >
                    <input
                      id="ad-cta"
                      className="input"
                      value={form.ctaLabel}
                      onChange={(event) => update('ctaLabel', event.target.value)}
                      maxLength={28}
                    />
                  </FormField>

                  <FormField label="Gambar sponsor" htmlFor="ad-image" error={errors.image} full>
                    <div className="admin-image-field">
                      <button
                        type="button"
                        className="admin-image-preview"
                        onClick={() => fileRef.current?.click()}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Pratinjau iklan" />
                        ) : (
                          <>
                            <ImagePlus size={26} aria-hidden="true" />
                            <span>Pilih gambar</span>
                          </>
                        )}
                      </button>
                      <div>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => fileRef.current?.click()}
                        >
                          <ImagePlus size={15} aria-hidden="true" />
                          {previewUrl ? 'Ganti gambar' : 'Unggah gambar'}
                        </button>
                        <p className="text-xs text-tertiary">
                          JPG, PNG, atau WebP. Maksimal 2 MB. Rasio lanskap 16:9 paling optimal.
                        </p>
                      </div>
                      <input
                        ref={fileRef}
                        id="ad-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={(event) => handleFile(event.target.files?.[0])}
                      />
                    </div>
                  </FormField>
                </>
              ) : (
                <>
                  <FormField
                    label="Slot ID AdSense"
                    htmlFor="ad-slot"
                    error={errors.adsenseSlot}
                    hint="Angka slot dari dashboard Google AdSense."
                  >
                    <input
                      id="ad-slot"
                      className="input"
                      value={form.adsenseSlot}
                      onChange={(event) => update('adsenseSlot', event.target.value)}
                      placeholder="1234567890"
                      inputMode="numeric"
                    />
                  </FormField>

                  <FormField label="Format" htmlFor="ad-format">
                    <select
                      id="ad-format"
                      className="select"
                      value={form.adsenseFormat}
                      onChange={(event) => update('adsenseFormat', event.target.value)}
                    >
                      <option value="auto">Otomatis</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="rectangle">Kotak</option>
                      <option value="vertical">Vertikal</option>
                    </select>
                  </FormField>

                  <div className="callout callout--primary form-grid__full">
                    <Megaphone aria-hidden="true" />
                    <span>
                      Publisher ID diatur lewat <code>VITE_ADSENSE_CLIENT</code>. Iklan hanya
                      dimuat setelah pengguna menyetujui cookie iklan.
                    </span>
                  </div>
                </>
              )}

              <FormField label="Mulai tampil" htmlFor="ad-start" optional>
                <input
                  id="ad-start"
                  type="datetime-local"
                  className="input"
                  value={form.startsAt}
                  onChange={(event) => update('startsAt', event.target.value)}
                />
              </FormField>

              <FormField label="Berakhir" htmlFor="ad-end" optional error={errors.endsAt}>
                <input
                  id="ad-end"
                  type="datetime-local"
                  className="input"
                  value={form.endsAt}
                  onChange={(event) => update('endsAt', event.target.value)}
                />
              </FormField>

              <label className="admin-switch form-grid__full">
                <span>
                  <strong>Aktifkan iklan</strong>
                  <small>Iklan hanya tampil dalam jadwal dan saat aktif.</small>
                </span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => update('isActive', event.target.checked)}
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat iklan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminAdsPage() {
  const adminAds = useAdStore((state) => state.adminAds);
  const stats = useAdStore((state) => state.stats);
  const isLoading = useAdStore((state) => state.isLoading);
  const fetchAdminAds = useAdStore((state) => state.fetchAdminAds);
  const editAd = useAdStore((state) => state.editAd);
  const removeAd = useAdStore((state) => state.removeAd);
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        await fetchAdminAds();
        if (isRefresh) toast.success('Data iklan diperbarui.');
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setRefreshing(false);
      }
    },
    [fetchAdminAds],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    adminAds.forEach((ad) => {
      const stat = stats.get(Number(ad.id));
      impressions += stat?.impressions || 0;
      clicks += stat?.clicks || 0;
    });
    return {
      impressions,
      clicks,
      ctr: impressions ? (clicks / impressions) * 100 : 0,
      active: adminAds.filter((ad) => adStatus(ad).label === 'Tayang').length,
    };
  }, [adminAds, stats]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (ad) => {
    setEditing(ad);
    setShowForm(true);
  };

  const handleToggle = async (ad) => {
    setBusyId(ad.id);
    try {
      await editAd(ad.id, { ...ad, isActive: !ad.isActive });
      toast.success(ad.isActive ? 'Iklan dinonaktifkan.' : 'Iklan diaktifkan.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (ad) => {
    const confirmed = await requestConfirm({
      title: 'Hapus iklan?',
      message: `“${ad.title}” akan dihapus permanen beserta statistiknya.`,
      confirmLabel: 'Hapus Iklan',
      danger: true,
    });
    if (!confirmed) return;

    setBusyId(ad.id);
    try {
      await removeAd(ad.id);
      if (ad.imagePath) await deleteAdCreative(ad.imagePath);
      toast.success('Iklan dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading && !adminAds.length) {
    return (
      <div className="page">
        <LoadingSpinner block label="Memuat iklan…" />
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <AdminAdsTabs />
      <section className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">
            <Megaphone size={14} aria-hidden="true" />
            MONETISASI
          </span>
          <h1>Kelola iklan</h1>
          <p>
            Atur sponsor lokal dan slot Google AdSense. Hanya kreatif dan tautan tepercaya yang
            diterima.
          </p>
        </div>
        <div className="admin-hero__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {refreshing ? 'Memuat…' : 'Segarkan'}
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Iklan Baru
          </button>
        </div>
      </section>

      <div className="admin-stat-grid admin-stat-grid--four">
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--income">
            <Power size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Tayang sekarang</div>
            <div className="admin-stat__value">{totals.active}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <Eye size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Tayangan</div>
            <div className="admin-stat__value">{totals.impressions.toLocaleString('id-ID')}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <MousePointerClick size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Klik</div>
            <div className="admin-stat__value">{totals.clicks.toLocaleString('id-ID')}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--accent">
            <CalendarClock size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">CTR internal</div>
            <div className="admin-stat__value">{totals.ctr.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {adminAds.length ? (
        <div className="admin-ad-grid">
          {adminAds.map((ad) => {
            const status = adStatus(ad);
            const stat = stats.get(Number(ad.id)) || { impressions: 0, clicks: 0 };
            return (
              <article key={ad.id} className="admin-ad-card">
                <div className="admin-ad-card__media">
                  {ad.imagePath ? (
                    <img src={getAdImageUrl(ad.imagePath)} alt="" loading="lazy" />
                  ) : (
                    <span className="admin-ad-card__media-placeholder">
                      <Megaphone size={27} aria-hidden="true" />
                    </span>
                  )}
                  <span className="admin-ad-card__placement">
                    {placementLabel(ad.placement)}
                  </span>
                  <span className={`badge badge--${status.tone} admin-ad-card__status`}>
                    {status.label}
                  </span>
                </div>
                <div className="admin-ad-card__body">
                  <div className="admin-ad-card__provider">
                    {ad.provider === 'adsense' ? 'Google AdSense' : 'Sponsor'}
                  </div>
                  <h2>{ad.title}</h2>
                  {ad.provider === 'sponsor' && ad.body ? <p>{ad.body}</p> : null}
                  <div className="admin-ad-card__stats">
                    <span>
                      <Eye size={14} aria-hidden="true" />
                      {stat.impressions.toLocaleString('id-ID')}
                    </span>
                    <span>
                      <MousePointerClick size={14} aria-hidden="true" />
                      {stat.clicks.toLocaleString('id-ID')}
                    </span>
                    <span>Prioritas {ad.priority}</span>
                  </div>
                  <div className="admin-ad-card__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleToggle(ad)}
                      disabled={busyId === ad.id}
                    >
                      <Power size={15} aria-hidden="true" />
                      {ad.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => openEdit(ad)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger-soft btn--sm"
                      onClick={() => handleDelete(ad)}
                      disabled={busyId === ad.id}
                      aria-label={`Hapus iklan ${ad.title}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<Megaphone size={27} />}
            title="Belum ada iklan"
            text="Buat iklan sponsor pertama atau siapkan slot AdSense untuk mulai ditampilkan di aplikasi."
            action={
              <button type="button" className="btn btn--primary" onClick={openCreate}>
                <Plus aria-hidden="true" />
                Buat Iklan
              </button>
            }
          />
        </div>
      )}

      <div className="callout callout--primary">
        <Megaphone aria-hidden="true" />
        <span>
          Statistik di atas adalah pengukuran internal tanpa identitas pengguna. Angka pendapatan
          AdSense tetap dilihat di dashboard Google.
        </span>
      </div>

      {showForm ? (
        <AdFormModal
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            toast.success(editing ? 'Iklan diperbarui.' : 'Iklan dibuat.');
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
