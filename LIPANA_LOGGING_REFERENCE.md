# Lipana Endpoint Logging Output Reference

## Backend Startup (When you run `npm run dev`)

```
🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ✅ Configured
```

**This means**: Backend is ready to receive payment requests

---

## Payment Request Processing (When user clicks "Place Order")

### 1. Request Arrives at Backend
```
✅ LIPANA REQUEST RECEIVED
```

### 2. Request Details Logged
```
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: order-xyz-123456
```

### 3. Lipana API Response Received
```
📥 Lipana response status: 200 OK
```

### 4. Response Data Logged
```
📋 Lipana response data: {
  "success": true,
  "data": {
    "transactionId": "123456789",
    "checkoutRequestID": "ws_CO_abc123def456",
    "message": "STK push initiated successfully"
  }
}
```

### 5. Success Confirmation
```
✅ STK Push successful! Transaction ID: 123456789
```

---

## Complete Successful Flow Log

```
🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ✅ Configured

[User clicks "Place Order"]

✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: order-xyz-123456
📥 Lipana response status: 200 OK
📋 Lipana response data: {
  "success": true,
  "data": {
    "transactionId": "123456789",
    "checkoutRequestID": "ws_CO_abc123def456",
    "message": "STK push initiated successfully"
  }
}
✅ STK Push successful! Transaction ID: 123456789
```

---

## Error Scenario Logs

### Invalid Phone Format
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: invalid
💰 Amount: 100
📦 Order ID: order-xyz
❌ Lipana API returned error: Invalid phone format
```

### Amount Out of Range (Less than 10 KES)
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 5
📦 Order ID: order-xyz
❌ Lipana API returned error: Minimum amount is 10 KES
```

### Lipana API Not Responding
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: order-xyz
📥 Lipana response status: 503 Service Unavailable
❌ Lipana API returned error: Service temporarily unavailable
```

### Missing Lipana API Key
```
🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ⚠️ Not configured  ← API Key missing!
```

---

## What Each Log Means

| Log | Meaning |
|-----|---------|
| `🚀 BACKEND SERVER RUNNING ON PORT 3001` | Backend started successfully |
| `Lipana Status: ✅ Configured` | Lipana API key is set |
| `✅ LIPANA REQUEST RECEIVED` | Frontend request arrived |
| `📱 Phone:` | The phone number submitted |
| `💰 Amount:` | The payment amount in KES |
| `📦 Order ID:` | The order reference |
| `📥 Lipana response status: 200 OK` | Lipana API responded successfully |
| `📋 Lipana response data:` | Complete response from Lipana |
| `✅ STK Push successful!` | Payment request processed successfully |
| `❌ Lipana API returned error:` | An error occurred |

---

## Expected vs Unexpected Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `200 OK` | Request successful | Payment initiated, user gets STK prompt |
| `400 Bad Request` | Invalid data (phone/amount) | Check frontend form validation |
| `401 Unauthorized` | API key wrong | Check `backend/.env` LIPANA_SECRET_KEY |
| `403 Forbidden` | API key invalid | Verify Lipana account and key |
| `500 Server Error` | Backend error | Check server logs for details |
| `503 Service Unavailable` | Lipana API down | Try again later |

---

## Testing the Endpoint Manually

If you want to test without going through the React UI:

```bash
node TEST_LIPANA_ENDPOINT.js
```

This will send a test request and show you the complete response.

---

## How to Use Logs for Debugging

1. **No logs appearing?**
   - Backend not running → Run `npm run dev` in backend folder
   - React not calling backend → Hard refresh (Ctrl+Shift+R)

2. **Logs show request but no response?**
   - Network issue → Check internet connection
   - Lipana down → Try again later

3. **Response has error?**
   - Read the error message in logs
   - Check phone format: should start with 0, 254, or +254
   - Check amount: must be 10-150000 KES

4. **Success logs appear but frontend shows error?**
   - Frontend not receiving response → Check network tab in DevTools
   - Response not parsed correctly → Check frontend error logs

---

## Complete Request Flow with Logs

```
[Browser] User fills checkout form
    ↓
[Frontend] Click "Place Order" with M-Pesa selected
    ↓
[Frontend] axios.post('http://localhost:3001/api/lipana/initiate-stk-push', {
    phone: '0712345678',
    amount: '100',
    orderId: 'order-123'
})
    ↓
[Backend receives request and logs]:
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 100
📦 Order ID: order-123
    ↓
[Backend converts phone to +254 format and calls Lipana]
    ↓
[Lipana responds and backend logs]:
📥 Lipana response status: 200 OK
📋 Lipana response data: {...}
✅ STK Push successful! Transaction ID: abc123
    ↓
[Backend sends response back to frontend]
    ↓
[Frontend] receives {success: true, transactionId: '...'}
    ↓
[Frontend] Shows "STK prompt sent!" toast
    ↓
[User] Receives M-Pesa STK prompt on phone
```

**All of this is visible in the backend logs!**

---

**Reference Created**: For understanding Lipana logging output
