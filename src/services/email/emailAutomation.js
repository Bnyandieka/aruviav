// Email Automation Service
// Handles automated emails for various user actions

import {
  sendTransactionalEmail,
  subscribeToNewsletter,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendWelcomeEmail,
  getEmailTemplate,
  replaceTemplateVariables
} from './brevoService';
import { toast } from 'react-toastify';

/**
 * Send account confirmation email
 * @param {string} email - User email
 * @param {string} displayName - User name
 * @param {string} confirmationLink - Email confirmation link
 * @returns {Promise}
 */
export const sendAccountConfirmationEmail = async (email, displayName, confirmationLink = null) => {
  try {
    // Fetch the 'welcome' email template from admin settings
    const template = await getEmailTemplate('welcome');
    
    let htmlContent;
    if (template && template.htmlContent) {
      // Use admin-configured template with variable replacement
      const variables = {
        displayName: displayName || 'User',
        email: email,
        confirmationLink: confirmationLink || '',
        currentYear: new Date().getFullYear()
      };
      htmlContent = replaceTemplateVariables(template.htmlContent, variables);
    } else {
      // Fallback to default template if admin template not configured
      htmlContent = `
        <h2>Welcome to Shopki, ${displayName}!</h2>
        <p>Your account has been created successfully.</p>
        ${confirmationLink ? `
        <p>To verify your email address, click the button below:</p>
        <a href="${confirmationLink}" style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
        ` : `
        <p>Your email has been verified. You can now enjoy all Shopki features.</p>
        `}
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          Shopki Team<br>
          We're here to help at support@shopki.com
        </p>
      `;
    }

    const result = await sendTransactionalEmail({
      email,
      subject: 'Welcome to Shopki! Verify Your Email',
      htmlContent
    });

    if (result.success) {
      console.log('✅ Account confirmation email sent to:', email);
    } else {
      console.error('❌ Failed to send confirmation email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error sending account confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send newsletter subscription confirmation
 * @param {string} email - Subscriber email
 * @param {string} displayName - Subscriber name
 * @returns {Promise}
 */
export const sendNewsletterConfirmation = async (email, displayName) => {
  try {
    const htmlContent = `
      <h2>Thank You for Subscribing!</h2>
      <p>Hi ${displayName},</p>
      <p>You've successfully subscribed to the Shopki newsletter.</p>
      <p>You'll receive:</p>
      <ul>
        <li>🎁 Exclusive deals and promotions</li>
        <li>📦 New product arrivals</li>
        <li>💝 Special offers for subscribers</li>
        <li>📚 Shopping tips and trends</li>
      </ul>
      <p style="margin-top: 20px;">Manage your preferences anytime in your account settings.</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        © ${new Date().getFullYear()} Shopki. All rights reserved.
      </p>
    `;

    const result = await sendTransactionalEmail({
      email,
      subject: 'Welcome to Shopki Newsletter!',
      htmlContent
    });

    if (result.success) {
      console.log('✅ Newsletter confirmation email sent to:', email);
    } else {
      console.error('❌ Failed to send newsletter confirmation:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error sending newsletter confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation with automation trigger
 * @param {string} email - Customer email
 * @param {object} orderData - Order information
 * @returns {Promise}
 */
export const sendOrderConfirmation = async (email, orderData) => {
  try {
    const result = await sendOrderConfirmationEmail(email, orderData);

    if (result.success) {
      console.log('✅ Order confirmation email sent for order:', orderData.id);
      // Log email event for automation
      logEmailEvent('order_confirmation', email, orderData.id);
    } else {
      console.error('❌ Failed to send order confirmation:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status update email
 * @param {string} email - Customer email
 * @param {object} orderData - Order information
 * @returns {Promise}
 */
export const sendOrderStatusUpdate = async (email, orderData) => {
  try {
    const result = await sendOrderStatusEmail(email, orderData);

    if (result.success) {
      console.log('✅ Order status email sent for order:', orderData.id);
      // Log email event for automation
      logEmailEvent('order_status_update', email, orderData.id);
    } else {
      console.error('❌ Failed to send order status email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error sending order status update:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send promotional email to newsletter subscribers
 * @param {string} email - Recipient email
 * @param {object} promoData - Promotion details
 * @returns {Promise}
 */
export const sendPromotionalEmail = async (email, promoData) => {
  try {
    const htmlContent = `
      <h2>${promoData.title || 'Special Offer for You!'}</h2>
      <p>${promoData.message || 'Check out our latest deals!'}</p>
      ${promoData.products && promoData.products.length > 0 ? `
      <h3>Featured Products:</h3>
      <ul>
        ${promoData.products.map(product => `
        <li><strong>${product.name}</strong> - KES ${product.price.toLocaleString()} 
          ${product.discount ? `<span style="color: #ff9800;"> (${product.discount}% OFF)</span>` : ''}
        </li>
        `).join('')}
      </ul>
      ` : ''}
      <a href="${process.env.REACT_APP_BASE_URL}/products" style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">
        Shop Now
      </a>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        ${promoData.expiryDate ? `Offer valid until ${new Date(promoData.expiryDate).toLocaleDateString()}` : ''}
      </p>
    `;

    const result = await sendTransactionalEmail({
      email,
      subject: promoData.subject || 'Special Offer Just for You!',
      htmlContent
    });

    if (result.success) {
      console.log('✅ Promotional email sent to:', email);
      logEmailEvent('promotional', email, promoData.campaignId);
    }

    return result;
  } catch (error) {
    console.error('Error sending promotional email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send abandoned cart reminder email
 * @param {string} email - Customer email
 * @param {array} cartItems - Items in abandoned cart
 * @param {number} cartTotal - Total amount
 * @returns {Promise}
 */
export const sendAbandonedCartEmail = async (email, cartItems, cartTotal) => {
  try {
    const itemsHtml = cartItems.map(item => `
      <li>
        <strong>${item.name}</strong> - KES ${(item.price * item.quantity).toLocaleString()} 
        (x${item.quantity})
      </li>
    `).join('');

    const htmlContent = `
      <h2>You Left Something Behind!</h2>
      <p>You have items waiting in your cart. Complete your purchase to get your order started.</p>
      <h3>Items in Your Cart:</h3>
      <ul>
        ${itemsHtml}
      </ul>
      <p style="font-size: 18px; font-weight: bold;">Cart Total: KES ${cartTotal.toLocaleString()}</p>
      <a href="${process.env.REACT_APP_BASE_URL}/cart" style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">
        Complete Purchase
      </a>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This cart will expire in 7 days.
      </p>
    `;

    const result = await sendTransactionalEmail({
      email,
      subject: 'Complete Your Purchase - Items Waiting!',
      htmlContent
    });

    if (result.success) {
      console.log('✅ Abandoned cart email sent to:', email);
      logEmailEvent('abandoned_cart', email);
    }

    return result;
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log email events for automation tracking
 * @param {string} eventType - Type of email event
 * @param {string} email - Recipient email
 * @param {string} reference - Reference ID (order, campaign, etc.)
 */
const logEmailEvent = (eventType, email, reference = null) => {
  try {
    // Log to console for now
    console.log(`📧 Email Event: ${eventType} | Email: ${email} | Reference: ${reference || 'N/A'}`);
    
    // In production, this could be sent to analytics service
    // or stored in Firestore for automation tracking
  } catch (error) {
    console.error('Error logging email event:', error);
  }
};

/**
 * Register user for newsletter
 * @param {string} email - User email
 * @param {string} displayName - User name
 * @returns {Promise}
 */
export const registerForNewsletter = async (email, displayName) => {
  try {
    // Subscribe to Brevo list
    const subscriptionResult = await subscribeToNewsletter({
      email,
      firstName: displayName.split(' ')[0],
      lastName: displayName.split(' ').slice(1).join(' ')
    });

    if (subscriptionResult.success) {
      // Send confirmation email
      await sendNewsletterConfirmation(email, displayName);
      console.log('✅ User registered for newsletter:', email);
      return { success: true };
    } else {
      console.error('❌ Failed to register for newsletter:', subscriptionResult.error);
      return subscriptionResult;
    }
  } catch (error) {
    console.error('Error registering for newsletter:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendAccountConfirmationEmail,
  sendNewsletterConfirmation,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendPromotionalEmail,
  sendAbandonedCartEmail,
  registerForNewsletter
};
