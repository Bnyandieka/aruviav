# 📺 Expected Terminal Output - Visual Guide

## 🚀 When Backend Starts (npm run dev)

```
PS C:\Users\SEAL TEAM\Documents\adeveloper\shopki\backend> npm run dev

> shopki-email-api@1.0.0 dev
> nodemon server.js

[nodemon] 3.1.11
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node server.js`
⚠️ WARNING: SendGrid API key not configured
📧 Emails will be logged to console only
❌ To enable real email sending, update SENDGRID_API_KEY in backend/.env

🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ✅ Configured
```

**What this means:**
- ✅ Backend is running
- ✅ Port 3001 is active
- ✅ Lipana is configured
- ⚠️ SendGrid is optional (for emails)

**Next action**: Keep this terminal open and go to browser

---

## 💳 When User Submits Payment

### Expected Logs in Terminal

**Moment 1: Payment Request Arrives**
```
✅ LIPANA REQUEST RECEIVED
```

**Moment 2: Request Details Logged**
```
📱 Phone: 0712345678
💰 Amount: 100
📦 Order ID: order-12345-67890
```

**Moment 3: Calling Lipana**
```
📤 Calling Lipana API with phone: +254712345678 amount: 100
```

**Moment 4: Lipana Responds**
```
📥 Lipana response status: 200 OK
```

**Moment 5: Response Data**
```
📋 Lipana response data: {
  "success": true,
  "data": {
    "transactionId": "LPN_STK_123456789",
    "checkoutRequestID": "ws_CO_20250110123456789abcdef",
    "message": "STK push initiated successfully"
  }
}
```

**Moment 6: Success Confirmation**
```
✅ STK Push successful! Transaction ID: LPN_STK_123456789
```

---

## 📊 Complete Successful Payment Flow

```
🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ✅ Configured

[5 seconds pass... user fills checkout form]

[User clicks "Place Order" button]

✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 100
📦 Order ID: order-12345-67890
📤 Calling Lipana API with phone: +254712345678 amount: 100
📥 Lipana response status: 200 OK
📋 Lipana response data: {
  "success": true,
  "data": {
    "transactionId": "LPN_STK_123456789",
    "checkoutRequestID": "ws_CO_20250110123456789abcdef",
    "message": "STK push initiated successfully"
  }
}
✅ STK Push successful! Transaction ID: LPN_STK_123456789

[In browser, user sees:]
✓ Success toast: "✓ M-Pesa STK prompt sent!"
✓ Redirect to /order-success page
✓ Order placed successfully
```

**This is what SUCCESS looks like!** ✅

---

## ❌ When Payment Fails - Error Scenarios

### Scenario 1: Invalid Phone Format

```
✅ LIPANA REQUEST RECEIVED
📱 Phone: invalid
💰 Amount: 100
📦 Order ID: order-12345-67890
📤 Calling Lipana API with phone: invalid amount: 100
📥 Lipana response status: 400 Bad Request
📋 Lipana response data: {
  "success": false,
  "message": "Invalid phone format"
}
❌ Lipana API returned error: Invalid phone format

[In browser:]
✗ Error toast: "Invalid phone format"
```

### Scenario 2: Amount Too Low

```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 5
📦 Order ID: order-12345-67890
📤 Calling Lipana API with phone: +254712345678 amount: 5
📥 Lipana response status: 400 Bad Request
📋 Lipana response data: {
  "success": false,
  "message": "Minimum amount is 10 KES"
}
❌ Lipana API returned error: Minimum amount is 10 KES

[In browser:]
✗ Error toast: "Minimum amount is 10 KES"
```

### Scenario 3: Missing API Key

```
🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ⚠️ Not configured  ← PROBLEM!
```

**Fix**: Add LIPANA_SECRET_KEY to backend/.env

### Scenario 4: Lipana Service Down

```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: order-12345-67890
📤 Calling Lipana API with phone: +254712345678 amount: 100
📥 Lipana response status: 503 Service Unavailable
📋 Lipana response data: {
  "success": false,
  "message": "Service temporarily unavailable"
}
❌ Lipana API returned error: Service temporarily unavailable

[In browser:]
✗ Error toast: "Service temporarily unavailable"
```

**Fix**: Try again later, Lipana API is having issues

---

## 🔍 Reading the Logs Like a Pro

### ✅ Good Signs
- `✅ LIPANA REQUEST RECEIVED` - Frontend connected
- `📱 Phone:` - Your phone was received
- `💰 Amount:` - Amount was received
- `📦 Order ID:` - Order ID was received
- `📥 Lipana response status: 200 OK` - Lipana working
- `✅ STK Push successful!` - Payment initiated

### ⚠️ Warning Signs
- `📥 Lipana response status: 400` - Bad request (check input)
- `📥 Lipana response status: 401/403` - API key issue
- `📥 Lipana response status: 500/503` - Lipana service issue
- `Lipana Status: ⚠️ Not configured` - API key missing

### ❌ Error Signs
- No request logs when clicking → Frontend not connected
- Error message in `❌` line → See error for details
- No response from Lipana → Network issue or API down

---

## 📱 Different Phone Format Examples

All these work and show same success output:

### Format 1: Standard Kenyan (07xx)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 100
📦 Order ID: order-123
📤 Calling Lipana API with phone: +254712345678 amount: 100
[Rest of logs...]
```

