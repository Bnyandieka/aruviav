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
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);} else {
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
    }    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');      return res.json({
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
    await sgMail.send(msg);    res.json({
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
    if (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_key') {      return res.status(500).json({
        success: false,
        error: 'M-Pesa payment not configured. Please contact admin.',
        message: 'M-Pesa API credentials missing in backend/.env'
      });
    }    // Get access token
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
    };    // Send to M-Pesa
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

    if (result.ResponseCode === '0') {      return res.json({
        success: true,
        checkoutRequestId: result.CheckoutRequestID,
        responseCode: result.ResponseCode,
        message: result.ResponseDescription || 'STK Push sent to phone',
        timestamp: new Date().toISOString()
      });
    } else {      return res.status(400).json({
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
    const callbackData = req.body;    console.log(JSON.stringify(callbackData, null, 2));

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
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;      if (ResultCode === 0) {        // TODO: Update order status to 'paid' in Firestore
      } else {        // TODO: Update order status to 'payment_failed' in Firestore
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
/**
 * ==========================================
 * CHAT NOTIFICATION ROUTES
 * ==========================================
 */

/**
 * POST /api/chat/notify-provider
 * Send email notification when user sends a message
 */
app.post('/api/chat/notify-provider', async (req, res) => {
  try {
    const { 
      providerEmail, 
      providerName, 
      senderName, 
      senderEmail,
      message, 
      serviceId, 
      serviceName 
    } = req.body;

    // Validate inputs
    if (!providerEmail || !senderName || !message || !serviceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }    console.log(`   From: ${senderName} (${senderEmail})`);    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      console.log('   Message Preview:', message.substring(0, 100) + '...');
      
      return res.json({
        success: true,
        message: 'Notification logged to console (SendGrid not configured)',
        status: 'logged'
      });
    }

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">New Message from ${senderName}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Service: ${serviceName}</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p><strong>From:</strong> ${senderName}</p>
          <p><strong>Email:</strong> ${senderEmail}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Reply to this message by logging into your Shopki account and accessing your messages section.
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p>© 2024 Shopki. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
New Message from ${senderName}

Service: ${serviceName}

Message:
${message}

---
Reply to this message by logging into your Shopki account.
    `;

    // Send email via SendGrid
    await sgMail.send({
      to: providerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject: `New Message from ${senderName} - ${serviceName}`,
      text: emailText,
      html: emailHtml,
      replyTo: senderEmail
    });    return res.json({
      success: true,
      message: 'Notification sent to provider',
      status: 'sent'
    });
  } catch (error) {
    console.error('Chat notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});

/**
 * POST /api/chat/notify-customer
 * Send email notification when provider replies
 */
app.post('/api/chat/notify-customer', async (req, res) => {
  try {
    const { 
      customerEmail, 
      customerName, 
      providerName, 
      message, 
      serviceName 
    } = req.body;

    // Validate inputs
    if (!customerEmail || !providerName || !message || !serviceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      console.log('   Message Preview:', message.substring(0, 100) + '...');
      
      return res.json({
        success: true,
        message: 'Notification logged to console (SendGrid not configured)',
        status: 'logged'
      });
    }

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">New Reply from ${providerName}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Service: ${serviceName}</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Hi ${customerName || 'there'},</p>
          
          <p><strong>${providerName}</strong> has replied to your message about <strong>${serviceName}</strong>:</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            View the full conversation by logging into your Shopki account.
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p>© 2024 Shopki. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
New Reply from ${providerName}

Service: ${serviceName}

Message:
${message}

---
View the full conversation by logging into your Shopki account.
    `;

    // Send email via SendGrid
    await sgMail.send({
      to: customerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject: `New Reply from ${providerName} - ${serviceName}`,
      text: emailText,
      html: emailHtml
    });    return res.json({
      success: true,
      message: 'Notification sent to customer',
      status: 'sent'
    });
  } catch (error) {
    console.error('Chat notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});

/**
 * ==========================================
 * BOOKING NOTIFICATION ROUTES
 * ==========================================
 */

/**
 * POST /api/booking/notify-vendor
 * Send email notification when customer books a service
 */
app.post('/api/booking/notify-vendor', async (req, res) => {
  try {
    const {
      vendorEmail,
      vendorName,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      bookingDate,
      bookingTime,
      bookingNotes,
      bookingId
    } = req.body;

    if (!vendorEmail || !customerName || !serviceName || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      return res.json({
        success: true,
        message: 'Notification logged to console (SendGrid not configured)',
        status: 'logged'
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">New Booking Request</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Service: ${serviceName}</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="margin-top: 0; color: #f97316;">Customer Details</h3>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
          
          <h3 style="color: #f97316;">Booking Details</h3>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Preferred Date:</strong> ${bookingDate}</p>
          ${bookingTime ? `<p><strong>Preferred Time:</strong> ${bookingTime}</p>` : ''}
          
          ${bookingNotes ? `
            <h3 style="color: #f97316;">Notes from Customer</h3>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316;">
              <p style="margin: 0; white-space: pre-wrap;">${bookingNotes}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f97316;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <p style="margin: 10px 0 0 0;">1. Review this booking request</p>
            <p style="margin: 5px 0;">2. Log into Shopki to accept or reschedule</p>
            <p style="margin: 5px 0;">3. Contact the customer via the chat feature if needed</p>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p>© 2024 Shopki. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
New Booking Request

Service: ${serviceName}

Customer Details:
Name: ${customerName}
Email: ${customerEmail}
${customerPhone ? `Phone: ${customerPhone}` : ''}

Booking Details:
Date: ${bookingDate}
${bookingTime ? `Time: ${bookingTime}` : ''}

${bookingNotes ? `Customer Notes:\n${bookingNotes}` : ''}

Next Steps:
1. Review this booking request
2. Log into Shopki to accept or reschedule
3. Contact the customer via the chat feature if needed
    `;

    await sgMail.send({
      to: vendorEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject: `New Booking Request - ${serviceName}`,
      text: emailText,
      html: emailHtml,
      replyTo: customerEmail
    });    return res.json({
      success: true,
      message: 'Notification sent to vendor',
      status: 'sent'
    });
  } catch (error) {
    console.error('Booking notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});

/**
 * POST /api/booking/notify-customer
 * Send booking confirmation email to customer
 */
app.post('/api/booking/notify-customer', async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      vendorName,
      serviceName,
      bookingDate,
      bookingTime,
      bookingId
    } = req.body;

    if (!customerEmail || !customerName || !serviceName || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      return res.json({
        success: true,
        message: 'Confirmation logged to console (SendGrid not configured)',
        status: 'logged'
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">✓ Booking Request Submitted</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Service: ${serviceName}</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Hi ${customerName},</p>
          
          <p>Thank you for submitting your booking request! We've received your request for <strong>${serviceName}</strong> from <strong>${vendorName}</strong>.</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
            <p><strong>Your Booking Details:</strong></p>
            <p style="margin: 10px 0;">📅 Requested Date: ${bookingDate}</p>
            ${bookingTime ? `<p style="margin: 10px 0;">🕐 Requested Time: ${bookingTime}</p>` : ''}
            <p style="margin: 10px 0;">🏢 Service Provider: ${vendorName}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
            <p style="margin-top: 0;"><strong>What happens next?</strong></p>
            <p style="margin: 10px 0;">✓ We've notified ${vendorName} about your booking request</p>
            <p style="margin: 10px 0;">✓ They will review your request and contact you within 24 hours</p>
            <p style="margin: 10px 0;">✓ You can chat with them directly in your Shopki account</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any questions, you can reply to this email or contact the service provider through the Shopki platform.</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p>© 2024 Shopki. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
Booking Request Submitted

Hi ${customerName},

Thank you for submitting your booking request! We've received your request for ${serviceName} from ${vendorName}.

Your Booking Details:
Date: ${bookingDate}
${bookingTime ? `Time: ${bookingTime}` : ''}
Service Provider: ${vendorName}

What happens next?
✓ We've notified ${vendorName} about your booking request
✓ They will review your request and contact you within 24 hours
✓ You can chat with them directly in your Shopki account

If you have any questions, you can reply to this email or contact the service provider through the Shopki platform.

© 2024 Shopki. All rights reserved.
    `;

    await sgMail.send({
      to: customerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject: `Booking Confirmation - ${serviceName}`,
      text: emailText,
      html: emailHtml,
      replyTo: customerEmail
    });    return res.json({
      success: true,
      message: 'Confirmation sent to customer',
      status: 'sent'
    });
  } catch (error) {
    console.error('Customer confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send confirmation'
    });
  }
});

/**
 * POST /api/booking/notify-customer-acceptance
 * Send email when vendor accepts booking
 */
app.post('/api/booking/notify-customer-acceptance', async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      vendorName,
      serviceName,
      bookingDate,
      bookingTime,
      vendorNotes
    } = req.body;

    if (!customerEmail || !vendorName || !serviceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      return res.json({
        success: true,
        message: 'Notification logged to console (SendGrid not configured)',
        status: 'logged'
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #22c55e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">✓ Booking Confirmed!</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Your booking has been accepted</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Hi ${customerName},</p>
          
          <p><strong>${vendorName}</strong> has accepted your booking for <strong>${serviceName}</strong>!</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p><strong>Booking Details:</strong></p>
            <p style="margin: 10px 0;">📅 Date: ${bookingDate}</p>
            ${bookingTime ? `<p style="margin: 10px 0;">🕐 Time: ${bookingTime}</p>` : ''}
          </div>
          
          ${vendorNotes ? `
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Vendor Notes:</strong></p>
              <p style="margin: 10px 0; white-space: pre-wrap;">${vendorNotes}</p>
            </div>
          ` : ''}
          
          <p>You can now communicate with the service provider via the chat feature in your booking details.</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p>© 2024 Shopki. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
Booking Confirmed!

Your booking has been accepted by ${vendorName}.

Service: ${serviceName}
Date: ${bookingDate}
${bookingTime ? `Time: ${bookingTime}` : ''}

${vendorNotes ? `Vendor Notes:\n${vendorNotes}` : ''}

You can now communicate with the service provider via the chat feature.
    `;

    await sgMail.send({
      to: customerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject: `Booking Confirmed - ${serviceName}`,
      text: emailText,
      html: emailHtml
    });    return res.json({
      success: true,
      message: 'Notification sent to customer',
      status: 'sent'
    });
  } catch (error) {
    console.error('Booking notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});

/**
 * POST /api/booking/notify-customer-reschedule
 * Send email when vendor reschedules booking
 */
app.post('/api/booking/notify-customer-reschedule', async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      vendorName,
      serviceName,
      originalDate,
      newDate,
      newTime,
      reason
    } = req.body;

    if (!customerEmail || !vendorName || !serviceName || !newDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      return res.json({
        success: true,
        message: 'Notification logged to console (SendGrid not configured)',
        status: 'logged'
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">📅 Booking Rescheduled</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Your booking has been rescheduled</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Hi ${customerName},</p>
          
          <p><strong>${vendorName}</strong> has rescheduled your booking for <strong>${serviceName}</strong>.</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
            <p><strong>New Schedule:</strong></p>
            <p style="margin: 10px 0;">📅 New Date: <strong>${newDate}</strong></p>
            ${newTime ? `<p style="margin: 10px 0;">🕐 New Time: <strong>${newTime}</strong></p>` : ''}
            ${originalDate ? `<p style="margin: 10px 0; color: #666; font-size: 12px;">Previously scheduled: ${originalDate}</p>` : ''}
          </div>
          
          ${reason ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reason for Reschedule:</strong></p>
              <p style="margin: 10px 0; white-space: pre-wrap;">${reason}</p>
            </div>
          ` : ''}
          
          <p>If you have any questions or concerns, please contact the service provider through the chat feature.</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p>© 2024 Shopki. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
Booking Rescheduled

Your booking has been rescheduled by ${vendorName}.

Service: ${serviceName}
New Date: ${newDate}
${newTime ? `New Time: ${newTime}` : ''}

${reason ? `Reason:\n${reason}` : ''}

If you have questions, contact the service provider through the chat feature.
    `;

    await sgMail.send({
      to: customerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject: `Booking Rescheduled - ${serviceName}`,
      text: emailText,
      html: emailHtml
    });    return res.json({
      success: true,
      message: 'Notification sent to customer',
      status: 'sent'
    });
  } catch (error) {
    console.error('Booking notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {  console.log(`SendGrid Status: ${process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here' ? '✅ Configured' : '⚠️ Not configured (emails logged to console)'}`);});
