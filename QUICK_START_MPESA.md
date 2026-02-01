# ⚡ QUICK START - M-Pesa Lipana Integration

## 🚀 Start Here (3 Steps)

### Step 1: Start Backend
```bash
cd backend
npm run dev
```
Wait for: `✅ BACKEND SERVER RUNNING ON PORT 3001`

### Step 2: Hard Refresh React
Go to http://localhost:3000 and press:
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### Step 3: Test Payment
1. Add item to cart
2. Go to Checkout
3. Select **M-Pesa** payment
4. Use phone: `0712345678` (or `254712345678` or `+254712345678`)
5. Click "Place Order"
6. **Watch backend terminal for logs**

## 📊 What You Should See

### Backend Terminal
```
✅ LIPANA REQUEST RECEIVED
📱 Phone: 254712345678
💰 Amount: 100
📦 Order ID: order-123
📥 Lipana response status: 200 OK
✅ STK Push successful! Transaction ID: ...
```

**If you see these logs** → Integration is working! ✅

## 🔧 Configuration Quick Check

- ✅ Frontend `.env`: `REACT_APP_API_URL=http://localhost:3001`
- ✅ Backend `.env`: `LIPANA_SECRET_KEY=lip_sk_live_...`
- ✅ Backend running: Port 3001
- ✅ React app refreshed: Hard refresh done

## 🐛 If Something's Wrong

| Problem | Solution |
|---------|----------|
| Backend doesn't show logs | Run `npm run dev` in backend folder |
| Still getting 404 error | Hard refresh: Ctrl+Shift+R (clear cache) |
| Wrong port | Check `.env` has port 3001 |
| Lipana says "Not configured" | Check `backend/.env` has LIPANA_SECRET_KEY |

## 📞 Test Numbers

All these formats work:
- `0712345678`
- `254712345678`  
- `+254712345678`

Backend automatically converts to `+254` format.

## ✨ How It Works

```
React App (localhost:3000)
       ↓
  Backend (localhost:3001)
       ↓
  Lipana API
```

Your secret key stays on backend - frontend never sees it! 🔒

---

**Everything is ready. Just test it!** 🎉
