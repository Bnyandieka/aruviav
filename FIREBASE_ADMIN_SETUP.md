# Firebase Admin Setup for Webhook Firestore Updates

## Problem
Your webhook is receiving payment confirmations from Lipana, but can't update Firestore because Firebase Admin isn't initialized:
```
Skipping Firestore update: Firebase Admin not initialized
```

## Solution
You need to generate a Firebase Service Account key and configure it in your backend.

---

## Step 1: Get Firebase Service Account Key

### 1a. Go to Firebase Console
- Visit https://console.firebase.google.com
- Select your project: **eccomerce-768db**

### 1b. Navigate to Service Accounts
1. Click **⚙️ Settings** (gear icon) → **Project settings**
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. A JSON file will download - **save it securely**

The file will look like:
```json
{
  "type": "service_account",
  "project_id": "eccomerce-768db",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@eccomerce-768db.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## Step 2: Add to Backend

Choose **ONE** of these methods:

### Option A: Environment Variable (Recommended for Production)
1. Copy the entire JSON key file contents
2. Add to `backend/.env`:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"eccomerce-768db",...}
```

3. The backend will automatically parse it

### Option B: File Path (Easier for Development)
1. Save the JSON file in `backend/` folder as `firebase-service-account.json`
2. Add to `backend/.env`:
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Option C: Upload JSON File (Simple Setup)
1. Save as `backend/firebase-service-account.json`
2. The backend will auto-detect it (no .env needed)

---

## Step 3: Update Backend .env

Add one of these to `backend/.env`:

**Option A (Environment Variable):**
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"eccomerce-768db",...}
```

**Option B (File Path):**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

## Step 4: Restart Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Firebase Admin initialized for webhook order updates
```

---

## Step 5: Test Webhook

1. Complete another M-Pesa payment
2. Watch backend logs - you should now see:
   ```
   ✅ Lipana webhook signature verified
   ✅ Updated order [orderId] to completed
   ```
   Instead of:
   ```
   Skipping Firestore update: Firebase Admin not initialized
   ```

3. Check Firestore console - order `paymentStatus` should be `completed`

---

## Security Notes

⚠️ **IMPORTANT:**
- The service account key is **PRIVATE** - never commit to git
- Add to `.gitignore`:
  ```
  firebase-service-account.json
  ```
- Never share this key or the `FIREBASE_SERVICE_ACCOUNT_JSON` value
- For production, use environment variables (secret management)

---

## What Happens After Setup

```
Lipana Payment Complete
    ↓
Lipana calls your webhook at POST /api/lipana/webhook
    ↓
Backend verifies webhook signature ✅
    ↓
Backend initializes Firebase Admin ✅
    ↓
Backend finds order by ID in Firestore
    ↓
Backend updates order.paymentStatus = "completed"
    ↓
Backend sets lastUpdated timestamp
    ↓
Frontend listens to Firestore changes
    ↓
Frontend detects order update
    ↓
Frontend shows payment success page ✅
```

---

## Troubleshooting

### Still seeing "Firebase Admin not initialized"?
1. Check `backend/.env` has `FIREBASE_SERVICE_ACCOUNT_JSON` OR `FIREBASE_SERVICE_ACCOUNT_PATH`
2. Verify the JSON/path is correct
3. Restart backend with `npm run dev`
4. Look for `✅ Firebase Admin initialized` in startup logs

### JSON parsing error?
1. Make sure the full JSON is on ONE line (no newlines)
2. Escape quotes properly
3. Check JSON syntax is valid

### File not found error?
1. If using `FIREBASE_SERVICE_ACCOUNT_PATH`, verify file exists in `backend/` folder
2. Use relative path: `./firebase-service-account.json`

---

## Next Steps

1. Generate service account key from Firebase Console
2. Add to `backend/.env` using Option A or B above
3. Restart backend
4. Verify "Firebase Admin initialized" in logs
5. Complete a test payment
6. Check that Firestore is updated automatically
