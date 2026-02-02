// Backend API for handling emails with Brevo
// Location: backend/server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
// Capture raw request body for webhook signature verification while still
// populating `req.body` for downstream handlers.
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) req.rawBody = buf.toString(encoding || 'utf8');
  }
}));

// Keep a Firebase Admin instance optional for server-side Firestore updates from webhooks.
let admin = null;
let adminDb = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Support both relative and absolute paths
      const path = require('path');
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.startsWith('.')
        ? path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      serviceAccount = require(filePath);
    }

    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      adminDb = admin.firestore();
      console.log('✅ Firebase Admin initialized for webhook order updates');
    }
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH to enable server-side Firestore updates from webhooks.');
  console.warn('Error details:', err.message);
}

// Initialize Brevo (using the same API as frontend)
const BREVO_API_BASE = 'https://api.brevo.com/v3';
const getBrevClient = () => {
  const apiKey = process.env.REACT_APP_BREVO_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ REACT_APP_BREVO_API_KEY is not set. Emails will be logged to console.');
  }
  return axios.create({
    baseURL: BREVO_API_BASE,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * POST /api/send-email
 * Send email via Brevo
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

    const brevoClient = getBrevClient();
    const apiKey = process.env.REACT_APP_BREVO_API_KEY;

    // Check if Brevo is configured
    if (!apiKey) {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      return res.json({
        success: true,
        message: `Email logged to console (Brevo not configured). Recipient: ${to}`,
        note: 'To send real emails, configure REACT_APP_BREVO_API_KEY in backend/.env'
      });
    }

    // Prepare email
    const senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL || 'support@shopki.com';
    const msg = {
      to: [{ email: to }],
      sender: {
        name: 'Shopki',
        email: senderEmail
      },
      subject,
      htmlContent: html
    };

    // Send email via Brevo
    const response = await brevoClient.post('/smtp/email', msg);
    
    res.json({
      success: true,
      message: `Email sent to ${to}`,
      messageId: response.data.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Check if it's a Brevo API error
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/lipana/reconcile
 * Admin helper: reconcile a Lipana transactionId with an order and apply status updates.
 * Body: { transactionId: string, status?: 'completed'|'failed' }
 */
app.post('/api/lipana/reconcile', async (req, res) => {
  try {
    const { transactionId, status } = req.body || {};
    if (!transactionId) return res.status(400).json({ success: false, error: 'transactionId required' });
    if (!adminDb) return res.status(500).json({ success: false, error: 'Firebase Admin not configured' });

    const txRef = adminDb.collection('transactions').doc(String(transactionId));
    const txSnap = await txRef.get();
    if (txSnap.exists) {
      const tx = txSnap.data();
      const orderId = tx.orderId;
      if (!orderId) return res.status(404).json({ success: false, error: 'Mapping exists but orderId missing' });
      const orderRef = adminDb.collection('orders').doc(String(orderId));
      const targetStatus = status || 'completed';
      await orderRef.update({
        paymentStatus: targetStatus,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        transaction: {
          id: transactionId,
          checkoutRequestId: tx.checkoutRequestId || null,
          raw: tx || null
        }
      });
      return res.json({ success: true, message: `Order ${orderId} updated to ${targetStatus}` });
    }

    // Fallback: try to find order by transactionId field
    const ordersRef = adminDb.collection('orders');
    const q = ordersRef.where('transaction.id', '==', transactionId).limit(1);
    const snaps = await q.get();
    if (!snaps.empty) {
      const doc = snaps.docs[0];
      await doc.ref.update({
        paymentStatus: status || 'completed',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.json({ success: true, message: `Order ${doc.id} updated` });
    }

    return res.status(404).json({ success: false, error: 'No mapping or order found for transactionId' });
  } catch (err) {
    console.error('Reconcile error:', err);
    res.status(500).json({ success: false, error: err.message || err });
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
      return res.status(500).json({
        success: false,
        error: 'M-Pesa payment not configured. Please contact admin.',
        message: 'M-Pesa API credentials missing in backend/.env'
      });
    }
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
      return res.json({
        success: true,
        checkoutRequestId: result.CheckoutRequestID,
        responseCode: result.ResponseCode,
        message: result.ResponseDescription || 'STK Push sent to phone',
        timestamp: new Date().toISOString()
      });
    } else {
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
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('📱 M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    // Always respond with 200 OK to Safaricom immediately
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    // Process callback data asynchronously
    const { Body } = callbackData;
    if (Body && Body.stkCallback) {
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
      
      // Extract order ID from callback metadata
      let orderId = null;
      if (CallbackMetadata && CallbackMetadata.Item) {
        const accountRefItem = CallbackMetadata.Item.find(item => item.Name === 'AccountReference');
        if (accountRefItem) {
          orderId = accountRefItem.Value;
        }
      }
      
      if (!orderId) {
        console.warn('⚠️ Could not extract order ID from M-Pesa callback');
        return;
      }

      console.log(`📦 Processing callback for order: ${orderId}`);

      // Handle successful payment
      if (ResultCode === 0) {
        console.log(`✅ Payment successful for order: ${orderId}`);
        
        // Extract payment ID (M-Pesa receipt number or checkout request ID)
        const paymentId = CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value || CheckoutRequestID;
        
        // If Firebase Admin is configured, update Firestore
        if (adminDb) {
          try {
            const orderRef = adminDb.collection('orders').doc(orderId);
            const orderSnap = await orderRef.get();
            
            if (orderSnap.exists()) {
              const orderData = orderSnap.data();
              
              // Update order status to 'processing' (not 'completed')
              await orderRef.update({
                paymentStatus: 'completed',
                status: 'processing',
                transactionId: paymentId,
                paymentId: paymentId,
                lastUpdated: new Date().toISOString()
              });
              
              console.log(`📝 Order ${orderId} status updated to 'processing' in Firestore`);
              
              // Reduce stock after successful payment
              try {
                await reduceOrderStock(orderId, orderData);
              } catch (stockError) {
                console.error('❌ Error reducing stock after payment:', stockError.message);
              }
              
              // Send payment confirmation email to customer
              try {
                const customerEmail = orderData.userEmail || orderData.email;
                if (customerEmail) {
                  await sendPaymentConfirmationEmail(
                    customerEmail,
                    orderId,
                    orderData,
                    paymentId
                  );
                }
              } catch (emailError) {
                console.error('❌ Failed to send payment confirmation email:', emailError.message);
              }
            } else {
              console.warn(`⚠️ Order ${orderId} not found in Firestore`);
            }
          } catch (firestoreError) {
            console.error('❌ Error updating Firestore order:', firestoreError.message);
          }
        } else {
          console.warn('⚠️ Firebase Admin not configured - skipping Firestore update');
          console.log(`🔔 Manually update order ${orderId} status to 'completed' in Firebase Console`);
        }
      } 
      // Handle failed payment
      else {
        console.log(`❌ Payment failed for order: ${orderId} (ResultCode: ${ResultCode})`);
        
        if (adminDb) {
          try {
            const orderRef = adminDb.collection('orders').doc(orderId);
            
            // Update order status to failed (do NOT reduce stock)
            await orderRef.update({
              paymentStatus: 'failed',
              status: 'payment_failed',
              paymentError: `Payment failed with code: ${ResultCode}`,
              lastUpdated: new Date().toISOString()
            });
            
            console.log(`📝 Order ${orderId} status updated to 'payment_failed' in Firestore`);
            console.log(`⚠️  Stock NOT reduced for failed payment (order: ${orderId})`);
            
            // Send payment failure email to customer
            try {
              const orderSnap = await orderRef.get();
              const orderData = orderSnap.data();
              const customerEmail = orderData.userEmail || orderData.email;
              if (customerEmail) {
                await sendPaymentFailureEmail(
                  customerEmail,
                  orderId,
                  orderData,
                  ResultCode
                );
              }
            } catch (emailError) {
              console.error('❌ Failed to send payment failure email:', emailError.message);
            }
          } catch (firestoreError) {
            console.error('❌ Error updating Firestore order:', firestoreError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    // Still respond with 200 OK even if there's an error
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

/**
 * Reduce stock for all items in an order after successful payment
 */
async function reduceOrderStock(orderId, orderData) {
  if (!adminDb) {
    console.warn('⚠️ Firebase Admin not configured - skipping stock reduction');
    return;
  }

  try {
    // Check if stock was already reduced (prevent double reduction)
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (orderSnap.exists() && orderSnap.data().stockReduced) {
      console.log(`⏭️  Stock already reduced for order ${orderId}`);
      return;
    }

    // Reduce stock for each item
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        const productId = item.productId || item.id;
        const quantity = item.quantity || 1;

        if (productId) {
          try {
            const productRef = adminDb.collection('products').doc(productId);
            const productSnap = await productRef.get();

            if (productSnap.exists()) {
              const productData = productSnap.data();
              const currentStock = productData.stock || 0;
              const newStock = Math.max(0, currentStock - quantity);

              await productRef.update({
                stock: newStock,
                sold: (productData.sold || 0) + quantity,
                updatedAt: new Date().toISOString()
              });

              console.log(`📊 Stock reduced for ${item.name}: ${currentStock} → ${newStock}`);
            }
          } catch (err) {
            console.error(`❌ Error reducing stock for product ${productId}:`, err.message);
          }
        }
      }
    }

    // Mark order as having stock reduced
    await orderRef.update({
      stockReduced: true,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Stock successfully reduced for order ${orderId}`);

  } catch (error) {
    console.error('❌ Error reducing stock after payment:', error.message);
  }
}

/**
 * Fetch email template from Firestore
 */
async function getEmailTemplate(templateType) {
  try {
    if (!adminDb) {
      console.warn(`⚠️ Firebase Admin not configured - cannot fetch template: ${templateType}`);
      return null;
    }

    const templateRef = admin.firestore().collection('emailTemplates').doc(templateType);
    const templateSnap = await templateRef.get();

    if (templateSnap.exists()) {
      return templateSnap.data();
    }
    return null;
  } catch (error) {
    console.error(`Error fetching template ${templateType}:`, error.message);
    return null;
  }
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * Get Brevo client for sending emails
 */
// Reuse the `getBrevClient` defined earlier near the top of this file.

/**
 * Send transactional email via Brevo
 */
async function sendTransactionalEmail({ email, subject, htmlContent }) {
  try {
    const brevoClient = getBrevClient();
    const senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL || 'orders@shopki.com';

    if (!process.env.REACT_APP_BREVO_API_KEY) {
      console.log('📧 Email would be sent to:', email);
      console.log('📧 Subject:', subject);
      console.log('📧 Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      return;
    }

    await brevoClient.post('/smtp/email', {
      to: [{ email }],
      sender: {
        name: 'Shopki',
        email: senderEmail
      },
      subject,
      htmlContent
    });

    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error('❌ Brevo email error:', error.response?.data || error.message);
    throw error;
  }
}

/**
async function sendPaymentConfirmationEmail(customerEmail, orderId, orderData, paymentId) {
  try {
    // Build items table HTML
    const itemsHtml = (orderData.items || []).map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; color: #333;">${item.name}</td>
        <td style="padding: 12px; text-align: center; color: #666;">x${item.quantity || 1}</td>
        <td style="padding: 12px; text-align: right; color: #ff9800; font-weight: 600;">KES ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Payment Successful! ✅</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your order has been confirmed</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Thank you for your purchase!</h2>
            <p style="color: #666; margin: 0 0 20px 0;">Your payment has been processed successfully. Here's your order summary:</p>

            <!-- Order Details -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${paymentId || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">PROCESSING</span></p>
            </div>

            <!-- Items Table -->
            <h3 style="color: #333; margin: 20px 0 10px 0;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f0f4ff;">
                  <th style="padding: 12px; text-align: left; color: #333; font-weight: 600;">Product</th>
                  <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #333; font-weight: 600;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Subtotal:</span>
                <span style="color: #333; font-weight: 600;">KES ${(orderData.total || 0).toLocaleString()}</span>
              </div>
              ${orderData.shippingFee ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Shipping Fee:</span>
                <span style="color: #333; font-weight: 600;">KES ${orderData.shippingFee.toLocaleString()}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; border-top: 2px solid #ddd; padding-top: 10px;">
                <span style="color: #333; font-weight: bold; font-size: 16px;">Total Amount:</span>
                <span style="color: #ff9800; font-weight: bold; font-size: 18px;">KES ${(orderData.total || 0).toLocaleString()}</span>
              </div>
            </div>

            <!-- Shipping Info -->
            ${orderData.shippingInfo ? `
            <h3 style="color: #333; margin: 20px 0 10px 0;">Shipping Address</h3>
            <div style="background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>${orderData.shippingInfo.fullName}</strong></p>
              <p style="margin: 5px 0;">${orderData.shippingInfo.address}</p>
              <p style="margin: 5px 0;">${orderData.shippingInfo.city}, ${orderData.shippingInfo.county} ${orderData.shippingInfo.postalCode}</p>
              <p style="margin: 5px 0;">📞 ${orderData.shippingInfo.phone}</p>
            </div>
            ` : ''}

            <!-- Next Steps -->
            <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32;">What happens next?</h4>
              <ul style="margin: 0; padding-left: 20px; color: #333;">
                <li style="margin: 8px 0;">Your order will be processed and prepared for shipment</li>
                <li style="margin: 8px 0;">You will receive tracking information via email</li>
                <li style="margin: 8px 0;">Expected delivery: 3-5 business days</li>
              </ul>
            </div>

            <!-- Track Order Button -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${process.env.REACT_APP_BASE_URL || 'https://shopki.com'}/orders/${orderId}" 
                 style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Track Your Order
              </a>
            </div>

            <!-- Support Message -->
            <p style="color: #999; font-size: 14px; text-align: center; margin-bottom: 0;">
              If you have any questions, please contact us at <a href="mailto:support@shopki.com" style="color: #667eea; text-decoration: none;">support@shopki.com</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f0f4ff; border-top: 1px solid #ddd; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Shopki. All rights reserved.</p>
            <p style="margin: 5px 0;">This email contains important information about your order.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Brevo
    const brevoClient = getBrevClient();
    const apiKey = process.env.REACT_APP_BREVO_API_KEY;
    const senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL || 'orders@shopki.com';

    if (apiKey) {
      try {
        await brevoClient.post('/smtp/email', {
          to: [{ email: customerEmail }],
          sender: {
            name: 'Shopki',
            email: senderEmail
          },
          subject: `Order Confirmed - ${orderId}`,
          htmlContent
        });
        console.log(`✅ Payment confirmation email sent to ${customerEmail}`);
      } catch (error) {
        console.error('❌ Brevo email error:', error.response?.data || error.message);
      }
    } else {
      console.log('📧 Email would be sent to:', customerEmail);
      console.log('📧 Subject: Order Confirmed -', orderId);
      console.log('📧 Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
    }
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error.message);
  }
}

/**
 * Send payment failure email to customer via Brevo
 */
async function sendPaymentFailureEmail(customerEmail, orderId, orderData, errorCode) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Payment Failed ❌</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Please try again or use a different payment method</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">We couldn't process your payment</h2>
            <p style="color: #666; margin: 0 0 20px 0;">Unfortunately, your M-Pesa payment for order <strong>${orderId}</strong> could not be processed.</p>

            <!-- Info Box -->
            <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #c62828;"><strong>Order ID:</strong> ${orderId}</p>
              ${errorCode ? `<p style="margin: 5px 0; color: #c62828;"><strong>Error Code:</strong> ${errorCode}</p>` : ''}
              <p style="margin: 5px 0; color: #c62828;"><strong>Status:</strong> Payment Failed</p>
              <p style="margin: 5px 0; color: #c62828;">Your order is still saved and you can retry the payment.</p>
            </div>

            <!-- What to Do -->
            <h3 style="color: #333; margin: 20px 0 10px 0;">What you can do:</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li style="margin: 10px 0;">Try the payment again</li>
              <li style="margin: 10px 0;">Check your M-Pesa balance</li>
              <li style="margin: 10px 0;">Use a different payment method</li>
              <li style="margin: 10px 0;">Contact our support team</li>
            </ul>

            <!-- Retry Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REACT_APP_BASE_URL || 'https://shopki.com'}/order-success?orderId=${orderId}" 
                 style="display: inline-block; background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Retry Payment
              </a>
            </div>

            <!-- Support -->
            <p style="color: #999; font-size: 14px; text-align: center; margin-bottom: 0;">
              Need help? Contact us at <a href="mailto:support@shopki.com" style="color: #f44336; text-decoration: none;">support@shopki.com</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f0f4ff; border-top: 1px solid #ddd; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Shopki. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Brevo
    const brevoClient = getBrevClient();
    const apiKey = process.env.REACT_APP_BREVO_API_KEY;
    const senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL || 'orders@shopki.com';

    if (apiKey) {
      try {
        await brevoClient.post('/smtp/email', {
          to: [{ email: customerEmail }],
          sender: {
            name: 'Shopki',
            email: senderEmail
          },
          subject: `Payment Failed - Order ${orderId}`,
          htmlContent
        });
        console.log(`✅ Payment failure email sent to ${customerEmail}`);
      } catch (error) {
        console.error('❌ Brevo email error:', error.response?.data || error.message);
      }
    } else {
      console.log('📧 Email would be sent to:', customerEmail);
      console.log('📧 Subject: Payment Failed - Order', orderId);
      console.log('📧 Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
    }
  } catch (error) {
    console.error('❌ Error sending payment failure email:', error.message);
  }
}

/**
 * POST /api/lipana/webhook
 * Webhook endpoint to receive payment status updates from Lipana (Lipa Na M-Pesa via Lipana)
 * - Verifies HMAC signature when `LIPANA_SECRET_KEY` is set
 * - Supports optional server-side Firestore updates when Firebase Admin is configured
 */
app.post('/api/lipana/webhook', async (req, res) => {
  try {
    // Get raw body captured by the JSON parser (preferred) or build one
    const signatureHeader = req.headers['x-lipana-signature'] || req.headers['x-signature'] || req.headers['x-webhook-signature'];
    let rawBody = req.rawBody;
    if (!rawBody) {
      if (typeof req.body === 'string') rawBody = req.body;
      else rawBody = JSON.stringify(req.body || {});
    }

    // Determine which secret to use for verifying webhooks. Lipana may sign
    // using a dedicated webhook secret (LIPANA_WEBHOOK_SECRET).
    const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET || process.env.LIPANA_SECRET_KEY || null;

    if (webhookSecret && signatureHeader) {
      const crypto = require('crypto');
      const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      // Debugging logs for signature mismatch investigations
      try {
        console.log('🔍 Webhook debug: incoming signature header:', String(signatureHeader));
        console.log('🔍 Webhook debug: computed signature:', computed);
        console.log('🔍 Webhook debug: rawBody length:', rawBody ? rawBody.length : 0);
        console.log('🔍 Webhook debug: rawBody (truncated 200 chars):', rawBody ? (rawBody.length>200? rawBody.slice(0,200)+'...': rawBody) : '');
      } catch (dbgErr) {
        console.warn('Could not log webhook debug info', dbgErr);
      }

      try {
        const compBuf = Buffer.from(computed, 'utf8');
        const sigBuf = Buffer.from(String(signatureHeader), 'utf8');
        if (compBuf.length !== sigBuf.length || !crypto.timingSafeEqual(compBuf, sigBuf)) {
          console.warn('❌ Lipana webhook signature mismatch');
          return res.status(401).json({ success: false, message: 'Invalid signature' });
        }
      } catch (e) {
        // Fallback simple compare if timingSafeEqual throws (shouldn't normally)
        if (computed !== String(signatureHeader)) {
          console.warn('❌ Lipana webhook signature mismatch (fallback)');
          return res.status(401).json({ success: false, message: 'Invalid signature' });
        }
      }

      console.log('✅ Lipana webhook signature verified');
    }

    // Parse payload
    let payload = {};
    try {
      if (Buffer.isBuffer(rawBody)) {
        payload = JSON.parse(rawBody.toString());
      } else if (typeof rawBody === 'string') {
        payload = JSON.parse(rawBody);
      } else {
        payload = rawBody; // Already an object
      }
    } catch (err) {
      console.warn('⚠️ Could not parse Lipana webhook body as JSON:', err.message);
      payload = {};
    }

    console.log('📥 Lipana webhook received:', JSON.stringify(payload));

    // Generic handler supporting common Lipana shapes.
    // Examples supported:
    // { event: 'payment.succeeded', data: { id, checkoutRequestId, amount, status, metadata: { orderId } } }
    // { type: 'payment', data: { status: 'success', checkoutRequestId, metadata: { orderId } } }

    const event = payload.event || payload.type || null;
    const data = payload.data || payload || {};

    // Extract identifiers
    const checkoutRequestId = data.checkoutRequestId || data.checkout_request_id || data.CheckoutRequestID || data.checkoutRequestID;
    const transactionId = data.id || data.transactionId || data.txnId || data.transaction_id;
    
    // Extract status from multiple sources (prioritize event, then data fields)
    // Lipana uses event field like: "transaction.success", "transaction.failed", "payout.initiated"
    let statusRaw = '';
    if (event) {
      statusRaw = event.toLowerCase();
    } else {
      statusRaw = (data.status || data.result || data.state || payload.status || '').toString().toLowerCase();
    }
    
    const metadata = data.metadata || data.meta || {};
    const orderId = metadata.orderId || metadata.order_id || metadata.order || null;

    // Log extracted values for debugging
    console.log(`🔍 Extracted webhook data:`);
    console.log(`   Event: ${event}`);
    console.log(`   Order ID: ${orderId || '(not in metadata)'}`);
    console.log(`   Transaction ID: ${transactionId || '(not found)'}`);
    console.log(`   Checkout Request ID: ${checkoutRequestId || '(not found)'}`);
    console.log(`   Status (raw): ${statusRaw}`);

    // Normalize status to completed/failed/pending
    let normalizedStatus = 'unknown';
    if (/success|completed|paid|ok|transaction\.success/.test(statusRaw)) normalizedStatus = 'completed';
    else if (/failed|error|declined|cancel|transaction\.failed/.test(statusRaw)) normalizedStatus = 'failed';
    else if (/pending|processing|waiting|payout\.initiated/.test(statusRaw)) normalizedStatus = 'pending';
    
    console.log(`   Status (normalized): ${normalizedStatus}`);

    // ACK the webhook immediately to stop Lipana retries; process update asynchronously
    try {
      res.status(200).json({ success: true, received: true });
    } catch (ackErr) {
      console.warn('Could not send immediate ACK to Lipana webhook:', ackErr && ackErr.message);
    }

    // Asynchronous processing to avoid blocking the webhook response
    (async () => {
      try {
        if (!adminDb) {
          console.log('Skipping Firestore update: Firebase Admin not initialized');
          return;
        }

        let orderDocRef = null;

        if (orderId) {
          orderDocRef = adminDb.collection('orders').doc(String(orderId));
          const orderSnap = await orderDocRef.get();
          if (orderSnap.exists) {
            const existing = orderSnap.data();
            const targetStatus = normalizedStatus === 'completed' ? 'completed' : (normalizedStatus === 'failed' ? 'failed' : 'pending');
            // Deduplicate: if transaction id and status already match, skip
            if (existing.transaction && existing.transaction.id && transactionId && String(existing.transaction.id) === String(transactionId) && existing.paymentStatus === targetStatus) {
              console.log(`ℹ️ Webhook duplicate - order ${orderId} already has transaction ${transactionId} with status ${targetStatus}`);
            } else {
              await orderDocRef.update({
                paymentStatus: targetStatus,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                transaction: {
                  id: transactionId || null,
                  checkoutRequestId: checkoutRequestId || null,
                  raw: data
                }
              });
              console.log(`✅ Updated order ${orderId} to ${normalizedStatus}`);
            }
          } else {
            console.warn(`Order ${orderId} not found for webhook update`);
          }
        } else if (checkoutRequestId || transactionId) {
          // Try to find order by transaction fields (look at top-level fields)
          const ordersRef = adminDb.collection('orders');
          let q = null;
          
          // Try top-level checkoutRequestID field first (as it's stored from frontend)
          if (checkoutRequestId) {
            q = ordersRef.where('checkoutRequestID', '==', checkoutRequestId).limit(1);
            console.log(`🔍 Searching for order by checkoutRequestID: ${checkoutRequestId}`);
          } else if (transactionId) {
            // Try simple mapping lookup first (fast path)
            try {
              const txRef = adminDb.collection('transactions').doc(String(transactionId));
              const txSnap = await txRef.get();
              if (txSnap.exists) {
                const txData = txSnap.data();
                if (txData && txData.orderId) {
                  const docRef = adminDb.collection('orders').doc(String(txData.orderId));
                  const docSnap = await docRef.get();
                  if (docSnap.exists) {
                    const existing = docSnap.data();
                    const targetStatus = normalizedStatus === 'completed' ? 'completed' : (normalizedStatus === 'failed' ? 'failed' : 'pending');
                    if (existing.transaction && existing.transaction.id && String(existing.transaction.id) === String(transactionId) && existing.paymentStatus === targetStatus) {
                      console.log(`ℹ️ Webhook duplicate - order ${txData.orderId} already up-to-date`);
                    } else {
                      await docRef.update({
                        paymentStatus: targetStatus,
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                        transaction: {
                          id: transactionId || null,
                          checkoutRequestId: checkoutRequestId || null,
                          raw: data
                        }
                      });
                      console.log(`✅ Updated order ${txData.orderId} via transactions mapping to ${normalizedStatus}`);
                    }
                    return;
                  }
                }
              }
            } catch (mapErr) {
              console.warn('Transaction mapping lookup failed, falling back to query:', mapErr && mapErr.message);
            }
            q = ordersRef.where('transactionId', '==', transactionId).limit(1);
            console.log(`🔍 Searching for order by transactionId: ${transactionId}`);
          }

          if (q) {
            const snaps = await q.get();
            if (!snaps.empty) {
              const doc = snaps.docs[0];
              console.log(`✅ Found order ${doc.id} by transaction identifier`);
              const existing = doc.data();
              const targetStatus = normalizedStatus === 'completed' ? 'completed' : (normalizedStatus === 'failed' ? 'failed' : 'pending');
              if (existing.transaction && existing.transaction.id && transactionId && String(existing.transaction.id) === String(transactionId) && existing.paymentStatus === targetStatus) {
                console.log(`ℹ️ Webhook duplicate - order ${doc.id} already up-to-date`);
              } else {
                await doc.ref.update({
                  paymentStatus: targetStatus,
                  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                  transaction: {
                    id: transactionId || null,
                    checkoutRequestId: checkoutRequestId || null,
                    raw: data
                  }
                });
                console.log(`✅ Updated order ${doc.id} via transaction lookup to ${normalizedStatus}`);
              }
            } else {
              console.warn(`❌ No matching order found by ${checkoutRequestId ? 'checkoutRequestID' : 'transactionId'}: ${checkoutRequestId || transactionId}`);
            }
          } else {
            console.warn('❌ No transaction identifiers available to search');
          }
        } else {
          console.warn('Webhook payload did not include orderId or transaction identifiers');
        }
      } catch (err) {
        console.error('Error updating Firestore from Lipana webhook (async):', err);
      }
    })();
  } catch (error) {
    console.error('Error handling Lipana webhook:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const brevoStatus = process.env.REACT_APP_BREVO_API_KEY ? 'configured' : 'not_configured';
  
  const mpesaStatus = process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_KEY !== 'your_key'
    ? 'configured'
    : 'not_configured';
  
  res.json({
    status: 'ok',
    message: 'Payment API server is running',
    brevo: brevoStatus,
    mpesa: mpesaStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

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
    }
    console.log(`   From: ${senderName} (${senderEmail})`);
    // Check if Brevo is configured
    if (!process.env.REACT_APP_BREVO_API_KEY) {
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

    // Send email via Brevo (uses sendTransactionalEmail helper)
    await sendTransactionalEmail({
      email: providerEmail,
      subject: `New Message from ${senderName} - ${serviceName}`,
      htmlContent: emailHtml
    });
    return res.json({
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
    }
    // Check if Brevo is configured
    if (!process.env.REACT_APP_BREVO_API_KEY) {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      console.log('   Message Preview:', message.substring(0, 100) + '...');
      
      return res.json({
        success: true,
        message: 'Notification logged to console (Brevo not configured)',
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

    // Send email via Brevo
    await sendTransactionalEmail({
      email: customerEmail,
      subject: `New Reply from ${providerName} - ${serviceName}`,
      htmlContent: emailHtml
    });
    return res.json({
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
    }
    if (!process.env.REACT_APP_BREVO_API_KEY) {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      return res.json({
        success: true,
        message: 'Notification logged to console (Brevo not configured)',
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

    await sendTransactionalEmail({
      email: vendorEmail,
      subject: `New Booking Request - ${serviceName}`,
      htmlContent: emailHtml
    });
    return res.json({
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
    }
    if (!process.env.REACT_APP_BREVO_API_KEY) {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      return res.json({
        success: true,
        message: 'Confirmation logged to console (Brevo not configured)',
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

    await sendTransactionalEmail({
      email: customerEmail,
      subject: `Booking Confirmation - ${serviceName}`,
      htmlContent: emailHtml
    });
    return res.json({
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
    }
    if (!process.env.REACT_APP_BREVO_API_KEY) {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      return res.json({
        success: true,
        message: 'Notification logged to console (Brevo not configured)',
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

    await sendTransactionalEmail({
      email: customerEmail,
      subject: `Booking Confirmed - ${serviceName}`,
      htmlContent: emailHtml
    });
    return res.json({
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
    }
    if (!process.env.REACT_APP_BREVO_API_KEY) {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (Brevo not configured)');
      return res.json({
        success: true,
        message: 'Notification logged to console (Brevo not configured)',
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

    await sendTransactionalEmail({
      email: customerEmail,
      subject: `Booking Rescheduled - ${serviceName}`,
      htmlContent: emailHtml
    });
    return res.json({
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
 * ========== LIPANA PAYMENT INTEGRATION ==========
 * Proxy endpoint for Lipana M-Pesa STK Push
 * Frontend calls this endpoint instead of Lipana directly (avoids CORS issues)
 */

/**
 * POST /api/lipana/initiate-stk-push
 * Initiate STK Push via Lipana API
 */
app.post('/api/lipana/initiate-stk-push', async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;
    
    console.log('✅ LIPANA REQUEST RECEIVED');
    console.log('📱 Phone:', phone);
    console.log('💰 Amount:', amount);
    console.log('📦 Order ID:', orderId);

    if (!phone || !amount) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone, amount'
      });
    }

    const lipanaSecretKey = process.env.LIPANA_SECRET_KEY;
    if (!lipanaSecretKey) {
      return res.status(500).json({
        success: false,
        error: 'Lipana API key not configured. Please check backend/.env'
      });
    }

    let formattedPhone = phone;
    if (phone.startsWith('07')) {
      formattedPhone = '+254' + phone.substring(1);
    } else if (phone.startsWith('254')) {
      formattedPhone = '+' + phone;
    } else if (!phone.startsWith('+254')) {
      formattedPhone = '+254' + phone;
    }

    console.log('📤 Calling Lipana API with phone:', formattedPhone, 'amount:', amount);
    
    const lipanaResponse = await fetch(
      'https://api.lipana.dev/v1/transactions/push-stk',
      {
        method: 'POST',
        headers: {
          'x-api-key': lipanaSecretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: parseInt(amount)
        })
      }
    );
    
    console.log('📥 Lipana response status:', lipanaResponse.status, lipanaResponse.statusText);

    const lipanaData = await lipanaResponse.json();
    console.log('📋 Lipana response data:', JSON.stringify(lipanaData, null, 2));

    if (lipanaResponse.ok && lipanaData.success) {
      console.log('✅ STK Push successful! Transaction ID:', lipanaData.data?.transactionId);
      
      // Build comprehensive response with transaction details
      const transactionResponse = {
        success: true,
        transactionId: lipanaData.data?.transactionId,
        checkoutRequestID: lipanaData.data?.checkoutRequestID,
        message: lipanaData.data?.message || 'STK push initiated successfully',
        orderId,
        // Additional transaction details for frontend tracking
        transaction: {
          id: lipanaData.data?.transactionId,
          checkoutRequestId: lipanaData.data?.checkoutRequestID,
          orderId: orderId,
          amount: parseInt(amount),
          phone: formattedPhone,
          status: 'pending',
          timestamp: new Date().toISOString(),
          expiresIn: 5 * 60 * 1000
        },
        instructions: 'Please enter your M-Pesa PIN on your phone to complete the payment.',
        nextSteps: 'Payment confirmation will be processed automatically.'
      };
      
      // Persist a lightweight transaction->order mapping and stamp order (if Firestore admin configured)
      if (adminDb) {
        (async () => {
          try {
            const txId = String(lipanaData.data?.transactionId || transactionResponse.transaction.id || '') || '';
            if (txId) {
              const txRef = adminDb.collection('transactions').doc(txId);
              await txRef.set({
                orderId: orderId || null,
                checkoutRequestId: lipanaData.data?.checkoutRequestID || null,
                amount: parseInt(amount) || null,
                phone: formattedPhone || null,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
              console.log(`✅ Wrote transaction mapping transactions/${txId} -> order ${orderId}`);
            }

            // Also write minimal transaction info on the order document to make future lookups fast
            if (orderId) {
              const orderRef = adminDb.collection('orders').doc(String(orderId));
              await orderRef.set({
                transaction: {
                  id: txId || null,
                  checkoutRequestId: lipanaData.data?.checkoutRequestID || null,
                  raw: lipanaData.data || null
                },
                checkoutRequestID: lipanaData.data?.checkoutRequestID || null,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
              console.log(`✅ Stamped order ${orderId} with transaction id ${txId}`);
            }
          } catch (err) {
            console.error('Error writing transaction mapping or stamping order:', err && err.message ? err.message : err);
          }
        })();
      }

      console.log('📤 Sending transaction response to frontend');
      return res.json(transactionResponse);
    } else {
      console.error('❌ Lipana API returned error:', lipanaData.message || 'Unknown error');
      
      const errorResponse = {
        success: false,
        error: lipanaData.message || 'Failed to initiate Lipana STK push',
        statusCode: lipanaResponse.status,
        orderId: orderId,
        recoveryOptions: [
          'Verify your phone number format (should start with 07 or 254)',
          'Ensure the amount is between 10-150000 KES',
          'Check that your phone has active M-Pesa service',
          'Try again in a few moments'
        ]
      };
      
      return res.status(lipanaResponse.status).json(errorResponse);
    }
  } catch (error) {
    console.error('Lipana STK Push error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Server error while initiating Lipana payment',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      recoveryOptions: [
        'Check your internet connection',
        'Try the payment again',
        'Contact support if the issue persists'
      ]
    };
    
    return res.status(500).json(errorResponse);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n🚀 ===============================================');
  console.log(`✅ BACKEND SERVER RUNNING ON PORT ${PORT}`);
  console.log('🚀 ===============================================\n');
  console.log(`Brevo Status: ${process.env.REACT_APP_BREVO_API_KEY ? '✅ Configured' : '⚠️ Not configured (emails logged to console)'}`);
  console.log(`Lipana Status: ${process.env.LIPANA_SECRET_KEY ? '✅ Configured' : '⚠️ Not configured'}\n`);
});

/**
 * PayPal create & capture endpoints
 */
app.post('/api/payments/paypal/create', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
    const base = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(500).json({ error: 'PayPal credentials not configured' });

    // Get access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResp = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`
      }
    });
    const accessToken = tokenResp.data.access_token;

    // Create order
    const currency = process.env.PAYPAL_CURRENCY || 'USD';
    const orderResp = await axios.post(`${base}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: Number(amount).toFixed(2) } }]
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.json({ orderID: orderResp.data.id, data: orderResp.data });
  } catch (error) {
    console.error('PayPal create error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/api/payments/paypal/capture', async (req, res) => {
  try {
    const { orderID } = req.body;
    if (!orderID) return res.status(400).json({ error: 'orderID is required' });

    const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
    const base = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(500).json({ error: 'PayPal credentials not configured' });

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResp = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`
      }
    });
    const accessToken = tokenResp.data.access_token;

    const captureResp = await axios.post(`${base}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.json(captureResp.data);
  } catch (error) {
    console.error('PayPal capture error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

/**
 * Stripe card payment endpoints
 */
app.post('/api/payments/stripe/create-intent', async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || !orderId) return res.status(400).json({ error: 'Amount and orderId are required' });

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
      metadata: { orderId }
    });

    return res.json({ clientSecret: paymentIntent.client_secret, intentId: paymentIntent.id });
  } catch (error) {
    console.error('Stripe create intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/stripe/confirm', async (req, res) => {
  try {
    const { intentId } = req.body;
    if (!intentId) return res.status(400).json({ error: 'intentId is required' });

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(intentId);
    
    return res.json(intent);
  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});
