# Email Inbox Troubleshooting Guide

## Issue: Email Inbox Shows Empty (0 emails)

### Step 1: Check Browser Console
1. **Open DevTools**: Press `F12` in your browser
2. **Go to Console tab**
3. **Look for these logs when admin inbox loads:**
   - `📧 AdminEmailInbox mounted/section changed: inbox` - Component loaded
   - `🔄 Fetching emails for section: inbox` - Started fetching
   - `📊 [inbox] Total emails in collection: X` - Number of emails in Firestore
   - `✅ [inbox] Returning X emails` - Emails loaded successfully

### Step 2: Test Email Creation
Run these commands in the browser console to test:

```javascript
// Test 1: Create a test email manually
const { saveEmailToAdminInbox } = await import('./src/services/email/adminEmailService');
const result = await saveEmailToAdminInbox({
  to: 'test@example.com',
  from: 'noreply@aruviah.com',
  subject: 'Test Email - ' + new Date().toLocaleTimeString(),
  htmlContent: '<p>This is a test email</p>',
  type: 'test',
  isSent: false
});
console.log('Result:', result);
```

**Expected Output:**
```
Result: { success: true, emailId: "some-long-id" }
```

**If you get an error:**
- Note the exact error message
- It likely indicates a Firestore permission or configuration issue

### Step 3: Verify Firestore Collection
Run this in console:

```javascript
// Test 2: Check Firestore directly
const { db } = await import('./src/services/firebase/config');
const { collection, getDocs, query, orderBy } = await import('firebase/firestore');

const q = query(
  collection(db, 'admin_emails'),
  orderBy('createdAt', 'desc')
);

const snapshot = await getDocs(q);
console.log('Total emails in Firestore:', snapshot.size);
snapshot.docs.forEach(doc => {
  console.log('Email:', {
    id: doc.id,
    to: doc.data().to,
    subject: doc.data().subject,
    isSent: doc.data().isSent
  });
});
```

**If `snapshot.size` is 0:**
- The `admin_emails` collection exists but has no documents
- Or the collection doesn't exist yet

**If you get an error like "Missing or insufficient permissions":**
- Firebase rules are blocking access
- See "Fix Firebase Rules" below

### Step 4: Test Email Fetch
Run this in console:

```javascript
// Test 3: Fetch emails programmatically
const { getEmailsBySection } = await import('./src/services/email/adminEmailService');
const result = await getEmailsBySection('all', 100);
console.log('Result:', result);
```

**Expected Output:**
```
Result: { success: true, emails: [...] }
```

---

## Common Issues & Fixes

### Issue 1: "Missing or insufficient permissions" Error

**Cause:** Firebase Firestore rules don't allow reads/writes to `admin_emails`

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `aruviah-7c395`
3. Go to **Firestore Database** → **Rules**
4. Replace rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin emails - allow authenticated users to read/write
    match /admin_emails/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Other collections as needed
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**
6. Refresh your app and try again

### Issue 2: Emails Not Appearing After Sending

**Possible Causes:**
1. Email was sent via Brevo but not saved to admin inbox
2. Error occurred during save but wasn't logged
3. Email is in "Sent" section but you're viewing "Inbox"

**Debugging:**
1. Send a test email through your app
2. Open DevTools Console
3. Look for: `✅ Email also saved to admin inbox:` or `❌ Failed to save to admin inbox:`
4. If you see the error, note the message

**Solution:**
- If Brevo sent OK but save failed: Check Firebase permissions (Issue 1)
- If Brevo send failed: Check Brevo API key in `.env`

### Issue 3: Brevo API Not Sending

**Check:**
1. Ensure `.env` file has: `REACT_APP_BREVO_API_KEY=your_key_here`
2. Check API key is correct (copy from Brevo dashboard)
3. Verify sender email is verified in Brevo account

**Debug in Console:**
```javascript
console.log('API Key Set:', !!process.env.REACT_APP_BREVO_API_KEY);
console.log('API Key Length:', process.env.REACT_APP_BREVO_API_KEY?.length);
```

Should show `true` and a number > 10

### Issue 4: Collection Doesn't Exist in Firestore

**Solution:** The collection auto-creates when you save the first email

**To create manually:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `aruviah-7c395`
3. Go to **Firestore Database**
4. Click **Start Collection**
5. Collection ID: `admin_emails`
6. Click **Auto-ID** and add this document:

```javascript
{
  to: "test@example.com",
  from: "noreply@aruviah.com",
  subject: "Test",
  htmlContent: "<p>Test</p>",
  type: "test",
  isSent: false,
  isRead: false,
  isStarred: false,
  isDraft: false,
  isSnoozed: false,
  createdAt: (current timestamp),
  updatedAt: (current timestamp)
}
```

Then refresh your app and check if it appears in inbox.

---

## Step-by-Step Verification

Run these in order in the browser console:

```javascript
// 1. Check Firebase initialization
const { db } = await import('./src/services/firebase/config');
console.log('Firebase DB:', db);

// 2. Check Firestore collection access
const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
const snap = await getDocs(query(collection(db, 'admin_emails'), orderBy('createdAt', 'desc')));
console.log('Total emails:', snap.size);

// 3. Create test email
const { saveEmailToAdminInbox } = await import('./src/services/email/adminEmailService');
const testResult = await saveEmailToAdminInbox({
  to: 'test@example.com',
  from: 'noreply@aruviah.com',
  subject: 'Test - ' + Date.now(),
  htmlContent: '<p>Test</p>',
  type: 'test',
  isSent: false
});
console.log('Save result:', testResult);

// 4. Fetch to verify
const { getEmailsBySection } = await import('./src/services/email/adminEmailService');
const fetchResult = await getEmailsBySection('all');
console.log('Emails:', fetchResult.emails.length);

// 5. Refresh the inbox component
// The page should now show at least 1 email
```

---

## Enable Auto-Refresh

To make emails appear in real-time as they're sent, run in console:

```javascript
// Auto-refresh every 5 seconds
setInterval(async () => {
  const { getEmailsBySection } = await import('./src/services/email/adminEmailService');
  const result = await getEmailsBySection('all');
  console.log('Refresh - Total emails:', result.emails.length);
}, 5000);
```

Or add this to the component for automatic polling.

---

## Contact Brevo Support

If emails aren't sending via Brevo:
1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Check **Activity** → **Email Log** to see if emails were sent
3. If no emails appear, verify:
   - API key is correct
   - Sender email is verified
   - Recipient email is valid (not a test email if Brevo is in free tier)

---

## Quick Checklist

- [ ] No console errors when opening Admin Email Inbox
- [ ] `Total emails in collection: X` log shows > 0
- [ ] Firebase permissions allow read/write to `admin_emails`
- [ ] `.env` has valid Brevo API key
- [ ] Test email appears in inbox after running manual save test
- [ ] "Sent" section shows emails when you click it
- [ ] Refresh button works and updates counts
