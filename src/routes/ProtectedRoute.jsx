import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { roleHome } from '../constants/roles.js';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <Outlet />;
}
