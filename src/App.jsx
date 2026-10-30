import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PublicLayout from './components/public/PublicLayout';
import { AdminGuard, PublicOnly, RequireAuth } from './components/auth/guards';
import FatalError from './components/ui/FatalError';
import SplashScreen from './components/ui/SplashScreen';
import SupabaseConfigScreen from './components/ui/SupabaseConfigScreen';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { useTheme } from './hooks/useTheme';
import { isSupabaseConfigured } from './lib/supabase';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import { useAuthStore } from './stores/useAuthStore';

const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const AddTransactionPage = lazy(() => import('./pages/AddTransactionPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExportPage = lazy(() => import('./pages/ExportPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const MorePage = lazy(() => import('./pages/MorePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TransactionDetailPage = lazy(() => import('./pages/TransactionDetailPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/AdminUserDetailPage'));
const AdminAdsPage = lazy(() => import('./pages/admin/AdminAdsPage'));
const AdminAdPackagesPage = lazy(() => import('./pages/admin/AdminAdPackagesPage'));
const AdminAdOrdersPage = lazy(() => import('./pages/admin/AdminAdOrdersPage'));
const AdminAdPaymentsPage = lazy(() => import('./pages/admin/AdminAdPaymentsPage'));
const AdvertisePage = lazy(() => import('./pages/public/AdvertisePage'));
const AdvertiseStatusPage = lazy(() => import('./pages/public/AdvertiseStatusPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnly>
        <RegisterPage />
      </PublicOnly>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnly>
        <ForgotPasswordPage />
      </PublicOnly>
    ),
  },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  {
    path: '/advertise',
    element: <PublicLayout />,
    children: [
      { index: true, element: <AdvertisePage /> },
      { path: 'order', element: <AdvertiseStatusPage /> },
      { path: 'order/:token', element: <AdvertiseStatusPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'add', element: <AddTransactionPage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'transaction/:id', element: <TransactionDetailPage /> },
          { path: 'transaction/:id/edit', element: <AddTransactionPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'budget', element: <BudgetPage /> },
          { path: 'accounts', element: <AccountsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'export', element: <ExportPage /> },
          { path: 'more', element: <MorePage /> },
          {
            element: <AdminGuard />,
            children: [
              { path: 'admin', element: <AdminOverviewPage /> },
              { path: 'admin/users', element: <AdminUsersPage /> },
              { path: 'admin/users/:id', element: <AdminUserDetailPage /> },
              { path: 'admin/ads', element: <AdminAdsPage /> },
              { path: 'admin/ads/packages', element: <AdminAdPackagesPage /> },
              { path: 'admin/ads/orders', element: <AdminAdOrdersPage /> },
              { path: 'admin/ads/payments', element: <AdminAdPaymentsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

function isPublicRoute() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/privacy' || path === '/advertise' || path.startsWith('/advertise/');
}

export default function App() {
  const { status, error, retry } = useAppBootstrap();
  useTheme();
  const publicRoute = isPublicRoute();

  if (!isSupabaseConfigured) {
    return <SupabaseConfigScreen />;
  }

  if (!publicRoute && status === 'loading') {
    return <SplashScreen message="Menyiapkan akun dan data keuanganmu…" />;
  }

  if (!publicRoute && status === 'auth_error') {
    return (
      <FatalError
        title="Akun tidak dapat dibuka"
        message="Kami tidak dapat memuat profil akunmu. Periksa koneksi, lalu coba lagi."
        details={error}
        onRetry={retry}
        secondaryAction={{
          label: 'Keluar dari akun',
          onClick: () => void useAuthStore.getState().signOut(),
        }}
      />
    );
  }

  return <RouterProvider router={router} />;
}
