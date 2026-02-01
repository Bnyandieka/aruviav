# M-PESA Payment Integration - Debugging Guide

## ✅ Backend Setup Status

Your backend is now **FULLY CONFIGURED** with:
- ✅ Port 3001 running
- ✅ Lipana API key configured
- ✅ Comprehensive logging added
- ✅ `/api/lipana/initiate-stk-push` endpoint ready

## 🔍 Debugging Checklist

### Step 1: Verify Backend is Running
- Open terminal in `backend/` folder
- Run: `npm run dev`
- You should see:
  ```
  🚀 ===============================================
  ✅ BACKEND SERVER RUNNING ON PORT 3001
  🚀 ===============================================
  
  SendGrid Status: ⚠️ Not configured (emails logged to console)
  Lipana Status: ✅ Configured
  ```

### Step 2: Hard Refresh React App
- Go to your React app in browser (http://localhost:3000)
- Press: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
- This clears the cache and loads the new `.env` file with PORT 3001

### Step 3: Verify Frontend Configuration
- Open browser DevTools (F12)
- Go to Console tab
- Check that API calls are going to `http://localhost:3001/api/lipana/initiate-stk-push`
- NOT to `http://localhost:5000`

### Step 4: Test Payment Flow
1. Go to Checkout page
2. Select M-Pesa payment method
3. Fill in test details
4. Click "Place Order"

### Step 5: Check Backend Logs
Watch the backend terminal. When you click "Place Order", you should see:

```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: [your-order-id]
📥 Lipana response status: 200 OK
📋 Lipana response data: {
  "success": true,
  "data": {
    "transactionId": "...",
    "checkoutRequestID": "...",
    "message": "STK push initiated successfully"
  }
}
✅ STK Push successful! Transaction ID: [transaction-id]
```

## 🧪 Manual Testing (Optional)

If you want to test the backend directly without going through React:

1. Open `TEST_LIPANA_ENDPOINT.js` in the root folder
2. In terminal, from root folder, run:
   ```
   node TEST_LIPANA_ENDPOINT.js
   ```
3. Check the output to see if endpoint responds

## 🐛 Common Issues & Solutions

### Issue: "Failed to load resource: 404 (Not Found)"
**Solution:** 
- React app is still using old port 5000
- Hard refresh with Ctrl+Shift+R
- Check `.env` file has `REACT_APP_API_URL=http://localhost:3001`

### Issue: Backend doesn't show payment requests
**Solution:**
- Make sure backend terminal shows the startup message
- Check `npm run dev` is running in backend folder
- Look for `✅ BACKEND SERVER RUNNING ON PORT 3001` message

### Issue: Logs show "Lipana Status: ⚠️ Not configured"
**Solution:**
- Check `backend/.env` has `LIPANA_SECRET_KEY` set
- Verify the key is correct: should start with `lip_sk_live_`

### Issue: "Cannot find module 'dotenv'"
**Solution:**
- In backend folder, run: `npm install`

## 📋 Log Format Reference

When working correctly, here's what you'll see in backend console:

```
✅ LIPANA REQUEST RECEIVED        ← Frontend request arrived
📱 Phone: 254712345678            ← Phone number being processed
💰 Amount: 100                     ← Amount in KES
📦 Order ID: order-123             ← Order reference
📥 Lipana response status: 200 OK  ← Lipana API responded
📋 Lipana response data: {...}     ← Complete response
✅ STK Push successful!             ← Operation successful
```

## 🔗 API Endpoint Details

**Endpoint:** `POST /api/lipana/initiate-stk-push`

**Request Body:**
```json
{
  "phone": "254712345678",  // Phone number in +254 or 07 format
  "amount": "100",           // Amount in KES (10-150000)
  "orderId": "order-123"     // Your order reference
}
```

**Success Response (200):**
```json
{
  "success": true,
  "transactionId": "123456",
  "checkoutRequestID": "ws_CO_...",
  "message": "STK push initiated successfully",
  "orderId": "order-123"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## ✨ Next Steps

1. **Verify backend is running** with visible startup message
2. **Hard refresh React** (Ctrl+Shift+R)
3. **Watch backend logs** while making payment
4. **Check for the 5 logging lines** that show request → Lipana → response
5. If all logs appear, payment integration is working!

## 📞 Testing Phone Numbers

For Lipana sandbox/testing:
- Use any valid Kenyan phone number format:
  - `254712345678` (with country code)
  - `0712345678` (with leading zero)
  - `+254712345678` (international format)

All formats are automatically converted to `+254` format by the backend.

---

**Last Updated:** When comprehensive logging was added to backend  
**Status:** Integration Ready for Testing
