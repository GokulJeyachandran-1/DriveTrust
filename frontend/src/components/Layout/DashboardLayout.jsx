import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import './Layout.css';
import {
  LayoutDashboard,
  Truck,
  Map as MapIcon,
  History,
  Star,
  Settings,
  Bell,
  UserCircle,
  LogOut,
  ChevronRight,
  Users
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    className={`sidebar-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <div className="item-icon-wrapper">
      <Icon size={20} />
    </div>
    <span>{label}</span>
    {active && <ChevronRight size={16} className="active-indicator" />}
  </div>
);

const Navbar = ({ role = "Customer", user }) => (
  <nav className="navbar">
    <div className="navbar-logo">
      <div className="logo-badge">
        <Truck className="logo-icon" size={24} />
      </div>
      <span className="logo-text">Drive<span className="text-primary">Trust</span></span>
    </div>

    <div className="navbar-actions">
      <div className="notification-bell">
        <Bell size={20} />
        <span className="bell-dot"></span>
      </div>
      <div className="nav-profile">
        <div className="profile-info">
          <div className="flex items-center gap-2">
            <span className="profile-name">{user?.name || "User"}</span>
            {user?.rating && (
              <span className="inline-flex items-center text-xs font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded shadow-sm" title="Your Rating">
                <Star size={12} className="mr-1 fill-current" />
                {user.rating}
              </span>
            )}
          </div>
          <span className="profile-role-badge">{role}</span>
        </div>
        <div className="profile-avatar">
          <UserCircle size={32} />
        </div>
      </div>
    </div>
  </nav>
);

const Sidebar = ({ role = "Customer" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const customerItems = [
    { id: 'find', path: '/customer/find', icon: MapIcon, label: 'Find Drivers' },
    { id: 'active', path: '/customer/active', icon: Truck, label: 'Active Trips' },
    { id: 'ratings', path: '/customer/ratings', icon: Star, label: 'Ratings' }
  ];

  const driverItems = [
    { id: 'dashboard', path: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'trips', path: '/driver/trips', icon: History, label: 'Trips' },
    { id: 'active', path: '/driver/active', icon: Truck, label: 'Active Trip' },
    { id: 'ratings', path: '/driver/ratings', icon: Star, label: 'Ratings' }
  ];

  const adminItems = [
    { id: 'drivers', path: '/admin/drivers', icon: Users, label: 'Drivers' },
    { id: 'trips', path: '/admin/trips', icon: History, label: 'View Trips' }
  ];

  const items = role === 'Driver' ? driverItems : role === 'Admin' ? adminItems : customerItems;
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="sidebar-group">
          <p className="sidebar-label">PAGES</p>
          {items.map((item) => {
            // Check if current path starts with item path, default to first item if just root
            const isActive = currentPath === item.path || (currentPath === `/${role.toLowerCase()}` && item.id === items[0].id);
            return (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={isActive}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleSignOut}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const DashboardLayout = ({ children, role = "Customer", user }) => {
  const location = useLocation();
  // Derive title from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  let activePageName = pathParts.length > 1 ? pathParts[1] : (role === "Driver" ? "dashboard" : role === "Admin" ? "drivers" : "find drivers");
  activePageName = activePageName.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="layout-container">
      <Navbar role={role} user={user} />
      <div className="layout-body">
        <Sidebar role={role} />
        <main className="main-content">
          <div className="content-header">
            <h2 className="page-title">{activePageName}</h2>
            <div className="breadcrumb">Pages / {activePageName}</div>
          </div>
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
