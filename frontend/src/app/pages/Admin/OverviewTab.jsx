import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Truck, ShieldAlert, CreditCard, TrendingUp, Package, Loader2 } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getAdminDashboard } from '../../../api/adminService';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <motion.div whileHover={{ y: -4 }} style={{ ...styles.common.card, padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: styles.colors.textMain }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: styles.colors.secondary, marginTop: '4px' }}>{label}</div>
    </div>
  </motion.div>
);

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: styles.colors.textMain, margin: '0 0 8px' }}>Dashboard</h1>
        <p style={{ color: styles.colors.secondary, margin: 0, fontSize: '14px' }}>Platform overview and key metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="#6366F1" bg="#EEF2FF" />
        <StatCard icon={Package} label="Customers" value={stats?.totalCustomers || 0} color="#8B5CF6" bg="#F5F3FF" />
        <StatCard icon={Truck} label="Drivers" value={stats?.totalDrivers || 0} color="#0EA5E9" bg="#F0F9FF" />
        <StatCard icon={TrendingUp} label="Total Trips" value={stats?.totalTrips || 0} color="#10B981" bg="#ECFDF5" />
        <StatCard icon={Truck} label="Active Trips" value={stats?.activeTrips || 0} color="#F59E0B" bg="#FFFBEB" />
        <StatCard icon={ShieldAlert} label="Open SOS" value={stats?.openSos || 0} color="#EF4444" bg="#FEF2F2" />
        <StatCard icon={Users} label="Pending KYC" value={stats?.pendingKyc || 0} color="#F97316" bg="#FFF7ED" />
        <StatCard icon={CreditCard} label="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} color="#059669" bg="#ECFDF5" />
      </div>
    </div>
  );
};

export default OverviewTab;
