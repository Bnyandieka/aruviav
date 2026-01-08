import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { listenToVendorOrders, updateOrderStatus } from '../../../services/vendor/vendorService';
import { FiCheck, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './VendorOrders.css';

export default function VendorOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    if (user) {      // Set up real-time listener for orders
      const unsubscribe = listenToVendorOrders(user.uid, (updatedOrders) => {        setOrders(updatedOrders);
      });

      // Cleanup listener on unmount
      return () => {        unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus]);

  const handleRefresh = () => {    toast.info('Orders are updating in real-time. Last sync just now.');
  };

  const filterOrders = () => {
    if (filterStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === filterStatus));
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to confirm this order?')) {
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'confirmed', user.uid);
      toast.success('Order confirmed successfully');
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Error confirming order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, user.uid);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return colors[status] || 'status-pending';
  };

  return (
    <div className="vendor-orders-container">
      <div className="orders-header">
        <h2>My Orders</h2>
        <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading && !orders.length ? (
        <div className="loading-state">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FiAlertCircle size={48} />
          <p>
            {orders.length === 0
              ? 'No orders yet. Once customers purchase your products, they will appear here.'
              : `No ${filterStatus} orders found`}
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="label">Order #</span>
                  <span className="value">{order.id?.slice(0, 8)}</span>
                </div>
                <div className={`order-status ${getStatusColor(order.status)}`}>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </div>
              </div>

              <div className="order-body">
                <div className="order-info-row">
                  <span className="label">Customer:</span>
                  <span className="value">{order.customerName || 'Unknown'}</span>
                </div>

                <div className="order-info-row">
                  <span className="label">Order Date:</span>
                  <span className="value">{formatDate(order.createdAt)}</span>
                </div>

                <div className="order-info-row">
                  <span className="label">Total Amount:</span>
                  <span className="value highlight">KES {order.totalAmount?.toLocaleString()}</span>
                </div>

                <div className="order-items">
                  <span className="items-label">Items:</span>
                  <ul className="items-list">
                    {order.items?.map((item, index) => (
                      <li key={index}>
                        {item.name} x {item.quantity} = KES {(item.price * item.quantity).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>

                {order.shippingAddress && (
                  <div className="shipping-info">
                    <span className="label">Shipping To:</span>
                    <p className="address">{order.shippingAddress}</p>
                  </div>
                )}
              </div>

              <div className="order-actions">
                {order.status === 'pending' && (
                  <>
                    <button
                      className="btn-action btn-confirm"
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={updatingOrderId === order.id}
                    >
                      <FiCheck /> Confirm Order
                    </button>
                    <button
                      className="btn-action btn-reject"
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      disabled={updatingOrderId === order.id}
                    >
                      Reject
                    </button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <button
                    className="btn-action btn-process"
                    onClick={() => handleUpdateStatus(order.id, 'processing')}
                    disabled={updatingOrderId === order.id}
                  >
                    Mark as Processing
                  </button>
                )}

                {order.status === 'processing' && (
                  <button
                    className="btn-action btn-ship"
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    disabled={updatingOrderId === order.id}
                  >
                    Mark as Shipped
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    className="btn-action btn-complete"
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                    disabled={updatingOrderId === order.id}
                  >
                    Mark as Completed
                  </button>
                )}

                {updatingOrderId === order.id && (
                  <span className="updating-indicator">Updating...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="orders-summary">
        <div className="summary-card">
          <span className="label">Total Orders:</span>
          <span className="value">{orders.length}</span>
        </div>
        <div className="summary-card">
          <span className="label">Pending:</span>
          <span className="value">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
        <div className="summary-card">
          <span className="label">Total Revenue:</span>
          <span className="value">KES {orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
