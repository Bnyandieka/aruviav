# 🧪 Testing Payment Response & Transaction Tracking

## Quick Test Checklist

### Prerequisites
- [x] Backend running: `npm run dev` in backend folder
- [x] Frontend running: `npm start` in root folder
- [x] Hard refresh browser: Ctrl+Shift+R
- [x] Valid Lipana API keys in `backend/.env`

---

## Test 1: Successful Payment Flow ✅

### Setup
```
Phone: 0759965800
Amount: 2700
Payment Method: M-Pesa
```

### Steps
1. Go to http://localhost:3000/checkout
2. Add an item to cart
3. Fill shipping information:
   - Name, Email, Phone, Address, City, County, Postal Code
4. Select **M-Pesa** as payment method
5. Click **"Place Order"**

### What to Watch

**In Backend Terminal:**
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0759965800
💰 Amount: 2700
📦 Order ID: [order-id]

📤 Calling Lipana API with phone: +2540759965800 amount: 2700
📥 Lipana response status: 200 OK
📋 Lipana response data: {
  "success": true,
  "data": {
    "transactionId": "LPN_STK_...",
    "checkoutRequestID": "ws_CO_...",
    "message": "STK push initiated successfully"
  }
}
✅ STK Push successful! Transaction ID: LPN_STK_...
📤 Sending transaction response to frontend
```

**In Frontend Browser:**
```
1. Toast: "📱 Sending M-Pesa prompt to your phone..."
2. Toast: "✅ M-Pesa prompt sent! Please enter your PIN on your phone."
3. Redirect to /order-success page
4. Page displays:
   ⏳ "Payment Pending"
   📱 Phone: +2540759965800
   💰 Amount: KES 2,700.00
   📦 Transaction ID: LPN_STK_...
   ⏱️ Countdown: 5:00 (and counting down)
   
   Buttons visible:
   - "Resend M-Pesa Prompt"
   - "Try Different Payment Method"
```

**In Firestore (Firebase Console):**
```
Navigate to orders collection → [orderId] document

Check fields:
✅ paymentStatus: "initiated"
✅ transactionId: "LPN_STK_..."
✅ checkoutRequestID: "ws_CO_..."
✅ transactionData: {
     orderId, amount, phone, status: "pending", timestamp
   }
✅ status: "payment_processing"
✅ lastUpdated: [timestamp]
```

### Success Indicators ✅
- [x] Backend logs show successful Lipana response
- [x] Frontend shows "Payment Pending" page
- [x] 5-minute countdown visible
- [x] Transaction details displayed
- [x] Order updated in Firestore with transaction data
- [x] Cart cleared

---

## Test 2: Failed Payment - Invalid API Key ❌

### Setup
```
1. Open backend/.env
2. Change LIPANA_SECRET_KEY to: wrong_key_12345
3. Save and restart backend: npm run dev
```

### Steps
1. Go to http://localhost:3000/checkout
2. Fill all required fields
3. Select M-Pesa
4. Click "Place Order"

### What to Watch

**In Backend Terminal:**
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0759965800
💰 Amount: 2700
📦 Order ID: [order-id]

📤 Calling Lipana API with phone: +2540759965800 amount: 2700
📥 Lipana response status: 401 Unauthorized
📋 Lipana response data: {
  "success": false,
  "message": "Invalid API key"
}
❌ Lipana API returned error: Invalid API key
```

**In Frontend Browser:**
```
1. Toast: "❌ Payment failed: Invalid API key"
2. Toast: "⚠️ Payment initiation failed. Please try again or use another payment method."
3. Page shows order success screen with:
   ❌ "Payment Failed"
   Error message: "Invalid API key"
   
   Recovery options shown:
   ✓ Try the payment again
   ✓ Use a different payment method
   ✓ Check your M-Pesa balance
   ✓ Try again in a few moments
   
   Buttons:
   - "Retry Payment"
   - "Try Different Payment Method"
```

**In Firestore:**
```
✅ paymentStatus: "failed"
✅ paymentError: "Invalid API key"
✅ status: "payment_failed"
```

### Success Indicators ✅
- [x] Backend shows 401 Unauthorized
- [x] Frontend displays error message
- [x] Recovery options visible
- [x] Order marked as failed in Firestore
- [x] Retry button functional

### Reset for Next Test
```
Restore original API key in backend/.env
Restart backend: npm run dev
```

---

## Test 3: Failed Payment - Invalid Phone ❌

### Setup
```
Phone: invalid
Amount: 2700
```

### Steps
1. Go to checkout
2. Fill all fields **except** use `invalid` as phone
3. Select M-Pesa
4. Click "Place Order"

### Expected Result
```
❌ Validation error before API call
Toast: "❌ Payment failed: Invalid phone format"

OR if validation passes:
Backend logs: "Invalid phone format error"
Frontend shows error page with recovery options
```

---

## Test 4: Failed Payment - Invalid Amount ❌

### Setup
```
Phone: 0759965800
Amount: 5 (less than minimum of 10)
```

### Steps
1. Go to checkout with this amount
2. Select M-Pesa
3. Click "Place Order"

### Expected Result
```
Frontend validation should catch this:
❌ "Amount must be between 10 and 150000 KES"

If it passes validation:
Backend will reject:
❌ "Minimum amount is 10 KES"
```

