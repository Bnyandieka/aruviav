# 🚀 Shopki Email Integration - Quick Start

## What's Ready ✅

Your Shopki app now has **real email sending** fully integrated!

### Features Enabled:
- ✅ Order confirmation emails (sent when customer orders)
- ✅ Order status update emails (sent when admin updates order)
- ✅ Beautiful HTML email templates
- ✅ Professional branding
- ✅ Express.js backend API
- ✅ SendGrid integration

## Setup in 5 Minutes

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up (FREE - 100 emails/day)
3. Verify your email

### Step 2: Get API Key
1. Login to SendGrid
2. Go to **Settings → API Keys**
3. Create new API key
4. **Copy the key** (save it!)

### Step 3: Configure Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
SENDGRID_API_KEY=your_api_key_from_step_2
SENDGRID_FROM_EMAIL=your_email@example.com
PORT=3001
```

**Note:** Use a verified email or `noreply@sendgrid.net` for testing

### Step 4: Start Backend

```bash
npm start
```

Should show:
```
🚀 Email API server running on port 3001
📧 SendGrid API Key: ✅ Configured
```

### Step 5: Configure Frontend

In project root, create `.env` file (or update existing):

```env
REACT_APP_API_URL=http://localhost:3001
```

### Step 6: Start Frontend

In a new terminal (from project root):

```bash
npm start
```

## Test It! 🧪

1. **Order Confirmation Email:**
   - Add product to cart
   - Complete checkout
   - Check your email for order confirmation

2. **Status Update Email:**
   - Go to Orders page (as admin)
   - Click any status button (e.g., "Processing")
   - Customer receives email with new status

## Folder Structure

```
shopki/
├── backend/                    # NEW! Email API server
│   ├── server.js              # Express email service
│   ├── package.json           # Dependencies
│   ├── .env.example           # Template
│   └── .gitignore
├── src/services/firebase/
│   ├── emailService.js        # Email templates & functions
│   └── firestoreHelpers.js    # Updated to send emails
├── SENDGRID_SETUP.md          # Detailed setup guide
└── .env                       # Your config (create this)
```

## Troubleshooting

### Backend won't start?
- Check port 3001 is free
- Verify `.env` file exists
- Check Node.js is installed: `node --version`

### Emails not sending?
```bash
# Test backend is running
curl http://localhost:3001/api/health
# Should return: {"status":"ok","message":"..."}

# Check SENDGRID_API_KEY in backend/.env
# Check sender email is verified in SendGrid dashboard
```

### CORS errors?
- Make sure `REACT_APP_API_URL=http://localhost:3001` in frontend `.env`
- Restart both frontend and backend

## Next Steps

1. ✅ Set up SendGrid account
2. ✅ Configure backend `.env`
3. ✅ Configure frontend `.env`
4. ✅ Start backend: `cd backend && npm start`
5. ✅ Start frontend: `npm start`
6. 🎉 Test email sending!

## Files to Reference

- **Setup Guide:** `SENDGRID_SETUP.md` (detailed instructions)
- **Backend Docs:** `backend/README.md`
- **Email Functions:** `src/services/firebase/emailService.js`
- **Database Integration:** `src/services/firebase/firestoreHelpers.js`

## Key Points

📧 **All order data is automatically sent**
- Customer email
- Order ID
- Item details
- Shipping info
- Order status

🔒 **Your SendGrid API key is safe**
- Stored in `backend/.env` (git ignored)
- Never exposed to frontend

🚀 **Production ready**
- See `SENDGRID_SETUP.md` for deployment instructions
- Heroku, Railway, AWS Lambda, or self-hosted

## What Happens When

| Event | Email Sent | Template |
|-------|-----------|----------|
| Customer places order | ✅ Yes | Order Confirmation |
| Admin changes status → Pending | ✅ Yes | Status: Pending |
| Admin changes status → Processing | ✅ Yes | Status: Processing |
| Admin changes status → Shipped | ✅ Yes | Status: Shipped |
| Admin changes status → Completed | ✅ Yes | Status: Completed |
| Admin changes status → Cancelled | ✅ Yes | Status: Cancelled |
| Admin changes status → Returned | ✅ Yes | Status: Returned |

## Email Features

Each email includes:
- Professional HTML design
- Shopki branding
- Order details
- Item list with prices
- Status indicators
- Color-coded status badges
- Call-to-action buttons
- Contact information

## Support

For detailed info, see:
- `SENDGRID_SETUP.md` - Complete setup with all options
- `backend/README.md` - Backend documentation
- https://sendgrid.com/docs - SendGrid documentation

---

**Status:** ✅ Ready to use!  
**Last Updated:** November 30, 2025
