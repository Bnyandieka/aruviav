# M-Pesa Payment Integration Setup Guide

## Overview
This guide will help you integrate M-Pesa payments (STK Push) into your Shopki e-commerce platform. M-Pesa STK Push is a secure payment method that sends a prompt directly to customers' phones.

## Prerequisites
- Shopki backend running (Node.js/Express)
- M-Pesa Business Account (Safaricom)
- PostMan or similar for testing (optional)

## Step 1: Get M-Pesa API Credentials

### From Safaricom
1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Sign up or log in to your account
3. Create a new app for your Shopki e-commerce platform
4. You'll receive:
   - **Consumer Key**
   - **Consumer Secret**
   - **Short Code** (e.g., 174379 for test, or your business short code)
   - **Passkey** (generated for STK Push)

### Test Credentials (Sandbox Environment)
```
Short Code: 174379
Passkey: bfb279f9ba9b9d0e61f1567f58f3cb4351714ebf750d86640fcd51e6002f18e2
Consumer Key: [Get from dashboard]
Consumer Secret: [Get from dashboard]
```

## Step 2: Configure Environment Variables

1. Open `/backend/.env`:

```bash
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9ba9b9d0e61f1567f58f3cb4351714ebf750d86640fcd51e6002f18e2
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

2. For production, replace with your actual credentials and callback URL.

## Step 3: Start the Backend Server

```bash
cd backend
npm install
npm start
```

You should see:
```
🚀 Payment API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Port: 3001
Environment: development
SendGrid Status: [Status]
M-Pesa Status: ✅ Configured
```

## Step 4: Test M-Pesa Payment Integration

### Manual Test with PostMan

**1. Initiate M-Pesa STK Push:**

```
POST http://localhost:3001/api/mpesa/initiate-payment

Body (JSON):
{
  "phoneNumber": "254712345678",
  "amount": 1000,
  "orderId": "ORDER-123",
  "accountReference": "SHOPKI-ORDER-123",
  "description": "Test Payment"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "checkoutRequestId": "ws_CO_DMZ_xxx",
  "responseCode": "0",
  "message": "Success. Request accepted for processing",
  "timestamp": "2025-11-30T10:30:00Z"
}
```

**2. Check Payment Status:**

```
GET http://localhost:3001/api/mpesa/payment-status/ws_CO_DMZ_xxx
```

### Test with Frontend

1. Go to Checkout page
2. Select "M-Pesa" as payment method
3. Enter phone number in format: `07XX XXX XXX` or `+254XXX XXX XXX`
4. Click "Place Order"
5. You should see an M-Pesa STK prompt on your phone (if using real SIM)
6. Enter your M-Pesa PIN to complete payment

## API Endpoints

### 1. Initiate Payment (STK Push)
```
POST /api/mpesa/initiate-payment

Request:
{
  "phoneNumber": "254712345678",
  "amount": 1000,
  "orderId": "ORDER-123",
  "accountReference": "SHOPKI-ORDER-123",
  "description": "Order Payment"
}

Response:
{
  "success": true,
  "checkoutRequestId": "ws_CO_DMZ_xxx",
  "responseCode": "0",
  "message": "Success. Request accepted for processing"
}
```

### 2. Check Payment Status
```
GET /api/mpesa/payment-status/:checkoutRequestId

Response:
{
  "success": true,
  "status": "completed" | "pending",
  "data": { ... M-Pesa response data ... }
}
```

### 3. M-Pesa Callback
```
POST /api/mpesa/callback

This endpoint is called by Safaricom when payment succeeds/fails
Currently logs callback to console
In production, update Firestore order status here
```

## Payment Flow

1. **User at Checkout:**
   - Fills shipping info
   - Selects M-Pesa as payment method
   - Reviews order
   - Clicks "Place Order"

2. **Order Creation:**
   - Order created in Firestore with status: `payment_pending`
   - `paymentStatus` field set to `pending`

3. **M-Pesa STK Push Initiated:**
   - Backend calls Safaricom API
   - STK prompt sent to customer's phone
   - Checkout Request ID stored

4. **Customer Completes Payment:**
   - Customer enters M-Pesa PIN
   - Payment processed by Safaricom
   - Safaricom sends callback to `/api/mpesa/callback`

5. **Order Confirmation:**
   - Callback updates order status to `completed`
   - Confirmation email sent
   - Customer redirected to success page

## Phone Number Format

Accepted formats:
- `0712345678` → Converted to `254712345678`
- `+254712345678` → Used as is
- `254712345678` → Used as is
- `712345678` → Converted to `254712345678`

Invalid formats:
- `+2547123456789` (too many digits)
- `5678` (too few digits)

## Troubleshooting

### "M-Pesa credentials not configured"
- Check `.env` file has `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET`
- Ensure backend is restarted after `.env` changes
- Check credentials are correct from Safaricom portal

### "Invalid phone number format"
- Use format starting with `07` or `254`
- Remove spaces and special characters
- Valid: `0712345678` or `254712345678`

### "STK Push not received on phone"
- Check phone number is correct
- Ensure phone has M-Pesa active
- Check balance is available
- Try with different phone number

### Backend returns 500 error
- Check backend logs for detailed error
- Ensure Safaricom API is accessible (not blocked by firewall)
- Verify SSL/TLS certificate for HTTPS requests

## Production Deployment

### Before Going Live:

1. **Get Production Credentials:**
   - Contact Safaricom for production credentials
   - Update `.env` with production values

2. **Update Callback URL:**
   ```
   MPESA_CALLBACK_URL=https://your-production-domain.com/api/mpesa/callback
   ```

3. **Deploy Backend:**
   - Deploy to production server (Heroku, AWS, DigitalOcean, etc.)
   - Ensure backend is accessible via HTTPS
   - Configure SSL/TLS certificates

4. **Update API URL in Frontend:**
   ```
   src/services/payment/mpesaService.js
   const API_BASE_URL = 'https://your-production-domain.com'
   ```

5. **Test Live Payment:**
   - Process a test transaction
   - Verify order created in Firestore
   - Check confirmation email received
   - Monitor M-Pesa callback processing

6. **Implement Callback Webhook:**
   - Currently callbacks are logged to console
   - Implement Firestore update on successful callback
   - Send confirmation emails
   - Update order status to `completed`

## Callback Webhook Implementation (TODO)

Add to `/api/mpesa/callback` handler:

```javascript
// Extract order ID from callback metadata
const orderId = extractOrderIdFromCallback(callbackData);

// Update order in Firestore
if (paymentSuccessful) {
  await updateOrderStatus(orderId, 'completed');
  await sendPaymentConfirmationEmail(orderId);
  await sendAdminNotification(orderId);
} else {
  await updateOrderStatus(orderId, 'payment_failed');
  await sendPaymentFailureEmail(orderId);
}
```

## Resources

- [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- [M-Pesa STK Push API Docs](https://developer.safaricom.co.ke/APIs/MpesaExpressAPI)
- [M-Pesa Test Credentials](https://developer.safaricom.co.ke/)

## Support

For issues or questions:
- Check backend logs: `npm start`
- Enable debug mode in frontend: `console.log()`
- Review Safaricom API documentation
- Contact Safaricom support: [support@safaricom.co.ke](mailto:support@safaricom.co.ke)

## Next Steps

- [ ] Get M-Pesa API credentials from Safaricom
- [ ] Add credentials to `/backend/.env`
- [ ] Test with sandbox credentials
- [ ] Implement callback webhook for order confirmation
- [ ] Deploy backend to production
- [ ] Test live payments
- [ ] Go live with M-Pesa integration
