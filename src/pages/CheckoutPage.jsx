// Location: src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCreditCard, FiPhone } from 'react-icons/fi';
import { FaPaypal, FaMobileAlt } from 'react-icons/fa';
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
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.0078); // Default fallback rate

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

  const formatPriceUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Fetch real-time exchange rate on component mount
  React.useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const resp = await fetch('https://api.exchangerate-api.com/v4/latest/KES');
        const data = await resp.json();
        const rateToUSD = data.rates?.USD || 0.0078;
        setExchangeRate(rateToUSD);
        console.log(`📊 KES to USD rate: 1 KES = ${rateToUSD} USD`);
      } catch (error) {
        console.warn('Failed to fetch exchange rate, using fallback:', error);
        // Fallback to default rate if API fails
        setExchangeRate(0.0078);
      }
    };
    fetchExchangeRate();
  }, []);

  // Check if user is in Kenya based on phone number
  const isKenyanUser = () => {
    const phone = shippingInfo.phone || '';
    return phone.startsWith('0') || phone.startsWith('+254') || phone.startsWith('254');
  };

  /**
   * Handle Stripe card payment
   */
  const handleStripePayment = async (orderId, amountInCents) => {
    try {
      setCardLoading(true);
      if (!window.Stripe) {
        toast.error('Stripe not loaded. Please try again.');
        return { success: false, error: 'Stripe SDK not loaded' };
      }

      const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
      
      // Create card element
      const elements = stripe.elements();
      const cardElement = elements.create('card');
      const cardContainer = document.getElementById('card-element');
      if (!cardContainer) {
        toast.error('Card form not found');
        return { success: false, error: 'Card form not initialized' };
      }
      cardElement.mount(cardContainer);

      // Create payment intent on backend with USD amount
      const intentResp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/payments/stripe/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents, orderId })
      });
      const intentData = await intentResp.json();
      if (!intentData.clientSecret) {
        throw new Error(intentData.error || 'Failed to create payment intent');
      }

      // Confirm card payment
      const confirmResp = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone,
            address: { line1: shippingInfo.address, city: shippingInfo.city, postal_code: shippingInfo.postalCode }
          }
        }
      });

      if (confirmResp.error) {
        throw new Error(confirmResp.error.message);
      }

      if (confirmResp.paymentIntent.status === 'succeeded') {
        return { success: true, data: confirmResp.paymentIntent };
      } else {
        throw new Error(`Payment status: ${confirmResp.paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(`Card payment failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setCardLoading(false);
    }
  };

  // Load Stripe SDK when card payment is selected
  React.useEffect(() => {
    if (paymentMethod !== 'card') return;

    if (!window.Stripe && process.env.REACT_APP_STRIPE_PUBLIC_KEY) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => setStripeLoaded(true);
      script.onerror = () => toast.error('Failed to load Stripe SDK');
      document.body.appendChild(script);
    } else if (window.Stripe) {
      setStripeLoaded(true);
    }
  }, [paymentMethod]);

  // Render PayPal Buttons when user selects PayPal
  React.useEffect(() => {
    if (paymentMethod !== 'paypal') return;

    const renderPaypalButtons = () => {
      if (!window.paypal) return;

      // Remove existing buttons if re-rendering
      const container = document.getElementById('paypal-button-container');
      if (!container) return;
      container.innerHTML = '';

      const amountInUSD = (total * exchangeRate).toFixed(2);

      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
        createOrder: async () => {
          const resp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/payments/paypal/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountInUSD })
          });
          const data = await resp.json();
          return data.orderID;
        },
        onApprove: async (data) => {
          try {
            setLoading(true);
            const resp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/payments/paypal/capture`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID })
            });
            const capture = await resp.json();

            // Check capture status - PayPal capture details vary; check for completed capture
            const captureStatus = (capture.status || capture.purchase_units?.[0]?.payments?.captures?.[0]?.status) || '';
            if (captureStatus === 'COMPLETED' || captureStatus === 'completed' || capture.status === 'COMPLETED') {
              // Create the order in Firestore and record transaction
              const orderData = {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'Customer',
                userPhone: shippingInfo.phone,
                invoiceNumber: `INV-${Date.now()}-${user.uid.slice(0, 8).toUpperCase()}`,
                items: cartItems,
                shippingInfo,
                paymentMethod: 'paypal',
                subtotal: cartTotal,
                total,
                totalAmount: total,
                status: 'completed',
                paymentStatus: 'success',
                orderDate: new Date().toISOString(),
                transactionData: capture
              };

              const { orderId: newOrderId, error } = await createOrder(orderData);
              if (!error) {
                await clearCart();
                navigate(`/order-success`, {
                  state: { orderId: newOrderId, paymentMethod: 'paypal', transactionData: capture }
                });
                toast.success('Payment successful — order completed');
              } else {
                console.error('Failed to save order after PayPal capture', error);
                toast.error('Payment succeeded but we failed to save the order. Contact support.');
              }
            } else {
              console.error('PayPal capture not completed', capture);
              toast.error('PayPal payment was not completed.');
            }
          } catch (err) {
            console.error('PayPal onApprove error', err);
            toast.error('PayPal error occurred');
          } finally {
            setLoading(false);
          }
        },
        onError: (err) => {
          console.error('PayPal Buttons error', err);
          toast.error('PayPal error. Please try another payment method.');
        }
      }).render('#paypal-button-container');
    };

    // Load PayPal SDK if not already loaded
    if (!window.paypal) {
      const script = document.createElement('script');
      const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || '';
      const currency = process.env.REACT_APP_PAYPAL_CURRENCY || 'USD';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
      script.async = true;
      script.onload = renderPaypalButtons;
      script.onerror = () => toast.error('Failed to load PayPal SDK');
      document.body.appendChild(script);
    } else {
      renderPaypalButtons();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, total]);

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

      // Handle Stripe card payment
      if (paymentMethod === 'card') {
        const amountInUSD = Math.round(total * exchangeRate * 100); // Convert to cents
        const paymentResponse = await handleStripePayment(orderId, amountInUSD);
        
        if (!paymentResponse.success) {
          await updateOrderStatus(orderId, {
            status: 'payment_failed',
            paymentStatus: 'failed',
            paymentError: paymentResponse.error,
            lastUpdated: new Date().toISOString()
          });
          
          toast.warning('⚠️ Card payment failed. Please try again.', { autoClose: 5000 });
          setLoading(false);
          return;
        }

        // Card payment successful
        await updateOrderStatus(orderId, {
          status: 'completed',
          paymentStatus: 'success',
          transactionData: paymentResponse.data,
          lastUpdated: new Date().toISOString()
        });

        clearCart();
        navigate(`/order-success`, {
          state: { orderId, transactionData: paymentResponse.data, paymentMethod: 'card' }
        });
        toast.success('✅ Payment successful! Order confirmed.');
        setLoading(false);
        return;
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
    <div className="checkout-page min-h-screen bg-gray-50">
      {/* Top padding for mobile */}
      <div className="pt-4 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Breadcrumb items={[{ label: 'Checkout' }]} />
            <h1 className="text-3xl font-bold mt-2">Checkout</h1>
          </div>

          {/* Mobile Order Summary */}
          <div className="lg:hidden mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-orange-500">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-center items-center">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        currentStep >= step.number
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span className="mt-2 text-sm font-medium text-gray-700">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-colors ${
                        currentStep > step.number ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0712 345 678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Street address, building, apartment"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Nairobi"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">County *</label>
                        <input
                          type="text"
                          name="county"
                          value={shippingInfo.county}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Nairobi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="00100"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (validateShippingInfo()) setCurrentStep(2);
                    }}
                    className="mt-8 w-full bg-orange-500 text-white py-4 rounded-lg font-semibold text-base hover:bg-orange-600 transition-colors shadow-md"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 2 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* M-Pesa */}
                    <label className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'mpesa' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="mpesa"
                        checked={paymentMethod === 'mpesa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 mr-4 flex-shrink-0 cursor-pointer accent-orange-500"
                      />
                      <FaMobileAlt className="text-green-600 text-2xl mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">M-Pesa</div>
                        <div className="text-sm text-gray-600">Fast & Secure</div>
                      </div>
                    </label>

                    {/* Card Payment */}
                    <label className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 mr-4 flex-shrink-0 cursor-pointer accent-orange-500"
                      />
                      <FiCreditCard className="text-blue-600 text-2xl mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Card</div>
                        <div className="text-sm text-gray-600">Secure with Stripe</div>
                      </div>
                    </label>

                    {/* PayPal */}
                    <label className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'paypal' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 mr-4 flex-shrink-0 cursor-pointer accent-orange-500"
                      />
                      <FaPaypal className="text-blue-600 text-2xl mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">PayPal</div>
                        <div className="text-sm text-gray-600">Fast and secure</div>
                      </div>
                    </label>

                    {/* Cash on Delivery - Only for Kenya */}
                    {isKenyanUser() && (
                    <label className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 mr-4 flex-shrink-0 cursor-pointer accent-orange-500"
                      />
                      <span className="text-2xl mr-3 flex-shrink-0">💵</span>
                      <div>
                        <div className="font-semibold">Cash on Delivery</div>
                        <div className="text-sm text-gray-600">Pay when delivered</div>
                      </div>
                    </label>
                    )}
                  </div>

                  {/* Stripe Card Form */}
                  {paymentMethod === 'card' && (
                    <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-3">💳 Enter Card Details</h4>
                      <p className="text-sm text-gray-600 mb-4">Amount in USD: <strong>{formatPriceUSD(total * exchangeRate)}</strong> (KES {formatPrice(total)})</p>
                      <div id="card-element" className="p-4 border border-gray-300 rounded-lg bg-white mb-4" />
                      <p className="text-sm text-gray-600">Your card information is secure and encrypted</p>
                    </div>
                  )}

                  {/* M-Pesa Info Box */}
                  {paymentMethod === 'mpesa' && (
                    <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl">
                      <h4 className="font-semibold text-green-900 mb-3">📱 How M-Pesa Payment Works:</h4>
                      <ul className="text-sm text-green-800 space-y-2 pl-4 list-disc">
                        <li>Click "Place Order" to proceed</li>
                        <li>You'll receive an M-Pesa STK prompt on <strong className="break-all">{shippingInfo.phone}</strong></li>
                        <li>Enter your M-Pesa PIN to complete payment</li>
                        <li>Order confirmed immediately after payment</li>
                      </ul>
                    </div>
                  )}

                  {/* PayPal Button Container */}
                  {paymentMethod === 'paypal' && (
                    <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-3">💳 Pay with PayPal</h4>
                      <p className="text-sm text-blue-800 mb-4">Use your PayPal account or card.</p>
                      <div id="paypal-button-container" />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="w-full sm:w-1/2 border-2 border-gray-300 py-4 rounded-lg font-semibold text-base hover:border-orange-500 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="w-full sm:w-1/2 bg-orange-500 text-white py-4 rounded-lg font-semibold text-base hover:bg-orange-600 transition-colors shadow-md"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                  {/* Shipping Info Review */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-lg">Shipping Address</h3>
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <p className="font-medium">{shippingInfo.fullName}</p>
                      <p className="text-gray-600 text-sm mt-1">{shippingInfo.address}</p>
                      <p className="text-gray-600 text-sm">
                        {shippingInfo.city}, {shippingInfo.county} {shippingInfo.postalCode}
                      </p>
                      <p className="text-gray-600 text-sm mt-1 break-all">{shippingInfo.phone}</p>
                      <p className="text-gray-600 text-sm break-all">{shippingInfo.email}</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-orange-500 text-sm mt-2 hover:underline font-medium"
                    >
                      Edit Address
                    </button>
                  </div>

                  {/* Payment Method Review */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-lg">Payment Method</h3>
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <p className="capitalize font-semibold">
                        {paymentMethod === 'mpesa' && '📱 M-Pesa'}
                        {paymentMethod === 'card' && '💳 Credit/Debit Card'}
                        {paymentMethod === 'paypal' && '💙 PayPal'}
                        {paymentMethod === 'cod' && '💵 Cash on Delivery'}
                      </p>
                      {paymentMethod === 'mpesa' && (
                        <p className="text-sm text-gray-600 mt-1">
                          ✓ STK prompt will be sent to <strong className="break-all">{shippingInfo.phone}</strong>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-orange-500 text-sm mt-2 hover:underline font-medium"
                    >
                      Change Payment Method
                    </button>
                  </div>

                  {/* Order Items */}
                  <div className="mb-8">
                    <h3 className="font-semibold mb-4 text-lg">Order Items ({cartItems.length})</h3>
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 bg-gray-50 p-5 rounded-xl">
                          <img
                            src={item.images?.[0] || 'https://via.placeholder.com/80'}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold line-clamp-2">{item.name}</p>
                            <p className="text-gray-600 text-sm mt-1">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Order Total */}
                  <div className="lg:hidden mb-6 p-5 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total:</span>
                      <span className="font-bold text-xl text-orange-500">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-1/2 border-2 border-gray-300 py-4 rounded-lg font-semibold text-base hover:border-orange-500 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading || mpesaLoading}
                      className="w-full sm:w-1/2 bg-orange-500 text-white py-4 rounded-lg font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {loading || mpesaLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span>
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span>
                          {paymentMethod === 'mpesa' ? 'Complete M-Pesa Payment' : 
                          paymentMethod === 'paypal' ? 'Complete PayPal Payment' :
                          paymentMethod === 'card' ? 'Complete Card Payment' :
                          'Place Order'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold text-green-600">FREE</span>
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
    </div>
  );
};

export default CheckoutPage;