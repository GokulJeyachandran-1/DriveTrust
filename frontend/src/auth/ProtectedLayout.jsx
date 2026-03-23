import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth';
import DashboardLayout from '../app/components/Layout/DashboardLayout';

const ProtectedLayout = ({ allowedRoles }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Admin has its own layout, skip DashboardLayout
  if (user.role === 'ADMIN') {
    return <Outlet />;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedLayout;
