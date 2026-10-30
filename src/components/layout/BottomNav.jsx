import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Plus, ChartPie, MoreHorizontal } from 'lucide-react';

const items = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/history', label: 'Riwayat', icon: History },
  { to: '/reports', label: 'Laporan', icon: ChartPie },
];

const morePaths = ['/more', '/budget', '/accounts', '/categories', '/export', '/settings'];

export default function BottomNav() {
  const location = useLocation();
  const isMoreActive =
    morePaths.includes(location.pathname) || location.pathname.startsWith('/admin');
  const isAddActive = location.pathname === '/add';

  return (
    <nav className="bottom-nav" aria-label="Navigasi bawah">
      {items.slice(0, 2).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <NavLink
        to="/add"
        className={`bottom-nav__add${isAddActive ? ' is-active' : ''}`}
        aria-label="Tambah transaksi baru"
      >
        <Plus size={26} aria-hidden="true" />
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
      >
        <ChartPie size={21} aria-hidden="true" />
        <span>Laporan</span>
      </NavLink>

      <NavLink
        to="/more"
        className={`bottom-nav__item${isMoreActive ? ' is-active' : ''}`}
      >
        <MoreHorizontal size={21} aria-hidden="true" />
        <span>Lainnya</span>
      </NavLink>
    </nav>
  );
}
