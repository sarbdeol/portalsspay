import {
  Activity,
  Banknote,
  Gauge,
  Landmark,
  PlusCircle,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
} from 'lucide-react';

export const navigationByRole = {
  Admin: [
    { label: 'Dashboard', to: '/admin', icon: Gauge },
    { label: 'Agents', to: '/admin/agents', icon: UsersRound },
    { label: 'Merchants', to: '/admin/merchants', icon: Store },
    { label: 'Bank Accounts', to: '/admin/accounts', icon: Landmark },
    { label: 'Activity Logs', to: '/admin/activity', icon: Activity },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  Agent: [
    { label: 'Dashboard', to: '/agent', icon: Gauge },
    { label: 'Add Account', to: '/agent/accounts/new', icon: PlusCircle },
    { label: 'My Accounts', to: '/agent/accounts', icon: Banknote },
    { label: 'Profile', to: '/agent/profile', icon: UserRound },
    { label: 'Settings', to: '/agent/settings', icon: Settings },
  ],
  Merchant: [
    { label: 'Dashboard', to: '/merchant', icon: Gauge },
    { label: 'Assigned Accounts', to: '/merchant/accounts', icon: Landmark },
    { label: 'Profile', to: '/merchant/profile', icon: UserRound },
  ],
};
