// M-Pesa Payment Service with Lipana Integration
// Location: src/services/payment/mpesaService.js
// Calls backend proxy endpoint (avoids CORS issues with Lipana)

import axios from 'axios';

// Backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Initiate M-Pesa STK Push via Lipana (through backend proxy)
 * 
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.phoneNumber - Customer phone number (format: 254712345678 or +254712345678)
 * @param {number} paymentData.amount - Amount in KES (minimum 10)
 * @param {string} paymentData.orderId - Order ID reference
 * @param {string} paymentData.description - Transaction description
 * @returns {Promise<Object>} Response with transaction ID and status
 */
export const initiateMpesaPayment = async (paymentData) => {
  try {
    // Call backend proxy endpoint (secret key stays secure on backend)
    const response = await axios.post(
      `${API_BASE_URL}/api/lipana/initiate-stk-push`,
      {
        phone: paymentData.phoneNumber,
        amount: paymentData.amount,
        orderId: paymentData.orderId
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
        transactionId: response.data.transactionId,
        checkoutRequestID: response.data.checkoutRequestID,
        message: response.data.message || 'STK push initiated successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Failed to initiate M-Pesa payment'
      };
    }
  } catch (error) {
    console.error('Lipana STK Push error:', error);
    return {
      success: false,
      error: error.message || 'Network error while initiating M-Pesa payment',
      details: error.response?.data || null
    };
  }
};


/**
 * Format phone number to M-Pesa format (254xxxxxxxxx or +254xxxxxxxxx)
 * @param {string} phone - Phone number (various formats accepted)
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters except + at start
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
    throw new Error('Invalid phone number format. Use 07xx, 254xx, or +254xx format.');
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

  if (paymentData.amount < 10) {
    return { valid: false, error: 'Minimum M-Pesa payment is KES 10' };
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

const mpesaService = {
  initiateMpesaPayment,
  formatPhoneNumber,
  validateMpesaPaymentData
};

export default mpesaService;
