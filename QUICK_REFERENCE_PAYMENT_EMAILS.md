# Payment Email System - Quick Reference

## What Was Changed

### ✅ Emails Now Send ONLY On:
1. **Payment Success** → Confirmation email with Order ID & Payment ID
2. **Payment Failure** → Failure email with Error Code & retry options

### ❌ Emails NOT Sent On:
- Order initiated (pending)
- Any other status changes

---

## Email Details

### Payment Success Email
```
To: customer@email.com
Subject: Order Confirmed - ABC123XYZ456

Body includes:
✓ Order ID
✓ Payment ID (M-Pesa receipt)
✓ Order items with prices
✓ Shipping address
✓ Status: PROCESSING (ready for fulfillment)
✓ Link to track order
```

### Payment Failure Email
```
To: customer@email.com
Subject: Payment Failed - ABC123XYZ456

Body includes:
✓ Order ID
✓ Error Code
✓ Instructions to retry
✓ Alternative payment options
✓ Support contact
```

---

## Order Status Flow

```
Checkout Page
    ↓
Order Created (status: "payment_pending")
    ↓ [User enters M-Pesa PIN]
    ├─→ PAYMENT SUCCESS
    │   ├─ Status: "processing" ✅
    │   ├─ Stock reduced ✅
    │   ├─ Email sent ✅
    │   └─ Admin sees ready to fulfill
    │
    └─→ PAYMENT FAILURE
        ├─ Status: "payment_failed" ❌
        ├─ Stock unchanged ✅
        ├─ Email sent ✅
        └─ User can retry
```

---

## Admin Panel Updates

| Status | Meaning | Next Action |
|--------|---------|-------------|
| payment_pending | Awaiting payment | Wait for M-Pesa callback |
| processing | ✅ Paid, ready to fulfill | Process order |
| confirmed | Being prepared | Pack items |
| shipped | In transit | Provide tracking |
| completed | Delivered | Order done |
| payment_failed | Payment declined | Contact customer |

---

## Key Code Changes

### 1. M-Pesa Callback (Success)
```javascript
// Extract payment ID
const paymentId = CallbackMetadata?.Item?.find(...)?.Value || CheckoutRequestID;

// Set status to 'processing' (not 'completed')
await orderRef.update({
  status: 'processing',
  paymentId: paymentId,
  stockReduced: false  // Will be set after stock reduced
});

// Reduce stock
await reduceOrderStock(orderId, orderData);

// Send email with paymentId
await sendPaymentConfirmationEmail(email, orderId, orderData, paymentId);
```

### 2. M-Pesa Callback (Failure)
```javascript
// Set status to 'payment_failed'
await orderRef.update({
  status: 'payment_failed',
  paymentError: `Failed with code: ${ResultCode}`
});
// Stock NOT reduced

// Send email with error code
await sendPaymentFailureEmail(email, orderId, orderData, ResultCode);
```

### 3. Stock Reduction
```javascript
// In createOrder: REMOVED stock reduction

// In M-Pesa callback (new function):
async function reduceOrderStock(orderId, orderData) {
  // Check if already reduced (prevent double-reduction)
  if (orderSnap.data().stockReduced) return;
  
  // Reduce stock for each item
  for (const item of orderData.items) {
    product.stock -= item.quantity;
    product.sold += item.quantity;
  }
  
  // Mark as reduced
  order.stockReduced = true;
}
```

---

## Important Fields in Firestore

### Orders Collection
```javascript
{
  id: "ABC123XYZ456",
  
  // Status fields
  status: "processing",              // ✅ NOW "processing" not "completed"
  paymentStatus: "completed",
  paymentError: null,                // Only on failure
  
  // Payment fields
  paymentId: "254700123456789",      // ✅ NEW - M-Pesa receipt
  transactionId: "254700123456789",  // ✅ Now same as paymentId
  
  // Stock management
  stockReduced: true,                // ✅ NEW - prevents double-reduction
  
  // Order data
  items: [...],
  total: 5000,
  shippingInfo: {...},
  userEmail: "customer@email.com",
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Testing Checklist

### Test 1: Successful Payment
- [ ] Place order
- [ ] Complete M-Pesa payment (enter PIN)
- [ ] Check Gmail inbox → See success email with Payment ID
- [ ] Check Firestore → Order status = "processing"
- [ ] Check Firestore → stockReduced = true
- [ ] Check Products → Stock quantity decreased

### Test 2: Failed Payment
- [ ] Place order
- [ ] Start M-Pesa payment
- [ ] Cancel or let it timeout/fail
- [ ] Check Gmail inbox → See failure email with error code
- [ ] Check Firestore → Order status = "payment_failed"
- [ ] Check Firestore → stockReduced NOT set
- [ ] Check Products → Stock unchanged

### Test 3: Payment Retry
- [ ] Retry payment on failed order
- [ ] Complete M-Pesa payment
- [ ] Check → Stock reduced (only once, not twice)
- [ ] Check email → New success email sent

---

## Troubleshooting

### Email not sending on success?
- Check Firestore → Look for order with paymentStatus = "completed"
- Check browser console → Look for email error
- Verify BREVO_API_KEY is set correctly

### Stock reducing but shouldn't?
- Check → order.stockReduced flag in Firestore
- Look for duplicate callbacks from M-Pesa
- Check backend logs for "Stock already reduced"

### Payment ID not in email?
- Check → paymentId parameter passed to sendPaymentConfirmationEmail
- Look at M-Pesa callback → MpesaReceiptNumber or CheckoutRequestID
- Email template shows: ${paymentId || 'N/A'}

### Orders not showing as "processing"?
- Check M-Pesa callback → ResultCode should be 0
- Look at Firestore → status field
- Verify backend updated order correctly

---

## Summary

✅ **Done**: Only send emails on payment success/failure
✅ **Done**: Include Payment ID in success emails
✅ **Done**: Include Error Code in failure emails
✅ **Done**: Set successful orders to "processing" status
✅ **Done**: Reduce stock only on successful payment
✅ **Done**: Prevent failed payments from affecting inventory

**Ready for deployment!**
