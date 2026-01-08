# Service Chat System - Complete Implementation Guide

## Overview

The Service Chat System allows users to communicate directly with service providers when viewing service details. This real-time chat feature enhances user engagement and enables quick communication between customers and service providers.

## Features

✅ **Real-time Messaging**: Instant message delivery using Firebase Firestore  
✅ **User Authentication**: Chat only available to logged-in users  
✅ **Chat History**: All messages stored and retrievable  
✅ **Email Notifications**: Automated email alerts when new messages arrive  
✅ **Responsive Design**: Works on desktop and mobile devices  
✅ **Message Timestamps**: Each message displays when it was sent  
✅ **Unread Message Tracking**: Shows unread message count  

## Architecture

### Frontend Components

#### 1. **ServiceChat Component** (`src/components/services/ServiceChat/ServiceChat.jsx`)
- Floating chat button that appears when viewing service details
- Modal/chat window for real-time conversations
- Automatic message scrolling to latest message
- Message input form with send button
- Displays user name and timestamp for each message

#### 2. **Firebase Helper Functions** (`src/services/firebase/chatHelpers.js`)
- `sendMessage()` - Send a new message
- `getMessages()` - Retrieve chat history
- `subscribeToMessages()` - Real-time message updates
- `getProviderChats()` - Get all chats for a provider
- `getCustomerChats()` - Get all chats for a customer
- `markMessagesAsRead()` - Mark messages as read
- `deleteMessage()` - Delete a message
- `getUnreadCount()` - Get count of unread messages
- `subscribeToUnreadMessages()` - Real-time unread updates

#### 3. **ServiceDetailsPage Integration**
Updated to include the ServiceChat component when a logged-in user views a service.

### Backend Routes

#### Chat Notification Endpoints

**POST `/api/chat/notify-provider`**
- Sends email notification when a customer messages the provider
- Includes message preview and quick action links
- Requires SendGrid configuration

**POST `/api/chat/notify-customer`**
- Sends email notification when provider replies
- Includes provider's message and conversation link
- Requires SendGrid configuration

### Firestore Collection Structure

**Collection**: `service_chats`

```javascript
{
  chatRoomId: "serviceId_userId",          // Unique chat room identifier
  serviceId: "service123",                 // Service being discussed
  providerId: "provider456",               // Service provider's ID
  senderId: "user789",                    // Who sent the message
  senderName: "John Doe",                 // Sender's display name
  senderEmail: "john@example.com",        // Sender's email
  message: "Hello, I'm interested...",    // Message content
  timestamp: Timestamp,                   // Firebase server timestamp
  read: false                             // Message read status
}
```

## Setup Instructions

### 1. Firebase Firestore Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Shopki project
3. Navigate to **Firestore Database**
4. Create a new collection named `service_chats`
5. Add security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Service chats collection
    match /service_chats/{document=**} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.providerId == request.auth.uid);
      allow delete: if request.auth != null && 
        resource.data.senderId == request.auth.uid;
    }
  }
}
```

### 2. Backend Configuration

1. Ensure SendGrid is configured in `backend/.env`:
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=support@shopki.com
```

2. Routes are already added to `backend/server.js`

### 3. Service Document Setup

Ensure your service documents in Firestore have:
- `sellerId` - The service provider's unique ID
- `sellerName` - The provider's display name
- `sellerEmail` - The provider's email address

## Usage

### For Customers

1. **Browse Services**
   - Navigate to a service details page

2. **Start Chat**
   - Click the chat button (bottom-right corner)
   - Type your message
   - Click send

3. **Receive Notifications**
   - Email notification when provider replies
   - Real-time chat updates

### For Service Providers

1. **View Customer Messages**
   - Access provider dashboard
   - See all customer messages for their services

2. **Reply to Messages**
   - Open chat conversation
   - Type and send reply
   - Customer receives email notification

## Code Examples

### Sending a Message

```javascript
import { sendMessage } from '../services/firebase/chatHelpers';

const handleSendMessage = async (messageText) => {
  try {
    await sendMessage({
      chatRoomId: `${serviceId}_${userId}`,
      serviceId,
      providerId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderEmail: currentUser.email,
      message: messageText,
      timestamp: new Date(),
    });
    
    // Send email notification to provider
    await fetch('/api/chat/notify-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerEmail: service.sellerEmail,
        providerName: service.sellerName,
        senderName: currentUser.displayName,
        senderEmail: currentUser.email,
        message: messageText,
        serviceId,
        serviceName: service.name
      })
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### Subscribing to Messages

```javascript
import { subscribeToMessages } from '../services/firebase/chatHelpers';

useEffect(() => {
  const chatRoomId = `${serviceId}_${userId}`;
  
  const unsubscribe = subscribeToMessages(chatRoomId, (messages) => {
    setMessages(messages);
  });
  
  return () => unsubscribe();
}, [serviceId, userId]);
```

### Getting Provider's All Chats

```javascript
import { getProviderChats } from '../services/firebase/chatHelpers';

const fetchChats = async () => {
  try {
    const chats = await getProviderChats(providerId);
    setChatList(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
  }
};
```

## Files Created/Modified

### Created Files:
- `src/components/services/ServiceChat/ServiceChat.jsx` - Main chat component
- `src/styles/ServiceChat.css` - Chat component styling
- `src/services/firebase/chatHelpers.js` - Firebase helper functions

### Modified Files:
- `src/pages/ServiceDetailsPage.jsx` - Added chat integration
- `backend/server.js` - Added notification routes

## Customization

### Change Chat Button Appearance

Edit `src/components/services/ServiceChat/ServiceChat.jsx`:

```javascript
<button
  onClick={() => setChatOpen(!chatOpen)}
  className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg"
>
```

### Modify Email Templates

Edit `/api/chat/notify-provider` and `/api/chat/notify-customer` in `backend/server.js` to customize email HTML.

### Change Firestore Collection Name

Update `CHATS_COLLECTION` in `src/services/firebase/chatHelpers.js`:

```javascript
const CHATS_COLLECTION = 'service_chats'; // Change this value
```

## Troubleshooting

### Messages Not Sending
- Verify Firestore security rules allow the user
- Check user is authenticated (`getAuth().currentUser`)
- Ensure service document has `sellerId`

### Email Notifications Not Working
- Check SendGrid API key in `backend/.env`
- Verify `SENDGRID_FROM_EMAIL` is set
- Check backend server is running on correct port

### Chat Not Appearing
- Ensure user is logged in
- Check that service document has `sellerId` and `sellerName`
- Verify ServiceChat component is imported in ServiceDetailsPage

### Real-time Updates Not Working
- Check Firestore rules allow read access
- Ensure chatRoomId is formatted correctly: `serviceId_userId`
- Check browser console for errors

## Future Enhancements

1. **Typing Indicators** - Show when someone is typing
2. **File/Image Sharing** - Allow media in messages
3. **Read Receipts** - Show message delivery status
4. **Chat List View** - Provider dashboard showing all conversations
5. **Chatbot Integration** - Automated responses for common questions
6. **Message Search** - Search through chat history
7. **Blocked Users** - Ability to block/mute users
8. **Ratings** - Rate service providers after chat

## Support

For issues or questions, refer to:
- Firebase Documentation: https://firebase.google.com/docs/firestore
- React Documentation: https://react.dev
- SendGrid Email API: https://docs.sendgrid.com
