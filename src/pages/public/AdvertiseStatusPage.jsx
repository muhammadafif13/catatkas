import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FileCheck2,
  Megaphone,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  getPaymentAssetUrl,
  getPublicAdStatus,
  submitPublicAdProof,
} from '../../db/advertising';
import { getAdImageUrl } from '../../db/ads';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { toast } from '../../stores/useUIStore';
import { AD_PLACEMENTS } from '../../utils/constants';

const TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_PROOF_BYTES = 5 * 1024 * 1024;

const STATUS_META = {
  awaiting_payment: {
    label: 'Menunggu pembayaran',
    tone: 'warning',
    title: 'Selesaikan pembayaran.',
    description:
      'Transfer sesuai nominal akhir, lalu unggah bukti di halaman ini. Admin akan memverifikasi pembayaran sebelum iklan tayang.',
  },
  awaiting_review: {
    label: 'Menunggu verifikasi',
    tone: 'info',
    title: 'Bukti sedang diperiksa.',
    description:
      'Admin sudah menerima bukti pembayaranmu. Kamu masih bisa memperbarui bukti jika ada kekeliruan.',
  },
  approved: {
    label: 'Disetujui',
    tone: 'success',
    title: 'Pembayaran disetujui.',
    description: 'Iklan sudah masuk jadwal tayang. Pantau tanggal mulai di ringkasan kampanye.',
  },
  scheduled: {
    label: 'Dijadwalkan',
    tone: 'info',
    title: 'Iklan sudah dijadwalkan.',
    description: 'Pembayaran telah diverifikasi. Iklan akan tampil otomatis sesuai jadwal.',
  },
  active: {
    label: 'Tayang',
    tone: 'success',
    title: 'Iklanmu sedang tayang.',
    description:
      'Kampanye aktif di CatatKas. Statistik di bawah diperbarui dari tayangan dan klik yang tercatat.',
  },
  paused: {
    label: 'Dijeda',
    tone: 'neutral',
    title: 'Iklan sedang dijeda.',
    description: 'Admin menjeda kampanye ini. Hubungi admin jika kamu memerlukan informasi lanjutan.',
  },
  ended: {
    label: 'Selesai',
    tone: 'neutral',
    title: 'Masa tayang selesai.',
    description:
      'Kampanye ini sudah berakhir. Kamu bisa membuat pesanan baru untuk memperpanjang penayangan.',
  },
  rejected: {
    label: 'Ditolak',
    tone: 'danger',
    title: 'Pesanan perlu ditinjau.',
    description:
      'Admin tidak dapat menyetujui pesanan ini. Baca catatan di bawah, lalu hubungi admin untuk perbaikan atau pengembalian dana.',
  },
  expired: {
    label: 'Kedaluwarsa',
    tone: 'neutral',
    title: 'Batas pembayaran telah lewat.',
    description:
      'Pesanan ini kedaluwarsa karena pembayaran tidak diselesaikan dalam batas waktu. Silakan buat pesanan baru.',
  },
  cancelled: {
    label: 'Dibatalkan',
    tone: 'neutral',
    title: 'Pesanan dibatalkan.',
    description: 'Pesanan ini sudah dibatalkan. Kamu bisa membuat pesanan baru kapan saja.',
  },
};

function placementLabel(value) {
  return AD_PLACEMENTS.find((item) => item.value === value)?.label || value;
}

function parseTokenInput(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (TOKEN_PATTERN.test(text)) return text;
  try {
    const url = new URL(text);
    const segments = url.pathname.split('/').filter(Boolean);
    const token = segments[segments.length - 1];
    return TOKEN_PATTERN.test(token) ? token : '';
  } catch {
    return '';
  }
}

