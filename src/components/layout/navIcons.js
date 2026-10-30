import {
  ChartPie,
  Download,
  History,
  LayoutDashboard,
  Megaphone,
  MoreHorizontal,
  Plus,
  Settings,
  ShieldHalf,
  Tags,
  Target,
  Users,
  Wallet,
} from 'lucide-react';

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  history: History,
  reports: ChartPie,
  budget: Target,
  accounts: Wallet,
  categories: Tags,
  export: Download,
  settings: Settings,
  more: MoreHorizontal,
  add: Plus,
  admin: ShieldHalf,
  users: Users,
  megaphone: Megaphone,
};

export function getNavIcon(name) {
  return NAV_ICONS[name] || LayoutDashboard;
}