### Format 2: Country Code (254xx)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: order-123
📤 Calling Lipana API with phone: +254712345678 amount: 100
[Rest of logs...]
```

### Format 3: International (+254xx)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: +254712345678
💰 Amount: 100
📦 Order ID: order-123
📤 Calling Lipana API with phone: +254712345678 amount: 100
[Rest of logs...]
```

**All three formats work! Backend converts to +254 format automatically.**

---

## 💰 Different Amount Examples

### Small Amount (10 KES minimum)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 10
📦 Order ID: order-123
📤 Calling Lipana API with phone: +254712345678 amount: 10
[Success logs...]
✅ STK Push successful!
```

### Normal Amount
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 500
📦 Order ID: order-123
📤 Calling Lipana API with phone: +254712345678 amount: 500
[Success logs...]
✅ STK Push successful!
```

### Large Amount (150000 KES maximum)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 150000
📦 Order ID: order-123
📤 Calling Lipana API with phone: +254712345678 amount: 150000
[Success logs...]
✅ STK Push successful!
```

### Too Small (Fails)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 5
📦 Order ID: order-123
❌ Lipana API returned error: Minimum amount is 10 KES
```

### Too Large (Fails)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 200000
📦 Order ID: order-123
❌ Lipana API returned error: Maximum amount is 150000 KES
```

---

## 🧪 Testing with TEST_LIPANA_ENDPOINT.js

When you run:
```bash
node TEST_LIPANA_ENDPOINT.js
```

You'll see:
```
🧪 Testing Lipana Endpoint...

📤 Sending request to: http://localhost:3001/api/lipana/initiate-stk-push
📋 Payload: {
  "phone": "254712345678",
  "amount": "50",
  "orderId": "TEST-ORDER-1705100000000"
}

-------------------------------------------

✅ Response received!
   Status: 200 OK
   Data: {
  "success": true,
  "transactionId": "LPN_STK_123456789",
  "checkoutRequestID": "ws_CO_...",
  "message": "STK push initiated successfully",
  "orderId": "TEST-ORDER-1705100000000"
}

✅ ENDPOINT IS WORKING!
```

**If you see this, endpoint is responding!** ✅

---

## 🎯 What to Look For

### Step 1: Backend Starts
✅ See: `✅ BACKEND SERVER RUNNING ON PORT 3001`
✅ See: `Lipana Status: ✅ Configured`

### Step 2: Payment Submitted
✅ See: `✅ LIPANA REQUEST RECEIVED`
✅ See: Phone, Amount, Order ID logged

### Step 3: Lipana Calls
✅ See: `📤 Calling Lipana API...`
✅ See: `📥 Lipana response status: 200 OK`

### Step 4: Response Received
✅ See: `📋 Lipana response data: {...}`
✅ See: Transaction ID in data

### Step 5: Success
✅ See: `✅ STK Push successful!`
✅ See: Transaction ID shown

---

## 📊 Summary of Output

| When | What You See | Status |
|------|--------------|--------|
| Backend starts | Startup message | ✅ Good |
| Lipana configured | `Lipana Status: ✅ Configured` | ✅ Good |
| Payment submitted | `✅ LIPANA REQUEST RECEIVED` | ✅ Good |
| Logs appear | Phone, Amount, Order ID | ✅ Good |
| Lipana responds | `📥 Response status: 200` | ✅ Good |
| Response logged | `📋 Response data: {...}` | ✅ Good |
| Success shown | `✅ STK Push successful!` | ✅ Good |
| React toast | Success message | ✅ Good |
| Redirect | To /order-success page | ✅ Good |

---

## 🎓 Pro Tip

Keep this terminal visible while testing:
```
┌─────────────────────────────────────────┐
│  BACKEND TERMINAL (left side)            │
│  Watch logs appear here ↓                │
├─────────────────────────────────────────┤
│  ✅ LIPANA REQUEST RECEIVED              │
│  📱 Phone: 0712345678                   │
│  💰 Amount: 100                         │
│  ...logs continue...                    │
└─────────────────────────────────────────┘
                    
┌─────────────────────────────────────────┐
│  BROWSER (right side)                    │
│  Watch payment form ↓                   │
├─────────────────────────────────────────┤
│  Checkout page form                     │
│  [Submit button]                        │
│  ↓ Click ↓                              │
│  ✓ Success toast appears!               │
│  ↓ Redirects to success page             │
└─────────────────────────────────────────┘
```

This way you see everything happening in real-time!

---

**Reference Complete**: Console output documented  
**Visual Guide**: ✅ Ready for testing
