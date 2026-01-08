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
      confirmed: {
        subject: 'Order Confirmed',
        message: 'Your order has been confirmed by the vendor and will be processed soon.'
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

    // Format items list for HTML email
    const itemsHtml = items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.name}</strong><br>
            <span style="color: #666;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            KSh ${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>
      `)
      .join('');

    // HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; }
            .order-details { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .status-badge { 
              display: inline-block; 
              padding: 8px 12px; 
              border-radius: 5px; 
              font-weight: bold;
              background-color: ${
                newStatus === 'completed' ? '#10b981' :
                newStatus === 'processing' ? '#3b82f6' :
                newStatus === 'shipped' ? '#a855f7' :
                newStatus === 'pending' ? '#f59e0b' :
                newStatus === 'returned' ? '#f97316' :
                '#ef4444'
              };
              color: white;
            }
            table { width: 100%; border-collapse: collapse; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .button { 
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #f97316; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Aruviah Order Update</h1>
            </div>
            
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>${statusInfo.message}</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Status:</strong> <span class="status-badge">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
                <p><strong>Total Amount:</strong> KSh ${total?.toLocaleString() || 'N/A'}</p>
              </div>
              
              <h4>Order Items</h4>
              <table>
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 8px; text-align: left;"><strong>Product</strong></th>
                    <th style="padding: 8px; text-align: right;"><strong>Amount</strong></th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <p style="margin-top: 20px;">
                <a href="https://aruviah.com/orders" class="button">Track Your Order</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you have any questions about your order, please don't hesitate to contact our support team.
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for shopping with Aruviah!</p>
              <p>© 2025 Aruviah. All rights reserved.</p>
              <p>support@aruviah.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Call backend API to send email via SendGrid
    const response = await axios.post(
      process.env.REACT_APP_API_URL + '/api/send-email',
      {
        to: userEmail,
        subject: statusInfo.subject,
        html: htmlContent,
        text: `Order ${orderId}: ${statusInfo.message}`
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, message: `Email notification sent to ${userEmail}` };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    // Fail gracefully - don't break order process if email fails
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (userEmail, userName, orderId, items, total, shippingAddress) => {
  try {
    const itemsHtml = items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.name}</strong><br>
            <span style="color: #666;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            KSh ${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>
      `)
      .join('');

    const addressText = shippingAddress 
      ? `${shippingAddress.street}<br>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>${shippingAddress.country}`
      : 'Not provided';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; }
            .order-details { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .status-badge { display: inline-block; padding: 8px 12px; border-radius: 5px; font-weight: bold; background-color: #f59e0b; color: white; }
            table { width: 100%; border-collapse: collapse; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .button { 
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #f97316; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>Thank you for your order! Your order has been confirmed and will be processed shortly.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Status:</strong> <span class="status-badge">Pending</span></p>
                <p><strong>Total Amount:</strong> KSh ${total?.toLocaleString() || 'N/A'}</p>
              </div>
              
              <h4>Order Items</h4>
              <table>
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 8px; text-align: left;"><strong>Product</strong></th>
                    <th style="padding: 8px; text-align: right;"><strong>Amount</strong></th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="order-details">
                <h4>Shipping Address</h4>
                <p>${addressText}</p>
              </div>
              
              <p style="margin-top: 20px;">
                <a href="https://aruviah.com/orders" class="button">Track Your Order</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                You can view and track your order at any time by visiting your account page.
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for shopping with Aruviah!</p>
              <p>© 2025 Aruviah. All rights reserved.</p>
              <p>support@aruviah.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await axios.post(
      process.env.REACT_APP_API_URL + '/api/send-email',
      {
        to: userEmail,
        subject: 'Order Confirmation - ' + orderId,
        html: htmlContent,
        text: `Order ${orderId} Confirmation`
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, message: `Confirmation email sent to ${userEmail}` };

  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification email (generic)
 */
export const sendNotificationEmail = async (userEmail, subject, content) => {
  try {
    const response = await axios.post(
      process.env.REACT_APP_API_URL + '/api/send-email',
      {
        to: userEmail,
        subject: subject,
        html: content
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, message: `Email sent to ${userEmail}` };

  } catch (error) {
    console.error('❌ Error sending notification email:', error.message);
    return { success: false, error: error.message };
  }
};
