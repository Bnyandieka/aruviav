// Brevo Email Service
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DEFAULT_EMAIL_TEMPLATES } from '../../utils/defaultEmailTemplates';
import { saveEmailToAdminInbox } from './adminEmailService';

const BREVO_API_BASE = 'https://api.brevo.com/v3';

// Get API key dynamically to ensure it's available
const getBrevClient = () => {
  const apiKey = process.env.REACT_APP_BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ REACT_APP_BREVO_API_KEY is not set. Emails will fail.');
  }
  
  return axios.create({
    baseURL: BREVO_API_BASE,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
};

// Fetch logo URL from Firestore
export const getLogoUrl = async () => {
  try {
    const docRef = doc(db, 'settings', 'branding');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().logoUrl) {
      return docSnap.data().logoUrl;
    }
    return `${process.env.REACT_APP_BASE_URL}/logo.png`; // Fallback
  } catch (err) {
    console.error('Error fetching logo URL:', err);
    return `${process.env.REACT_APP_BASE_URL}/logo.png`; // Fallback
  }
};

// Fetch email template from Firestore with fallback to defaults
export const getEmailTemplate = async (templateType) => {
  try {
    const docRef = doc(db, 'emailTemplates', templateType);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Return default template if custom not found
    return DEFAULT_EMAIL_TEMPLATES[templateType] || null;
  } catch (err) {
    console.error(`Error fetching email template (${templateType}):`, err);
    // Fallback to default template
    return DEFAULT_EMAIL_TEMPLATES[templateType] || null;
  }
};

// Replace template variables with actual values
export const replaceTemplateVariables = (template, variables) => {
  let content = template;
  
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, variables[key] || '');
  });
  
  return content;
};

/**
 * Send transactional email via Brevo
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content
 * @param {string} senderName - Sender name
 * @param {string} senderEmail - Sender email
 * @param {Object} options - { saveToAdminInbox, emailType, relatedData }
 * @returns {Promise}
 */