function formatRemaining(ms) {
  if (ms <= 0) return 'Lewat';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} hari ${restHours} jam` : `${days} hari`;
}

function StatusBadge({ status, label, tone }) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label || status}
    </span>
  );
}

function CopyButton({ value, label = 'Salin', className = '' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      toast.success('Disalin.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Gagal menyalin. Salin manual dari teks yang tertera.');
    }
  }

  return (
    <button type="button" className={`status-copy ${className}`} onClick={copy}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? 'Tersalin' : label}
    </button>
  );
}

function TokenLookup({ initialValue = '', compact = false, onToken }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const token = parseTokenInput(value);
    if (!token) {
      setError('Tempel link status atau token pesanan yang valid.');
      return;
    }
    if (onToken) onToken(token);
    navigate(`/advertise/order/${token}`);
  }

  return (
    <form className={`status-lookup ${compact ? 'status-lookup--compact' : ''}`} onSubmit={submit}>
      <label className="status-lookup__label" htmlFor="status-token">
        Link atau token pesanan
      </label>
      <div className="status-lookup__row">
        <Search size={18} aria-hidden="true" />
        <input
          id="status-token"
          className="status-lookup__input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
          placeholder="Tempel link status pesanan..."
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--primary">
          Buka
        </button>
      </div>
      {error ? (
        <p className="public-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Timeline({ order }) {
  const approved = order.status === 'approved';
  const rejected = order.status === 'rejected';
  const proof = order.proofSubmitted;
  const publicStatus = order.publicStatus;

  const items = [
    {
      title: 'Pesanan dibuat',
      detail: formatDateTime(order.createdAt),
      state: 'done',
    },
    {
      title: proof ? 'Bukti diterima' : 'Unggah bukti transfer',
      detail: proof
        ? order.submittedAt
          ? `Dikirim ${formatDateTime(order.submittedAt)}`
          : 'Bukti sudah tersimpan.'
        : 'Belum ada bukti pembayaran.',
      state: proof ? 'done' : order.canSubmitProof ? 'current' : 'pending',
    },
    {
      title: rejected ? 'Verifikasi gagal' : 'Verifikasi pembayaran',
      detail: approved
        ? order.reviewedAt
          ? `Disetujui ${formatDateTime(order.reviewedAt)}`
          : 'Pembayaran disetujui.'
        : rejected
          ? 'Admin menolak pesanan ini.'
          : order.status === 'awaiting_review'
            ? 'Menunggu pemeriksaan admin.'
            : 'Belum diverifikasi.',
      state: rejected
        ? 'error'
        : approved
          ? 'done'
          : order.status === 'awaiting_review'
            ? 'current'
            : 'pending',
    },
    {
      title:
        publicStatus === 'active'
          ? 'Kampanye tayang'
          : publicStatus === 'scheduled'
            ? 'Dijadwalkan tayang'
            : publicStatus === 'ended'
              ? 'Masa tayang selesai'
              : publicStatus === 'paused'
                ? 'Kampanye dijeda'
                : 'Kampanye tayang',
      detail: approved
        ? order.startsAt
          ? `${formatDateTime(order.startsAt)}${order.endsAt ? ` - ${formatDateTime(order.endsAt)}` : ''}`
          : 'Jadwal akan ditentukan admin.'
        : 'Menunggu persetujuan pembayaran.',
      state:
        publicStatus === 'active' || publicStatus === 'scheduled'
          ? 'current'
          : publicStatus === 'ended' || publicStatus === 'paused'
            ? 'done'
            : 'pending',
    },
  ];

  return (
    <ol className="status-timeline">
      {items.map((item) => (
        <li key={item.title} className={`status-timeline__item is-${item.state}`}>
          <span className="status-timeline__marker" aria-hidden="true">
            {item.state === 'done' ? (
              <Check size={13} />
            ) : item.state === 'current' ? (
              <span />
            ) : item.state === 'error' ? (
              <XCircle size={14} />
            ) : null}
          </span>
          <div>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ProofForm({ token, defaultName, compact = false, onSuccess }) {
  const fileRef = useRef(null);
  const [payerName, setPayerName] = useState(defaultName || '');
  const [payerNote, setPayerNote] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleFile(event) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    if (!PROOF_TYPES.includes(selected.type)) {
      setError('Gunakan JPG, PNG, WebP, atau PDF.');
      return;
    }
    if (selected.size > MAX_PROOF_BYTES) {
      setError('Ukuran bukti maksimal 5 MB.');
      return;
    }
    setFile(selected);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (payerName.trim().length < 2) {
      setError('Tulis nama pengirim, minimal 2 karakter.');
      return;
    }
    if (!file) {
      setError('Pilih file bukti pembayaran.');
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicAdProof({
        token,
        file,
        payerName: payerName.trim(),
        payerNote: payerNote.trim(),
      });
      setFile(null);
      setPayerNote('');
      toast.success('Bukti pembayaran terkirim.');
      onSuccess?.();
    } catch (uploadError) {
      setError(uploadError.message || 'Bukti gagal dikirim. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={`status-proof ${compact ? 'status-proof--compact' : ''}`} onSubmit={submit}>
      <div className="status-proof__grid">
        <label className="status-proof__field">
          <span>Nama pengirim</span>
          <input
            className="input"
            value={payerName}
            onChange={(event) => setPayerName(event.target.value)}
            maxLength={100}
            placeholder="Nama sesuai rekening"
            autoComplete="name"
          />
        </label>
        <label className="status-proof__field">
          <span>Catatan untuk admin</span>
          <input
            className="input"
            value={payerNote}
            onChange={(event) => setPayerNote(event.target.value)}
            maxLength={500}
            placeholder="Opsional"
          />
        </label>
      </div>
      <div className="status-proof__upload">
        <button
          type="button"
          className={`status-proof__file ${file ? 'has-file' : ''}`}
          onClick={() => fileRef.current?.click()}
        >
          {file ? <FileCheck2 size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
          <span>{file ? file.name : 'Pilih bukti transfer'}</span>
          <small>{file ? 'Klik untuk mengganti' : 'JPG, PNG, WebP, atau PDF · maks. 5 MB'}</small>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={PROOF_TYPES.join(',')}
          className="sr-only"
          onChange={handleFile}
          aria-label="Unggah bukti transfer"
        />
      </div>
      {error ? (
        <p className="public-field-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Mengirim bukti...' : 'Kirim bukti'}
      </button>
    </form>
  );
}

function PaymentPanel({ order, data, onRefresh }) {
  const bankAvailable = Boolean(data.payment.bankName && data.payment.accountNumber);
  const qrisPath = data.payment.qrisPath || data.payment.qrisImagePath || '';
  const qrisUrl = qrisPath ? getPaymentAssetUrl(qrisPath) : '';
  const isQris = order.paymentMethod === 'qris';
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    if (!order.expiresAt) return undefined;
    const interval = window.setInterval(() => setClock(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [order.expiresAt]);

  const remaining = useMemo(() => {
    if (!order.expiresAt) return null;
    return new Date(order.expiresAt).getTime() - clock;
  }, [clock, order.expiresAt]);

  async function copyAmount() {
    try {
      await navigator.clipboard.writeText(String(order.totalAmount));
      setCopiedAmount(true);
      toast.success('Nominal disalin.');
      window.setTimeout(() => setCopiedAmount(false), 1800);
    } catch {
      toast.error('Gagal menyalin nominal.');
    }
  }

  return (
    <section className="status-panel status-panel--payment">
      <div className="status-panel__head">
        <div>
          <p className="status-panel__eyebrow">
            <Clock size={15} aria-hidden="true" />
            {order.status === 'awaiting_review'
              ? 'Menunggu verifikasi admin'
              : remaining !== null && remaining <= 0
                ? 'Batas pembayaran lewat'
                : `Bayar dalam ${formatRemaining(remaining)}`}
          </p>
          <h2>{order.status === 'awaiting_review' ? 'Bukti sudah diterima.' : 'Nominal yang harus dibayar'}</h2>
        </div>
        <StatusBadge
          status={order.status}
          label={STATUS_META[order.status]?.label}
          tone={STATUS_META[order.status]?.tone}
        />
      </div>

      <div className="status-amount">
        <span>Total transfer</span>
        <strong>{formatCurrency(order.totalAmount)}</strong>
        <button type="button" className="status-copy" onClick={copyAmount}>
          {copiedAmount ? <Check size={14} /> : <Copy size={14} />}
          {copiedAmount ? 'Tersalin' : 'Salin nominal'}
        </button>
        <p>
          {formatCurrency(order.baseAmount)} + kode unik {order.uniqueCode}
        </p>
      </div>

      {isQris ? (
        <div className="status-payment">
          <div className="status-payment__qris">
            {qrisUrl ? (
              <img src={qrisUrl} alt="QRIS pembayaran CatatKas" />
            ) : (
              <div className="status-payment__qris-placeholder">
                <AlertTriangle size={20} aria-hidden="true" />
                <span>QRIS belum tersedia. Hubungi admin.</span>
              </div>
            )}
            <div>
              <strong>Pindai QRIS</strong>
              <p>
                Masukkan nominal tepat <b>{formatCurrency(order.totalAmount)}</b> di
                aplikasi pembayaran. Jangan membulatkan nominal.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="status-payment">
          {bankAvailable ? (
            <dl className="status-bank">
              <div>
                <dt>Bank</dt>
                <dd>{data.payment.bankName}</dd>
              </div>
              <div>
                <dt>Nomor rekening</dt>
                <dd>
                  {data.payment.accountNumber}
                  <CopyButton value={data.payment.accountNumber} />
                </dd>
              </div>
              <div>
                <dt>Atas nama</dt>
                <dd>{data.payment.accountHolder || '-'}</dd>
              </div>
            </dl>
          ) : (
            <div className="public-callout public-callout--warning">
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>Rekening belum tersedia.</strong>
                <p>Hubungi admin untuk mendapatkan detail pembayaran.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {data.payment.instructions ? (
        <p className="status-payment__instructions">{data.payment.instructions}</p>
      ) : null}

      {order.status === 'awaiting_payment' ? (
        <div className="status-proof-block">
          <div className="status-proof-block__head">
            <h3>Unggah bukti transfer</h3>
            <p>Bukti dibaca admin secara manual. Data rekening tidak ditampilkan ke publik.</p>
          </div>
          <ProofForm token={order.publicToken || window.location.pathname.split('/').pop()} defaultName={order.payerName} onSuccess={onRefresh} />
        </div>
      ) : null}

      {order.status === 'awaiting_review' ? (
        <details className="status-proof-details">
          <summary>
            <ShieldCheck size={17} aria-hidden="true" />
            Bukti sudah diterima. Perbarui jika perlu
            <ChevronRight size={16} aria-hidden="true" />
          </summary>
          <ProofForm
            token={order.publicToken || window.location.pathname.split('/').pop()}
            defaultName={order.payerName}
            compact
            onSuccess={onRefresh}
          />
        </details>
      ) : null}
    </section>
  );
}

function CampaignPanel({ order, ad }) {
  const imageUrl = getAdImageUrl(ad?.imagePath);
  const status = STATUS_META[order.publicStatus] || STATUS_META[order.status];

  return (
    <section className="status-panel status-panel--campaign">
      <div className="status-panel__head">
        <div>
          <p className="status-panel__eyebrow">
            <Megaphone size={15} aria-hidden="true" />
            Kampanye
          </p>
          <h2>{status?.title || STATUS_META.approved.title}</h2>
          <p className="status-panel__description">{status?.description}</p>
        </div>
        <StatusBadge status={order.publicStatus} label={status?.label} tone={status?.tone} />
      </div>

      {ad ? (
        <div className="status-campaign">
          <div className="status-campaign__media">
            {imageUrl ? (
              <img src={imageUrl} alt="" />
            ) : (
              <Megaphone size={28} aria-hidden="true" />
            )}
          </div>
          <div className="status-campaign__copy">
            <span>{placementLabel(order.placement)}</span>
            <h3>{ad.title}</h3>
            {ad.body ? <p>{ad.body}</p> : null}
            {ad.targetUrl ? (
              <a href={ad.targetUrl} target="_blank" rel="noreferrer noopener">
                {ad.ctaLabel || 'Kunjungi'}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <dl className="status-dates">
        <div>
          <dt>Mulai</dt>
          <dd>{ad?.startsAt ? formatDateTime(ad.startsAt) : 'Menunggu jadwal'}</dd>
        </div>
        <div>
          <dt>Berakhir</dt>
          <dd>{ad?.endsAt ? formatDateTime(ad.endsAt) : 'Mengikuti masa tayang'}</dd>
        </div>
        <div>
          <dt>Durasi</dt>
          <dd>{order.durationDays} hari</dd>
        </div>
      </dl>

      {order.publicStatus === 'active' || order.publicStatus === 'ended' ? (
        <div className="status-stats">
          <div>
            <strong>{Number(order.stats?.impressions || 0).toLocaleString('id-ID')}</strong>
            <span>tayangan</span>
          </div>
          <div>
            <strong>{Number(order.stats?.clicks || 0).toLocaleString('id-ID')}</strong>
            <span>klik</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReviewNote({ order }) {
  if (!order.reviewNote) return null;
  return (
    <section className="status-panel status-panel--note">
      <div className="status-panel__head">
        <div>
          <p className="status-panel__eyebrow">Catatan admin</p>
          <h2>
            {order.status === 'rejected' ? 'Alasan penolakan' : 'Catatan verifikasi'}
          </h2>
        </div>
      </div>
      <p className="status-review-note">{order.reviewNote}</p>
    </section>
  );
}

export default function AdvertiseStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Status pesanan iklan · CatatKas';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);

  async function loadStatus() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const result = await getPublicAdStatus(token);
      setData(result);
    } catch (loadError) {
      setData(null);
      setError(loadError.message || 'Status pesanan belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadStatus();
    else {
      setData(null);
      setError('');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="status-page status-page--lookup">
        <div className="public-container">
          <div className="status-lookup-hero">
            <Link to="/advertise" className="status-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali ke halaman iklan
            </Link>
            <p className="status-lookup-hero__eyebrow">Status pesanan</p>
            <h1>Buka kembali pesananmu.</h1>
            <p>
              Tempel link status yang kamu simpan setelah mengirim formulir. Link berisi
              token rahasia—tanpa link itu, pesanan tidak dapat diakses.
            </p>
            <TokenLookup />
            <p className="status-lookup-hero__hint">
              Belum punya pesanan?{' '}
              <Link to="/advertise#pasang">Mulai pasang iklan</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="status-page">
        <div className="public-container status-loading" aria-busy="true">
          <div className="status-loading__bar" />
          <div className="status-loading__grid">
            <div />
            <div />
          </div>
          <p>Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="status-page status-page--lookup">
        <div className="public-container">
          <div className="status-lookup-hero">
            <Link to="/advertise" className="status-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali ke halaman iklan
            </Link>
            <p className="status-lookup-hero__eyebrow">Status pesanan</p>
            <h1>Pesanan tidak dapat dibuka.</h1>
            <p>{error || 'Periksa kembali link status yang kamu simpan.'}</p>
            <TokenLookup initialValue={token} compact />
            <p className="status-lookup-hero__hint">
              Jika link terasa benar, hubungi admin melalui kontak di aplikasi CatatKas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { order } = data;
  const status = STATUS_META[order.publicStatus] || STATUS_META[order.status] || STATUS_META.approved;
  const orderWithExtras = { ...order, ...data, publicToken: token, stats: data.stats };
  const showPayment =
    order.status === 'awaiting_payment' || order.status === 'awaiting_review';
  const showCampaign = order.status === 'approved';

  return (
    <div className="status-page">
      <div className="public-container">
        <div className="status-page__top">
          <Link to="/advertise" className="status-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Halaman iklan
          </Link>
          <div className="status-page__tools">
            <button type="button" className="btn btn--ghost btn--sm" onClick={loadStatus}>
              <RefreshCw size={15} aria-hidden="true" />
              Muat ulang
            </button>
            <CopyButton value={window.location.href} label="Salin link status" />
          </div>
        </div>

        <header className="status-hero">
          <div>
            <StatusBadge status={order.status} label={status.label} tone={status.tone} />
            <p className="status-hero__code">Pesanan {order.code}</p>
            <h1>{status.title}</h1>
            <p className="status-hero__description">{status.description}</p>
          </div>
          <div className="status-hero__meta">
            <span>Dibuat {formatDateTime(order.createdAt)}</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
            <span>
              {order.packageName} · {placementLabel(order.placement)}
            </span>
          </div>
        </header>

        <div className="status-layout">
          <div className="status-layout__main">
            {showPayment ? (
              <PaymentPanel order={orderWithExtras} data={data} onRefresh={loadStatus} />
            ) : null}
            {showCampaign ? <CampaignPanel order={orderWithExtras} ad={data.ad} /> : null}
            <ReviewNote order={orderWithExtras} />
            {order.status === 'rejected' || order.status === 'expired' || order.status === 'cancelled' ? (
              <section className="status-panel status-panel--reorder">
                <h2>Siap mencoba lagi?</h2>
                <p>Buat pesanan baru dengan paket dan materi yang sudah diperbaiki.</p>
                <Link to="/advertise#pasang" className="btn btn--primary">
                  Pasang iklan kembali
                </Link>
              </section>
            ) : null}
            <section className="status-panel status-panel--help">
              <div className="status-help">
                <ShieldCheck size={20} aria-hidden="true" />
                <div>
                  <h3>Link ini bersifat rahasia.</h3>
                  <p>
                    Simpan atau bagikan hanya kepada pihak yang berwenang. Siapa pun yang
                    memiliki link dapat melihat status dan data pembayaran pesanan.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="status-layout__aside">
            <section className="status-panel status-panel--timeline">
              <div className="status-panel__head">
                <div>
                  <p className="status-panel__eyebrow">Perjalanan pesanan</p>
                  <h2>Progres</h2>
                </div>
              </div>
              <Timeline order={orderWithExtras} />
            </section>

            <section className="status-panel status-panel--summary">
              <div className="status-panel__head">
                <div>
                  <p className="status-panel__eyebrow">Ringkasan</p>
                  <h2>Detail pesanan</h2>
                </div>
              </div>
              <dl className="status-summary">
                <div>
                  <dt>Paket</dt>
                  <dd>{order.packageName}</dd>
                </div>
                <div>
                  <dt>Penempatan</dt>
                  <dd>{placementLabel(order.placement)}</dd>
                </div>
                <div>
                  <dt>Durasi</dt>
                  <dd>{order.durationDays} hari</dd>
                </div>
                <div>
                  <dt>Metode</dt>
                  <dd>{order.paymentMethod === 'qris' ? 'QRIS' : 'Transfer bank'}</dd>
                </div>
                <div>
                  <dt>Pembayaran</dt>
                  <dd>
                    {formatCurrency(order.baseAmount)} + {order.uniqueCode}
                  </dd>
                </div>
              </dl>
              <div className="status-summary__total">
                <span>Total</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
