import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Auth from './pages/Auth/Auth';
import DashboardLayout from './components/Layout/DashboardLayout';
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import DriverDashboard from './pages/Driver/DriverDashboard';
import TripsDashboard from './pages/Trips/TripsDashboard';
import { Loader2 } from 'lucide-react';
import api from './services/api';
import { styles } from './utils/styles';

const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserData(user);
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = (user, access_token) => {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUserData(user);
    if (user.role === 'DRIVER') navigate('/driver');
    else navigate('/customer');
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUserData(null);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.common.pageContainer, alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 color={styles.colors.primary} size={48} className="animate-spin" />
        <p style={{ marginTop: '16px', color: styles.colors.secondary, fontWeight: 600 }}>Loading DriveTrust...</p>
      </div>
    );
  }

  // Unauthenticated routes
  if (!userData) {
    return (
      <Routes>
        <Route path="*" element={<Auth onLogin={handleLogin} />} />
      </Routes>
    );
  }

  return (
    <DashboardLayout role={userData.role} user={userData} onLogout={handleLogout}>
      <Routes>
        {/* Customer Routes */}
        {userData.role === 'CUSTOMER' && (
          <>
            <Route path="/customer" element={<CustomerDashboard user={userData} />} />
            <Route path="/customer/trips" element={<TripsDashboard user={userData} />} />
          </>
        )}

        {/* Driver Routes */}
        {userData.role === 'DRIVER' && (
          <>
            <Route path="/driver" element={<DriverDashboard user={userData} />} />
            <Route path="/driver/trips" element={<TripsDashboard user={userData} />} />
          </>
        )}

        {/* Fallback Redirection */}
        <Route
          path="*"
          element={
            <Navigate to={userData.role === 'DRIVER' ? '/driver' : '/customer'} replace />
          }
        />
      </Routes>
    </DashboardLayout>
  );
};

export default App;
