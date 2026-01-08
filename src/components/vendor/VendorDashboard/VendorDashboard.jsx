import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiBarChart2, FiLogOut, FiCalendar } from 'react-icons/fi';
import VendorProducts from '../VendorProducts/VendorProducts';
import VendorOrders from '../VendorOrders/VendorOrders';
import VendorAnalytics from '../VendorAnalytics/VendorAnalytics';
import VendorBookings from '../VendorBookings/VendorBookings';
import './VendorDashboard.css';
import { toast } from 'react-toastify';

export default function VendorDashboard() {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (!loading && (!user || !userData?.isVendor)) {
      toast.error('You must be an approved vendor to access this page');
      navigate('/');
    }
  }, [user, userData, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  if (loading) {
    return (
      <div className="vendor-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading vendor dashboard...</p>
      </div>
    );
  }

  if (!userData?.isVendor) {
    return (
      <div className="vendor-dashboard-error">
        <p>You are not authorized as a vendor</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard-container">
      {/* Sidebar */}
      <aside className="vendor-sidebar">
        <div className="sidebar-header">
          <h2>Vendor Dashboard</h2>
        </div>

        <div className="vendor-profile-card">
          <h3>{userData.businessName}</h3>
          <p className="vendor-email">{userData.email}</p>
          <p className="vendor-category">{userData.businessCategory}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FiPackage /> Products
          </button>
          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FiShoppingCart /> Orders
          </button>
          <button
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FiCalendar /> Bookings
          </button>
          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiBarChart2 /> Analytics
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="vendor-main-content">
        {activeTab === 'products' && <VendorProducts />}
        {activeTab === 'orders' && <VendorOrders />}
        {activeTab === 'bookings' && <VendorBookings />}
        {activeTab === 'analytics' && <VendorAnalytics />}
      </main>
    </div>
  );
}
