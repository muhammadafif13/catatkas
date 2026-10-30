import { NavLink } from 'react-router-dom';
import { LogOut, Plus, ShieldHalf } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { ADMIN_NAV_ITEMS, APP_TAGLINE, APP_VERSION, NAV_ITEMS } from '../../utils/constants';
import { useAuthStore } from '../../stores/useAuthStore';
import BrandMark from '../ui/BrandMark';
import { getNavIcon } from './navIcons';

const primaryPaths = ['/', '/history', '/reports', '/budget', '/accounts'];

export default function Sidebar() {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const online = useOnlineStatus();
  const primary = NAV_ITEMS.filter((item) => primaryPaths.includes(item.to));
  const secondary = NAV_ITEMS.filter((item) => !primaryPaths.includes(item.to));

  const renderLink = (item) => {
    const Icon = getNavIcon(item.icon);
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
      >
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <BrandMark size={42} className="sidebar__brand-mark" decorative />
        <div>
          <div className="sidebar__brand-name">CatatKas</div>
          <div className="sidebar__brand-tag">{APP_TAGLINE}</div>
        </div>
      </div>

      <NavLink to="/add" className="btn btn--primary sidebar__cta">
        <Plus aria-hidden="true" />
        Tambah Transaksi
      </NavLink>

      <nav className="sidebar__nav" aria-label="Navigasi utama">
        <div className="sidebar__group">
          <div className="sidebar__group-label">Utama</div>
          {primary.map(renderLink)}
        </div>
        <div className="sidebar__group">
          <div className="sidebar__group-label">Kelola</div>
          {secondary.map(renderLink)}
        </div>
        {profile?.role === 'admin' ? (
          <div className="sidebar__group sidebar__group--admin">
            <div className="sidebar__group-label">
              <ShieldHalf size={12} aria-hidden="true" />
              Admin
            </div>
            {ADMIN_NAV_ITEMS.map(renderLink)}
          </div>
        ) : null}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__account">
          <NavLink to="/settings" className="sidebar__account-link">
            <span className="sidebar__account-avatar">
              {(profile?.fullName || profile?.email || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="sidebar__account-copy">
              <strong>{profile?.fullName || 'Pengguna'}</strong>
              <small>{profile?.email}</small>
            </span>
          </NavLink>
          <button
            type="button"
            className="sidebar__logout"
            onClick={() => void signOut()}
            aria-label="Keluar dari akun"
            title="Keluar"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
        <div className={`sidebar__status${online ? '' : ' is-offline'}`}>
          <span className="sidebar__status-dot" aria-hidden="true" />
          <span>{online ? 'Tersambung ke CatatKas Cloud' : 'Mode offline — baca saja'}</span>
        </div>
        <span>Versi {APP_VERSION}</span>
      </div>
    </aside>
  );
}
