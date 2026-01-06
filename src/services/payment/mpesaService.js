// M-Pesa Payment Service
// Location: src/services/payment/mpesaService.js

import axios from 'axios';

// Backend API base URL (adjust if needed)
// Note: Only needed if you have a backend M-Pesa service running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Disable console errors for M-Pesa service if backend is not available
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true // Don't throw on any status code
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Silently handle connection errors when backend is not available
    if (!error.response && error.code === 'ECONNREFUSED') {
      console.debug('M-Pesa backend service unavailable');
    }
    return Promise.reject(error);
  }
);

/**
 * Initiate M-Pesa STK Push (Lipa Na M-Pesa Online)
 * This prompts the user with an M-Pesa popup on their phone
 * 
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.phoneNumber - Customer phone number (format: 254712345678)
 * @param {number} paymentData.amount - Amount in KES
 * @param {string} paymentData.orderId - Aruviah order ID
 * @param {string} paymentData.accountReference - Account reference (e.g., "ARUVIAH-ORDER-123")
 * @param {string} paymentData.description - Transaction description
 * @returns {Promise<Object>} Response with checkout request ID and status
 */
export const initiateMpesaPayment = async (paymentData) => {
  try {
    const response = await axiosInstance.post(
      `/api/mpesa/initiate-payment`,
      {
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        accountReference: paymentData.accountReference || `ARUVIAH-${paymentData.orderId}`,
        description: paymentData.description || 'Aruviah Order Payment'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        checkoutRequestId: response.data.checkoutRequestId,
        responseCode: response.data.responseCode,
        message: response.data.message,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Failed to initiate M-Pesa payment',
        message: response.data.message
      };
    }
  } catch (error) {
    console.error('M-Pesa initiation error:', error);
    return {
      success: false,
      error: error.message || 'Network error while initiating M-Pesa payment',
      details: error.response?.data || null
    };
  }
};

/**
 * Check M-Pesa payment status
 * Query the status of a payment by checkout request ID
 * 
 * @param {string} checkoutRequestId - The checkout request ID from initiation
 * @returns {Promise<Object>} Payment status information
 */
export const checkMpesaPaymentStatus = async (checkoutRequestId) => {
  try {
    const response = await axiosInstance.get(
      `/api/mpesa/payment-status/${checkoutRequestId}`
    );

    return response.data;
  } catch (error) {
    console.error('M-Pesa status check error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check payment status'
    };
  }
};

/**
 * Process M-Pesa payment callback
 * Called internally when M-Pesa sends callback notification
 * This updates order status in Firestore
 * 
 * @param {Object} callbackData - Data from M-Pesa callback
 * @returns {Promise<Object>} Result of processing
 */
export const processMpesaCallback = async (callbackData) => {
  try {
    const response = await axiosInstance.post(
      `/api/mpesa/callback`,
      callbackData
    );

    return response.data;
  } catch (error) {
    console.error('M-Pesa callback processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process M-Pesa callback'
    };
  }
};

/**
 * Format phone number to M-Pesa format (254xxxxxxxxx)
 * @param {string} phone - Phone number (various formats accepted)
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 07, replace with 254
  if (cleaned.startsWith('07')) {
    cleaned = '254' + cleaned.substring(1);
  }
  // If it starts with 7, prefix with 254
  else if (cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  }
  // If it doesn't start with 254, it's invalid
  else if (!cleaned.startsWith('254')) {
    throw new Error('Invalid phone number format');
  }

  return cleaned;
};

/**
 * Validate M-Pesa payment data before submission
 * @param {Object} paymentData - Payment data to validate
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export const validateMpesaPaymentData = (paymentData) => {
  // Check required fields
  if (!paymentData.phoneNumber) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (!paymentData.amount || paymentData.amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (paymentData.amount < 1) {
    return { valid: false, error: 'Minimum M-Pesa payment is KES 1' };
  }

  if (paymentData.amount > 150000) {
    return { valid: false, error: 'Maximum M-Pesa payment is KES 150,000' };
  }

  if (!paymentData.orderId) {
    return { valid: false, error: 'Order ID is required' };
  }

  // Validate phone number format
  try {
    formatPhoneNumber(paymentData.phoneNumber);
  } catch (error) {
    return { valid: false, error: error.message };
  }

  return { valid: true };
};

export default {
  initiateMpesaPayment,
  checkMpesaPaymentStatus,
  processMpesaCallback,
  formatPhoneNumber,
  validateMpesaPaymentData
};
