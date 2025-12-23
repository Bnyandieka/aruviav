// Backend API for handling emails with SendGrid
// Location: backend/server.js

const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SendGrid only if API key exists
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid configured successfully');
} else {
  console.warn('⚠️ WARNING: SendGrid API key not configured');
  console.warn('📧 Emails will be logged to console only');
  console.warn('❌ To enable real email sending, update SENDGRID_API_KEY in backend/.env');
}

/**
 * POST /api/send-email
 * Send email via SendGrid
 */
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    // Validate input
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log('\n📧 Email Request:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com'}`);

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      console.log('\n📧 Email Content Preview:');
      console.log('---START EMAIL---');
      console.log(html);
      console.log('---END EMAIL---\n');
      
      return res.json({
        success: true,
        message: `Email logged to console (SendGrid not configured). Recipient: ${to}`,
        note: 'To send real emails, configure SENDGRID_API_KEY in backend/.env'
      });
    }

    // Prepare email
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
    };

    // Send email via SendGrid
    await sgMail.send(msg);

    console.log(`   Status: ✅ SENT via SendGrid\n`);
    res.json({
      success: true,
      message: `Email sent to ${to}`
    });

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Check if it's a SendGrid validation error
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.body?.errors?.[0]?.message || error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ========== M-PESA PAYMENT INTEGRATION ==========
 * Handles M-Pesa STK Push payments (Lipa Na M-Pesa Online)
 * 
 * SETUP REQUIRED:
 * 1. Get M-Pesa API credentials from Safaricom
 * 2. Add to backend/.env:
 *    MPESA_CONSUMER_KEY=your_consumer_key
 *    MPESA_CONSUMER_SECRET=your_consumer_secret
 *    MPESA_SHORT_CODE=your_short_code (or 174379 for test)
 *    MPESA_PASSKEY=your_passkey
 *    MPESA_CALLBACK_URL=https://your-domain/api/mpesa/callback
 */

/**
 * Helper function: Get M-Pesa access token
 */
const getMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('M-Pesa Token Error:', error);
    throw error;
  }
};

/**
 * Helper function: Generate M-Pesa password
 * Password = Base64(ShortCode + Passkey + Timestamp)
 */
const generateMpesaPassword = (shortCode, passkey, timestamp) => {
  const str = shortCode + passkey + timestamp;
  return Buffer.from(str).toString('base64');
};

/**
 * POST /api/mpesa/initiate-payment
 * Initiate M-Pesa STK Push payment
 */
app.post('/api/mpesa/initiate-payment', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, accountReference, description } = req.body;

    // Validate inputs
    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, amount, orderId'
      });
    }

    // Check M-Pesa credentials
    if (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_key') {
      console.log('⚠️ M-Pesa credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'M-Pesa payment not configured. Please contact admin.',
        message: 'M-Pesa API credentials missing in backend/.env'
      });
    }

    console.log('\n💳 M-Pesa Payment Initiated:');
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   Amount: KES ${amount}`);
    console.log(`   Order: ${orderId}`);

    // Get access token
    const accessToken = await getMpesaAccessToken();

    // Prepare STK Push request
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortCode = process.env.MPESA_SHORT_CODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9ba9b9d0e61f1567f58f3cb4351714ebf750d86640fcd51e6002f18e2';
    
    const password = generateMpesaPassword(shortCode, passkey, timestamp);

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://your-domain/api/mpesa/callback',
      AccountReference: accountReference || `SHOPKI-${orderId}`,
      TransactionDesc: description || 'Shopki Order Payment'
    };

    console.log(`   Password: ${password}`);
    console.log(`   Timestamp: ${timestamp}`);

    // Send to M-Pesa
    const mpesaResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await mpesaResponse.json();

    if (result.ResponseCode === '0') {
      console.log(`   ✅ STK Push Sent: ${result.CheckoutRequestID}`);
      return res.json({
        success: true,
        checkoutRequestId: result.CheckoutRequestID,
        responseCode: result.ResponseCode,
        message: result.ResponseDescription || 'STK Push sent to phone',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`   ❌ STK Push Failed: ${result.ResponseDescription}`);
      return res.status(400).json({
        success: false,
        error: result.ResponseDescription || 'Failed to initiate M-Pesa payment',
        responseCode: result.ResponseCode
      });
    }
  } catch (error) {
    console.error('M-Pesa initiation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'M-Pesa payment initiation failed'
    });
  }
});

/**
 * GET /api/mpesa/payment-status/:checkoutRequestId
 * Check M-Pesa payment status
 */
app.get('/api/mpesa/payment-status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Checkout request ID is required'
      });
    }

    // Check M-Pesa credentials
    if (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_key') {
      return res.status(500).json({
        success: false,
        error: 'M-Pesa not configured'
      });
    }

    const accessToken = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortCode = process.env.MPESA_SHORT_CODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9ba9b9d0e61f1567f58f3cb4351714ebf750d86640fcd51e6002f18e2';
    
    const password = generateMpesaPassword(shortCode, passkey, timestamp);

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const mpesaResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await mpesaResponse.json();

    return res.json({
      success: result.ResponseCode === '0',
      status: result.ResultCode === '0' ? 'completed' : 'pending',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('M-Pesa status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check payment status'
    });
  }
});

/**
 * POST /api/mpesa/callback
 * M-Pesa callback endpoint (called by Safaricom)
 * This is called when payment succeeds or fails
 */
app.post('/api/mpesa/callback', (req, res) => {
  try {
    const callbackData = req.body;

    console.log('\n✅ M-Pesa Callback Received:');
    console.log(JSON.stringify(callbackData, null, 2));

    // Always respond with 200 OK to Safaricom
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    // Process callback data (in production, update Firestore with order status)
    // This would:
    // 1. Extract order ID from Body.stkCallback.CallbackMetadata
    // 2. Update order status in Firestore to "completed"
    // 3. Send confirmation email to user
    // 4. Send admin notification

    const { Body } = callbackData;
    if (Body && Body.stkCallback) {
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
      
      console.log(`   Result Code: ${ResultCode}`);
      console.log(`   Checkout ID: ${CheckoutRequestID}`);
      
      if (ResultCode === 0) {
        console.log('   ✅ Payment Successful!');
        // TODO: Update order status to 'paid' in Firestore
      } else {
        console.log('   ❌ Payment Failed');
        // TODO: Update order status to 'payment_failed' in Firestore
      }
    }
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const sgStatus = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here'
    ? 'configured'
    : 'not_configured';
  
  const mpesaStatus = process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_KEY !== 'your_key'
    ? 'configured'
    : 'not_configured';
  
  res.json({
    status: 'ok',
    message: 'Payment API server is running',
    sendgrid: sgStatus,
    mpesa: mpesaStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Email API Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`SendGrid Status: ${process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here' ? '✅ Configured' : '⚠️ Not configured (emails logged to console)'}`);
  console.log(`From Email: ${process.env.SENDGRID_FROM_EMAIL}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
