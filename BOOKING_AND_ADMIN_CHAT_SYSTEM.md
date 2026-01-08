# Complete Booking & Admin Chat System Documentation

## Overview

This comprehensive system enables:
- **Customers** to book services with date, time, and notes
- **Service Vendors** to manage bookings (accept, reschedule, reject)
- **Admin** to monitor all vendor-customer communications privately
- **Email notifications** at every stage of the booking lifecycle

## Architecture

### Data Models

#### 1. Service Bookings Collection
**Collection**: `service_bookings`

```javascript
{
  id: "booking123",
  serviceId: "service456",
  serviceName: "Home Cleaning",
  vendorId: "vendor789",
  vendorName: "John's Services",
  vendorEmail: "john@services.com",
  customerId: "customer123",
  customerName: "Alice",
  customerEmail: "alice@email.com",
  customerPhone: "+254700000000",
  bookingDate: "2024-01-20",
  bookingTime: "10:00",
  notes: "Please bring cleaning supplies",
  status: "pending", // pending, accepted, rescheduled, completed, cancelled
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // Reschedule fields (if rescheduled)
  rescheduleDate: "2024-01-22",
  rescheduleTime: "14:00",
  rescheduleReason: "Vendor unavailable on original date",
  rescheduledAt: Timestamp,
}
```

#### 2. Service Chats Collection
**Collection**: `service_chats`

```javascript
{
  id: "msg123",
  chatRoomId: "serviceId_userId",
  serviceId: "service456",
  providerId: "vendor789",
  senderId: "customer123",
  senderName: "Alice",
  senderEmail: "alice@email.com",
  message: "When can you start?",
  timestamp: Timestamp,
  read: false,
}
```

## Setup Instructions

### 1. Firebase Firestore Collections

Create two collections in your Firestore database:

#### Collection 1: `service_bookings`
- No initial data needed
- Data is created when customers book services

#### Collection 2: `service_chats`
- Already exists from previous chat setup
- Reusing existing structure

### 2. Firebase Security Rules

Update your Firestore security rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Service Bookings - Vendors can see their own, customers can see theirs
    match /service_bookings/{document=**} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null && 
        (resource.data.vendorId == request.auth.uid || 
         resource.data.customerId == request.auth.uid);
      allow delete: if false; // Never delete, only update status
    }

    // Service Chats - Only participants and admins can see
    match /service_chats/{document=**} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.providerId == request.auth.uid ||
         request.auth.token.admin == true);
      allow delete: if request.auth != null && 
        resource.data.senderId == request.auth.uid;
    }
  }
}
```

### 3. Backend Setup

Email notification endpoints are already added in `backend/server.js`:
- `POST /api/booking/notify-vendor` - When customer books
- `POST /api/booking/notify-customer-acceptance` - When vendor accepts
- `POST /api/booking/notify-customer-reschedule` - When vendor reschedules

### 4. Admin User Setup

To mark a user as admin for chat visibility, set a custom claim in Firebase:

```bash
# Using Firebase CLI
firebase auth:import users.json --hash-algo=scrypt
```

Or in your backend, add an admin check function:

```javascript
const admin = require('firebase-admin');

async function setAdminClaim(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`User ${uid} is now admin`);
}
```

## File Structure

```
src/
├── pages/
│   ├── ServiceDetailsPage.jsx          # Updated with booking
│   ├── vendor/
│   │   └── VendorBookingsPage.jsx      # Vendor dashboard
│   └── admin/
│       └── AdminChatPage.jsx            # Admin chat monitor
├── services/
│   └── firebase/
│       ├── bookingHelpers.js            # Booking operations
│       └── chatHelpers.js               # Updated with admin functions
├── styles/
│   ├── VendorBookings.css
│   └── AdminChat.css
└── components/
    └── services/
        └── ServiceChat/
            └── ServiceChat.jsx          # Existing chat component

backend/
└── server.js                            # Updated with booking routes
```

## Usage Flow

### Customer Journey

1. **Browse Service**
   - Navigate to service detail page

2. **Book Service**
   - Fill in date, time, and optional notes
   - Click "Request Booking"
   - Booking saved to Firestore
   - Vendor receives email notification

3. **Monitor Booking**
   - Navigate to `/vendor/bookings` (if vendor) or customer bookings page
   - See booking status changes in real-time

4. **Communicate**
   - Use chat widget to message vendor/customer
   - Both parties receive email notifications

### Vendor Journey

1. **Receive Booking**
   - Email notification with customer details
   - Navigate to `/vendor/bookings` page

2. **Manage Booking**
   - **Accept**: Confirm the booking → Customer gets confirmation email
   - **Reschedule**: Change date/time/reason → Customer gets notification email
   - **Cancel**: Reject booking with reason

3. **Communicate**
   - Use chat widget to discuss with customer
   - Customer receives email notifications

### Admin Journey

1. **Monitor Communications**
   - Navigate to `/admin/chat`
   - View all vendor-customer conversations
   - See message count and last message

2. **Review Chats**
   - Click on conversation to view full chat history
   - See customer and vendor information
   - Monitor service quality

## Code Examples

### Creating a Booking

```javascript
import { createBooking } from '../services/firebase/bookingHelpers';