export const sendTransactionalEmail = async ({
  email,
  subject,
  htmlContent,
  senderName = 'Aruviah',
  senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL,
  saveToAdminInbox = true,
  emailType = 'general',
  relatedData = {}
}) => {
  try {
    const brevoClient = getBrevClient();
    const response = await brevoClient.post('/smtp/email', {
      to: [{ email }],
      sender: { 
        name: senderName, 
        email: senderEmail 
      },
      subject,
      htmlContent
    });
    // Save to admin inbox if enabled
    let adminSaveResult = null;
    if (saveToAdminInbox) {
      try {
        adminSaveResult = await saveEmailToAdminInbox({
          to: email,
          from: senderEmail || 'noreply@aruviah.com',
          subject,
          htmlContent,
          type: emailType,
          relatedData,
          isSent: true // Mark as sent email
        });
        
        if (adminSaveResult.success) {
        } else {
          console.error('❌ Failed to save to admin inbox:', adminSaveResult.error);
        }
      } catch (saveError) {
        console.error('❌ Error saving to admin inbox:', saveError);
        adminSaveResult = { success: false, error: saveError.message };
      }
    }
    
    return { 
      success: true, 
      messageId: response.data.messageId,
      adminEmailId: adminSaveResult?.emailId || null 
    };
  } catch (error) {
    console.error('❌ Brevo email error:', error.response?.data || error.message);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Alias for sendTransactionalEmail for compatibility
 * Handles both object and positional argument styles
 */
export const sendBrevEmail = async (arg1, arg2, arg3) => {
  // Handle object argument style: sendBrevEmail({ to, subject, htmlContent })
  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
    return sendTransactionalEmail(arg1);
  }
  // Handle positional argument style: sendBrevEmail(email, subject, htmlContent)
  else {
    return sendTransactionalEmail({
      email: arg1,
      subject: arg2,
      htmlContent: arg3
    });
  }
};

/**
 * Add subscriber to newsletter list
 * @param {string} email - Subscriber email
 * @param {string} firstName - Subscriber first name
 * @param {string} lastName - Subscriber last name
 * @returns {Promise}
 */
export const subscribeToNewsletter = async ({ email, firstName = '', lastName = '' }) => {
  try {
    // Validate newsletter list ID
    const listId = process.env.REACT_APP_BREVO_NEWSLETTER_LIST_ID;
    if (!listId || isNaN(parseInt(listId))) {
      console.error('❌ REACT_APP_BREVO_NEWSLETTER_LIST_ID is not properly configured. Set it in your .env file.');
      return { 
        success: false, 
        error: 'Newsletter list ID is not configured. Please contact support.' 
      };
    }

    const brevoClient = getBrevClient();
    const response = await brevoClient.post('/contacts', {
      email,
      firstName,
      lastName,
      listIds: [parseInt(listId)],
      updateEnabled: true
    });
    return { success: true, contactId: response.data.id };
  } catch (error) {
    console.error('❌ Brevo subscription error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Send order confirmation email
 * @param {string} email - Customer email
 * @param {object} orderData - Order information
 * @returns {Promise}
 */
export const sendOrderConfirmationEmail = async (email, orderData) => {
  try {
    // Fetch the 'orderConfirmation' email template from admin settings
    const template = await getEmailTemplate('orderConfirmation');
    
    // Prepare order items HTML
    const itemsHtml = orderData.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 15px; color: #333;">${item.name}</td>
        <td style="padding: 15px; text-align: center; color: #666;">x${item.quantity}</td>
        <td style="padding: 15px; text-align: right; color: #ff9800; font-weight: 600;">KES ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const orderDate = new Date(orderData.createdAt || orderData.orderDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let htmlContent;
    if (template && template.htmlContent) {
      // Use admin-configured template with variable replacement
      const variables = {
        orderNumber: orderData.id.slice(0, 12).toUpperCase(),
        orderDate: orderDate,
        items: itemsHtml,
        subtotal: orderData.subtotal ? orderData.subtotal.toLocaleString() : orderData.total.toLocaleString(),
        total: orderData.total.toLocaleString(),
        shippingFee: orderData.shippingFee ? orderData.shippingFee.toLocaleString() : 'Free',
        trackingUrl: `${process.env.REACT_APP_BASE_URL}/orders/${orderData.id}`,
        currentYear: new Date().getFullYear()
      };
      htmlContent = replaceTemplateVariables(template.htmlContent, variables);
    } else {
      // Fallback to default template if admin template not configured
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .badge { display: inline-block; background-color: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
              .content { padding: 40px 30px; }
              .section { margin: 25px 0; }
              .order-info { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .order-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
              .info-item { font-size: 14px; }
              .info-label { color: #ff9800; font-weight: 600; margin-bottom: 4px; }
              .info-value { color: #333; font-size: 16px; font-weight: 500; }
              h2 { color: #333; margin-bottom: 10px; border-bottom: 3px solid #ff9800; padding-bottom: 10px; }
              h3 { color: #ff9800; font-size: 16px; margin: 20px 0 15px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .items-table thead tr { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; }
              .items-table th { padding: 15px; text-align: left; font-weight: 600; }
              .summary { background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .summary-row:last-child { border-bottom: none; }
              .total-row { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 15px; border-radius: 6px; font-size: 18px; font-weight: 700; margin-top: 15px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .cta-button:hover { transform: translateY(-2px); }
              .delivery-info { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; color: #2e7d32; font-weight: 500; }
              .footer { background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; border-radius: 0 0 8px 8px; }
              .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
              @media (max-width: 600px) {
                .content { padding: 20px 15px; }
                .header { padding: 30px 15px; }
                .order-info-grid { grid-template-columns: 1fr; }
                .items-table { font-size: 14px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Order Confirmed!</h1>
                <div class="badge">Your order has been received</div>
              </div>
              
              <div class="content">
                <p style="font-size: 16px; color: #555;">Thank you for shopping with <strong>Aruviah</strong>! We're excited to get your order ready.</p>
                
                <div class="order-info">
                  <div class="order-info-grid">
                    <div class="info-item">
                      <div class="info-label">Order ID</div>
                      <div class="info-value">${orderData.id.slice(0, 12).toUpperCase()}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Order Date</div>
                      <div class="info-value">${orderDate}</div>
                    </div>
                  </div>
                </div>
                
                <h2>📦 Order Items</h2>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                
                <div class="summary">
                  <div class="summary-row">
                    <span style="color: #666;">Subtotal:</span>
                    <span style="color: #666;">KES ${orderData.total.toLocaleString()}</span>
                  </div>
                  <div class="summary-row">
                    <span style="color: #666;">Shipping:</span>
                    <span style="color: #4caf50; font-weight: 600;">Free</span>
                  </div>
                  <div class="total-row">
                    <span>Total Paid: KES ${orderData.total.toLocaleString()}</span>
                  </div>
                </div>
                
                <div class="delivery-info">
                  📍 Estimated Delivery: 3-5 Business Days
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.REACT_APP_BASE_URL}/orders/${orderData.id}" class="cta-button">Track Your Order</a>
                </div>
                
                <hr class="divider">
                
                <h3>📝 What's Next?</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>We'll prepare your items for shipment</li>
                  <li>You'll receive a shipping notification with tracking details</li>
                  <li>Track your order in real-time from your dashboard</li>
                  <li>Questions? Visit our <a href="${process.env.REACT_APP_BASE_URL}/contact" style="color: #ff9800;">support page</a></li>
                </ul>
                
                <hr class="divider">
                
                <p style="font-size: 14px; color: #888; text-align: center;">
                  Thank you for being part of the Aruviah family! Happy shopping! 🛍️
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 10px 0;">© 2025 Aruviah. All rights reserved.</p>
                <p style="margin: 10px 0; font-size: 11px;">This is an automated order confirmation. Please do not reply to this email.</p>
                <p style="margin: 10px 0;"><a href="${process.env.REACT_APP_BASE_URL}/privacy" style="color: #ff9800; text-decoration: none;">Privacy Policy</a> | <a href="${process.env.REACT_APP_BASE_URL}/terms" style="color: #ff9800; text-decoration: none;">Terms & Conditions</a></p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    return sendTransactionalEmail({
      email,
      subject: `✅ Order Confirmed - Aruviah Order #${orderData.id.slice(0, 8).toUpperCase()}`,
      htmlContent
    });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status update email
 * @param {string} email - Customer email
 * @param {object} orderData - Order information
 * @returns {Promise}
 */
export const sendOrderStatusEmail = async (email, orderData) => {
  try {
    // Map status to specific template, or use generic orderStatus template
    const statusTemplateMap = {
      pending: 'orderPending',
      confirmed: 'orderConfirmed',
      processing: 'orderProcessing',
      shipped: 'orderShipped',
      completed: 'orderCompleted',
      cancelled: 'orderCancelled',
      returned: 'orderReturned'
    };
    
    const templateType = statusTemplateMap[orderData.status] || 'orderStatus';
    
    // Try to fetch status-specific template, fallback to generic orderStatus
    let template = await getEmailTemplate(templateType);
    if (!template || !template.htmlContent) {
      template = await getEmailTemplate('orderStatus');
    }
    
    const statusMessages = {
      pending: 'Your order has been received and is being prepared.',
      confirmed: 'Your order has been confirmed by the vendor and will be processed soon.',
      processing: 'Your order is being processed and will be shipped soon.',
      shipped: 'Your order has been shipped! Track your package with the tracking number below.',
      completed: 'Your order has been delivered. We hope you enjoy your purchase!',
      cancelled: 'Your order has been cancelled.',
      returned: 'Your return has been processed.'
    };

    let htmlContent;
    if (template && template.htmlContent) {
      // Use admin-configured template with variable replacement
      const variables = {
        orderNumber: orderData.id.slice(0, 12).toUpperCase(),
        status: orderData.status.toUpperCase(),
        statusMessage: statusMessages[orderData.status] || 'Your order status has been updated.',
        trackingNumber: orderData.trackingNumber || '',
        trackingUrl: `${process.env.REACT_APP_BASE_URL}/orders/${orderData.id}`,
        currentYear: new Date().getFullYear()
      };
      htmlContent = replaceTemplateVariables(template.htmlContent, variables);
    } else {
      // Fallback to default template if admin template not configured
      htmlContent = `
        <h2>Order Status Update</h2>
        <p><strong>Order ID:</strong> ${orderData.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>New Status:</strong> ${orderData.status.toUpperCase()}</p>
        <p>${statusMessages[orderData.status] || 'Your order status has been updated.'}</p>
        ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
        <p><a href="${process.env.REACT_APP_BASE_URL}/orders/${orderData.id}">View Order Details</a></p>
      `;
    }

    return sendTransactionalEmail({
      email,
      subject: `Order Status Update - Order #${orderData.id.slice(0, 8).toUpperCase()}`,
      htmlContent
    });
  } catch (error) {
    console.error('Error sending order status email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new subscriber/account holder
 * @param {string} email - Subscriber email
 * @param {string} firstName - User's first name (optional)
 * @returns {Promise}
 */
export const sendWelcomeEmail = async (email, firstName = 'Valued Customer') => {
  const logoUrl = await getLogoUrl();
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
          .logo { max-width: 160px; height: auto; margin: 0 auto; display: block; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 600; display: none; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; line-height: 1.8; }
          .section { margin: 25px 0; }
          .section h3 { color: #ff9800; font-size: 18px; margin: 15px 0 12px 0; border-bottom: 2px solid #ff9800; padding-bottom: 8px; }
          .section p { color: #555; margin: 10px 0; }
          .benefits { list-style: none; padding: 0; margin: 10px 0; }
          .benefits li { padding: 10px 0; padding-left: 25px; position: relative; color: #555; }
          .benefits li:before { content: "✓"; position: absolute; left: 0; color: #ff9800; font-weight: bold; font-size: 18px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
          .cta-button:hover { transform: translateY(-2px); }
          .secondary-button { display: inline-block; background-color: #f5f5f5; color: #ff9800; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 10px 10px 0; border: 2px solid #ff9800; }
          .secondary-button:hover { background-color: #fff3e0; }
          .highlight-box { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .highlight-box p { margin: 0; color: #333; font-weight: 500; }
          .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .feature-item { background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 3px solid #ff9800; }
          .feature-item strong { color: #ff9800; display: block; margin-bottom: 5px; }
          .feature-item p { margin: 0; font-size: 14px; color: #555; }
          .footer { background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          .footer a { color: #ff9800; text-decoration: none; }
          .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
          @media (max-width: 600px) {
            .content { padding: 20px 15px; }
            .header { padding: 30px 15px; }
            .header h1 { font-size: 24px; }
            .feature-grid { grid-template-columns: 1fr; }
            .logo { max-width: 100px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="data:image/png;base64,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
" alt="Aruviah Logo" class="logo">
            <h1>Welcome to Aruviah! 🎉</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hello <strong>${firstName}</strong>,</p>
            <p>Thank you for joining <strong>Aruviah</strong>! We're thrilled to welcome you to our community of smart shoppers. Get ready to discover amazing products at incredible prices.</p>
            
            <div class="highlight-box">
              <p>🎁 Exclusive New Member Offer: Enjoy special discounts on your first purchase! Check your dashboard for your personalized welcome offer.</p>
            </div>
            
            <h3>🛍️ What You Can Expect</h3>
            <ul class="benefits">
              <li>Access to exclusive deals and flash sales</li>
              <li>Early access to new product launches</li>
              <li>Reward points on every purchase</li>
              <li>Personalized shopping recommendations</li>
              <li>Priority customer support</li>
            </ul>
            
            <div class="feature-grid">
              <div class="feature-item">
                <strong>⚡ Fast Checkout</strong>
                <p>Secure payment options with one-click ordering</p>
              </div>
              <div class="feature-item">
                <strong>📦 Free Shipping</strong>
                <p>On orders over a certain amount</p>
              </div>
              <div class="feature-item">
                <strong>🔒 Secure</strong>
                <p>Your data is protected with top security</p>
              </div>
              <div class="feature-item">
                <strong>✨ Premium Quality</strong>
                <p>Curated products from trusted brands</p>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.REACT_APP_BASE_URL}" class="cta-button">Start Shopping Now</a>
            </div>
            
            <hr class="divider">
            
            <h3>📝 Getting Started is Easy</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li>Complete your profile with your preferences</li>
              <li>Browse our extensive collection of products</li>
              <li>Add items to your wishlist for easy access</li>
              <li>Subscribe to our newsletter for exclusive deals</li>
              <li>Make your first purchase and start earning rewards</li>
            </ol>
            
            <hr class="divider">
            
            <h3>❓ Need Help?</h3>
            <p>We're here to help! Visit our support resources:</p>
            <ul class="benefits">
              <li><a href="${process.env.REACT_APP_BASE_URL}/faq" style="color: #ff9800; text-decoration: none;">Frequently Asked Questions</a></li>
              <li><a href="${process.env.REACT_APP_BASE_URL}/contact" style="color: #ff9800; text-decoration: none;">Contact Us</a></li>
              <li>Email: support@aruviah.com</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REACT_APP_BASE_URL}/profile" class="secondary-button">Complete Your Profile</a>
            </div>
            
            <hr class="divider">
            
            <p style="font-size: 16px; color: #ff9800; text-align: center; font-weight: 600;">
              Happy shopping! We're excited to serve you! 🚀
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 10px 0;"><strong>Aruviah - Your Trusted Online Marketplace</strong></p>
            <p style="margin: 10px 0; font-size: 11px;">© 2025 Aruviah. All rights reserved.</p>
            <p style="margin: 10px 0; font-size: 11px;">You're receiving this email because you created an account with Aruviah.</p>
            <p style="margin: 10px 0;"><a href="${process.env.REACT_APP_BASE_URL}/privacy">Privacy Policy</a> | <a href="${process.env.REACT_APP_BASE_URL}/terms">Terms & Conditions</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendTransactionalEmail({
    email,
    subject: `Welcome to Aruviah, ${firstName}! 🎉 Start Shopping Today`,
    htmlContent
  });
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const template = await getEmailTemplate('passwordReset');
    
    if (!template) {
      console.error('Password reset email template not found');
      return { success: false, error: 'Template not found' };
    }

    const htmlContent = replaceTemplateVariables(template.htmlContent, {
      resetLink,
      expirationTime: '1 hour',
      email
    });

    return sendTransactionalEmail({
      email,
      subject: template.subject,
      htmlContent
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch newsletter subscribers from a specific list
 * @param {number} listId - Brevo list ID (optional, defaults to newsletter list)
 * @param {number} limit - Number of subscribers to fetch (default: 500)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise}
 */
export const getNewsletterSubscribers = async (listId = null, limit = 500, offset = 0) => {
  try {
    const id = listId || parseInt(process.env.REACT_APP_BREVO_NEWSLETTER_LIST_ID);
    if (!id || isNaN(id)) {
      console.error('❌ Newsletter list ID is not configured');
      return { success: false, error: 'Newsletter list ID not configured', contacts: [] };
    }

    const brevoClient = getBrevClient();
    const response = await brevoClient.get(`/contacts/lists/${id}/contacts`, {
      params: {
        limit,
        offset,
        sort: 'desc'
      }
    });
    return { 
      success: true, 
      contacts: response.data.contacts || [],
      totalCount: response.data.count || 0,
      totalPages: Math.ceil((response.data.count || 0) / limit)
    };
  } catch (error) {
    console.error('❌ Error fetching newsletter subscribers:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      contacts: []
    };
  }
};

export default {
  sendTransactionalEmail,
  sendBrevEmail: sendTransactionalEmail, // Alias for compatibility
  subscribeToNewsletter,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendWelcomeEmail,
  getEmailTemplate,
  replaceTemplateVariables,
  getLogoUrl,
  getNewsletterSubscribers
};
