import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getAdminUsers, runAdminUserAction } from '../../services/admin';
import { formatDateTime } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/helpers';
import { toast, useUIStore } from '../../stores/useUIStore';

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Ditangguhkan' },
  { value: 'admin', label: 'Admin' },
];

function initials(name, email) {
  return String(name || email || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function AdminUsersPage() {
  const requestConfirm = useUIStore((state) => state.requestConfirm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
      if (isRefresh) toast.success('Daftar pengguna diperbarui.');
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

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter === 'active' && (user.isSuspended || user.role === 'admin')) return false;
      if (filter === 'suspended' && !user.isSuspended) return false;
      if (filter === 'admin' && user.role !== 'admin') return false;
      if (!keyword) return true;
      return (
        user.email.toLowerCase().includes(keyword) ||
        user.fullName.toLowerCase().includes(keyword)
      );
    });
  }, [users, filter, search]);

  const handleToggleStatus = async (user) => {
    const suspending = !user.isSuspended;
    const confirmed = await requestConfirm({
      title: suspending ? 'Tangguhkan pengguna?' : 'Aktifkan kembali pengguna?',
      message: suspending
        ? `${user.email} tidak akan bisa masuk atau mengubah data sampai diaktifkan kembali. Data keuangan tetap tersimpan.`
        : `${user.email} akan bisa masuk dan mencatat data kembali.`,
      confirmLabel: suspending ? 'Tangguhkan' : 'Aktifkan',
      danger: suspending,
    });
    if (!confirmed) return;

    setBusyId(user.id);
    try {
      await runAdminUserAction(user.id, suspending ? 'suspend' : 'activate');
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isSuspended: suspending } : item,
        ),
      );
      toast.success(suspending ? 'Pengguna ditangguhkan.' : 'Pengguna diaktifkan kembali.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    total: users.length,
    active: users.filter((user) => !user.isSuspended).length,
    suspended: users.filter((user) => user.isSuspended).length,
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner block label="Memuat data pengguna…" />
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <section className="admin-hero admin-hero--compact">
        <div>
          <span className="admin-hero__eyebrow">
            <Users size={14} aria-hidden="true" />
            {counts.total} PENGGUNA
          </span>
          <h1>Kelola pengguna CatatKas</h1>
          <p>
            {counts.active} aktif · {counts.suspended} ditangguhkan. Buka detail untuk meninjau data
            keuangan.
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

      <div className="admin-toolbar">
        <div className="input-wrap admin-toolbar__search">
          <Search aria-hidden="true" />
          <input
            type="search"
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau email…"
            aria-label="Cari pengguna"
          />
        </div>
        <div className="chips admin-filter">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`chip${filter === item.value ? ' is-active' : ''}`}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="card card--flush admin-table-card">
          <div className="admin-table-head">
            <span>Pengguna</span>
            <span>Aktivitas</span>
            <span>Status</span>
            <span aria-hidden="true" />
          </div>
          {filtered.map((user) => (
            <div key={user.id} className="admin-table-row">
              <Link to={`/admin/users/${user.id}`} className="admin-identity">
                <span className="admin-avatar">{initials(user.fullName, user.email)}</span>
                <span>
                  <strong>{user.fullName || 'Tanpa nama'}</strong>
                  <small>{user.email}</small>
                </span>
              </Link>

              <div className="admin-activity">
                <span>{user.transactionCount.toLocaleString('id-ID')} transaksi</span>
                <small>
                  {user.lastSeenAt
                    ? `Dibuka ${formatDateTime(user.lastSeenAt)}`
                    : 'Belum pernah dibuka'}
                </small>
              </div>

              <div className="admin-status">
                {user.role === 'admin' ? (
                  <span className="badge badge--primary">
                    <ShieldCheck size={12} aria-hidden="true" />
                    Admin
                  </span>
                ) : null}
                <span
                  className={`badge ${user.isSuspended ? 'badge--danger' : 'badge--success'}`}
                >
                  {user.isSuspended ? 'Ditangguhkan' : 'Aktif'}
                </span>
              </div>

              <div className="admin-actions">
                {user.role !== 'admin' ? (
                  <button
                    type="button"
                    className={`btn btn--sm ${user.isSuspended ? 'btn--soft' : 'btn--danger-soft'}`}
                    onClick={() => handleToggleStatus(user)}
                    disabled={busyId === user.id}
                  >
                    {user.isSuspended ? (
                      <CheckCircle2 size={15} aria-hidden="true" />
                    ) : (
                      <Ban size={15} aria-hidden="true" />
                    )}
                    {busyId === user.id ? 'Memproses…' : user.isSuspended ? 'Aktifkan' : 'Tangguhkan'}
                  </button>
                ) : null}
                <Link to={`/admin/users/${user.id}`} className="admin-chevron" aria-label="Buka detail">
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<UserRound size={26} />}
            title="Tidak ada pengguna yang cocok"
            text="Ubah kata pencarian atau filter untuk melihat pengguna lain."
          />
        </div>
      )}
    </div>
  );
}
