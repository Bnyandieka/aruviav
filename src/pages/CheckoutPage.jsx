// Location: src/pages/CheckoutPage.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCreditCard, FiPhone } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, updateOrderStatus, getOrderById } from '../services/firebase/firestoreHelpers';
import { sendOrderConfirmation } from '../services/email/emailAutomation';
import { initiateMpesaPayment, formatPhoneNumber, validateMpesaPaymentData } from '../services/payment/mpesaService';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart, restoreCart } = useCart();

  // Redirect if user is not authenticated
  React.useEffect(() => {
    if (user === null) {
      toast.error('Please log in to checkout');
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Handle retry payment scenario
  const retryOrderId = location.state?.orderId;
  const isRetryPayment = location.state?.retryPayment || false;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  const [existingOrderId, setExistingOrderId] = useState(retryOrderId || null);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    county: '',
    postalCode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('mpesa');

  // When retrying, load the existing order details
  React.useEffect(() => {
    if (isRetryPayment && retryOrderId) {
      const loadRetryOrder = async () => {
        try {
          const { order } = await getOrderById(retryOrderId);
          if (order) {
            // Restore shipping info and payment details from the failed order
            setShippingInfo(order.shippingInfo || {
              fullName: '',
              email: user?.email || '',
              phone: '',
              address: '',
              city: '',
              county: '',
              postalCode: ''
            });
            setPaymentMethod(order.paymentMethod || 'mpesa');
            setExistingOrderId(retryOrderId);
              // Restore cart items from order into cart context
              if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                restoreCart(order.items);
                console.log('🔄 Cart restored from failed order items:', order.items.length, 'items');
              } else {
                console.warn('⚠️ No items found in order for restore:', order);
              }
            
            console.log('🔄 Loaded order details for retry:', retryOrderId, 'with', order.items?.length || 0, 'items');
            toast.info('Order loaded. You can now retry the payment.');
          }
          else {
            // Try restoring from localStorage fallback
            try {
              const sessionKey = `order_session_${retryOrderId}`;
              const raw = localStorage.getItem(sessionKey);
              if (raw) {
                const sess = JSON.parse(raw);
                if (sess.shippingInfo) setShippingInfo(sess.shippingInfo);
                if (sess.paymentMethod) setPaymentMethod(sess.paymentMethod);
                if (sess.cartItems) {
                  restoreCart(sess.cartItems);
                  console.log('🔄 Cart restored from localStorage:', sess.cartItems.length, 'items');
                }
                console.log('🔄 Restored order session from localStorage:', sessionKey);
                toast.info('Restored previous order session. You can retry payment.');
              }
            } catch (e) {
              console.warn('No local session found for retry:', e.message);
            }
          }
        } catch (error) {
          console.error('Error loading order for retry:', error);
          toast.error('Failed to load order details');
        }
      };
      
      loadRetryOrder();
    }
  }, [isRetryPayment, retryOrderId, user]);

  // All deliveries are free
  const shippingFee = 0;
  // Total is computed dynamically to ensure it updates when cartTotal changes (e.g., after restoreCart)
  const total = cartTotal + shippingFee;

  // Debug: Log cart state when it changes
  React.useEffect(() => {
    if (isRetryPayment) {
      console.log('🛒 [RETRY] Current cart items:', cartItems.length, 'items', 'Total:', total);
    }
  }, [cartItems, total, isRetryPayment]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  const validateShippingInfo = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'county'];
    for (const field of required) {
      if (!shippingInfo[field]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  /**
   * Handle M-Pesa payment
   * Initiates STK Push when user chooses M-Pesa at checkout
   */
  const handleMpesaPayment = async (orderId) => {
    try {
      setMpesaLoading(true);

      // Validate M-Pesa payment data
      const phoneNumber = shippingInfo.phone;
      const paymentData = {
        phoneNumber,
        amount: total,
        orderId,
        accountReference: `ARUVIAH-${orderId}`,
        description: `Aruviah Order #${orderId}`
      };

      const validation = validateMpesaPaymentData(paymentData);
      if (!validation.valid) {
        toast.error(validation.error);
        setMpesaLoading(false);
        return { success: false, error: validation.error };
      }

      // Format phone number to M-Pesa format
      const formattedPhone = formatPhoneNumber(phoneNumber);
      toast.info('📱 Sending M-Pesa prompt to your phone...', { autoClose: false });

      // Call backend to initiate M-Pesa STK Push
      const result = await initiateMpesaPayment({
        ...paymentData,
        phoneNumber: formattedPhone
      });

      if (result.success) {
        // Store transaction details
        const transactionData = {
          transactionId: result.transactionId,
          checkoutRequestID: result.checkoutRequestID,
          orderId: orderId,
          amount: total,
          phone: formattedPhone,
          status: 'pending',
          timestamp: new Date().toISOString(),
          message: result.message
        };

        // Update order with transaction details
        try {
          await updateOrderStatus(orderId, {
            paymentStatus: 'initiated',
            transactionId: result.transactionId,
            checkoutRequestID: result.checkoutRequestID,
            transactionData: transactionData,
            lastUpdated: new Date().toISOString()
          });
        } catch (updateError) {
          console.warn('Failed to update order with transaction data:', updateError);
        }

        setMpesaCheckoutId(result.checkoutRequestID);
        
        toast.success('✅ M-Pesa prompt sent! Please enter your PIN on your phone.', {
          autoClose: 5000
        });

        return { success: true, data: transactionData };
      } else {
        console.error('❌ STK Push failed:', result.error);
        toast.error(`Payment failed: ${result.error || 'Unable to process M-Pesa payment'}`);
        
        // Update order status as payment failed
        try {
          await updateOrderStatus(orderId, {
            paymentStatus: 'failed',
            paymentError: result.error,
            lastUpdated: new Date().toISOString()
          });
        } catch (updateError) {
          console.warn('Failed to update order status:', updateError);
        }

        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      toast.error('Payment error. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setMpesaLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateShippingInfo()) return;
    
    setLoading(true);
    
    try {
      let orderId;
      let isRetry = false;
      
      // If retrying a failed payment, use the existing order
      if (existingOrderId && isRetryPayment) {
        orderId = existingOrderId;
        isRetry = true;
        console.log('🔄 Retrying payment for order:', orderId);
        
        // Update order with latest shipping info for retry
        await updateOrderStatus(orderId, {
          shippingInfo,
          paymentMethod,
          status: 'payment_pending',
          paymentStatus: 'pending',
          lastUpdated: new Date().toISOString()
        });
        
        toast.info('📱 Retrying payment for order ' + orderId);
      } else {
        // Create new order
        const orderData = {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Customer',
          userPhone: shippingInfo.phone,
          invoiceNumber: `INV-${Date.now()}-${user.uid.slice(0, 8).toUpperCase()}`,
          items: cartItems,
          shippingInfo,
          paymentMethod,
          subtotal: cartTotal,
          total,
          totalAmount: total,
          status: paymentMethod === 'cod' ? 'pending' : 'payment_pending',
          paymentStatus: 'pending',
          orderDate: new Date().toISOString()
        };

        const { orderId: newOrderId, error } = await createOrder(orderData);
        
        if (error) {
          toast.error('Failed to create order');
          setLoading(false);
          return;
        }
        
        orderId = newOrderId;
        // Persist session info for retry fallback (cart, shipping, payment)
        try {
          const sessionKey = `order_session_${orderId}`;
          const session = {
            cartItems,
            shippingInfo,
            paymentMethod,
            total
          };
          localStorage.setItem(sessionKey, JSON.stringify(session));
          console.log('💾 Saved order session for retry:', sessionKey);
        } catch (err) {
          console.warn('Could not save order session:', err.message);
        }
      }

      // Handle M-Pesa payment
      if (paymentMethod === 'mpesa') {
        const paymentResponse = await handleMpesaPayment(orderId);
        
        if (!paymentResponse.success) {
          // Update order status to failed
          await updateOrderStatus(orderId, {
            status: 'payment_failed',
            paymentStatus: 'failed',
            paymentError: paymentResponse.error,
            lastUpdated: new Date().toISOString()
          });
          
          toast.warning('⚠️ Payment initiation failed. Please try again or use another payment method.', {
            autoClose: 5000
          });
          setLoading(false);
          return;
        }

        // Payment initiated successfully - update order status
        await updateOrderStatus(orderId, {
          status: 'payment_processing',
          paymentStatus: 'initiated',
          lastUpdated: new Date().toISOString()
        });

        // Only clear cart on NEW orders, not on retries
        if (!isRetry) {
          clearCart();
        }
        
        // Redirect to payment confirmation page
        toast.success('✅ Order placed! Waiting for M-Pesa confirmation...', {
          autoClose: 5000
        });
        
        navigate(`/order-success`, {
          state: {
            orderId,
            transactionData: paymentResponse.data,
            paymentMethod: 'mpesa'
          }
        });
        setLoading(false);
        return;
      }

      // For COD and Card, send confirmation email
      const emailOrderData = {
        id: orderId,
        items: cartItems,
        total: total,
        createdAt: new Date().toISOString()
      };
      
      await sendOrderConfirmation(user.email, emailOrderData);

      // Clear cart
      await clearCart();
      
      // Redirect to success page
      navigate(`/order-success?orderId=${orderId}`);
      toast.success('Order placed successfully! Check your email for confirmation.');
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Shipping' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Review' }
  ];

  return (
    <div className="checkout-page bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Breadcrumb items={[{ label: 'Checkout' }]} />

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step.number
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className="mt-2 text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="0712 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="Street address, building, apartment"
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="Nairobi"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">County *</label>
                      <input
                        type="text"
                        name="county"
                        value={shippingInfo.county}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="Nairobi"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="00100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (validateShippingInfo()) setCurrentStep(2);
                  }}
                  className="mt-6 w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Payment Method</h2>

                <div className="space-y-3 sm:space-y-4">
                  {/* M-Pesa */}
                  <label className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'mpesa' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="mpesa"
                      checked={paymentMethod === 'mpesa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 mr-3 sm:mr-4 flex-shrink-0 cursor-pointer"
                    />
                    <FiPhone className="text-green-600 text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm sm:text-base">M-Pesa 🚀 Recommended</div>
                      <div className="text-xs sm:text-sm text-gray-600">Fast & Secure - Instant payment via M-Pesa STK Push</div>
                      <div className="text-xs text-green-600 mt-1">✓ Instant STK prompt to your phone</div>
                    </div>
                  </label>

                  {/* Card Payment */}
                  <label className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 mr-3 sm:mr-4 flex-shrink-0 cursor-pointer"
                    />
                    <FiCreditCard className="text-blue-600 text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm sm:text-base">Credit/Debit Card</div>
                      <div className="text-xs sm:text-sm text-gray-600">Pay securely with your card</div>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 mr-3 sm:mr-4 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">💵</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm sm:text-base">Cash on Delivery</div>
                      <div className="text-xs sm:text-sm text-gray-600">Pay when you receive your order</div>
                    </div>
                  </label>
                </div>

                {/* M-Pesa Info Box */}
                {paymentMethod === 'mpesa' && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">📱 How M-Pesa Payment Works:</h4>
                    <ul className="text-xs sm:text-sm text-green-800 space-y-1 list-disc list-inside">
                      <li>Click "Place Order" to proceed</li>
                      <li>You'll receive an M-Pesa STK prompt on <strong>{shippingInfo.phone}</strong></li>
                      <li>Enter your M-Pesa PIN to complete payment</li>
                      <li>Order will be confirmed immediately after payment</li>
                      <li>Check your email for order details</li>
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border-2 border-gray-300 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:border-orange-500 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-orange-500 text-white py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-orange-600 transition"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                {/* Shipping Info Review */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{shippingInfo.fullName}</p>
                    <p className="text-gray-600">{shippingInfo.address}</p>
                    <p className="text-gray-600">
                      {shippingInfo.city}, {shippingInfo.county} {shippingInfo.postalCode}
                    </p>
                    <p className="text-gray-600">{shippingInfo.phone}</p>
                    <p className="text-gray-600">{shippingInfo.email}</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-orange-500 text-sm mt-2 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* Payment Method Review */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Payment Method</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="capitalize font-semibold">
                      {paymentMethod === 'mpesa' && '📱 M-Pesa'}
                      {paymentMethod === 'card' && '💳 Credit/Debit Card'}
                      {paymentMethod === 'cod' && '💵 Cash on Delivery'}
                    </p>
                    {paymentMethod === 'mpesa' && (
                      <p className="text-sm text-gray-600 mt-1">
                        ✓ STK prompt will be sent to <strong>{shippingInfo.phone}</strong>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-orange-500 text-sm mt-2 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                        <img
                          src={item.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:border-orange-500 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || mpesaLoading}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || mpesaLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {paymentMethod === 'mpesa' ? 'Processing M-Pesa Payment...' : 'Placing Order...'}
                      </span>
                    ) : (
                      `Place Order (${paymentMethod === 'mpesa' ? 'M-Pesa Payment' : 'Pay at Checkout'})`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">
                    {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-orange-500">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="text-gray-600 mb-2">🔒 Secure Checkout</p>
                <p className="text-gray-600">Your payment information is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;