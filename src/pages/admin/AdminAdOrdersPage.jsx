import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCheck2,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import AdminAdsTabs from '../../components/admin/AdminAdsTabs';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getAdImageUrl } from '../../db/ads';
import {
  getAdProofSignedUrl,
  getAdminAdOrders,
  reviewAdOrder,
} from '../../db/advertising';
import { toast, useUIStore } from '../../stores/useUIStore';
import { AD_ORDER_STATUSES, AD_PLACEMENTS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/helpers';

function placementLabel(value) {
  return AD_PLACEMENTS.find((item) => item.value === value)?.label || value;
}

function statusMeta(value) {
  return (
    AD_ORDER_STATUSES.find((item) => item.value === value) || {
      value,
      label: value || 'Tidak diketahui',
      tone: 'neutral',
    }
  );
}

function waNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function CopyToken({ value }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Link status disalin.');
    } catch {
      toast.error('Gagal menyalin link.');
    }
  }

  return (
    <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
      <Copy size={14} aria-hidden="true" />
      Salin link
    </button>
  );
}

function OrderDetailModal({ order, onClose, onReviewed }) {
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [note, setNote] = useState(order.reviewNote || '');
  const [reviewing, setReviewing] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');
  const status = statusMeta(order.status);
  const canApprove = order.status === 'awaiting_review';
  const canReject = order.status === 'awaiting_payment' || order.status === 'awaiting_review';
  const publicLink = `${window.location.origin}/advertise/order/${order.publicToken}`;
  const phone = waNumber(order.contactPhone);
  const adImage = order.ad?.imagePath ? getAdImageUrl(order.ad.imagePath) : '';

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !reviewing) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, reviewing]);

  async function loadProof() {
    setProofLoading(true);
    setProofError('');
    try {
      const url = await getAdProofSignedUrl(order.proofPath);
      setProofUrl(url);
    } catch (error) {
      setProofError(getErrorMessage(error));
    } finally {
      setProofLoading(false);
    }
  }

  async function review(action) {
    if (action === 'reject' && !note.trim()) {
      toast.warning('Tulis alasan penolakan agar pengiklan tahu langkah berikutnya.');
      return;
    }
    const confirmed = await requestConfirm({
      title: action === 'approve' ? 'Setujui pembayaran?' : 'Tolak pesanan?',
      message:
        action === 'approve'
          ? 'Iklan akan langsung diaktifkan selama masa tayang paket.'
          : 'Pesanan ditolak dan iklan tidak akan tayang. Pastikan alasan sudah jelas.',
      confirmLabel: action === 'approve' ? 'Setujui' : 'Tolak Pesanan',
      danger: action !== 'approve',
    });
    if (!confirmed) return;
    setReviewing(action);
    try {
      await reviewAdOrder(order.id, action, note.trim());
      toast.success(action === 'approve' ? 'Pesanan disetujui dan iklan diaktifkan.' : 'Pesanan ditolak.');
      onReviewed();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setReviewing('');
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !reviewing) onClose();
      }}
    >
      <div className="modal modal--xl" role="dialog" aria-modal="true" aria-label="Detail pesanan iklan">
        <div className="modal__header">
          <div className="modal__title-wrap">
            <div className="admin-order-modal__title">
              <h2 className="modal__title">Pesanan {order.orderCode}</h2>
              <span className={`badge badge--${status.tone}`}>{status.label}</span>
            </div>
            <p className="modal__description">
              Dibuat {formatDateTime(order.createdAt)} · {order.packageName}
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body admin-order-detail">
          <section className="admin-order-detail__section">
            <h3>Pengiklan</h3>
            <dl className="admin-order-detail__list">
              <div>
                <dt>Nama</dt>
                <dd>{order.contactName || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  {order.contactEmail ? (
                    <a href={`mailto:${order.contactEmail}`}>
                      <Mail size={14} aria-hidden="true" />
                      {order.contactEmail}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  {phone ? (
                    <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer noopener">
                      <MessageCircle size={14} aria-hidden="true" />
                      {order.contactPhone}
                    </a>
                  ) : (
                    order.contactPhone || '—'
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-detail__section">
            <h3>Pesanan</h3>
            <dl className="admin-order-detail__list">
              <div>
                <dt>Paket</dt>
                <dd>
                  {order.packageName} · {order.durationDays} hari
                </dd>
              </div>
              <div>
                <dt>Penempatan</dt>
                <dd>{placementLabel(order.placement)}</dd>
              </div>
              <div>
                <dt>Harga dasar</dt>
                <dd>{formatCurrency(order.baseAmount)}</dd>
              </div>
              <div>
                <dt>Kode unik</dt>
                <dd>{order.uniqueCode}</dd>
              </div>
              <div className="is-total">
                <dt>Total transfer</dt>
                <dd>{formatCurrency(order.totalAmount)}</dd>
              </div>
              <div>
                <dt>Metode</dt>
                <dd>{order.paymentMethod === 'qris' ? 'QRIS' : 'Transfer bank'}</dd>
              </div>
              <div>
                <dt>Batas bayar</dt>
                <dd>{formatDateTime(order.expiresAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-detail__section">
            <h3>Materi iklan</h3>
            {order.ad ? (
              <div className="admin-order-ad">
                <div className="admin-order-ad__media">
                  {adImage ? (
                    <img src={adImage} alt="" loading="lazy" />
                  ) : (
                    <span>Tanpa gambar</span>
                  )}
                </div>
                <div>
                  <strong>{order.ad.title}</strong>
                  {order.ad.body ? <p>{order.ad.body}</p> : null}
                  <a href={order.ad.targetUrl} target="_blank" rel="noreferrer noopener">
                    {order.ad.ctaLabel || 'Kunjungi'}
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-tertiary">Materi iklan tidak ditemukan.</p>
            )}
          </section>

          <section className="admin-order-detail__section">
            <h3>Bukti pembayaran</h3>
            {order.proofPath ? (
              <div className="admin-order-proof">
                <FileCheck2 size={20} aria-hidden="true" />
                <div>
                  <strong>Bukti sudah diunggah</strong>
                  <span>
                    {order.payerName ? `Pengirim: ${order.payerName}` : 'Nama pengirim tidak diisi'}
                    {order.submittedAt ? ` · ${formatDateTime(order.submittedAt)}` : ''}
                  </span>
                  {order.payerNote ? <p>{order.payerNote}</p> : null}
                </div>
                {proofUrl ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn--ghost btn--sm"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Buka bukti
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={loadProof}
                    disabled={proofLoading}
                  >
                    <FileCheck2 size={14} aria-hidden="true" />
                    {proofLoading ? 'Menyiapkan…' : 'Muat tautan'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-tertiary">Belum ada bukti pembayaran.</p>
            )}
            {proofError ? <p className="field__error">{proofError}</p> : null}
            {proofUrl ? (
              <p className="text-xs text-tertiary">
                Tautan bukti bersifat sementara (5 menit). Muat ulang jika sudah kedaluwarsa.
              </p>
            ) : null}
          </section>

          <section className="admin-order-detail__section">
            <h3>Akses pengiklan</h3>
            <div className="admin-order-link">
              <code>{publicLink}</code>
              <div>
                <CopyToken value={publicLink} />
                <a
                  href={publicLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn--ghost btn--sm"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Buka
                </a>
              </div>
            </div>
            <p className="text-xs text-tertiary">
              Jangan membagikan link ini ke publik. Siapa pun yang memilikinya dapat melihat
              status pembayaran.
            </p>
          </section>

          {canApprove || canReject ? (
            <section className="admin-order-detail__section admin-order-review">
              <h3>Verifikasi admin</h3>
              <label className="field">
                <span className="field__label">Catatan review</span>
                <textarea
                  className="textarea"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={
                    canApprove
                      ? 'Opsional. Contoh: dana masuk sesuai nominal.'
                      : 'Wajib untuk penolakan. Jelaskan alasan dan langkah berikutnya.'
                  }
                />
                <span className="field__hint">Catatan terlihat oleh pengiklan di halaman status.</span>
              </label>
              <div className="admin-order-review__actions">
                {canApprove ? (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => review('approve')}
                    disabled={Boolean(reviewing)}
                  >
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {reviewing === 'approve' ? 'Menyetujui…' : 'Setujui & aktifkan'}
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    type="button"
                    className="btn btn--danger-soft"
                    onClick={() => review('reject')}
                    disabled={Boolean(reviewing)}
                  >
                    <XCircle size={16} aria-hidden="true" />
                    {reviewing === 'reject' ? 'Menolak…' : 'Tolak pesanan'}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={Boolean(reviewing)}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAdOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const rows = await getAdminAdOrders();
      setOrders(rows);
      if (isRefresh) toast.success('Pesanan diperbarui.');
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
      review: orders.filter((item) => item.status === 'awaiting_review').length,
      awaiting: orders.filter((item) => item.status === 'awaiting_payment').length,
      approved: orders.filter((item) => item.status === 'approved').length,
      revenue: orders
        .filter((item) => item.status === 'approved')
        .reduce((total, item) => total + item.totalAmount, 0),
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!query) return true;
      return [item.orderCode, item.contactName, item.contactEmail, item.contactPhone, item.packageName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="page admin-page">
      <AdminAdsTabs />
      <section className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">
            <ShoppingBag size={14} aria-hidden="true" />
            PESANAN IKLAN
          </span>
          <h1>Verifikasi pesanan</h1>
          <p>
            Periksa bukti transfer, cocokkan nominal unik, lalu setujui pesanan agar iklan
            tayang. Hanya pesanan berstatus menunggu verifikasi yang dapat disetujui.
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
        </div>
      </section>

      <div className="admin-stat-grid admin-stat-grid--four">
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--accent">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Perlu verifikasi</div>
            <div className="admin-stat__value">{summary.review}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <Clock size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Menunggu bayar</div>
            <div className="admin-stat__value">{summary.awaiting}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--income">
            <CheckCircle2 size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Disetujui</div>
            <div className="admin-stat__value">{summary.approved}</div>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon">
            <Wallet size={19} aria-hidden="true" />
          </span>
          <div>
            <div className="admin-stat__label">Dana terverifikasi</div>
            <div className="admin-stat__value admin-stat__value--sm">
              {formatCurrency(summary.revenue)}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-toolbar admin-order-toolbar">
        <div className="admin-toolbar__search input-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kode, nama, email, atau paket…"
            aria-label="Cari pesanan"
          />
        </div>
        <div className="admin-filter">
          <button
            type="button"
            className={`admin-filter__button ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Semua
          </button>
          {AD_ORDER_STATUSES.map((status) => (
            <button
              key={status.value}
              type="button"
              className={`admin-filter__button ${
                statusFilter === status.value ? 'is-active' : ''
              }`}
              onClick={() => setStatusFilter(status.value)}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner block label="Memuat pesanan iklan…" />
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={<AlertCircle size={27} />}
            title="Pesanan tidak dapat dimuat"
            text={error}
            action={
              <button type="button" className="btn btn--primary" onClick={() => load()}>
                Coba lagi
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ShoppingBag size={27} />}
            title={orders.length ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
            text={
              orders.length
                ? 'Ubah kata kunci atau filter status untuk menemukan pesanan.'
                : 'Pesanan dari halaman /advertise akan muncul di sini.'
            }
          />
        </div>
      ) : (
        <div className="card admin-table-card admin-order-card">
          <div className="admin-order-head" aria-hidden="true">
            <span>Pesanan</span>
            <span>Paket</span>
            <span>Total</span>
            <span>Status</span>
            <span>Dibuat</span>
            <span>Aksi</span>
          </div>
          {filtered.map((order) => {
            const status = statusMeta(order.status);
            return (
              <div className="admin-order-row" key={order.id}>
                <div className="admin-order-row__identity">
                  <strong>{order.orderCode}</strong>
                  <small>{order.contactName || 'Tanpa nama'}</small>
                  <span>{order.contactEmail}</span>
                </div>
                <div data-label="Paket" className="admin-order-row__package">
                  <strong>{order.packageName}</strong>
                  <span>{placementLabel(order.placement)}</span>
                </div>
                <strong data-label="Total" className="admin-order-row__amount">
                  {formatCurrency(order.totalAmount)}
                </strong>
                <div data-label="Status">
                  <span className={`badge badge--${status.tone}`}>{status.label}</span>
                </div>
                <span data-label="Dibuat" className="admin-order-row__date">
                  {formatDateTime(order.createdAt)}
                </span>
                <div className="admin-order-row__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setSelected(order)}
                  >
                    Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="callout callout--primary">
        <ShieldCheck aria-hidden="true" />
        <span>
          Persetujuan akan mengaktifkan iklan dan mengisi jadwal tayang otomatis. Catatan
          review dan nominal tersimpan di audit log admin.
        </span>
      </div>

      {selected ? (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onReviewed={() => {
            setSelected(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
