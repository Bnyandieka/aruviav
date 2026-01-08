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
        <h2>Welcome to Aruviah, ${displayName}!</h2>
        <p>Your account has been created successfully.</p>
        ${confirmationLink ? `
        <p>To verify your email address, click the button below:</p>
        <a href="${confirmationLink}" style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
        ` : `
        <p>Your email has been verified. You can now enjoy all Aruviah features.</p>
        `}
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          Aruviah Team<br>
          We're here to help at support@aruviah.com
        </p>
      `;
    }

    const result = await sendTransactionalEmail({
      email,
      subject: 'Welcome to Aruviah! Verify Your Email',
      htmlContent
    });

    if (result.success) {    } else {
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
    // Fetch the newsletter email template from admin settings
    const template = await getEmailTemplate('newsletter');
    
    let htmlContent;
    let subject = 'Welcome to Aruviah Newsletter!';

    if (template && template.htmlContent) {
      // Use admin-configured template with variable replacement
      const variables = {
        displayName: displayName || 'Subscriber',
        email: email,
        unsubscribeLink: `${process.env.REACT_APP_BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
        currentYear: new Date().getFullYear()
      };
      htmlContent = replaceTemplateVariables(template.htmlContent, variables);
      if (template.subject) {
        subject = template.subject;
      }
    } else {
      // Fallback to default template
      htmlContent = `
        <h2>Thank You for Subscribing!</h2>
        <p>Hi ${displayName},</p>
        <p>You've successfully subscribed to the Aruviah newsletter.</p>
        <p>You'll receive:</p>
        <ul>
          <li>🎁 Exclusive deals and promotions</li>
          <li>📦 New product arrivals</li>
          <li>💝 Special offers for subscribers</li>
          <li>📚 Shopping tips and trends</li>
        </ul>
        <p style="margin-top: 20px;">Manage your preferences anytime in your account settings.</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} Aruviah. All rights reserved.
        </p>
      `;
    }

    const result = await sendTransactionalEmail({
      email,
      subject,
      htmlContent
    });

    if (result.success) {    } else {
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

    if (result.success) {      // Log email event for automation
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

    if (result.success) {      // Log email event for automation
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

    if (result.success) {      logEmailEvent('promotional', email, promoData.campaignId);
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

    if (result.success) {      logEmailEvent('abandoned_cart', email);
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
    // Log to console for now    // In production, this could be sent to analytics service
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
      await sendNewsletterConfirmation(email, displayName);      return { success: true };
    } else {
      console.error('❌ Failed to register for newsletter:', subscriptionResult.error);
      return subscriptionResult;
    }
  } catch (error) {
    console.error('Error registering for newsletter:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send vendor application approved email
 * @param {string} email - User email
 * @param {string} displayName - User name
 * @param {string} businessName - Vendor business name
 * @returns {Promise}
 */
export const sendVendorApprovedEmail = async (email, displayName, businessName) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">🎉 Welcome to Aruviah Vendor Program!</h2>
        
        <p>Hi ${displayName},</p>
        
        <p>Great news! Your vendor application for <strong>${businessName}</strong> has been <strong style="color: #28a745;">APPROVED</strong>!</p>
        
        <p>You can now access the vendor dashboard to:</p>
        <ul style="color: #555; line-height: 1.8;">
          <li>📦 Post and manage your products</li>
          <li>📊 View sales analytics and reports</li>
          <li>🛒 Manage customer orders</li>
          <li>💰 Track your revenue</li>
          <li>⚙️ Update your business information</li>
        </ul>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.REACT_APP_SITE_URL || 'https://localhost:3000'}/vendor/dashboard" 
             style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Go to Vendor Dashboard
          </a>
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          If you have any questions, please contact our vendor support team.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Best regards,<br/>
          <strong>Aruviah Vendor Team</strong><br/>
          ${new Date().getFullYear()}
        </p>
      </div>
    `;

    return await sendTransactionalEmail({
      email,
      subject: `🎉 Vendor Application Approved - ${businessName}`,
      htmlContent,
      senderName: 'Aruviah Vendor Team'
    });
  } catch (error) {
    console.error('Error sending vendor approved email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send vendor application rejected email
 * @param {string} email - User email
 * @param {string} displayName - User name
 * @param {string} businessName - Vendor business name
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const sendVendorRejectedEmail = async (email, displayName, businessName, rejectionReason) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Application Review Decision</h2>
        
        <p>Hi ${displayName},</p>
        
        <p>Thank you for applying to become an Aruviah vendor. After careful review, we have decided to <strong style="color: #dc3545;">not approve</strong> your application at this time.</p>
        
        <h3 style="color: #333; margin-top: 20px;">Reason for Decision:</h3>
        <p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; color: #555;">
          ${rejectionReason || 'Thank you for your interest in our vendor program.'}
        </p>
        
        <h3 style="color: #333; margin-top: 20px;">What's Next?</h3>
        <p>We encourage you to:</p>
        <ul style="color: #555; line-height: 1.8;">
          <li>Review the feedback provided above</li>
          <li>Make any necessary improvements to your business documentation</li>
          <li>Reapply in 30 days if you feel you've addressed the concerns</li>
        </ul>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.REACT_APP_SITE_URL || 'https://localhost:3000'}/vendor-signup" 
             style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Learn More About Our Vendor Program
          </a>
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          If you have questions about this decision, please contact our vendor support team.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Best regards,<br/>
          <strong>Aruviah Vendor Team</strong><br/>
          ${new Date().getFullYear()}
        </p>
      </div>
    `;

    return await sendTransactionalEmail({
      email,
      subject: `Application Review - ${businessName}`,
      htmlContent,
      senderName: 'Aruviah Vendor Team'
    });
  } catch (error) {
    console.error('Error sending vendor rejected email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send vendor application received confirmation email
 * @param {string} email - User email
 * @param {string} displayName - User name
 * @param {string} businessName - Vendor business name
 * @returns {Promise}
 */
export const sendVendorApplicationReceivedEmail = async (email, displayName, businessName) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">✓ Application Received</h2>
        
        <p>Hi ${displayName},</p>
        
        <p>Thank you for submitting your vendor application for <strong>${businessName}</strong>!</p>
        
        <p>We have received your application and it is now under review. Our vendor team will carefully evaluate your submission.</p>
        
        <h3 style="color: #333; margin-top: 20px;">What to Expect:</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>⏱️ Review typically takes 3-5 business days</li>
          <li>📧 You will receive an email with the decision</li>
          <li>📞 We may contact you for additional information if needed</li>
        </ul>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          You can check the status of your application at any time by logging into your account.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Best regards,<br/>
          <strong>Aruviah Vendor Team</strong><br/>
          ${new Date().getFullYear()}
        </p>
      </div>
    `;

    return await sendTransactionalEmail({
      email,
      subject: `✓ Vendor Application Received - ${businessName}`,
      htmlContent,
      senderName: 'Aruviah Vendor Team'
    });
  } catch (error) {
    console.error('Error sending vendor application received email:', error);
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
  registerForNewsletter,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendVendorApplicationReceivedEmail
};
