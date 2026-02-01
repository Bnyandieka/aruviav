# Payment Email System - Updated Implementation

## Summary of Changes

You now have a complete payment email system that only sends emails on payment success or failure, includes payment IDs, and properly manages order status and inventory.

## Key Updates

### 1. Email Sending (Success/Failure Only)
✅ **Emails are NOW sent ONLY on:**
- Payment successful
- Payment failed

✅ **NO automatic emails** on order initiated/pending status

### 2. Payment Success Flow

**File**: [backend/server.js](backend/server.js#L370-L420)

When M-Pesa payment succeeds:
1. ✅ Order status set to **`processing`** (not `completed`)
2. ✅ Payment ID/Receipt Number stored in Firestore
3. ✅ Stock is **reduced** for all items
4. ✅ Payment confirmation email sent to customer with:
   - Order ID
   - Payment ID
   - Order summary with items
   - Status: "PROCESSING"

```
Email includes:
- Order ID: ABC123XYZ456
- Payment ID: MPesa receipt number or CheckoutRequestID
- Items with quantities and prices
- Shipping address
- Total amount
- "Track Your Order" button
```

### 3. Payment Failure Flow

**File**: [backend/server.js](backend/server.js#L432-L465)

When M-Pesa payment fails:
1. ✅ Order status set to **`payment_failed`**
2. ✅ **Stock NOT reduced** (inventory untouched)
3. ✅ Payment failure email sent to customer with:
   - Order ID
   - Error code (if available)
   - Retry instructions

```
Email includes:
- Order ID: ABC123XYZ456
- Error Code: [M-Pesa error code]
- Retry payment link
- Alternative payment method options
```

### 4. Stock Management

**Old behavior**: Stock reduced when order created ❌
**New behavior**: Stock reduced only on successful payment ✅

**Files changed:**
- [src/services/firebase/firestoreHelpers.js](src/services/firebase/firestoreHelpers.js#L383-L386)
  - `createOrder()` now does NOT reduce stock
  - Added `reduceStockAfterPayment()` function
  
- [backend/server.js](backend/server.js#L481-L540)
  - Added `reduceOrderStock()` function
  - Called automatically after successful payment

**Protection against double-reduction:**
- `stockReduced` flag prevents reducing stock multiple times
- Safe for payment retries

### 5. Order Status in Admin Panel

**Processing status:**
- When payment succeeds → Order becomes **"processing"** (ready for fulfillment)
- When payment fails → Order becomes **"payment_failed"** (awaiting retry)

**Admin can then:**
- Update from "processing" → "confirmed" → "shipped" → "completed"
- Manage inventory based on actual successful payments

## Email Template Details

### Payment Success Email
```
Header: "Payment Successful! ✅"
- Order ID: ABC123XYZ456
- Payment ID: MPesa receipt #
- Order Date: [date]
- Status: PROCESSING (green)

Items Table with quantities and prices
Shipping Address
Total Amount in KES

What happens next:
✓ Order will be processed and prepared
✓ You will receive tracking information
✓ Expected delivery: 3-5 business days

Button: "Track Your Order" → Links to /orders/{orderId}
```

### Payment Failure Email
```
Header: "Payment Failed ❌"
- Order ID: ABC123XYZ456
- Error Code: [code if available]
- Status: Payment Failed

What to do:
✓ Try the payment again
✓ Use a different M-Pesa account
✓ Contact support

Your order is saved - no inventory was reserved
```

## Database Changes

### Orders Collection
Each order now includes:
```
{
  id: "ABC123XYZ456",
  status: "processing",           // Was "completed", now "processing"
  paymentStatus: "completed",
  paymentId: "MPesa receipt #",   // NEW - M-Pesa receipt number
  transactionId: "MPesa receipt #",
  stockReduced: true,             // NEW - prevents double reduction
  userEmail: "customer@email.com",
  items: [...],
  shippingInfo: {...},
  total: 5000,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Products Collection
Stock updates only happen AFTER successful payment:
```
{
  id: "PROD123",
  stock: 45,      // Reduced only after payment success
  sold: 5,        // Incremented after payment success
  updatedAt: timestamp
}
```

## Flow Diagram

```
1. User Checkout
   └─ Order created with status: "payment_pending"
   └─ Stock NOT reduced yet
   └─ NO email sent

2. User initiates M-Pesa payment
   └─ STK Push prompt shown
   └─ User enters PIN
   └─ NO email sent

3a. PAYMENT SUCCEEDS
   ├─ Order status: "pending" → "processing"
   ├─ Stock reduced for all items
   ├─ stockReduced flag set
   └─ ✅ SUCCESS EMAIL SENT
      └─ Includes Order ID, Payment ID
      └─ Shows status: PROCESSING

3b. PAYMENT FAILS
   ├─ Order status: "pending" → "payment_failed"
   ├─ Stock remains untouched
   ├─ User can retry payment
   └─ ✅ FAILURE EMAIL SENT
      └─ Includes Order ID, Error Code
      └─ Provides retry options
```

## Admin Panel Updates

In the admin panel you should:
1. See orders grouped by status
2. Orders with successful payment appear as **"processing"**
3. Update order from "processing" → "confirmed" → "shipped" → "completed"
4. Stock quantities reflect actual successful purchases only

## Email Configuration

Ensure `.env` has:
```
REACT_APP_BREVO_API_KEY=your_api_key
REACT_APP_BREVO_SENDER_EMAIL=orders@shopki.com
REACT_APP_BASE_URL=http://localhost:3000 (or production URL)
```

## Testing Checklist

- [ ] Place order → No email sent yet
- [ ] Complete M-Pesa payment → SUCCESS email with Order ID & Payment ID
- [ ] Check admin panel → Order status is "processing"
- [ ] Check Firestore → stockReduced flag is true
- [ ] Verify products stock decreased
- [ ] Test payment failure → FAILURE email with error code
- [ ] Check admin panel → Order status is "payment_failed"
- [ ] Verify products stock NOT changed
- [ ] Retry payment on failed order → Stock reduced after success

## Summary

✅ **Emails**: Only on payment success/failure, include payment ID
✅ **Order Status**: "processing" on success (not "completed")
✅ **Stock**: Reduced only on successful payment
✅ **Failed Payments**: No inventory reservation, can retry with same order
✅ **Admin Ready**: Clear status flow for order fulfillment
