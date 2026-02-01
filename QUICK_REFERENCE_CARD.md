# 🎯 M-Pesa Integration - Quick Reference Card

## 🚀 Start Backend (Do This First!)
```bash
cd backend
npm run dev
```
Expect: `✅ BACKEND SERVER RUNNING ON PORT 3001` and `Lipana Status: ✅ Configured`

---

## 🌐 Hard Refresh React
Go to http://localhost:3000  
Press: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

---

## 💳 Test Payment
1. Add item to cart
2. Go to Checkout
3. Enter shipping (Step 1)
4. Select M-Pesa payment (Step 2)
5. Phone: `0712345678`
6. Click "Place Order" (Step 3)

---

## 📋 What Should Appear in Backend Terminal

### ✅ When Backend Starts
```
🚀 ===============================================
✅ BACKEND SERVER RUNNING ON PORT 3001
🚀 ===============================================

SendGrid Status: ⚠️ Not configured (emails logged to console)
Lipana Status: ✅ Configured
```

### ✅ When Payment is Submitted
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 0712345678
💰 Amount: 100
📦 Order ID: order-xyz

📤 Calling Lipana API with phone: +254712345678 amount: 100
📥 Lipana response status: 200 OK
📋 Lipana response data: {...success: true...}
✅ STK Push successful! Transaction ID: 123456789
```

**If you see this → Integration works! ✅**

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| `Lipana Status: ⚠️ Not configured` | Check `backend/.env` has LIPANA_SECRET_KEY |
| `404 error in React` | Hard refresh: Ctrl+Shift+R |
| `No logs when clicking order` | Backend not running? Start with `npm run dev` |
| `Invalid phone format error` | Use format: `0712345678` or `254712345678` |

---

## 📍 File Locations (If You Need to Edit)

| Purpose | File | Action |
|---------|------|--------|
| Backend code | `backend/server.js` | Read lines 990-1070 |
| Frontend code | `src/pages/CheckoutPage.jsx` | Read around line 110 |
| Payment service | `src/services/payment/mpesaService.js` | Read lines 20-35 |
| Backend config | `backend/.env` | Check LIPANA_SECRET_KEY is set |
| Frontend config | `.env` | Check REACT_APP_API_URL=http://localhost:3001 |

---

## 🔍 Log Output Reference

| Log | Meaning | Status |
|-----|---------|--------|
| `✅ BACKEND SERVER RUNNING` | Backend is running | Good ✅ |
| `Lipana Status: ✅ Configured` | Lipana key is set | Good ✅ |
| `✅ LIPANA REQUEST RECEIVED` | Frontend connected | Good ✅ |
| `📱 Phone: ...` | Phone data received | Good ✅ |
| `💰 Amount: ...` | Amount data received | Good ✅ |
| `📦 Order ID: ...` | Order ID data received | Good ✅ |
| `📥 Response status: 200 OK` | Lipana responded OK | Good ✅ |
| `✅ STK Push successful!` | Payment initiated | Good ✅ |
| `❌ Lipana API returned error:` | Payment failed | Check error message |

---

## 📱 Phone Number Formats (All Work!)

Any of these formats will work - backend auto-converts:
- `0712345678` ← Standard Kenyan format
- `254712345678` ← With country code
- `+254712345678` ← International format

Backend converts to: `+254712345678` automatically

---

## 💰 Amount Requirements

- **Minimum**: 10 KES
- **Maximum**: 150000 KES
- **Format**: Any number between 10-150000
- **Examples**: 50, 100, 1000, 5000, 150000 all work

---

## ⚙️ Configuration Quick Check

| Config | Value | Where |
|--------|-------|-------|
| Backend Port | 3001 | `backend/.env` or terminal |
| Frontend API URL | http://localhost:3001 | `frontend/.env` |
| Lipana Secret Key | lip_sk_live_... | `backend/.env` |
| Lipana API Endpoint | https://api.lipana.dev/v1 | hardcoded in server.js |

---

## 🔄 Data Flow (Simple)

```
Browser
  ↓ (Ctrl+Shift+R hard refresh)
React (localhost:3000)
  ↓ (Click "Place Order")
Backend (localhost:3001)
  ↓ (Logs all steps)
Lipana API
  ↓ (Returns response)
Backend (Logs success/error)
  ↓ (Sends to React)
React (Shows success/error)
```

---

## ✨ 8 Logging Checkpoints

1. **Backend Startup** - See "✅ RUNNING" message
2. **Request Received** - See "✅ REQUEST RECEIVED"
3. **Phone Received** - See "📱 Phone: ..."
4. **Amount Received** - See "💰 Amount: ..."
5. **Order ID Received** - See "📦 Order ID: ..."
6. **Lipana Called** - See "📤 Calling Lipana..."
7. **Response Received** - See "📥 Response status: 200"
8. **Success/Error** - See "✅ STK successful!" or error

All 8 = Working! 🎉

---

## 🎓 Key Concepts

- **Port 3001**: Backend server port
- **Port 3000**: React app port  
- **Hard Refresh**: Ctrl+Shift+R to clear cache
- **Logging**: All in backend terminal, not browser console
- **Proxy Pattern**: Frontend → Backend → Lipana (for security)

---

## 📚 Useful Documents

- `QUICK_START_MPESA.md` ← 3-step guide
- `WHAT_TO_DO_NEXT.md` ← Detailed action plan
- `LIPANA_LOGGING_REFERENCE.md` ← Log examples
- `ARCHITECTURE_AND_DATA_FLOW.md` ← System design

---

## 🎯 Success Checklist

Before saying "it works", verify:

- [ ] Backend starts with startup message
- [ ] Lipana shows as configured
- [ ] Frontend hard refresh done (Ctrl+Shift+R)
- [ ] Payment request triggers "✅ REQUEST RECEIVED" log
- [ ] Phone number appears in logs
- [ ] Amount appears in logs
- [ ] Lipana API response status shows 200
- [ ] Transaction ID appears in logs
- [ ] "✅ STK Push successful!" message shows
- [ ] React shows success toast
- [ ] React redirects to success page

All checked = Working! ✅

---

## ⏱️ Expected Timing

| Step | Time |
|------|------|
| Start backend | < 1 second |
| See startup message | 2-3 seconds |
| Hard refresh React | < 1 second |
| Payment submission | < 1 second |
| See logs appear | 1-2 seconds |
| Backend processes | 500ms-1s |
| Response to frontend | < 100ms |
| React shows success | < 1 second |

**Total end-to-end**: 2-5 seconds

---

## 🆘 When Something's Wrong

### Step 1: Is backend running?
```bash
# Check if terminal shows:
✅ BACKEND SERVER RUNNING ON PORT 3001
```
If not: `npm run dev` in backend folder

### Step 2: Is Lipana configured?
```bash
# Check terminal shows:
Lipana Status: ✅ Configured
```
If not: Check `backend/.env` has LIPANA_SECRET_KEY

### Step 3: Did hard refresh?
```
# Press Ctrl+Shift+R in browser
```
If not: Do it now!

### Step 4: Check logs when clicking
```bash
# Should see in backend terminal:
✅ LIPANA REQUEST RECEIVED
```
If not: Check browser network tab for errors

---

## 📞 Quick Test Without UI

```bash
node TEST_LIPANA_ENDPOINT.js
```

This sends a test request directly to backend without using UI.
Check logs to see response.

---

**Version**: Final Production Ready  
**Status**: ✅ All Logging Implemented  
**Confidence**: 🟢 HIGH (9/10)

---

**Start here**: Run `npm run dev` in backend folder!
