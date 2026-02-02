# First User as Admin - Implementation

## Overview
When a new user signs up (via email, phone, or Google), the system automatically checks if they are the **first user in the system**. If so, they are set as `isAdmin: true` with `role: 'admin'` instead of the default `'customer'`.

## Changes Made

### 1. **src/services/firebase/auth.js**
Added helper function `isFirstUser()` that:
- Queries the `users` collection with `limit(1)`
- Returns `true` if the collection is empty (first user)
- Updated `signUpWithEmail()` to check `isFirstUser` and set:
  - `isAdmin: firstUser ? true : false`
  - `role: firstUser ? 'admin' : 'customer'`
- Updated `signInWithGoogle()` to check `isFirstUser` when creating new user document

### 2. **src/services/firebase/phoneAuth.js**
Updated `completePhoneSignup()` to:
- Check if this is the first user before creating the user document
- Set `isAdmin: isFirstUser ? true : false`
- Set `role: isFirstUser ? 'admin' : 'customer'`
- Added `limit` to Firestore imports

### 3. **src/context/AuthContext.jsx**
Updated both signup flows:
- `signup()` (email/password): Checks if first user and sets `isAdmin` and `role`
- `loginWithGoogle()`: Checks if first user when creating new Google user document
- Added `collection`, `query`, `limit`, `getDocs` to Firestore imports

## How It Works

```
New User Signup
    ↓
Check if users collection is empty (limit 1 query)
    ↓
If empty (first user):
    ├─ Set isAdmin: true
    ├─ Set role: 'admin'
    └─ Log: "First user created as admin"
    ↓
If not empty (subsequent users):
    ├─ Set isAdmin: false
    ├─ Set role: 'customer'
    └─ User is regular customer
    ↓
User document saved to Firestore
```

## Database Structure

First user Firestore document:
```javascript
{
  uid: "user-id",
  email: "admin@example.com",
  displayName: "Admin User",
  isAdmin: true,           // ← Set to true for first user
  role: "admin",            // ← Set to 'admin' for first user
  verified: false,
  createdAt: Timestamp,
  preferences: {...},
  // ... other fields
}
```

Subsequent users:
```javascript
{
  uid: "user-id",
  email: "customer@example.com",
  displayName: "Regular User",
  isAdmin: false,           // ← False for all other users
  role: "customer",         // ← 'customer' for all other users
  verified: false,
  createdAt: Timestamp,
  preferences: {...},
  // ... other fields
}
```

## Testing

1. **Clear your Firestore database** (delete all users):
   - Go to Firebase Console
   - Select your project (`aruviah-7c395`)
   - Go to Firestore Database
   - Delete all documents in the `users` collection

2. **Create the first user**:
   - Open the app
   - Sign up with email/phone/Google
   - Check Firestore → `users` collection
   - Verify that `isAdmin: true` and `role: 'admin'`

3. **Create subsequent users**:
   - Create a second user
   - Verify that `isAdmin: false` and `role: 'customer'`

## Authentication & Authorization

The app should check `isAdmin` or `role` to:
- Show admin dashboard/controls
- Restrict admin-only operations
- Display appropriate UI elements

Example in components:
```jsx
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
  const { userData } = useAuth();
  
  if (!userData?.isAdmin) {
    return <div>Access Denied</div>;
  }
  
  return <AdminContent />;
}
```

## Notes

- The check for "first user" happens **during signup**, not on user creation in auth.
- This is safe because Firestore queries are atomic and only the first signup will see an empty collection.
- If multiple users sign up simultaneously, there's a small race condition risk, but Firestore transaction semantics minimize this.
- To manually change a user's `isAdmin` status, update the Firestore document directly via Firebase Console or admin panel.
