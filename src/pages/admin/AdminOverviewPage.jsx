import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getAdminOverview, getAdminUsers } from '../../services/admin';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/helpers';
import { toast } from '../../stores/useUIStore';

function Stat({ icon: Icon, label, value, meta, tone = 'default' }) {
  return (
    <article className={`admin-stat admin-stat--${tone}`}>
      <span className="admin-stat__icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <div className="admin-stat__label">{label}</div>
        <div className="admin-stat__value">{value}</div>
        {meta ? <div className="admin-stat__meta">{meta}</div> : null}
      </div>
    </article>
  );
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [stats, userList] = await Promise.all([getAdminOverview(), getAdminUsers()]);
      setOverview(stats);
      setUsers(userList);
      if (isRefresh) toast.success('Ringkasan admin diperbarui.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner block label="Memuat ringkasan admin…" />
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            MODE ADMIN
          </span>
          <h1>Ringkasan seluruh pengguna</h1>
          <p>
            Pantau pertumbuhan pengguna, aktivitas pencatatan, dan iklan aktif. Data keuangan
            bersifat baca-saja dari panel ini.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {refreshing ? 'Memuat…' : 'Segarkan'}
        </button>
      </section>

      <div className="admin-stat-grid">
        <Stat
          icon={Users}
          label="Total pengguna"
          value={overview?.totalUsers ?? 0}
          meta={`${overview?.suspendedUsers ?? 0} ditangguhkan`}
        />
        <Stat
          icon={Wallet}
          label="Total transaksi"
          value={(overview?.totalTransactions ?? 0).toLocaleString('id-ID')}
          meta="Seluruh akun"
        />
        <Stat
          icon={ArrowDownLeft}
          label="Pemasukan tercatat"
          value={formatCurrency(overview?.totalIncome ?? 0)}
          tone="income"
        />
        <Stat
          icon={ArrowUpRight}
          label="Pengeluaran tercatat"
          value={formatCurrency(overview?.totalExpense ?? 0)}
          tone="expense"
        />
        <Stat
          icon={Megaphone}
          label="Iklan aktif"
          value={overview?.activeAds ?? 0}
          meta="Tayang di aplikasi"
          tone="accent"
        />
        <Stat
          icon={UserRound}
          label="Pengguna aktif 7 hari"
          value={users.filter((user) => isWithinDays(user.lastSeenAt, 7)).length}
          meta="Berdasarkan terakhir dibuka"
        />
      </div>

      <div className="admin-quick-grid">
        <Link to="/admin/users" className="admin-quick">
          <span className="admin-quick__icon">
            <Users size={21} aria-hidden="true" />
          </span>
          <span>
            <strong>Kelola pengguna</strong>
            <small>Lihat akun, status, dan data keuangan.</small>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/admin/ads" className="admin-quick">
          <span className="admin-quick__icon admin-quick__icon--accent">
            <Megaphone size={21} aria-hidden="true" />
          </span>
          <span>
            <strong>Kelola iklan</strong>
            <small>Atur sponsor dan slot AdSense.</small>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>

      <section className="card admin-recent">
        <div className="card__header">
          <div className="card__header-main">
            <h2 className="card__title">Pengguna terbaru</h2>
            <p className="card__subtitle">Akun yang baru bergabung</p>
          </div>
          <Link to="/admin/users" className="btn btn--ghost btn--sm">
            Lihat semua
          </Link>
        </div>

        {users.length ? (
          <div className="admin-user-list">
            {users.slice(0, 5).map((user) => (
              <Link key={user.id} to={`/admin/users/${user.id}`} className="admin-user-row">
                <span className="admin-avatar">{initials(user.fullName, user.email)}</span>
                <span className="admin-user-row__identity">
                  <strong>{user.fullName || 'Tanpa nama'}</strong>
                  <small>{user.email}</small>
                </span>
                <span className="admin-user-row__meta">
                  <span>{user.transactionCount.toLocaleString('id-ID')} transaksi</span>
                  <small>{formatDateTime(user.createdAt)}</small>
                </span>
                <span className={`badge ${user.isSuspended ? 'badge--danger' : 'badge--success'}`}>
                  {user.isSuspended ? 'Ditangguhkan' : 'Aktif'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Belum ada pengguna terdaftar.</p>
        )}
      </section>

      <div className="callout callout--warning">
        <ShieldCheck aria-hidden="true" />
        <span>
          Admin dapat membaca data keuangan seluruh pengguna, tetapi tidak dapat mengedit atau
          menghapus transaksi mereka. Akses ini tercatat di audit log.
        </span>
      </div>
    </div>
  );
}

function initials(name, email) {
  return String(name || email || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function isWithinDays(value, days) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}
