# Admin Setup Guide

This guide explains how to set up admin users in the Shopki e-commerce platform.

## Overview

The admin system uses Firestore user documents with an `isAdmin` boolean flag. Only users with `isAdmin: true` can access the admin dashboard and manage products, categories, and orders.

## How to Make a User an Admin

### Method 1: Firebase Console (Recommended for Development)

1. **Go to Firebase Console**:
   - Open [Firebase Console](https://console.firebase.google.com/)
   - Select your project (`shopki-1584c`)
   - Navigate to **Firestore Database**

2. **Find the User Document**:
   - Click on the **`users`** collection
   - Find the user document by their email or UID
   - If the user doesn't exist yet, they need to sign up first

3. **Update isAdmin Field**:
   - Click on the user document to open it
   - Look for the `isAdmin` field
   - If it doesn't exist, click **Add field**
   - Name: `isAdmin`
   - Type: `Boolean`
   - Value: `true`
   - Click **Save**

### Method 2: Programmatically (For Automation)

If you want to set isAdmin programmatically, you can use this code in the browser console or create a script:

```javascript
// Example: Set a user as admin using Firebase Admin SDK
// This should be done in a secure backend, NOT in frontend code

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './services/firebase/config';

async function makeUserAdmin(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isAdmin: true
    });
    console.log('User is now an admin');
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

// Usage:
// makeUserAdmin('user-uid-here');
```

## User Document Structure

When a user signs up, their Firestore document looks like this:

```json
{
  "uid": "user-unique-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "createdAt": "2025-11-30T12:00:00.000Z",
  "photoURL": null,
  "isAdmin": false,
  "cart": [],
  "orders": [],
  "wishlist": []
}
```

To make them an admin, simply set `isAdmin: true`.

## Accessing the Admin Dashboard

Once a user is marked as admin (`isAdmin: true`):

1. **Sign in** with the admin account
2. Click on **Account** in the header
3. You'll see **Admin Dashboard** link in the dropdown menu
4. Click it to access the admin panel

## Admin Dashboard Features

The admin dashboard (`/admin`) includes:

- **Product Management**
  - Add new products
  - Edit existing products
  - Delete products
  - Upload product images via Cloudinary

- **Category Management**
  - Create categories
  - Edit categories
  - Delete categories

- **Order Management**
  - View all orders
  - Update order status
  - Manage order details

- **Analytics**
  - Sales statistics
  - Recent orders
  - Popular products

## Security Notes

⚠️ **Important**: The current implementation uses client-side checks. For production:

1. **Use Firebase Security Rules** to prevent unauthorized users from modifying data
2. **Implement Backend Verification** - Add server-side checks in Cloud Functions
3. **Audit Logging** - Log all admin actions
4. **Role-Based Access Control** - Consider different admin levels (super admin, product manager, etc.)

### Example Firebase Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only admins can read/write products
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Only admins can read all users
    match /users/{document=**} {
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Testing Admin Features

### Test Account Setup:

1. Create a test user account (e.g., `admin@test.com`)
2. Go to Firebase Console → Firestore → users collection
3. Find your test user
4. Add/update `isAdmin` field to `true`
5. Log out and log back in
6. You should now see "Admin Dashboard" in the account menu

### Test Data:

To test the admin dashboard with sample products, you can:
1. Use the admin dashboard to add test products
2. Or manually add products to Firestore

## Removing Admin Access

To remove admin access from a user:

1. Go to Firebase Console → Firestore
2. Open the users collection
3. Find the user document
4. Change `isAdmin` from `true` to `false`
5. Save changes

## Troubleshooting

### "Admin Dashboard" link doesn't appear:
- Verify user is logged in
- Check Firestore: user document should have `isAdmin: true`
- Clear browser cache and reload
- Check browser console for errors

### "Access Denied" when visiting /admin:
- User doesn't have `isAdmin: true` in Firestore
- Follow the setup steps above to grant admin access
- Ensure you're logged in with the correct account

### Firebase credentials not working:
- Check `.env` file has correct Firebase credentials
- Verify Firebase project in Console matches project ID in `.env`
- Restart dev server after updating `.env`

## Next Steps

1. Set up your first admin user
2. Log in as admin and explore the dashboard
3. Add test products and categories
4. Configure Firebase Security Rules for production
5. Set up Cloud Functions for server-side validation

## Support

For issues or questions about the admin system, please check:
- Firebase Console error logs
- Browser developer console (F12 → Console tab)
- GitHub Issues on the project repository
