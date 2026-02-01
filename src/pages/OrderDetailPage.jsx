import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Loader from '../components/common/Loader/Spinner';
import '../styles/OrderDetail.css';

export const OrderDetailPage = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError('Order ID not provided');
          setLoading(false);
          return;
        }

        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = {
          id: orderSnap.id,
          ...orderSnap.data()
        };

        // Check if user owns this order
        if (orderData.userId !== user?.uid) {
          setError('You do not have permission to view this order');
          setLoading(false);
          return;
        }

        setOrder(orderData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user?.uid]);

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✓',
      processing: '⚙️',
      shipped: '📦',
      completed: '✅',
      cancelled: '❌',
      returned: '🔄'
    };
    return icons[status] || '•';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      processing: '#2196F3',
      shipped: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#F44336',
      returned: '#9C27B0'
    };
    return colors[status] || '#999';
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !order) {
    return (
      <div className="order-detail-error">
        <h2>Error</h2>
        <p>{error || 'Order not found'}</p>
        <button onClick={() => navigate('/orders')} className="btn-back">
          Back to Orders
        </button>
      </div>
    );
  }

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shippingCost = order.shippingInfo?.cost || 0;
  const total = order.total || (subtotal + shippingCost);

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <button onClick={() => navigate('/orders')} className="btn-back">
          ← Back to Orders
        </button>
        <h1>Order Details</h1>
      </div>

      <div className="order-detail-grid">
        {/* Order Info Card */}
        <div className="order-card order-info">
          <h3>Order Information</h3>
          <div className="info-row">
            <span className="label">Order Number:</span>
            <span className="value">{order.id}</span>
          </div>
          <div className="info-row">
            <span className="label">Order Date:</span>
            <span className="value">
              {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className="value status">
              <span style={{ color: getStatusColor(order.status), marginRight: '5px' }}>
                {getStatusIcon(order.status)}
              </span>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Payment Status:</span>
            <span className="value">
              {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
            </span>
          </div>
        </div>

        {/* Items Card */}
        <div className="order-card items-section">
          <h3>Items</h3>
          <div className="items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-sku">{item.sku}</span>
                </div>
                <div className="item-details">
                  <span className="quantity">Qty: {item.quantity}</span>
                  <span className="price">KES {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Info Card */}
        <div className="order-card shipping-section">
          <h3>Shipping Address</h3>
          {order.shippingInfo ? (
            <div className="shipping-details">
              <p><strong>{order.shippingInfo.name}</strong></p>
              <p>{order.shippingInfo.phone}</p>
              <p>{order.shippingInfo.county}</p>
              <p>{order.shippingInfo.address}</p>
              <p>{order.shippingInfo.postalCode}</p>
            </div>
          ) : (
            <p>No shipping information</p>
          )}
        </div>

        {/* Order Summary Card */}
        <div className="order-card summary-section">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>KES {shippingCost.toLocaleString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="order-timeline">
        <h3>Order Timeline</h3>
        <div className="timeline">
          {['pending', 'confirmed', 'processing', 'shipped', 'completed'].map((status) => (
            <div
              key={status}
              className={`timeline-item ${order.status === status || 
                (order.status === 'completed' && ['pending', 'confirmed', 'processing', 'shipped', 'completed'].indexOf(order.status) >= ['pending', 'confirmed', 'processing', 'shipped', 'completed'].indexOf(status))
                ? 'active' : ''}`}
            >
              <div className="timeline-marker" style={{ borderColor: getStatusColor(status) }}>
                {getStatusIcon(status)}
              </div>
              <span className="timeline-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
