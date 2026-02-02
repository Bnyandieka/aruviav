# Aruviah Deployment Guide

## Overview
This guide covers deploying the Aruviah e-commerce platform to production with:
- **Frontend:** Vercel (React)
- **Backend:** Render (Node.js Express)
- **Database:** Firebase Firestore
- **Domain:** Custom domain with SSL

---

## Prerequisites
- GitHub account with the `aruviah` repository
- Vercel account (vercel.com)
- Render account (render.com)
- Firebase project (`aruviah-7c395`)
- Custom domain (optional)

---

## 1. Push to GitHub

### If not already pushed:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aruviah.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 2. Deploy Frontend to Vercel

### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Add New Project**
4. Select the `aruviah` repository
5. **Framework:** React
6. **Root Directory:** `./`
7. **Environment Variables:**
   ```
   REACT_APP_FIREBASE_API_KEY=<your_api_key>
   REACT_APP_FIREBASE_AUTH_DOMAIN=aruviah-7c395.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=aruviah-7c395
   REACT_APP_FIREBASE_STORAGE_BUCKET=aruviah-7c395.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
   REACT_APP_FIREBASE_APP_ID=<your_app_id>
   REACT_APP_FIREBASE_MEASUREMENT_ID=<your_measurement_id>
   REACT_APP_BACKEND_URL=https://your-backend.onrender.com
   ```
8. Click **Deploy**

### After Deployment:
- Vercel provides a URL: `https://aruviah.vercel.app` (you can customize)
- Auto-deploys on every git push to `main`

---

## 3. Deploy Backend to Render

### Step 1: Create `render.yaml`
The project already has a `render.yaml` file configured. It includes:
- **Service:** Node.js web service
- **Start command:** `npm start` or `node backend/server.js`
- **Environment variables:** Firebase, Lipana, Brevo, Stripe keys

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign in (create account if needed)
3. Click **New +** → **Web Service**
4. **Connect Repository:** Select `aruviah`
5. **Name:** `aruviah-api`
6. **Root Directory:** `backend/`
7. **Runtime:** Node
8. **Build Command:** `npm install`
9. **Start Command:** `npm start`
10. **Environment Variables:** (Add these)
    ```
    PORT=3001
    FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
    LIPANA_API_KEY=<your_lipana_key>
    LIPANA_CALLBACK_URL=https://your-domain.com/webhook
    BREVO_API_KEY=<your_brevo_key>
    STRIPE_SECRET_KEY=<your_stripe_key>
    STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
    ```
11. **Plan:** Free tier available
12. Click **Create Web Service**

### Step 3: Upload Firebase Service Account
1. After deployment, the backend will need `backend/firebase-service-account.json`
2. In Render dashboard, go to your service
3. Upload via **Environment** tab or deploy from git with the file included
4. Ensure `.gitignore` is set to **NOT** ignore this specific file for deployment

---

## 4. Configure Environment Variables

### Frontend (Vercel)
Update in Vercel Dashboard → Settings → Environment Variables:
```
REACT_APP_BACKEND_URL=https://aruviah-api.onrender.com
```

### Backend (Render)
Update in Render Dashboard → Environment:
```
LIPANA_CALLBACK_URL=https://aruviah-api.onrender.com/api/lipana/webhook
CORS_ALLOWED_ORIGINS=https://aruviah.vercel.app
```

---

## 5. Connect Custom Domain

### For Frontend (Vercel):
1. Go to Vercel Project Settings
2. **Domains** tab
3. Add your domain (e.g., `aruviah.com`)
4. Update DNS records (Vercel provides instructions)
5. Enable SSL (automatic)

### For Backend (Render):
1. Go to Render Web Service Settings
2. **Custom Domain**
3. Add domain (e.g., `api.aruviah.com`)
4. Update DNS records
5. SSL auto-enabled

### DNS Setup Example:
```
aruviah.com          →  CNAME  →  cname.vercel.app
api.aruviah.com      →  CNAME  →  <render-domain>.onrender.com
```

---

## 6. Test Deployment

### Frontend:
```
https://aruviah.vercel.app
```

### Backend Health Check:
```
curl https://your-backend.onrender.com/health
```

### Webhook Test:
POST to: `https://your-backend.onrender.com/api/lipana/webhook`

---

## 7. Monitoring & Logs

### Vercel:
- Dashboard → Deployments → View logs

### Render:
- Dashboard → Logs tab (real-time streaming)

---

## Troubleshooting

### Build Fails on Vercel:
- Check `.env` variables are correctly set
- Ensure `package.json` has all dependencies
- Run `npm run build` locally to test

### Backend Won't Start on Render:
- Check `PORT` environment variable (should be 3001 or left blank for auto)
- Verify Firebase service account JSON is accessible
- Check logs for missing dependencies

### CORS Issues:
- Update `CORS_ALLOWED_ORIGINS` in backend `.env`
- Restart backend service

---

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables set correctly
- [ ] Firebase project configured (`aruviah-7c395`)
- [ ] Custom domain(s) connected
- [ ] SSL certificates active
- [ ] CORS configured
- [ ] Webhook URLs updated
- [ ] Payment gateways tested (Lipana, Stripe)
- [ ] Monitoring alerts set up
- [ ] Database backups configured

---

## Next Steps

1. **Testing:** Run end-to-end tests in production
2. **Monitoring:** Set up error tracking (Sentry, etc.)
3. **Backups:** Enable Firebase automatic backups
4. **CDN:** Consider adding CloudFlare for frontend caching
5. **Analytics:** Set up Google Analytics & Firebase Analytics

