export const APP_NAME = 'CatatKas';
export const APP_VERSION = '2.0.0';
export const APP_TAGLINE = 'Catat keuanganmu, kendalikan hidupmu.';
export const DATABASE_NAME = 'CatatKasCacheDB';
export const LEGACY_DATABASE_NAME = 'CatatKasDB';
export const BACKUP_VERSION = '2.0.0';

export const CHART_FALLBACK_COLORS = [
  '#6366f1',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#94a3b8',
];

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const TYPE_LABELS = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
};

export const TYPE_OPTIONS = [
  { value: 'all', label: 'Semua jenis' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
];

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  currency: 'IDR',
  currencySymbol: 'Rp',
  defaultAccountId: null,
  language: 'id',
  firstDayOfWeek: 1,
  isFirstLaunch: true,
  lastBackupDate: null,
  budgetAlertThreshold: 80,
};

export const NAV_ITEMS = [
  { to: '/', label: 'Beranda', icon: 'dashboard', end: true },
  { to: '/history', label: 'Riwayat', icon: 'history' },
  { to: '/reports', label: 'Laporan', icon: 'reports' },
  { to: '/budget', label: 'Budget', icon: 'budget' },
  { to: '/accounts', label: 'Akun', icon: 'accounts' },
  { to: '/categories', label: 'Kategori', icon: 'categories' },
  { to: '/export', label: 'Ekspor', icon: 'export' },
  { to: '/settings', label: 'Pengaturan', icon: 'settings' },
];

export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Ringkasan Admin', icon: 'admin', end: true },
  { to: '/admin/users', label: 'Pengguna', icon: 'users' },
  { to: '/admin/ads', label: 'Iklan', icon: 'megaphone' },
];

export const MORE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['/budget', '/accounts', '/categories', '/export', '/settings'].includes(item.to),
);

export const AD_PLACEMENTS = [
  { value: 'dashboard', label: 'Beranda' },
  { value: 'history', label: 'Riwayat' },
  { value: 'reports', label: 'Laporan' },
  { value: 'more', label: 'Menu Lainnya' },
];

export const AD_PROVIDERS = [
  { value: 'sponsor', label: 'Sponsor / gambar' },
  { value: 'adsense', label: 'Google AdSense' },
];

export const AD_ORDER_STATUSES = [
  { value: 'awaiting_payment', label: 'Menunggu pembayaran', tone: 'warning' },
  { value: 'awaiting_review', label: 'Menunggu verifikasi', tone: 'info' },
  { value: 'approved', label: 'Disetujui', tone: 'success' },
  { value: 'rejected', label: 'Ditolak', tone: 'danger' },
  { value: 'expired', label: 'Kedaluwarsa', tone: 'neutral' },
  { value: 'cancelled', label: 'Dibatalkan', tone: 'neutral' },
];

export const AD_PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Transfer bank' },
  { value: 'qris', label: 'QRIS' },
];

export const THEME_OPTIONS = [
  { value: 'light', label: 'Terang', description: 'Tampilan cerah', icon: 'sun' },
  { value: 'dark', label: 'Gelap', description: 'Nyaman di malam hari', icon: 'moon' },
  { value: 'system', label: 'Sistem', description: 'Ikuti perangkat', icon: 'monitor' },
];

export const EMOJI_OPTIONS = [
  '🍔',
  '🍜',
  '☕',
  '🛒',
  '🚗',
  '⛽',
  '🚌',
  '🏠',
  '💡',
  '💊',
  '🎓',
  '🎮',
  '👔',
  '📱',
  '💼',
  '💰',
  '🎁',
  '📈',
  '🔄',
  '🏦',
  '💵',
  '💳',
  '✈️',
  '🐾',
  '📦',
  '🎵',
  '⚽',
  '❤️',
];

export const COLOR_OPTIONS = [
  '#6366f1',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#94a3b8',
];

export const PAGE_TITLES = {
  '/': 'Beranda',
  '/add': 'Tambah Transaksi',
  '/history': 'Riwayat Transaksi',
  '/reports': 'Laporan',
  '/budget': 'Budget',
  '/accounts': 'Akun & Dompet',
  '/categories': 'Kategori',
  '/settings': 'Pengaturan',
  '/export': 'Ekspor & Impor',
  '/admin': 'Ringkasan Admin',
  '/admin/users': 'Pengguna',
  '/admin/ads': 'Kelola Iklan',
  '/admin/ads/packages': 'Paket Iklan',
  '/admin/ads/orders': 'Pesanan Iklan',
  '/admin/ads/payments': 'Pembayaran Iklan',
  '/advertise': 'Pasang Iklan',
};

export const DATE_FILTER_PRESETS = [
  { label: 'Bulan ini', value: 'this-month' },
  { label: '30 hari', value: 'last-30' },
  { label: 'Tahun ini', value: 'this-year' },
  { label: 'Semua', value: 'all' },
];
