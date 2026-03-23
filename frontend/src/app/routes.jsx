import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../auth/ProtectedLayout';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import DriverDashboard from './pages/Driver/DriverDashboard';
import TripsDashboard from './pages/Trips/TripsDashboard';
import AdminLayout from './pages/Admin/AdminLayout';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Customer Routes */}
      <Route element={<ProtectedLayout allowedRoles={['CUSTOMER']} />}>
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/trips" element={<TripsDashboard />} />
      </Route>

      {/* Driver Routes */}
      <Route element={<ProtectedLayout allowedRoles={['DRIVER']} />}>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/trips" element={<TripsDashboard />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
