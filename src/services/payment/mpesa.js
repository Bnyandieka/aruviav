// src/services/payment/mpesa.js
import axios from 'axios';

// Note: M-Pesa integration requires a backend server for security
// This is a client-side wrapper that communicates with your backend API

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Initiate M-Pesa STK Push (Lipa na M-Pesa)
export const initiateMpesaPayment = async (paymentData) => {
  try {
    const { amount, phoneNumber, accountReference, transactionDesc } = paymentData;

    const response = await axios.post(`${API_BASE_URL}/api/payments/mpesa/stk-push`, {
      amount,
      phoneNumber,
      accountReference: accountReference || 'ORDER',
      transactionDesc: transactionDesc || 'Payment for order'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Check M-Pesa payment status
export const checkMpesaPaymentStatus = async (checkoutRequestId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/payments/mpesa/status/${checkoutRequestId}`
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// M-Pesa C2B (Customer to Business) Registration
export const registerMpesaC2BURL = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/payments/mpesa/register-url`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Validate phone number format for M-Pesa (254...)
export const validateMpesaPhone = (phone) => {
  // Remove any spaces or special characters
  const cleaned = phone.replace(/\s|-/g, '');
  
  // Check if it matches Kenyan format
  const regex = /^(254|0)?[17]\d{8}$/;
  
  if (!regex.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  // Convert to 254... format
  let formatted = cleaned;
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  } else if (!formatted.startsWith('254')) {
    formatted = '254' + formatted;
  }

  return { valid: true, phone: formatted };
};

// Format amount for M-Pesa (should be integer)
export const formatMpesaAmount = (amount) => {
  return Math.round(parseFloat(amount));
};

// Example backend endpoint structure (for reference):
/*
Backend API endpoints needed:

POST /api/payments/mpesa/stk-push
- Initiates STK push to customer's phone
- Requires: amount, phoneNumber, accountReference, transactionDesc

GET /api/payments/mpesa/status/:checkoutRequestId
- Check status of STK push transaction

POST /api/payments/mpesa/callback
- Handle M-Pesa callback after payment

POST /api/payments/mpesa/register-url
- Register validation and confirmation URLs
*/