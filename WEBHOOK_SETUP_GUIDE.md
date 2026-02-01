# Webhook Configuration Guide - Lipana M-Pesa Integration

## ⚠️ Problem: Webhooks Not Working

The webhook endpoint exists in your backend at `POST /api/lipana/webhook`, but **Lipana is not calling it** because you need to configure the webhook URL in the **Lipana Dashboard**.

---

## ✅ Solution: Configure Webhook in Lipana Dashboard

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.com/api/lipana/webhook
```

**For Development:**
- If using ngrok: `https://your-ngrok-url.ngrok.io/api/lipana/webhook`
- If using localhost: You need ngrok (localhost won't work - Lipana can't reach your local machine)

**For Production:**
- Replace `your-domain.com` with your actual production domain

### Step 2: Go to Lipana Dashboard

1. Log in to [Lipana Dashboard](https://dashboard.lipanampesa.com)
2. Navigate to **Settings** → **Webhooks** or **Integrations** → **Webhook Configuration**
3. Look for "Payment Webhook URL" or similar option

### Step 3: Add Your Webhook URL

In the webhook settings:
1. **Webhook URL**: Paste your webhook endpoint
   ```
   https://your-domain.com/api/lipana/webhook
   ```

2. **Webhook Secret** (if available): 
   - Copy the webhook secret from Lipana
   - Add it to your backend `.env`:
     ```
     LIPANA_WEBHOOK_SECRET=your_webhook_secret_here
     ```

3. **Events to Listen For**:
   - ✅ Payment Succeeded
   - ✅ Payment Failed
   - ✅ Payment Pending
   - (Select whichever events you want to listen to)

4. **Click Save/Enable**

### Step 4: Verify Webhook Configuration

1. In Lipana Dashboard, look for a "Test Webhook" button
2. Send a test webhook
3. Check your backend logs to see if the webhook was received

**Success looks like:**
```
📥 Lipana webhook received: {
  "event": "payment.succeeded",
  "data": { "status": "success", "checkoutRequestId": "...", "metadata": {...} }
}
✅ Lipana webhook signature verified
✅ Updated order ... to completed
```

---

## 🌐 Using ngrok for Local Development

If you're testing locally and don't have a public domain:

### Step 1: Install ngrok
```bash
# Download from https://ngrok.com/download
# Or if you have it via Chocolatey:
choco install ngrok
```

### Step 2: Start ngrok Tunnel
```bash
ngrok http 3001
```

You'll see:
```
ngrok by @inconshreveable

Session Status                online
Account                       [your account]
Version                       3.0.0
Region                        us (United States)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://1234-56-78-910.ngrok.io -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p95
                              0       0       0.00    0.00    0.00    0.00
```

### Step 3: Use the HTTPS URL in Lipana

Your webhook URL becomes:
```
https://1234-56-78-910.ngrok.io/api/lipana/webhook
```

⚠️ **Important**: ngrok URLs change each time you restart. For production, use your actual domain.

---

## 📋 Backend Webhook Handler

Your backend webhook handler at `/api/lipana/webhook` supports:

### Lipana Webhook Format 1:
```json
{
  "event": "payment.succeeded",
  "data": {
    "id": "txn_123",
    "checkoutRequestId": "ws_CO_...",
    "amount": 100,
    "status": "success",
    "metadata": {
      "orderId": "order-abc"
    }
  }
}
```

### Lipana Webhook Format 2:
```json
{
  "type": "payment",
  "status": "success",
  "checkoutRequestId": "ws_CO_...",
  "transactionId": "txn_123",
  "metadata": {
    "orderId": "order-abc"
  }
}
```

The handler automatically:
- ✅ Verifies webhook signature using `LIPANA_WEBHOOK_SECRET`
- ✅ Extracts transaction details
- ✅ Finds the corresponding order by `orderId`
- ✅ Updates Firebase Firestore with payment status
- ✅ Normalizes status to: `completed`, `failed`, or `pending`

---

## 🔐 Webhook Signature Verification

Lipana signs webhooks with an HMAC-SHA256 signature. Your backend:

1. Receives the raw request body
2. Retrieves the signature from header: `x-lipana-signature` (or alternatives)
3. Computes: `HMAC-SHA256(webhook_secret, raw_body)`
4. Compares signatures using `timingSafeEqual` (timing-safe comparison)
5. Returns `401 Unauthorized` if verification fails

To enable this:
```env
# backend/.env
LIPANA_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
```

---

## 🧪 Testing Webhooks Locally

### Option 1: Using Lipana Dashboard Test Button
1. Go to Lipana Webhook Settings
2. Click "Send Test Webhook"
3. Watch your backend logs

### Option 2: Manual curl Test
```bash
curl -X POST http://localhost:3001/api/lipana/webhook \
  -H "Content-Type: application/json" \
  -H "x-lipana-signature: test-signature" \
  -d '{
    "event": "payment.succeeded",
    "data": {
      "checkoutRequestId": "test-123",
      "status": "success",
      "metadata": {
        "orderId": "order-test-123"
      }
    }
  }'
```

### Option 3: Simulate Full Payment Flow
1. Complete a payment in your app
2. Lipana processes it
3. Lipana calls your webhook automatically
4. Your backend updates the Firebase order
5. Frontend listens to Firestore for updates and shows success

---

## 📊 Data Flow with Webhooks

```
User Initiates M-Pesa Payment
    ↓
Frontend: initiateMpesaPayment()
    ↓
Backend: POST /api/lipana/initiate-stk-push
    ↓
Backend creates order in Firestore (status: pending)
    ↓
Lipana: Generates STK push prompt
    ↓
User: Enters PIN to complete payment
    ↓
M-Pesa: Processes payment
    ↓
Lipana: Receives payment confirmation
    ↓
Lipana: Calls your webhook at POST /api/lipana/webhook
    ↓
Backend: Verifies signature and updates order (status: completed)
    ↓
Frontend: Listens to Firestore changes
    ↓
Frontend: Updates UI to show payment success
```

---

## ✅ Checklist

- [ ] Backend webhook endpoint exists: `/api/lipana/webhook`
- [ ] You have ngrok running (or a public domain)
- [ ] Webhook URL is configured in Lipana Dashboard
- [ ] Webhook secret is in `backend/.env` as `LIPANA_WEBHOOK_SECRET`
- [ ] Test webhook shows success in backend logs
- [ ] Real payment flow updates order status via webhook
- [ ] Frontend shows payment success within 5 seconds

---

## 🆘 Troubleshooting

### Webhook not being called?
1. **Check Lipana Dashboard**: Verify webhook URL is correct and enabled
2. **Check logs**: Add `console.log('Webhook endpoint called')` at the top of webhook handler
3. **Verify domain**: Use `https://` (Lipana requires HTTPS)
4. **Restart ngrok**: If using ngrok, URL changes on restart - update in Lipana

### Signature verification failing?
1. Check `backend/.env` has correct `LIPANA_WEBHOOK_SECRET`
2. Verify the secret matches what's in Lipana Dashboard
3. Check logs for signature mismatch warning

### Order not updating?
1. Verify `metadata.orderId` matches an order in Firestore
2. Check Firebase Admin is initialized in backend
3. Check `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH` is set

---

## 📞 Next Steps

1. **Set up ngrok** if you're testing locally
2. **Configure webhook URL** in Lipana Dashboard
3. **Set webhook secret** in `backend/.env`
4. **Test webhook** using Lipana's test feature
5. **Complete a real payment** and verify order updates
