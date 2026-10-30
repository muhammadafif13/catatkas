import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import AdminAdsTabs from '../../components/admin/AdminAdsTabs';
import FormField from '../../components/forms/FormField';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  createAdminAdPackage,
  deleteAdminAdPackage,
  getAdminAdPackages,
  updateAdminAdPackage,
} from '../../db/advertising';
import { toast, useUIStore } from '../../stores/useUIStore';
import { AD_PLACEMENTS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { getErrorMessage } from '../../utils/helpers';

const EMPTY_PACKAGE = {
  name: '',
  description: '',
  placement: 'dashboard',
  durationDays: 7,
  priceIdr: 50000,
  priority: 0,
  sortOrder: 0,
  isActive: true,
};

function placementLabel(value) {
  return AD_PLACEMENTS.find((item) => item.value === value)?.label || value;
}

function PackageFormModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_PACKAGE, ...(editing || {}) }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, submitting]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  }

  function validate() {
    const next = {};
    if (form.name.trim().length < 3) next.name = 'Nama paket minimal 3 karakter.';
    if (!form.placement) next.placement = 'Pilih penempatan.';
    if (!Number.isFinite(Number(form.durationDays)) || Number(form.durationDays) < 1) {
      next.durationDays = 'Durasi minimal 1 hari.';
    }
    if (Number(form.durationDays) > 365) next.durationDays = 'Durasi maksimal 365 hari.';
    if (!Number.isFinite(Number(form.priceIdr)) || Number(form.priceIdr) < 0) {
      next.priceIdr = 'Harga tidak valid.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        durationDays: Number(form.durationDays),
        priceIdr: Number(form.priceIdr),
        priority: Number(form.priority) || 0,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing?.id) {
        await updateAdminAdPackage(editing.id, payload);
      } else {
        await createAdminAdPackage(payload);
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal modal--lg" role="dialog" aria-modal="true" aria-label="Form paket iklan">
        <div className="modal__header">
          <div className="modal__title-wrap">
            <h2 className="modal__title">{editing ? 'Edit paket iklan' : 'Paket iklan baru'}</h2>
            <p className="modal__description">
              Paket aktif akan tampil di halaman /advertise. Nonaktifkan paket lama tanpa
              menghapus riwayat pesanan.
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {submitError ? <div className="budget-alert budget-alert--danger">{submitError}</div> : null}
            <div className="form-grid admin-form-grid">
              <FormField label="Nama paket" htmlFor="package-name" error={errors.name} full>
                <input
                  id="package-name"
                  className="input"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Contoh: Sponsor Beranda 7 Hari"
                  maxLength={80}
                />
              </FormField>

              <FormField label="Penempatan" htmlFor="package-placement" error={errors.placement}>
                <select
                  id="package-placement"
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

              <FormField
                label="Durasi tayang"
                htmlFor="package-duration"
                error={errors.durationDays}
                hint="Dalam hari."
              >
                <input
                  id="package-duration"
                  type="number"
                  min="1"
                  max="365"
                  className="input"
                  value={form.durationDays}
                  onChange={(event) => update('durationDays', event.target.value)}
                />
              </FormField>

              <FormField
                label="Harga paket"
                htmlFor="package-price"
                error={errors.priceIdr}
                hint={formatCurrency(Number(form.priceIdr) || 0)}
              >
                <input
                  id="package-price"
                  type="number"
                  min="0"
                  step="1000"
                  className="input"
                  value={form.priceIdr}
                  onChange={(event) => update('priceIdr', event.target.value)}
                />
              </FormField>

              <FormField
                label="Prioritas iklan"
                htmlFor="package-priority"
                hint="Angka lebih besar tampil lebih dulu."
              >
                <input
                  id="package-priority"
                  type="number"
                  className="input"
                  value={form.priority}
                  onChange={(event) => update('priority', event.target.value)}
                />
              </FormField>

              <FormField
                label="Urutan paket"
                htmlFor="package-sort"
                hint="Angka kecil tampil lebih atas."
              >
                <input
                  id="package-sort"
                  type="number"
                  className="input"
                  value={form.sortOrder}
                  onChange={(event) => update('sortOrder', event.target.value)}
                />
              </FormField>

              <FormField
                label="Deskripsi"
                htmlFor="package-description"
                optional
                full
                hint="Ditampilkan di bawah nama paket pada halaman publik."
              >
                <textarea
                  id="package-description"
                  className="textarea"
                  rows={3}
                  maxLength={240}
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder="Jelaskan posisi dan keunggulan paket ini."
                />
              </FormField>

              <label className="admin-switch form-grid__full">
                <span>
                  <strong>Tampilkan paket</strong>
                  <small>Paket nonaktif tidak bisa dipilih pengiklan publik.</small>
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
              {submitting ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat paket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAdPackagesPage() {
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const rows = await getAdminAdPackages();
      setPackages(rows);
      if (isRefresh) toast.success('Paket iklan diperbarui.');
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

  const summary = useMemo(
    () => ({
      total: packages.length,
      active: packages.filter((item) => item.isActive).length,
      cheapest: packages.reduce(
        (lowest, item) => (lowest === null || item.priceIdr < lowest ? item.priceIdr : lowest),
        null,
      ),
    }),
    [packages],
  );

  async function togglePackage(item) {
    setBusyId(item.id);
    try {
      await updateAdminAdPackage(item.id, { ...item, isActive: !item.isActive });
      toast.success(item.isActive ? 'Paket dinonaktifkan.' : 'Paket diaktifkan.');
      await load();
    } catch (toggleError) {
      toast.error(getErrorMessage(toggleError));
    } finally {
      setBusyId(null);
    }
  }

  async function removePackage(item) {
    const confirmed = await requestConfirm({
      title: 'Hapus paket iklan?',
      message: `“${item.name}” akan dihapus. Paket yang sudah dipakai pesanan tidak dapat dihapus—nonaktifkan saja.`,
      confirmLabel: 'Hapus Paket',
      danger: true,
    });
    if (!confirmed) return;
    setBusyId(item.id);
    try {
      await deleteAdminAdPackage(item.id);
      toast.success('Paket dihapus.');
      await load();
    } catch {
      toast.error(
        'Paket tidak dapat dihapus. Kemungkinan sudah dipakai pesanan—nonaktifkan paket ini saja.',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page admin-page">
      <AdminAdsTabs />
      <section className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">
            <Tag size={14} aria-hidden="true" />
            PAKET IKLAN
          </span>
          <h1>Atur paket publik</h1>
          <p>
            Tentukan penempatan, durasi, dan harga yang dilihat pengiklan di halaman
            /advertise. Harga paket belum termasuk kode unik tiga digit.
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
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Paket Baru
          </button>
        </div>
      </section>

      <div className="admin-stat-grid admin-stat-grid--four">
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <Tag size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Total paket</div>
            <div className="admin-stat__value">{summary.total}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--income">
            <CalendarDays size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Paket aktif</div>
            <div className="admin-stat__value">{summary.active}</div>
          </div>
        </div>
        <div className="admin-stat admin-stat--wide">
          <span className="admin-stat__icon admin-stat__icon--accent">
            <Tag size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Harga terendah</div>
            <div className="admin-stat__value">
              {summary.cheapest === null ? '—' : formatCurrency(summary.cheapest)}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner block label="Memuat paket iklan…" />
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={<Tag size={27} />}
            title="Paket tidak dapat dimuat"
            text={error}
            action={
              <button type="button" className="btn btn--primary" onClick={() => load()}>
                Coba lagi
              </button>
            }
          />
        </div>
      ) : packages.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Tag size={27} />}
            title="Belum ada paket"
            text="Buat paket pertama agar halaman /advertise bisa menerima pesanan."
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus aria-hidden="true" />
                Buat Paket
              </button>
            }
          />
        </div>
      ) : (
        <div className="card admin-table-card admin-package-card">
          <div className="admin-package-head" aria-hidden="true">
            <span>Paket</span>
            <span>Penempatan</span>
            <span>Durasi</span>
            <span>Harga</span>
            <span>Status</span>
            <span>Aksi</span>
          </div>
          {packages.map((item) => (
            <div className="admin-package-row" key={item.id}>
              <div className="admin-package-row__identity">
                <strong>{item.name}</strong>
                <small>{item.description || 'Tanpa deskripsi'}</small>
              </div>
              <span data-label="Penempatan">{placementLabel(item.placement)}</span>
              <span data-label="Durasi">{item.durationDays} hari</span>
              <strong data-label="Harga" className="admin-package-row__price">
                {formatCurrency(item.priceIdr)}
              </strong>
              <div data-label="Status">
                <span className={`badge badge--${item.isActive ? 'success' : 'neutral'}`}>
                  {item.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div className="admin-package-row__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => togglePackage(item)}
                  disabled={busyId === item.id}
                >
                  {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setEditing(item);
                    setShowForm(true);
                  }}
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn--danger-soft btn--sm"
                  onClick={() => removePackage(item)}
                  disabled={busyId === item.id}
                  aria-label={`Hapus ${item.name}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="callout callout--primary">
        <Tag aria-hidden="true" />
        <span>
          Harga pada paket adalah harga dasar. Sistem menambahkan kode unik tiga digit
          saat pengiklan membuat pesanan agar transfer mudah dicocokkan.
        </span>
      </div>

      {showForm ? (
        <PackageFormModal
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            toast.success(editing ? 'Paket diperbarui.' : 'Paket dibuat.');
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
