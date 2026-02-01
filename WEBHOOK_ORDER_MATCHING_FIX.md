# Webhook Order Matching Fix

## Problem
Webhooks were being received and verified correctly, but couldn't find matching orders:
```
No matching order found by checkoutRequestId/transactionId
```

## Root Cause
The webhook handler was looking for orders in the wrong location:
- **Was looking**: `transaction.checkoutRequestID` (nested field)
- **Actually stored**: `checkoutRequestID` (top-level field)

When the frontend calls `updateOrderStatus()` after initiating M-Pesa payment, it stores:
```javascript
{
  transactionId: "TXN1769953181352ZOC4UZ",
  checkoutRequestID: "...",
  transactionData: { ... }
}
```

These fields go to the **top-level** of the order document, not inside a `transaction` object.

## Solution Applied

Updated [backend/server.js](backend/server.js#L467-L501) webhook handler to:

1. **Look at top-level fields** for `checkoutRequestID` and `transactionId`
2. **Improved logging** to show what's being extracted and searched
3. **Better error messages** for debugging

### New Query Logic
```javascript
// Before: Looking in wrong place
q = ordersRef.where('transaction.checkoutRequestId', '==', checkoutRequestId)

// After: Look at top-level fields
q = ordersRef.where('checkoutRequestID', '==', checkoutRequestId)
q = ordersRef.where('transactionId', '==', transactionId)
```

## How It Works Now

### Flow
```
1. User completes M-Pesa payment
   ↓
2. Frontend stores in order: transactionId, checkoutRequestID
   ↓
3. Lipana calls webhook with transactionId
   ↓
4. Backend extracts transactionId from webhook
   ↓
5. Backend searches for order WHERE transactionId == ...
   ↓
6. ✅ ORDER FOUND
   ↓
7. Order status updates to "completed"
```

### Updated Log Output
You'll now see:
```
🔍 Extracted webhook data:
   Event: transaction.success
   Order ID: (not in metadata)
   Transaction ID: TXN1769953181352ZOC4UZ
   Checkout Request ID: (not found)
   Status: success

🔍 Searching for order by transactionId: TXN1769953181352ZOC4UZ
✅ Found order 00R9L0OYUhpYnqsucCv2 by transaction identifier
✅ Updated order 00R9L0OYUhpYnqsucCv2 to completed
```

## Testing the Fix

1. Complete an M-Pesa payment
2. Watch backend logs for the new output format
3. Should see `✅ Found order...` instead of `❌ No matching order found...`
4. Check Firestore - order `paymentStatus` should be `completed`

## Data Structure Reference

### Order Document in Firestore
```javascript
{
  id: "00R9L0OYUhpYnqsucCv2",           // Document ID
  
  // Top-level transaction fields (stored by frontend)
  transactionId: "TXN1769953181352ZOC6UZ",
  checkoutRequestID: "ws_CO_...",
  transactionData: {
    transactionId: "...",
    checkoutRequestID: "...",
    orderId: "...",
    status: "pending",
    timestamp: "...",
    amount: 100,
    phone: "+254703147873"
  },
  
  // Payment status fields
  paymentStatus: "completed",           // Will be updated by webhook
  
  // Order fields
  status: "pending",
  items: [...],
  userEmail: "...",
  createdAt: "...",
  updatedAt: "..."
}
```

### Webhook Payload from Lipana
```javascript
{
  event: "transaction.success",
  data: {
    transactionId: "TXN1769953181352ZOC4UZ",  // This is what we extract
    amount: 10,
    phone: "+254703147873",
    reference: "...",
    status: "success",
    timestamp: "..."
  }
}
```

## Files Changed
- **[backend/server.js](backend/server.js)** - Updated webhook handler:
  - Lines 425-442: Added improved extraction logging
  - Lines 467-501: Fixed query to look at top-level fields

## What the Webhook Does After Matching

Once the order is found by `transactionId`:
```javascript
await orderDocRef.update({
  paymentStatus: "completed",
  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  transaction: {
    id: transactionId,
    checkoutRequestId: checkoutRequestId,
    raw: data  // Full Lipana webhook data
  }
})
```

## Next Payment Test

When you make the next payment:
1. Lipana will send webhook with `transactionId`
2. Backend will extract it
3. Backend will search orders for matching `transactionId`
4. ✅ **FOUND** - Order will be updated automatically
5. Frontend will detect Firestore change and show success

---

## Troubleshooting

**Still seeing "No matching order found"?**

Check:
1. ✅ Is transactionId in the webhook? (should be in `data.transactionId`)
2. ✅ Did frontend store it in order? (check Firestore for `transactionId` field)
3. ✅ Are the values identical? (exact match required)
4. ✅ Backend restarted? (need to reload the new code)

**Verify Order Structure**
In Firebase Console, go to order document and check:
- `transactionId` field exists at top level
- Value matches Lipana response
- No typos or extra whitespace
