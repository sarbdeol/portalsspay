import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './components/ui/Toast.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import ChangePassword from './pages/auth/ChangePassword.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Agents from './pages/admin/Agents.jsx';
import Merchants from './pages/admin/Merchants.jsx';
import BankAccounts from './pages/admin/BankAccounts.jsx';
import ActivityLogs from './pages/admin/ActivityLogs.jsx';
import Settings from './pages/shared/Settings.jsx';
import AgentDashboard from './pages/agent/AgentDashboard.jsx';
import AccountForm from './pages/agent/AccountForm.jsx';
import Profile from './pages/shared/Profile.jsx';
import MerchantDashboard from './pages/merchant/MerchantDashboard.jsx';
import AssignedAccounts from './pages/merchant/AssignedAccounts.jsx';
import KycUpload from './pages/public/KycUpload.jsx';

export default function App() {
  const location = useLocation();

  return (
    <ToastProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Public KYC upload page — accessed by anyone with the link */}
          <Route path="/kyc/:token" element={<KycUpload />} />

          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Agent', 'Merchant']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="agents" element={<Agents />} />
              <Route path="merchants" element={<Merchants />} />
              <Route path="accounts" element={<BankAccounts />} />
              <Route path="activity" element={<ActivityLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Agent']} />}>
            <Route path="/agent" element={<DashboardLayout />}>
              <Route index element={<AgentDashboard />} />
              <Route path="accounts/new" element={<AccountForm />} />
              <Route path="accounts" element={<BankAccounts scope="agent" />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Merchant']} />}>
            <Route path="/merchant" element={<DashboardLayout />}>
              <Route index element={<MerchantDashboard />} />
              <Route path="accounts" element={<AssignedAccounts />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </ToastProvider>
  );
}
