import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './pages/Auth/Auth';
import DashboardLayout from './components/Layout/DashboardLayout';
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import DriverDashboard from './pages/Driver/DriverDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SeedData from './pages/SeedData';
import { Loader2 } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Event: ", currentUser?.uid ? `User ${currentUser.uid}` : "No User");

      if (currentUser) {
        setUser(currentUser);
        if (unsubscribeDoc) unsubscribeDoc();

        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setLoading(false);
          } else {
            console.log("No profile found for UID:", currentUser.uid);
            setUserData(null);
            // Don't hang indefinitely if doc doesn't exist
            setTimeout(() => setLoading(false), 3000);
          }
        }, (err) => {
          console.error("Profile Sync Error: ", err);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mb-4" size={48} />
          <p className="text-muted">Loading DriveTrust platform...</p>
        </div>
      </div>
    );
  }

  // Auth pages (Login/Signup/Seeding)
  if (!user) {
    return (
      <Routes>
        <Route path="/seed" element={<SeedData />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // Profile missing fallback
  if (!userData) {
    return (
      <div className="loader-container">
        <div className="card text-center p-8 max-w-md mx-auto animate-slide-up">
          <div className="bg-red-50 text-red-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Profile Missing</h2>
          <p className="text-muted mb-6">We couldn't load your profile. Please try logging in again or contact support.</p>
          <div className="flex gap-4 justify-center">
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
            <button className="btn btn-secondary" onClick={() => auth.signOut()}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role={userData.role} user={userData}>
      <Routes>
        {/* Customer Routes */}
        {userData.role === 'Customer' && (
          <Route path="/customer/*" element={<CustomerDashboard user={userData} />} />
        )}

        {/* Driver Routes */}
        {userData.role === 'Driver' && (
          <Route path="/driver/*" element={<DriverDashboard user={userData} />} />
        )}

        {/* Admin Routes */}
        {userData.role === 'Admin' && (
          <Route path="/admin/*" element={<AdminDashboard user={userData} />} />
        )}

        {/* Fallback Redirection */}
        <Route
          path="*"
          element={
            <Navigate to={userData.role === 'Driver' ? '/driver' : userData.role === 'Admin' ? '/admin' : '/customer'} replace />
          }
        />
      </Routes>
    </DashboardLayout>
  );
};

export default App;
