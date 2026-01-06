// Location: src/pages/CheckoutPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiPhone } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, updateOrderStatus } from '../services/firebase/firestoreHelpers';
import { sendOrderConfirmation } from '../services/email/emailAutomation';
import { initiateMpesaPayment, formatPhoneNumber, validateMpesaPaymentData } from '../services/payment/mpesaService';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  
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

  const shippingFee = cartTotal > 5000 ? 0 : 300;
  const total = cartTotal + shippingFee;

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
        return false;
      }

      // Format phone number to M-Pesa format
      const formattedPhone = formatPhoneNumber(phoneNumber);

      console.log('📱 Initiating M-Pesa STK Push...');
      console.log(`   Phone: ${formattedPhone}`);
      console.log(`   Amount: KES ${total}`);

      toast.info('📱 Sending M-Pesa prompt to your phone...', { autoClose: false });

      // Call backend to initiate M-Pesa STK Push
      const result = await initiateMpesaPayment({
        ...paymentData,
        phoneNumber: formattedPhone
      });

      if (result.success) {
        console.log('✅ STK Push sent successfully');
        console.log(`   Checkout ID: ${result.checkoutRequestId}`);
        
        setMpesaCheckoutId(result.checkoutRequestId);
        
        toast.success('✅ M-Pesa prompt sent! Please enter your PIN on your phone.', {
          autoClose: 5000
        });

        // Save checkout ID to order for verification
        // In production, you would poll the backend or wait for callback
        return true;
      } else {
        console.error('❌ STK Push failed:', result.error);
        toast.error(`Payment failed: ${result.error || 'Unable to process M-Pesa payment'}`);
        return false;
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      toast.error('Payment error. Please try again.');
      return false;
    } finally {
      setMpesaLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateShippingInfo()) return;
    
    setLoading(true);
    
    try {
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
        shippingFee,
        total,
        status: paymentMethod === 'cod' ? 'pending' : 'payment_pending',
        paymentStatus: 'pending',
        orderDate: new Date().toISOString()
      };

      const { orderId, error } = await createOrder(orderData);
      
      if (error) {
        toast.error('Failed to create order');
        setLoading(false);
        return;
      }

      // Handle M-Pesa payment
      if (paymentMethod === 'mpesa') {
        const mpesaSuccess = await handleMpesaPayment(orderId);
        
        if (!mpesaSuccess) {
          setLoading(false);
          return;
        }

        // For M-Pesa, show a waiting screen for the user to complete payment
        toast.info('⏳ Waiting for M-Pesa confirmation...', { autoClose: false });
        
        // In production, implement polling or callback webhook to confirm payment
        // For now, redirect to a payment verification page
        navigate(`/order-success?orderId=${orderId}&paymentPending=true`);
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