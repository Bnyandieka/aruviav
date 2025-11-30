import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPackage, FiCheck, FiClock, FiEdit2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import Loader from '../components/common/Loader/Spinner';
import { updateOrderStatus } from '../services/firebase/firestoreHelpers';

export const OrdersPage = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Query orders for the current user
        const ordersRef = collection(db, 'orders');
        // Use only 'where' clause first without orderBy to avoid index requirements
        const q = query(
          ordersRef,
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const userOrders = [];
        
        querySnapshot.forEach((doc) => {
          userOrders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort on client side instead of using Firestore orderBy
        userOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
          return dateB - dateA;
        });
        
        setOrders(userOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(`Failed to load orders: ${err.message}`);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      // Update the order in local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      setUpdateMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
    } else {
      setUpdateMessage({ type: 'error', text: `Failed to update order: ${result.error}` });
    }
    
    setUpdatingOrder(null);
    setTimeout(() => setUpdateMessage(null), 3000);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Update Message */}
        {updateMessage && (
          <div className={`px-4 py-3 rounded-lg mb-6 border ${
            updateMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {updateMessage.text}
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Date not available'}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mt-3 md:mt-0">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 w-fit ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'shipped'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status === 'completed' && <FiCheck />}
                      {order.status === 'processing' && <FiClock />}
                      {order.status === 'shipped' && <FiPackage />}
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                          <span>
                            {item.name} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            KSh {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No items in this order</p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>KSh {(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Shipping:</span>
                    <span>KSh {(order.shipping || 0).toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-green-600">-KSh {(order.discount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-orange-600">
                      KSh {(order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <h5 className="font-semibold text-sm text-gray-900 mb-2">
                      Shipping Address
                    </h5>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                )}

                {/* Admin Status Management */}
                {isAdmin && (
                  <div className="pt-4 border-t">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiEdit2 /> Manage Order Status
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order.id, status)}
                          disabled={updatingOrder === order.id || order.status === status}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                            order.status === status
                              ? 'bg-gray-300 text-gray-600 cursor-default'
                              : updatingOrder === order.id
                              ? 'bg-gray-200 text-gray-500 cursor-wait'
                              : status === 'completed'
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : status === 'processing'
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : status === 'shipped'
                              ? 'bg-purple-500 hover:bg-purple-600 text-white'
                              : status === 'pending'
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              : status === 'returned'
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className={isAdmin ? 'pt-4 border-t mt-4' : ''}>
                  <Link
                    to={`/product/${order.items?.[0]?.id || ''}`}
                    className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    View Details <FiArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start shopping to create your first order
            </p>
            <Link
              to="/products"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
