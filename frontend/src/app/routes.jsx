import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../auth/ProtectedLayout';

// Pages - updated paths
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import DriverDashboard from './pages/Driver/DriverDashboard';
import TripsDashboard from './pages/Trips/TripsDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Customer Routes */}
      <Route element={<ProtectedLayout allowedRoles={['CUSTOMER']} />}>
        <Route path="/customer" element={<CustomerDashboard />} />
      </Route>

      {/* Driver Routes */}
      <Route element={<ProtectedLayout allowedRoles={['DRIVER']} />}>
        <Route path="/driver" element={<DriverDashboard />} />
      </Route>

      {/* Shared Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/trips" element={<TripsDashboard />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