const handleBookService = async () => {
  try {
    const booking = await createBooking({
      serviceId: service.id,
      serviceName: service.name,
      vendorId: service.sellerId,
      vendorName: service.sellerName,
      vendorEmail: service.sellerEmail,
      customerId: currentUser.uid,
      customerName: currentUser.displayName,
      customerEmail: currentUser.email,
      bookingDate: '2024-01-20',
      bookingTime: '10:00',
      notes: 'Special requirements...'
    });

    // Send notification email
    await fetch('/api/booking/notify-vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorEmail: service.sellerEmail,
        vendorName: service.sellerName,
        customerName: currentUser.displayName,
        customerEmail: currentUser.email,
        serviceName: service.name,
        bookingDate: '2024-01-20',
        bookingTime: '10:00',
        bookingNotes: 'Special requirements...',
        bookingId: booking.id
      })
    });
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Getting Vendor Bookings

```javascript
import { subscribeToVendorBookings } from '../services/firebase/bookingHelpers';

useEffect(() => {
  const unsubscribe = subscribeToVendorBookings(vendorId, (bookings) => {
    setBookings(bookings);
  });

  return () => unsubscribe();
}, [vendorId]);
```

### Accepting a Booking

```javascript
import { acceptBooking } from '../services/firebase/bookingHelpers';

const handleAccept = async (bookingId) => {
  try {
    await acceptBooking(bookingId, 'Looking forward to working with you!');
    
    // Send confirmation email
    await fetch('/api/booking/notify-customer-acceptance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        vendorName: booking.vendorName,
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        vendorNotes: 'Looking forward to working with you!'
      })
    });
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Rescheduling a Booking

```javascript
import { rescheduleBooking } from '../services/firebase/bookingHelpers';

const handleReschedule = async (bookingId) => {
  try {
    await rescheduleBooking(
      bookingId,
      '2024-01-22',  // newDate
      '14:00',       // newTime
      'Vendor schedule conflict' // reason
    );
    
    // Send reschedule email
    await fetch('/api/booking/notify-customer-reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        vendorName: booking.vendorName,
        serviceName: booking.serviceName,
        originalDate: booking.bookingDate,
        newDate: '2024-01-22',
        newTime: '14:00',
        reason: 'Vendor schedule conflict'
      })
    });
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Admin Chat Viewing

```javascript
import { subscribeToAllServiceChats } from '../services/firebase/chatHelpers';

useEffect(() => {
  const unsubscribe = subscribeToAllServiceChats((chats) => {
    setChats(chats);
  });

  return () => unsubscribe();
}, []);
```

## Features

✅ **Real-time Updates** - All bookings and chats update in real-time using Firestore subscriptions  
✅ **Email Notifications** - Automatic emails at each booking stage  
✅ **Booking Status Tracking** - Pending → Accepted → Rescheduled → Completed  
✅ **Admin Monitoring** - Admins can view all vendor-customer communications  
✅ **Mobile Responsive** - Works on desktop and mobile devices  
✅ **Secure** - Firestore rules restrict access appropriately  

## Routes to Add

Add these routes to your `src/routes` or main routing file:

```javascript
import VendorBookingsPage from '../pages/vendor/VendorBookingsPage';
import AdminChatPage from '../pages/admin/AdminChatPage';

// In your route configuration:
{
  path: '/vendor/bookings',
  element: <VendorBookingsPage />
},
{
  path: '/admin/chat',
  element: <AdminChatPage />
}
```

## Testing

### Test Booking Flow

1. Log in as a customer
2. Go to a service detail page
3. Fill booking form and submit
4. Check vendor email inbox for notification
5. Log in as vendor, go to `/vendor/bookings`
6. Accept/Reschedule booking
7. Check customer email for updates

### Test Admin Chat View

1. Log in as admin user
2. Navigate to `/admin/chat`
3. Select a conversation
4. View all messages between vendor and customer
5. Verify you cannot send messages (read-only)

## Customization

### Change Booking Status Colors

Edit `src/styles/VendorBookings.css`:

```css
.booking-status.pending {
  background-color: #fef3c7;
  color: #92400e;
}
```

### Customize Email Templates

Edit notification routes in `backend/server.js`:
- Search for `emailHtml` variable
- Modify HTML template as needed

### Change Chat Room Privacy

Edit Firestore rules to allow different visibility:

```javascript
// Allow vendors to see all customer chats for their services
allow read: if resource.data.providerId == request.auth.uid;
```

## Troubleshooting

### Bookings Not Showing for Vendor

- Verify `vendorId` field matches vendor's `uid`
- Check Firestore rules allow access
- Ensure vendor is logged in

### Emails Not Sending

- Verify SendGrid configuration in `backend/.env`
- Check backend server is running
- Check browser console for errors

### Admin Can't See Chats

- Verify custom claim `admin: true` is set on user account
- Update Firestore rules to include admin check
- Clear browser cache and reload

### Real-time Updates Not Working

- Check Firestore subscription is not unsubscribed early
- Verify Firestore rules allow read access
- Check network tab for errors

## Future Enhancements

1. **Booking Confirmation** - Add SMS/WhatsApp confirmations
2. **Ratings & Reviews** - Rate service after completion
3. **Recurring Bookings** - Weekly/monthly service subscriptions
4. **Calendar Integration** - Sync with vendor calendar
5. **Payment Integration** - Process payments with booking
6. **Automatic Reminders** - SMS/Email reminders before service
7. **Service History** - Track completed services
8. **Dispute Resolution** - Handle booking cancellations/refunds

## Support

For issues or questions:
- Check Firestore rules in Firebase Console
- Verify collections exist: `service_bookings`, `service_chats`
- Check backend logs for email errors
- Ensure user has required authentication
