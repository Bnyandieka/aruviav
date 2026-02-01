// Default email templates for all email types

export const DEFAULT_EMAIL_TEMPLATES = {
  passwordReset: {
    subject: 'Reset Your Password - Aruviah Stores',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              <div style="text-align: center;">
                <a href="{{resetLink}}" class="cta-button">Reset Password</a>
              </div>
              <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
              <p>Best regards,<br><strong>Aruviah Stores Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  welcomeEmail: {
    subject: 'Welcome to Aruviah Stores! 🎉',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .benefits { list-style: none; padding: 0; }
            .benefits li { padding: 10px 0; padding-left: 25px; position: relative; }
            .benefits li:before { content: "✓"; position: absolute; left: 0; color: #ff9800; font-weight: bold; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome {{firstName}}! 🎉</h1>
            </div>
            <div class="content">
              <p>Thank you for joining Aruviah Stores! We're excited to have you as part of our community.</p>
              
              <h3 style="color: #ff9800;">What You Can Expect</h3>
              <ul class="benefits">
                <li>Exclusive deals and special offers</li>
                <li>New product arrivals</li>
                <li>Member rewards on every purchase</li>
                <li>Fast checkout and shipping</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="{{shopUrl}}" class="cta-button">Start Shopping</a>
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br><strong>Aruviah Stores Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  orderPlaced: {
    subject: 'Order Placed - {{orderId}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Order Received</h1>
            </div>
            <div class="content">
              <p>Thank you for your order, {{firstName}}!</p>
              <p><strong>Order ID:</strong> {{orderId}}</p>
              <p><strong>Order Date:</strong> {{orderDate}}</p>
              
              <h3 style="color: #ff9800;">Order Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {{orderItems}}
                </tbody>
              </table>
              
              <h3 style="color: #ff9800;">Order Total: {{orderTotal}}</h3>
              <p>We'll notify you when your order ships.</p>
              <p>Best regards,<br><strong>Aruviah Stores Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  orderConfirmed: {
    subject: 'Order Confirmed - {{orderId}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmed</h1>
            </div>
            <div class="content">
              <p>Great news! Your order has been confirmed and is being prepared.</p>
              <p><strong>Order ID:</strong> {{orderId}}</p>
              
              <h3 style="color: #ff9800;">What's Next?</h3>
              <ul>
                <li>Your order is being packed</li>
                <li>You'll receive a shipping notification soon</li>
                <li>Estimated delivery: 3-5 business days</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="{{orderTrackingUrl}}" class="cta-button">Track Order</a>
              </div>
              
              <p>Best regards,<br><strong>Aruviah Stores Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  orderShipped: {
    subject: 'Your Order Has Shipped! 🚚 {{orderId}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .highlight-box { background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Order Shipped!</h1>
            </div>
            <div class="content">
              <p>Great news {{firstName}}! Your order has been shipped.</p>
              
              <div class="highlight-box">
                <p><strong>Order ID:</strong> {{orderId}}</p>
                <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
              </div>
              
              <h3 style="color: #ff9800;">Track Your Package</h3>
              <p>You can track your shipment in real-time using the tracking number above.</p>
              
              <div style="text-align: center;">
                <a href="{{trackingUrl}}" class="cta-button">Track Package</a>
              </div>
              
              <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
              <p>Best regards,<br><strong>Aruviah Stores Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  orderCancelled: {
    subject: 'Order Cancelled - {{orderId}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .info-box { background: #fff3e0; padding: 15px; border-radius: 6px; border-left: 4px solid #ff9800; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Order Cancelled</h1>
            </div>
            <div class="content">
              <p>Your order has been cancelled.</p>
              <p><strong>Order ID:</strong> {{orderId}}</p>
              
              <div class="info-box">
                <h3 style="color: #ff9800; margin-top: 0;">Refund Information</h3>
                <p>Your refund of <strong>{{refundAmount}}</strong> will be processed within 5-7 business days.</p>
              </div>
              
              <h3 style="color: #ff9800;">Need Help?</h3>
              <p>If you have questions about this cancellation or need assistance, please contact our support team.</p>
              
              <div style="text-align: center;">
                <a href="{{supportUrl}}" class="cta-button">Contact Support</a>
              </div>
              
              <p>We appreciate your business and hope to serve you again!</p>
              <p>Best regards,<br><strong>Aruviah Stores Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  orderConfirmation: {
    subject: '✅ Order Confirmed - {{orderNumber}}',
    htmlContent: `
      <h2>Order Confirmation</h2>
      <p>Thank you for your order!</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p><strong>Order Date:</strong> {{orderDate}}</p>
      <p><strong>Total:</strong> {{total}}</p>
      <p>We're preparing your items for shipment.</p>
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Your Order</a>
    `
  },

  orderStatus: {
    subject: '📊 Order Status Update - {{orderNumber}}',
    htmlContent: `
      <h2>Order Status Updated</h2>
      <p>Your order status has been updated!</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <p>{{statusMessage}}</p>
      {{trackingNumber}}
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Details</a>
    `
  },

  orderPending: {
    subject: '⏳ Order Pending - {{orderNumber}}',
    htmlContent: `
      <h2>Your Order is Pending</h2>
      <p>We've received your order and are preparing it for processing.</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p><strong>Order Date:</strong> {{orderDate}}</p>
      <p><strong>Total:</strong> {{total}}</p>
      <p>We'll notify you when your order moves to the next stage.</p>
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Order</a>
    `
  },

  orderProcessing: {
    subject: '🔄 Order Processing - {{orderNumber}}',
    htmlContent: `
      <h2>Your Order is Being Processed</h2>
      <p>Your order is now being processed and packed.</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p>{{items}}</p>
      <p>You'll receive a shipping notification with tracking details very soon!</p>
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Order</a>
    `
  },

  orderShipped: {
    subject: '🚚 Your Order Has Shipped! - {{orderNumber}}',
    htmlContent: `
      <h2>Your Order is On the Way!</h2>
      <p>Great news! Your order has been shipped.</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
      <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
      <p>Click below to track your shipment in real-time.</p>
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Shipment</a>
    `
  },

  orderCompleted: {
    subject: '✅ Order Delivered - {{orderNumber}}',
    htmlContent: `
      <h2>Your Order Has Been Delivered!</h2>
      <p>We're excited to let you know that your order has arrived!</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p>We hope you enjoy your purchase. If you have any questions or concerns, please don't hesitate to reach out.</p>
      <p><a href="{{trackingUrl}}" style="color: #ff9800;">View your order details</a></p>
      <p>Thank you for shopping with us!</p>
    `
  },

  orderCancelled: {
    subject: '❌ Order Cancelled - {{orderNumber}}',
    htmlContent: `
      <h2>Order Cancellation Notice</h2>
      <p>Your order has been cancelled.</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p>{{statusMessage}}</p>
      <p>If you have any questions about this cancellation, please contact our support team.</p>
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Order</a>
    `
  },

  orderReturned: {
    subject: '↩️ Order Return Processed - {{orderNumber}}',
    htmlContent: `
      <h2>Your Return Has Been Processed</h2>
      <p>We've received and processed your return.</p>
      <p><strong>Order #:</strong> {{orderNumber}}</p>
      <p>{{statusMessage}}</p>
      <p>Your refund will be processed within 5-7 business days.</p>
      <a href="{{trackingUrl}}" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Return Status</a>
    `
  },

  newsletter: {
    subject: '🎉 Welcome to the Aruviah Newsletter!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .benefit-box { background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2196F3; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
            .unsubscribe { text-align: center; margin-top: 10px; font-size: 11px; }
            .unsubscribe a { color: #0066cc; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Aruviah!</h1>
              <p>You're now subscribed to exclusive deals and updates</p>
            </div>
            <div class="content">
              <p>Hello {{displayName}},</p>
              <p>Thank you for subscribing to our newsletter! We're excited to have you on our growing community of smart shoppers.</p>
              
              <div class="benefit-box">
                <h3 style="margin-top: 0;">✨ Here's what you'll get:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Exclusive discounts and early access to sales</li>
                  <li>New product launches and trending items</li>
                  <li>Special promotions just for subscribers</li>
                  <li>Tips and recommendations curated for you</li>
                  <li>Updates on the latest arrivals in your favorite categories</li>
                </ul>
              </div>

              <p>Our newsletter is packed with valuable content, so keep an eye on your inbox. We send updates every week with the best deals, new arrivals, and exclusive offers.</p>

              <p style="text-align: center;">
                <a href="https://aruviah.com" class="cta-button">Visit Our Store</a>
              </p>

              <p>If you have any questions or feedback, feel free to reach out to us at support@aruviah.com</p>

              <p>Happy shopping!<br><strong>The Aruviah Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah. All rights reserved.</p>
              <p>Registered in Kenya | East African E-commerce Platform</p>
              <div class="unsubscribe">
                <p><a href="{{unsubscribeLink}}">Manage your subscription preferences</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  vendorApplication: {
    subject: 'New Vendor Application - {{businessName}} | Admin Review Required',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .alert { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-box { background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .info-row { display: flex; margin: 12px 0; }
            .info-label { font-weight: 600; width: 150px; color: #ff9800; }
            .info-value { flex: 1; }
            .action-buttons { text-align: center; margin-top: 30px; }
            .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
            .btn-approve { background-color: #4caf50; color: white; }
            .btn-review { background-color: #2196f3; color: white; }
            .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏪 New Vendor Application</h1>
            </div>
            <div class="content">
              <div class="alert">
                <strong>⚠️ ACTION REQUIRED:</strong> A new vendor application has been submitted and requires review.
              </div>

              <h3 style="color: #ff9800;">Applicant Details</h3>
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">{{firstName}} {{lastName}}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{email}}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">{{phone}}</span>
                </div>
              </div>

              <h3 style="color: #ff9800;">Business Information</h3>
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Business Name:</span>
                  <span class="info-value">{{businessName}}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Category:</span>
                  <span class="info-value">{{businessCategory}}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span class="info-value">{{businessAddress}}</span>
                </div>
              </div>

              <h3 style="color: #ff9800;">Business Description</h3>
              <div class="info-box">
                <p style="margin: 0;">{{businessDescription}}</p>
              </div>

              <div class="action-buttons">
                <a href="{{adminDashboardLink}}" class="btn btn-review">📊 Review Application</a>
              </div>

              <p style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                Application ID: {{applicationId}}<br>
                Submitted: {{submittedDate}}
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Aruviah Stores. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  paymentSuccess: {
    subject: '✅ Payment Successful - Order #{{orderId}}',
    htmlContent: `
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
            <p style="color: #666; margin: 0 0 20px 0;">Your payment has been processed successfully.</p>

            <!-- Order Details -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> {{orderId}}</p>
              <p style="margin: 5px 0;"><strong>Payment ID:</strong> {{paymentId}}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> {{orderDate}}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">PROCESSING</span></p>
            </div>

            <!-- Items -->
            <h3 style="color: #333; margin: 20px 0 10px 0;">Order Items</h3>
            <div style="background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              {{items}}
            </div>

            <!-- Totals -->
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Subtotal:</span>
                <span style="color: #333; font-weight: 600;">{{subtotal}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Shipping:</span>
                <span style="color: #333; font-weight: 600;">{{shippingFee}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 2px solid #ddd; padding-top: 10px;">
                <span style="color: #333; font-weight: bold; font-size: 16px;">Total:</span>
                <span style="color: #ff9800; font-weight: bold; font-size: 18px;">{{total}}</span>
              </div>
            </div>

            <!-- Shipping Address -->
            <h3 style="color: #333; margin: 20px 0 10px 0;">Shipping Address</h3>
            <div style="background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              {{shippingAddress}}
            </div>

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
              <a href="{{trackingUrl}}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
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
            <p style="margin: 5px 0;">© {{currentYear}} Shopki. All rights reserved.</p>
            <p style="margin: 5px 0;">This email contains important information about your order.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  paymentFailure: {
    subject: '❌ Payment Failed - Order #{{orderId}}',
    htmlContent: `
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
            <p style="color: #666; margin: 0 0 20px 0;">Unfortunately, your M-Pesa payment for order <strong>{{orderId}}</strong> could not be processed.</p>

            <!-- Error Info -->
            <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #c62828;"><strong>Order ID:</strong> {{orderId}}</p>
              <p style="margin: 5px 0; color: #c62828;"><strong>Error Code:</strong> {{errorCode}}</p>
              <p style="margin: 5px 0; color: #c62828;"><strong>Reason:</strong> {{errorMessage}}</p>
              <p style="margin: 5px 0; color: #c62828;"><strong>Status:</strong> Payment Failed</p>
              <p style="margin: 10px 0 0 0; color: #c62828;">Your order is still saved and you can retry the payment.</p>
            </div>

            <!-- Order Summary -->
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Order Amount</h4>
              <div style="display: flex; justify-content: space-between; font-size: 18px;">
                <span style="font-weight: bold;">Total:</span>
                <span style="color: #ff9800; font-weight: bold;">{{total}}</span>
              </div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Order Date: {{orderDate}}</p>
            </div>

            <!-- What to Do -->
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1565c0;">What you can do:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #333;">
                <li style="margin: 8px 0;">Try the payment again with the correct PIN</li>
                <li style="margin: 8px 0;">Use a different M-Pesa account or payment method</li>
                <li style="margin: 8px 0;">Check that you have sufficient balance</li>
                <li style="margin: 8px 0;">Contact our support team for assistance</li>
              </ul>
            </div>

            <!-- Retry Button -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="{{retryLink}}" style="display: inline-block; background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Retry Payment
              </a>
            </div>

            <!-- Support Message -->
            <p style="color: #999; font-size: 14px; text-align: center; margin-bottom: 0;">
              Need help? Contact us at <a href="mailto:support@shopki.com" style="color: #f44336; text-decoration: none;">support@shopki.com</a> or call our support team.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #ffebee; border-top: 1px solid #ffcdd2; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© {{currentYear}} Shopki. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated email. Your order is safe and awaiting payment.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};
