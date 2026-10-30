import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin/ads', label: 'Kampanye', end: true },
  { to: '/admin/ads/packages', label: 'Paket' },
  { to: '/admin/ads/orders', label: 'Pesanan' },
  { to: '/admin/ads/payments', label: 'Pembayaran' },
];

export default function AdminAdsTabs() {
  return (
    <nav className="admin-ad-tabs" aria-label="Kelola iklan">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `admin-ad-tabs__link ${isActive ? 'is-active' : ''}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