---

## Test 5: Payment Timeout ⏱️

### Setup
Same as Test 1 (Successful flow)

### Steps
1. Complete checkout with M-Pesa
2. See "Payment Pending" page
3. Watch the countdown timer
4. Wait for 5 minutes without completing M-Pesa PIN entry

### Expected Result
```
After 5 minutes:
⏱️ Countdown reaches 0:00
Page updates to:
⚠️ "Payment Window Expired"
"The M-Pesa payment window has expired (5 minutes timeout)."

Buttons appear:
- "Retry Payment"
- "Try Different Payment Method"

Firestore updates:
✅ paymentStatus: "expired"
✅ status: "payment_expired"
```

---

## Test 6: Retry Payment ↩️

### Setup
Complete Test 2 (Failed payment)

### Steps
1. On Payment Failed page
2. Click "Retry Payment" button
3. This should redirect back to checkout with same order

### Expected Result
```
✅ Checkout page loads
✅ Same order ID in URL/state
✅ Can retry payment
✅ If successful, updates same order in Firestore
```

---

## Test 7: Alternative Payment Method 🔄

### Setup
Complete Test 2 (Failed payment)

### Steps
1. On Payment Failed page
2. Click "Try Different Payment Method" button
3. Should redirect to checkout to change payment method

### Expected Result
```
✅ Checkout page loads
✅ Can select different payment method (COD, Card, etc.)
✅ Same order ID
✅ Can complete with different method
```

---

## Advanced Testing

### Check Firestore Updates
```
1. Go to Firebase Console
2. Select your Firestore database
3. Open "orders" collection
4. Click any order ID
5. Verify these fields:

On Success:
- paymentStatus: "initiated" or "completed"
- transactionId: (populated)
- checkoutRequestID: (populated)
- transactionData: (full object)
- status: "payment_processing"

On Failure:
- paymentStatus: "failed" or "expired"
- paymentError: (error message)
- status: "payment_failed"

On Timeout:
- paymentStatus: "expired"
- status: "payment_expired"
```

### Check Backend Logs
```
All requests logged to backend terminal in this format:

✅ LIPANA REQUEST RECEIVED
📱 Phone: [number]
💰 Amount: [amount]
📦 Order ID: [id]
📤 Calling Lipana API...
📥 Lipana response status: [200/400/401/500]
📋 Response data: [JSON]
✅/❌ Result message
```

### Monitor Network Traffic
```
In Browser DevTools (F12):

1. Go to Network tab
2. Filter: XHR/Fetch
3. Make payment request
4. Look for POST to:
   http://localhost:3001/api/lipana/initiate-stk-push
   
5. Click the request
6. Check Response tab for:
   {
     success: true/false,
     transactionId: ...,
     transaction: {...}
     ...
   }
```

---

## Troubleshooting

### Problem: No backend logs appearing
```
Fix:
1. Make sure backend is running: npm run dev
2. Check terminal shows: "BACKEND SERVER RUNNING ON PORT 3001"
3. Check Lipana status shows: ✅ Configured
4. Hard refresh frontend: Ctrl+Shift+R
```

### Problem: "404 Not Found" error
```
Fix:
1. Check frontend .env has: REACT_APP_API_URL=http://localhost:3001
2. Hard refresh: Ctrl+Shift+R
3. Make sure backend is on port 3001, not 5000
```

### Problem: "Invalid API key" even with correct key
```
Fix:
1. Copy API key fresh from Lipana dashboard
2. Paste into backend/.env
3. No extra spaces or characters
4. Restart backend: npm run dev
5. Hard refresh frontend
```

### Problem: Payment doesn't redirect to success page
```
Fix:
1. Check browser console (F12) for errors
2. Check backend logs for errors
3. Verify order was created in Firestore
4. Check network request succeeded (green 200)
```

---

## Success Criteria Checklist

For each test, verify:

**Backend:**
- [ ] Appropriate logs appear
- [ ] Response contains all required fields
- [ ] Status codes correct (200 for success, 4xx/5xx for errors)

**Frontend:**
- [ ] Toast notifications appear
- [ ] Page displays correct status
- [ ] Buttons for actions appear
- [ ] Countdown timer visible (if pending)

**Database:**
- [ ] Order created with correct status
- [ ] Transaction data stored
- [ ] Error details saved (if applicable)
- [ ] Timestamps accurate

**User Experience:**
- [ ] Clear feedback provided
- [ ] Next steps obvious
- [ ] Recovery options available
- [ ] No confusing errors

---

## Timeline for Testing

- **Test 1**: 10 minutes
- **Test 2**: 10 minutes
- **Test 3-4**: 5 minutes
- **Test 5**: 5+ minutes (wait for timeout)
- **Test 6-7**: 5 minutes
- **Advanced**: 10 minutes

**Total**: ~50 minutes for complete testing

---

## Ready to Test?

1. ✅ Backend running with valid API keys
2. ✅ Frontend hard refreshed
3. ✅ This checklist open
4. ✅ Backend terminal visible
5. ✅ Firestore console open

**Start with Test 1: Successful Payment** ✅

Good luck! 🚀
