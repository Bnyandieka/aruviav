import axios from 'axios';

/**
 * Send order status update email to user
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New order status
 * @param {array} items - Order items
 * @param {number} total - Order total
 */
export const sendOrderStatusEmail = async (userEmail, userName, orderId, newStatus, items, total) => {
  try {
    // Email templates based on status
    const statusMessages = {
      pending: {
        subject: 'Order Confirmed - Pending Processing',
        message: 'Your order has been confirmed and is pending processing.'
      },
      processing: {
        subject: 'Order Processing',
        message: 'Your order is now being processed and will be shipped soon.'
      },
      shipped: {
        subject: 'Order Shipped',
        message: 'Your order has been shipped! Track your package now.'
      },
      completed: {
        subject: 'Order Delivered',
        message: 'Your order has been delivered! Thank you for your purchase.'
      },
      cancelled: {
        subject: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact our support team.'
      },
      returned: {
        subject: 'Order Returned',
        message: 'Your returned order has been processed and refund will be initiated within 5-7 business days.'
      }
    };

    const statusInfo = statusMessages[newStatus] || statusMessages.pending;

    // Format items list
    const itemsText = items
      .map(item => `- ${item.name} (Qty: ${item.quantity}) - KSh ${(item.price * item.quantity).toLocaleString()}`)
      .join('\n');

    const emailContent = `
Hello ${userName},

${statusInfo.message}

Order Details:
- Order ID: ${orderId}
- Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
- Total Amount: KSh ${total?.toLocaleString() || 'N/A'}

Items:
${itemsText}

Thank you for shopping with Shopki!

Best regards,
Shopki Support Team
support@shopki.com
    `.trim();

    // Log the email (in production, replace with actual email API)
    console.log('📧 Email would be sent to:', userEmail);
    console.log('📧 Subject:', statusInfo.subject);
    console.log('📧 Content:', emailContent);

    // For now, we'll log it. In production, integrate with:
    // - Firebase Extensions (Email)
    // - SendGrid API
    // - Mailgun API
    // - AWS SES
    // - Custom Node.js backend

    return {
      success: true,
      message: `Email notification sent to ${userEmail}`
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (userEmail, userName, orderId, items, total, shippingAddress) => {
  try {
    const itemsText = items
      .map(item => `- ${item.name} (Qty: ${item.quantity}) - KSh ${(item.price * item.quantity).toLocaleString()}`)
      .join('\n');

    const addressText = shippingAddress 
      ? `${shippingAddress.street}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}\n${shippingAddress.country}`
      : 'Not provided';

    const emailContent = `
Hello ${userName},

Thank you for your order! Your order has been confirmed and will be processed shortly.

Order Details:
- Order ID: ${orderId}
- Status: Pending
- Total Amount: KSh ${total?.toLocaleString() || 'N/A'}

Items:
${itemsText}

Shipping Address:
${addressText}

You can track your order status at: https://shopki.com/orders

Thank you for shopping with Shopki!

Best regards,
Shopki Support Team
support@shopki.com
    `.trim();

    console.log('📧 Confirmation email would be sent to:', userEmail);
    console.log('📧 Subject: Order Confirmation');
    console.log('📧 Content:', emailContent);

    return {
      success: true,
      message: `Confirmation email sent to ${userEmail}`
    };

  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send notification email (generic)
 */
export const sendNotificationEmail = async (userEmail, subject, content) => {
  try {
    console.log('📧 Email would be sent to:', userEmail);
    console.log('📧 Subject:', subject);
    console.log('📧 Content:', content);

    return {
      success: true,
      message: `Email sent to ${userEmail}`
    };

  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
