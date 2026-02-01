# ✅ Payment Success Email - Setup & Testing Checklist

## Pre-Setup Checklist

- [ ] Backend server accessible
- [ ] npm packages installed in backend
- [ ] Firestore database configured
- [ ] M-Pesa credentials set up
- [ ] Environment variables configured

## Email Service Setup

### Option 1: SendGrid Setup Checklist

#### Account Creation
- [ ] Create SendGrid account at https://sendgrid.com
- [ ] Verify email address
- [ ] Complete signup process
- [ ] Access SendGrid dashboard

#### API Key Configuration
- [ ] Login to SendGrid
- [ ] Go to Settings → API Keys
- [ ] Click "Create API Key"
- [ ] Choose "Full Access" or "Restricted Access"
- [ ] Copy the API key (format: SG.xxxx...)
- [ ] Store in secure location

#### Sender Email Verification
- [ ] Go to Settings → Senders
- [ ] Click "Create New Sender"
- [ ] Enter your email address (e.g., orders@shopki.com)
- [ ] Verify sender email via confirmation link
- [ ] Note the verified sender email address

#### Backend Configuration
- [ ] Open `backend/.env`
- [ ] Add `SENDGRID_API_KEY=SG.your_key_here`
- [ ] Add `SENDGRID_FROM_EMAIL=orders@shopki.com`
- [ ] Add `PORT=5001`
- [ ] Save the file

#### Server Restart
- [ ] Open terminal in backend folder
- [ ] Run `npm start`
- [ ] Verify server starts successfully
- [ ] Look for: "✅ Server running on http://localhost:5001"

### Option 2: Gmail SMTP Setup Checklist

#### Gmail Account Preparation
- [ ] Login to your Gmail account
- [ ] Go to myaccount.google.com/security
- [ ] Enable 2-Step Verification
- [ ] Verify phone number
- [ ] Complete 2FA setup

#### App Password Creation
- [ ] Go to Security settings
- [ ] Go to "App passwords"
- [ ] Select "Mail" and "Windows Computer"
- [ ] Generate app password
- [ ] Copy the 16-character password
- [ ] Store in secure location

#### Backend Configuration
- [ ] Open `backend/.env`
- [ ] Add `GMAIL_EMAIL=your-email@gmail.com`
- [ ] Add `GMAIL_PASSWORD=your_16_char_password`
- [ ] Add `PORT=5001`
- [ ] Save the file

#### Server Restart
- [ ] Open terminal in backend folder
- [ ] Run `npm start`
- [ ] Verify server starts successfully

### Option 3: Test Mode (No Service) Checklist

- [ ] Backend configured for logging
- [ ] `.env` file in place (even without real credentials)
- [ ] Backend running
- [ ] Ready to see email logs in console

## Firebase Configuration

### Firestore Setup
- [ ] Firestore database exists
- [ ] "orders" collection exists
- [ ] Orders have `userEmail` field
- [ ] Orders have `items` array
- [ ] Orders have `total` field
- [ ] Orders have `shippingInfo` object

