import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { updateOrderStatus, getOrderById } from '../services/firebase/firestoreHelpers';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [orderData, setOrderData] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(true);

  const { orderId, transactionData: passedTransactionData, paymentMethod } = location.state || {};

  useEffect(() => {
    const initializeOrderSuccess = async () => {
      if (!orderId) {
        // If no order state, check for URL parameters
        const urlParams = new URLSearchParams(location.search);
        const urlOrderId = urlParams.get('orderId');
        
        if (!urlOrderId) {
          toast.error('No order information found');
          navigate('/');
          return;
        }
      }

      try {
        // Fetch full order data
        const order = await getOrderById(orderId);
        if (!order) {
          toast.error('Order not found');
          navigate('/');
          return;
        }

        setOrderData(order);
        setTransactionData(passedTransactionData || order.transactionData);
        
        // Determine payment status
        if (order.paymentStatus === 'completed') {
          setPaymentStatus('completed');
        } else if (order.paymentStatus === 'initiated') {
          setPaymentStatus('pending');
        } else if (order.paymentStatus === 'failed') {
          setPaymentStatus('failed');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading order:', error);
        toast.error('Failed to load order information');
        setLoading(false);
      }
    };

    initializeOrderSuccess();
  }, [orderId, navigate, location.search]);

  // Real-time Firestore listener for order status changes (from webhooks)
  useEffect(() => {
    if (!orderId) return;

    console.log('🔄 Setting up real-time listener for order:', orderId);
    
    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const order = docSnapshot.data();
          console.log('📡 Order updated from Firestore:', { paymentStatus: order.paymentStatus, status: order.status });
          
          // Update order data
          setOrderData(order);
          
          // Update payment status based on paymentStatus or status field
          const newStatus = order.paymentStatus || order.status;
          if (newStatus === 'completed') {
            setPaymentStatus('completed');
            toast.success('✅ Payment successful!');
            // Clear saved session and restore cart state if needed
            try { localStorage.removeItem(`order_session_${orderId}`); } catch (e) {}
            try { const cartJson = localStorage.getItem('cart'); if (cartJson && cartJson !== '[]') { /* already has cart */ } } catch(e){}
            try { clearCart(); } catch (e) { console.warn('Could not clear cart on success:', e.message); }
          } else if (newStatus === 'initiated') {
            setPaymentStatus('pending');
          } else if (newStatus === 'failed') {
            setPaymentStatus('failed');
            toast.error('❌ Payment failed');
          } else if (newStatus === 'expired') {
            setPaymentStatus('expired');
            toast.warning('⏳ Payment window expired');
          }
        }
      },
      (error) => {
        console.error('Error listening to order updates:', error);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // Polling fallback to check payment status every 5 seconds
  // This helps when Firebase Admin webhook updates aren't configured
  useEffect(() => {
    if (!orderId || paymentStatus !== 'pending' || !orderData?.checkoutRequestID) return;

    console.log('⏱️ Setting up payment status polling...');
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/mpesa/payment-status/${orderData.checkoutRequestID}`);
        const result = await response.json();
        
        if (result.success && result.status === 'completed') {
          console.log('✅ Payment confirmed via polling - M-Pesa callback should handle status update');
          // DO NOT update order status here - M-Pesa callback handles it
          // Just update UI to show payment is completed
          setPaymentStatus('completed');
          toast.success('✅ Payment successful! Email confirmation being sent...');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.warn('Poll check error (non-critical):', error.message);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(pollInterval);
  }, [orderId, paymentStatus, orderData?.checkoutRequestID]);

  // Timer for M-Pesa payment window
  useEffect(() => {
    if (paymentStatus !== 'pending' || !transactionData) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handlePaymentExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, transactionData, orderId]);

  const handlePaymentExpired = async () => {
    try {
      await updateOrderStatus(orderId, {
        paymentStatus: 'expired',
        status: 'payment_expired',
        lastUpdated: new Date().toISOString()
      });
      
      setPaymentStatus('expired');
      toast.info('M-Pesa payment window has expired. You can try again.');
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleRetryPayment = () => {
    navigate('/checkout', {
      state: { orderId, retryPayment: true }
    });
  };

  const handleTryAlternativePayment = () => {
    navigate('/checkout', {
      state: { orderId, changePaymentMethod: true }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Status Section */}
        {paymentStatus === 'completed' && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-green-500">
            <div className="flex items-center mb-4">
              <FiCheckCircle className="text-4xl text-green-500 mr-4" />
              <h1 className="text-3xl font-bold text-gray-900">Payment Completed!</h1>
            </div>
            <p className="text-gray-600 text-lg">Your order has been placed and payment confirmed.</p>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <FiClock className="text-4xl text-blue-500 mr-4" />
              <h1 className="text-3xl font-bold text-gray-900">Payment Pending</h1>
            </div>
            <p className="text-gray-600 mb-6">We're waiting for you to enter your M-Pesa PIN...</p>
            
            {transactionData && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-lg font-semibold text-blue-900 mb-4">
                  Complete payment within: <strong className="text-xl">{formatTime(timeRemaining)}</strong>
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>📱 Phone: {transactionData.phone}</p>
                  <p>💰 Amount: {formatPrice(transactionData.amount)}</p>
                  <p>📦 Transaction ID: {transactionData.transactionId}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">What to do next:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Enter your M-Pesa PIN on your phone</li>
                <li>Confirm the payment</li>
                <li>You'll see a confirmation message</li>
              </ol>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <FiAlertCircle className="text-4xl text-red-500 mr-4" />
              <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
            </div>
            <p className="text-gray-600 mb-4">We couldn't process your M-Pesa payment.</p>
            
            {orderData?.paymentError && (
              <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-6">{orderData.paymentError}</p>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">What you can do:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Try the payment again</li>
                <li>✓ Use a different payment method</li>
                <li>✓ Check your M-Pesa balance</li>
                <li>✓ Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        )}

        {paymentStatus === 'expired' && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-yellow-500">
            <div className="flex items-center mb-4">
              <FiAlertCircle className="text-4xl text-yellow-500 mr-4" />
              <h1 className="text-3xl font-bold text-gray-900">Payment Window Expired</h1>
            </div>
            <p className="text-gray-600 mb-2">The M-Pesa payment window has expired (5 minutes timeout).</p>
            <p className="text-gray-600">Your order is still saved. You can try the payment again.</p>
          </div>
        )}

        {/* Order Summary */}
        {orderData && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
              <div>
                <p className="text-gray-600 text-sm">Order ID</p>
                <p className="text-gray-900 font-semibold">{orderId}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Order Date</p>
                <p className="text-gray-900 font-semibold">{new Date(orderData.orderDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Payment Method</p>
                <p className="text-gray-900 font-semibold">{paymentMethod === 'mpesa' ? 'M-Pesa' : orderData.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="text-gray-900 font-semibold text-lg">{formatPrice(orderData.total)}</p>
              </div>
            </div>

            {orderData.shippingInfo && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
                <p className="text-gray-700">{orderData.shippingInfo.fullName}</p>
                <p className="text-gray-700">{orderData.shippingInfo.address}</p>
                <p className="text-gray-700">{orderData.shippingInfo.city}, {orderData.shippingInfo.county} {orderData.shippingInfo.postalCode}</p>
                <p className="text-gray-700">📞 {orderData.shippingInfo.phone}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-8">
          {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
            <>
              <button 
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold flex items-center justify-center gap-2"
                onClick={handleRetryPayment}
              >
                <FiChevronRight /> Retry Payment
              </button>
              <button 
                className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                onClick={handleTryAlternativePayment}
              >
                Try Different Payment Method
              </button>
            </>
          )}

          {paymentStatus === 'completed' && (
            <>
              <button 
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
                onClick={() => navigate('/orders')}
              >
                View My Orders
              </button>
              <button 
                className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                onClick={() => navigate('/shop')}
              >
                Continue Shopping
              </button>
            </>
          )}

          {paymentStatus === 'pending' && (
            <>
              <button 
                className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                onClick={handleRetryPayment}
              >
                Resend M-Pesa Prompt
              </button>
              <button 
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
                onClick={handleTryAlternativePayment}
              >
                Try Different Payment Method
              </button>
            </>
          )}
        </div>

        {/* Support Section */}
        <div className="text-center text-gray-600">
          <p>📞 Need help? <a href="/support" className="text-orange-500 hover:underline">Contact our support team</a></p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
