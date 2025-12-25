import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiPackage, FiTruck, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { toast } from 'react-toastify';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, removeNotification } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const previousOrdersRef = useRef({});

  // Listen to order updates
  useEffect(() => {
    if (!user?.uid) {
      console.log('NotificationBell: No user logged in');
      return;
    }

    console.log('NotificationBell: Listening to orders for user:', user.uid);

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('userId', '==', user.uid),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = [];
        const currentOrders = {};

        snapshot.forEach((doc) => {
          const orderData = {
            id: doc.id,
            ...doc.data()
          };
          orders.push(orderData);
          currentOrders[doc.id] = orderData.status;

          // Check if this order status changed
          const previousStatus = previousOrdersRef.current[doc.id];
          console.log(`Order ${doc.id}:`, {
            currentStatus: orderData.status,
            previousStatus: previousStatus,
            changed: previousStatus && previousStatus !== orderData.status
          });

          if (previousStatus && previousStatus !== orderData.status) {
            // Order status changed - show toast notification
            console.log('STATUS CHANGED! Showing notification...');
            showOrderStatusNotification(orderData, orderData.status, previousStatus);
          } else if (!previousStatus) {
            // First time loading this order, don't show notification
            console.log('First time loading order:', doc.id);
          }
        });

        console.log('Total orders loaded:', orders.length);
        
        // Sort by createdAt on client side
        orders.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
          return dateB - dateA;
        });
        
        // Update the reference with current orders
        previousOrdersRef.current = currentOrders;
        
        setOrderNotifications(orders);
        
        // Calculate unread count (new orders not yet read)
        const unread = orders.filter(order => !readNotifications.has(order.id)).length;
        setUnreadCount(unread);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error listening to orders:', error);
    }
  }, [user?.uid]);

  const showOrderStatusNotification = (order, newStatus, previousStatus) => {
    const statusMessages = {
      pending: '⏳ Order placed',
      processing: '🔄 Order is being processed',
      shipped: '🚚 Order shipped',
      delivered: '✅ Order delivered',
      cancelled: '❌ Order cancelled',
      returned: '↩️ Order returned'
    };

    const message = statusMessages[newStatus?.toLowerCase()] || `Order status updated to ${newStatus}`;
    
    toast.info(
      <div>
        <p className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        <p>{message}</p>
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const markAsRead = (orderId) => {
    setReadNotifications(prev => {
      const updated = new Set(prev);
      updated.add(orderId);
      // Recalculate unread count
      const unread = orderNotifications.filter(order => !updated.has(order.id)).length;
      setUnreadCount(unread);
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allOrderIds = new Set(orderNotifications.map(order => order.id));
    setReadNotifications(allOrderIds);
    setUnreadCount(0);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'shipped':
        return <FiTruck className="text-blue-500" size={18} />;
      case 'delivered':
        return <FiCheck className="text-green-500" size={18} />;
      case 'cancelled':
        return <FiAlertCircle className="text-red-500" size={18} />;
      case 'returned':
        return <FiAlertCircle className="text-orange-500" size={18} />;
      case 'processing':
        return <FiPackage className="text-yellow-500" size={18} />;
      case 'pending':
        return <FiPackage className="text-gray-500" size={18} />;
      default:
        return <FiPackage size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'shipped':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'returned':
        return 'text-orange-600';
      case 'processing':
        return 'text-yellow-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  const totalNotifications = notifications.length + orderNotifications.length;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center hover:text-orange-500 transition"
        title="Notifications"
      >
        <FiBell size={24} />
        {totalNotifications > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition"
                  title="Mark all as read"
                >
                  ✓ All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y">
            {/* Order Notifications */}
            {orderNotifications.length > 0 ? (
              orderNotifications.map((order) => (
                <div
                  key={order.id}
                  onClick={() => markAsRead(order.id)}
                  className={`p-4 hover:bg-gray-50 transition border-l-4 border-orange-500 cursor-pointer ${
                    readNotifications.has(order.id) ? 'opacity-60' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-gray-800">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        {!readNotifications.has(order.id) && (
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className={`font-medium text-sm ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase()}
                      </p>
                      {order.items && (
                        <p className="text-xs text-gray-600 mt-1">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • KES {order.totalAmount?.toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FiBell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No order notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {orderNotifications.length > 0 && (
            <div className="border-t p-3 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/orders';
                }}
                className="w-full text-center text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                View All Orders →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