### Firebase Admin (Optional but Recommended)
- [ ] Go to Firebase Console
- [ ] Project Settings → Service Accounts
- [ ] Click "Generate New Private Key"
- [ ] Download JSON file
- [ ] Either:
  - [ ] Set `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable with file contents, OR
  - [ ] Set `FIREBASE_SERVICE_ACCOUNT_PATH` with path to downloaded file

## M-Pesa Integration Verification

- [ ] M-Pesa STK Push working
- [ ] Callback endpoint configured at Safaricom
- [ ] Test payments completing successfully
- [ ] Order created in Firestore on payment
- [ ] Order has all required fields:
  - [ ] `userEmail`
  - [ ] `items[]`
  - [ ] `total`
  - [ ] `shippingInfo`
  - [ ] `createdAt` or `orderDate`

## Code Implementation Verification

- [ ] `backend/server.js` updated (check lines 323-502)
- [ ] `sendPaymentConfirmationEmail()` function exists
- [ ] `sendPaymentFailureEmail()` function exists
- [ ] M-Pesa callback handler updated
- [ ] Imports at top of file include all required modules
- [ ] sendGrid module installed: `npm install @sendgrid/mail`

## Testing Workflow

### Test 1: Backend Health Check
- [ ] Backend running on http://localhost:5001
- [ ] No console errors
- [ ] Environment variables loaded correctly
- [ ] Check logs for startup messages

### Test 2: M-Pesa Payment Test
- [ ] Navigate to checkout page
- [ ] Fill shipping information completely
- [ ] Select M-Pesa as payment method
- [ ] Enter test phone number (254700000000)
- [ ] Review order summary
- [ ] Click "Place Order"
- [ ] Complete M-Pesa payment

### Test 3: Verify Payment Success
- [ ] Check backend console for callback logs
- [ ] Look for: "✅ Payment successful for order: [ID]"
- [ ] Look for: "📝 Order [ID] status updated to 'completed'"
- [ ] Look for: "✅ Payment confirmation email sent to [email]"

### Test 4: Verify Email Sent

#### If using SendGrid:
- [ ] Check customer's inbox
- [ ] Subject: "Order Confirmed - [ORDER_ID]"
- [ ] From: orders@shopki.com
- [ ] Verify email arrived within 2 seconds

#### If using Gmail SMTP:
- [ ] Check customer's inbox
- [ ] Verify email from your Gmail address
- [ ] Check spam folder if not in inbox

#### If using console logging:
- [ ] Check backend terminal for email logs
- [ ] Look for: "📧 Email would be sent to: customer@example.com"
- [ ] Look for: "📧 Subject: Order Confirmed - [ORDER_ID]"

### Test 5: Verify Email Content

- [ ] Order ID visible and correct
- [ ] Order date correct
- [ ] Status shows "COMPLETED"
- [ ] All products listed with names
- [ ] Quantities correct
- [ ] Prices formatted as "KES X,XXX"
- [ ] Total amount correct
- [ ] Shipping address included
  - [ ] Full name correct
  - [ ] Address correct
  - [ ] City correct
  - [ ] County correct
  - [ ] Postal code correct
  - [ ] Phone number correct
- [ ] "Track Your Order" button/link present
- [ ] Link points to correct order page
- [ ] Expected delivery information present
- [ ] Support email present
- [ ] Professional HTML formatting

### Test 6: Verify Payment Failure Email

- [ ] Complete M-Pesa payment and cancel/fail it
- [ ] Check backend console for failure logs
- [ ] Look for: "❌ Payment failed for order: [ID]"
- [ ] Look for: "✅ Payment failure email sent to [email]"
- [ ] Check email received by customer
- [ ] Subject: "Payment Failed - Order [ORDER_ID]"
- [ ] Verify email contains:
  - [ ] Failure notification
  - [ ] Order ID
  - [ ] Retry payment button
  - [ ] Support contact info
  - [ ] What customer can do next

## Firestore Verification

After payment success:
- [ ] Order document exists in `orders` collection
- [ ] `paymentStatus` = "completed"
- [ ] `status` = "completed"
- [ ] `transactionId` populated with M-Pesa receipt
- [ ] `lastUpdated` timestamp present

After payment failure:
- [ ] Order document exists in `orders` collection
- [ ] `paymentStatus` = "failed"
- [ ] `status` = "payment_failed"
- [ ] `paymentError` contains error message
- [ ] `lastUpdated` timestamp present

## Logging Verification

### Success Path Logs
```
✅ M-Pesa Callback received
✅ Payment successful for order: [ID]
📝 Order [ID] status updated to 'completed' in Firestore
✅ Payment confirmation email sent to [email]
```

### Failure Path Logs
```
✅ M-Pesa Callback received
❌ Payment failed for order: [ID]
📝 Order [ID] status updated to 'payment_failed' in Firestore
✅ Payment failure email sent to [email]
```

### No Email Service Logs
```
📧 Email would be sent to: customer@example.com
📧 Subject: Order Confirmed - A1B2C3D4E5
📧 Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)
```

## Documentation Verification

- [ ] Read `PAYMENT_SUCCESS_EMAIL_QUICK_START.md`
- [ ] Read `PAYMENT_SUCCESS_EMAIL_GUIDE.md`
- [ ] Read `PAYMENT_EMAIL_FIELD_MAPPING.md`
- [ ] Read `SAMPLE_PAYMENT_SUCCESS_EMAIL.md`
- [ ] Understand the email flow
- [ ] Know how to troubleshoot

## Production Readiness Checklist

### Before Going Live
- [ ] All tests passed
- [ ] Email service working reliably
- [ ] Firestore updates working
- [ ] Backend logs clean (no errors)
- [ ] Email template looks professional
- [ ] Support email address configured
- [ ] Sender email verified at email service
- [ ] API key secured (not in git)
- [ ] Test with real payment (if available)

### Security Checks
- [ ] API keys not in git repository
- [ ] `.env` file in `.gitignore`
- [ ] Passwords not logged anywhere
- [ ] Firestore rules properly configured
- [ ] Email addresses validated

### Performance Checks
- [ ] Email sends in < 3 seconds
- [ ] No timeout issues
- [ ] Order status updates immediately
- [ ] No database lock issues
- [ ] Callback processes without errors

## Troubleshooting Checklist

### Email Not Sending?
- [ ] Check `SENDGRID_API_KEY` in backend/.env
- [ ] Verify API key format (SG.xxxx)
- [ ] Check sender email is verified in SendGrid
- [ ] Verify backend is running
- [ ] Check backend console for errors
- [ ] Try restarting backend
- [ ] Check SendGrid dashboard for errors

### Email in Spam?
- [ ] Add SPF record in SendGrid
- [ ] Add DKIM record in SendGrid
- [ ] Use professional sender email
- [ ] Check SendGrid reputation dashboard
- [ ] Monitor bounce rates

### Order Not Updating?
- [ ] Check Firebase Admin credentials
- [ ] Verify `FIREBASE_SERVICE_ACCOUNT_JSON` set correctly
- [ ] Check Firestore collection exists
- [ ] Check order document exists
- [ ] Review Firestore security rules
- [ ] Check backend logs for errors

### Test Payment Not Completing?
- [ ] Verify M-Pesa credentials
- [ ] Check STK Push is enabled
- [ ] Verify callback endpoint accessible
- [ ] Check Safaricom test numbers configured
- [ ] Review M-Pesa logs in backend

## Communication Checklist

- [ ] Inform team about email system
- [ ] Provide SendGrid/Gmail setup instructions
- [ ] Share quick start guide
- [ ] Document any customizations
- [ ] Set up monitoring/alerts
- [ ] Plan for support/troubleshooting

## Final Verification

Before considering complete:
- [ ] ✅ Backend code updated
- [ ] ✅ Email service configured
- [ ] ✅ Payment triggers email
- [ ] ✅ Email contains all order info
- [ ] ✅ Firestore updates working
- [ ] ✅ Logs show success
- [ ] ✅ Documentation reviewed
- [ ] ✅ Ready for production use

---

## Quick Reference

### Email Service Status
- **SendGrid:** Production-ready, reliable, professional
- **Gmail:** Good for testing, use with caution in production
- **Console:** Good for development, not for production

### File Locations
- Backend server: `backend/server.js`
- Configuration: `backend/.env`
- Email functions: Lines 323-502 in server.js

### Important Environment Variables
```
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
FIREBASE_SERVICE_ACCOUNT_JSON= (or PATH)
PORT=5001
```

### Key Endpoints
- M-Pesa callback: `POST /api/mpesa/callback`
- Email service: Built-in to callback handler

### Monitoring Commands
```bash
# Watch backend logs
npm start

# Test M-Pesa
Complete payment at checkout

# Check email
Look in customer inbox or backend logs
```

---

**Checklist Complete:**  
When all items are checked, your payment success email system is ready for production use.

**Estimated Time:** 30-45 minutes total setup and testing  
**Difficulty:** Easy (mostly configuration)  
**Support:** Refer to documentation files for detailed help
