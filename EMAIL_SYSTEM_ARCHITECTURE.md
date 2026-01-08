# 📧 Shopki Email System - Complete Architecture Guide

## System Overview

Your project uses a **hybrid email system** with two different email providers:

### 1. **Brevo (Frontend-based)** - Main Email Service
- **Type**: Cloud-based email API
- **Location**: Frontend (React)
- **Use Cases**: 
  - Welcome emails
  - Order confirmations
  - Newsletter signups
  - Vendor application confirmations
  - Customer notifications

### 2. **SendGrid (Backend-based)** - Email API Server
- **Type**: Node.js backend server
- **Location**: Backend `/api` endpoints
- **Use Cases**:
  - Booking notifications (vendor & customer)
  - Chat notifications
  - Order status updates
  - Admin notifications

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPKI APPLICATION                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 REACT FRONTEND                            │  │
│  │                                                            │  │
│  │  ┌─────────────────┐         ┌─────────────────────┐     │  │
│  │  │  Components     │ sends   │ Brevo Service       │     │  │
│  │  │  - SignUp       │────────→│ brevoService.js     │     │  │
│  │  │  - Checkout     │ email   │                     │     │  │
│  │  │  - Orders       │ data    │ Direct API calls to │     │  │
│  │  │  - Vendor App   │         │ Brevo API          │     │  │
│  │  └─────────────────┘         └──────────┬──────────┘     │  │
│  │                                          │                 │  │
│  │                                          ↓                 │  │
│  │                                    [BREVO CLOUD]           │  │
│  │                           Emails sent directly from        │  │
│  │                               browser to Brevo            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NODE.JS BACKEND SERVER                       │  │
│  │              (/backend/server.js)                         │  │
│  │                                                            │  │
│  │  ┌──────────────┐         ┌──────────────┐              │  │
│  │  │   Endpoints  │ uses    │ SendGrid     │              │  │
│  │  │ /api/booking │────────→│ Mail Service │              │  │
│  │  │ /api/chat    │         │ (@sendgrid   │              │  │
│  │  │ /api/orders  │         │   /mail)     │              │  │
│  │  └──────────────┘         └──────┬───────┘              │  │
│  │                                   │                       │  │
│  │                                   ↓                       │  │
│  │                            [SENDGRID CLOUD]              │  │
│  │                         Emails sent from backend         │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            FIREBASE (Data Storage)                        │  │
│  │                                                            │  │
│  │  ┌──────────────────┐    ┌──────────────────┐           │  │
│  │  │ Firestore        │    │ Storage          │           │  │
│  │  │ - users          │    │ - Images         │           │  │
│  │  │ - orders         │    │ - Portfolios     │           │  │
│  │  │ - products       │    │ - Documents      │           │  │
│  │  │ - services       │    │                  │           │  │
│  │  │ - bookings       │    │ (Cloudinary)     │           │  │
│  │  │ - admin_emails   │    │ - Service images │           │  │
│  │  │ - emailTemplates │    │                  │           │  │
│  │  └──────────────────┘    └──────────────────┘           │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Email Flow by Feature

### 1️⃣ User Signs Up

**Frontend Flow:**
```
User Signup Form → createUserWithEmailAndPassword() 
    ↓
AuthContext updates user state
    ↓
useEffect triggers in AuthContext
    ↓
Calls: sendWelcomeEmail(email, firstName)
    ↓
brevoService.js handles the request
    ↓
Direct HTTP POST to Brevo API
    ↓
✉️ Welcome email delivered to user inbox
```

**Code Location:** `src/context/AuthContext.jsx`
```javascript
// After user signup
await sendWelcomeEmail(user.email, user.displayName);
```

**Email Service:** `src/services/email/brevoService.js`
```javascript
export const sendWelcomeEmail = async (email, firstName = 'Valued Customer') => {
  const logoUrl = await getLogoUrl();
  const brevoClient = getBrevClient();
  
  const response = await brevoClient.post('/smtp/email', {
    to: [{ email }],
    sender: { 
      name: 'Aruviah',
      email: process.env.REACT_APP_BREVO_SENDER_EMAIL 
    },
    subject: 'Welcome to Shopki!',
    htmlContent: welcomeTemplate // HTML template
  });
  
  return response.data.messageId;
};
```

---

### 2️⃣ Customer Places Order

**Frontend Flow:**
```
Checkout Page → handleCheckout()
    ↓
Create order in Firestore
    ↓
Frontend calls: sendOrderConfirmationEmail()
    ↓
brevoService.js → Brevo API
    ↓
✉️ Order confirmation sent to customer
```

**Email Service:** `src/services/email/brevoService.js`
```javascript
export const sendOrderConfirmationEmail = async (customerEmail, orderData) => {
  // orderData includes: orderId, items, total, customerName, etc.
  
  const htmlContent = buildOrderTemplate(orderData);
  
  const response = await brevoClient.post('/smtp/email', {
    to: [{ email: customerEmail }],
    sender: { name: 'Aruviah', email: senderEmail },
    subject: `Order Confirmation #${orderData.orderId}`,
    htmlContent
  });
};
```

---

### 3️⃣ Service Booking (NEW - Dual Email System)

**Frontend → Backend Flow:**

```
Service Detail Page (ServiceDetailsPage.jsx)
    ↓
User fills: name, email, date, time
    ↓
handleBookService() called
    ↓
Create booking in Firestore
    ↓
Fetch 1: /api/booking/notify-vendor (SendGrid)
    ├─ Sends vendor notification email
    └─ Vendor receives booking request
    ↓
Fetch 2: /api/booking/notify-customer (SendGrid)
    └─ Sends customer confirmation email
    ↓
✉️ Both vendor and customer receive emails
```

**Frontend Code:** `src/pages/ServiceDetailsPage.jsx`
```javascript
const handleBookService = async () => {
  // ... validation ...
  
  const booking = await createBooking(bookingData);
  
  // Send to vendor via backend
  await fetch('/api/booking/notify-vendor', {
    method: 'POST',
    body: JSON.stringify({
      vendorEmail: service.sellerEmail,
      vendorName: service.sellerName,
      customerName: bookingForm.name,
      customerEmail: bookingForm.email,
      serviceName: service.name,
      bookingDate: bookingForm.date,
      bookingTime: bookingForm.time,
      bookingId: booking.id
    })
  });
  
  // Send to customer via backend
  await fetch('/api/booking/notify-customer', {
    method: 'POST',
    body: JSON.stringify({
      customerEmail: bookingForm.email,
      customerName: bookingForm.name,
      vendorName: service.sellerName,
      serviceName: service.name,
      bookingDate: bookingForm.date,
      bookingTime: bookingForm.time,
      bookingId: booking.id
    })
  });
};
```

**Backend Code:** `backend/server.js`
```javascript
// Endpoint 1: Notify Vendor
app.post('/api/booking/notify-vendor', async (req, res) => {
  const { vendorEmail, vendorName, customerName, ... } = req.body;
  
  const emailHtml = `<div>New booking from ${customerName}...</div>`;
  
  await sgMail.send({
    to: vendorEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `New Booking Request - ${serviceName}`,
    html: emailHtml,
    replyTo: customerEmail
  });
});

// Endpoint 2: Notify Customer
app.post('/api/booking/notify-customer', async (req, res) => {
  const { customerEmail, customerName, ... } = req.body;
  
  const emailHtml = `<div>Your booking request has been submitted...</div>`;
  
  await sgMail.send({
    to: customerEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Booking Confirmation - ${serviceName}`,
    html: emailHtml
  });
});
```

---

### 4️⃣ Vendor Application Submission

**Frontend Flow:**
```
VendorSignupForm → handleSubmit()
    ↓
Save application to Firestore
    ↓
Call: sendApplicationReceivedNotification()
    ↓
brevoService.js → Brevo API
    ├─ Email 1: Vendor receives confirmation
    └─ Email 2: Admin receives notification
    ↓
✉️ Emails delivered + stored in admin inbox
```

**Email Service:** `src/services/vendor/vendorService.js`
```javascript
export const sendApplicationReceivedNotification = async (userData, applicationId) => {
  const { email, businessName, firstName } = userData;
  
  // Email to vendor
  await sendTransactionalEmail({
    email,
    subject: 'Application Received!',
    htmlContent: vendorConfirmationTemplate,
    saveToAdminInbox: false
  });
  
  // Email to admin
  await sendAdminVendorApplicationNotification({
    vendorEmail: email,
    vendorName: businessName,
    applicationId
  });
};
```

---

### 5️⃣ Chat Notifications

**Backend Flow:**
```
ServiceChat Component sends message
    ↓
Message saved to Firestore
    ↓
Backend receives chat event (via Cloud Function or polling)
    ↓
Calls: /api/chat/notify-provider
    ↓
SendGrid sends email to chat participant
    ↓
✉️ "New message from user X" email
```

**Backend Code:** `backend/server.js`
```javascript
app.post('/api/chat/notify-provider', async (req, res) => {
  const { providerEmail, senderName, message, serviceName } = req.body;
  
  const emailHtml = `
    <p>You have a new message from ${senderName}:</p>
    <p>"${message}"</p>
    <p>Service: ${serviceName}</p>
  `;
  
  await sgMail.send({
    to: providerEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `New Message - ${serviceName}`,
    html: emailHtml
  });
});
```

---

## Configuration Requirements

### Frontend Configuration (`.env`)

```env
# Brevo Email Service (Frontend-based)
REACT_APP_BREVO_API_KEY=your_brevo_api_key_here
REACT_APP_BREVO_SENDER_EMAIL=noreply@yourdomain.com
REACT_APP_BREVO_NEWSLETTER_LIST_ID=3
REACT_APP_ADMIN_EMAIL=admin@yourdomain.com

# Base URL for email links
REACT_APP_BASE_URL=http://localhost:3000
```

### Backend Configuration (`backend/.env`)

```env
# SendGrid Email Service (Backend-based)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
PORT=5000
NODE_ENV=development

# Optional: Firebase credentials for backend operations
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_email
```

---

## Email Service Details

### Brevo (Frontend Direct)

**Advantages:**
- ✅ Instant send from frontend
- ✅ No backend server dependency
- ✅ Free tier: 300 emails/day
- ✅ Easy configuration in .env
- ✅ Supports email templates

**Implementation:**
```javascript
import { sendTransactionalEmail } from '../services/email/brevoService';

await sendTransactionalEmail({
  email: 'user@example.com',
  subject: 'Test Email',
  htmlContent: '<p>Hello!</p>',
  senderName: 'Shopki',
  senderEmail: process.env.REACT_APP_BREVO_SENDER_EMAIL,
  saveToAdminInbox: true,      // Auto-save to admin inbox
  emailType: 'welcome'         // For categorization
});
```

**API Endpoint:** `https://api.brevo.com/v3/smtp/email`

---

### SendGrid (Backend Server)

**Advantages:**
- ✅ Server-side control
- ✅ Secure (API key not exposed)
- ✅ Better for transactional emails
- ✅ Reply-To support
- ✅ Advanced tracking

**Implementation:**
```javascript
// In backend server
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: recipient,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Email Subject',
  html: '<p>HTML content</p>',
  text: 'Plain text version',
  replyTo: replyToEmail
});
```

**Server Endpoints:**
- `POST /api/booking/notify-vendor`
- `POST /api/booking/notify-customer`
- `POST /api/chat/notify-provider`
- `POST /api/orders/notify-*`

---

## File Structure

```
shopki/
│
├── src/
│   ├── services/
│   │   ├── email/
│   │   │   ├── brevoService.js              ← Main email functions
│   │   │   ├── adminEmailService.js         ← Save emails to inbox
│   │   │   ├── contactFormService.js        ← Contact form emails
│   │   │   ├── emailAutomation.js           ← Automation helpers
│   │   │   └── orderEmailService.js         ← Order emails
│   │   │
│   │   ├── vendor/
│   │   │   └── vendorService.js             ← Vendor emails
│   │   │
│   │   └── firebase/
│   │       ├── firestoreHelpers.js          ← Database operations
│   │       └── config.js                    ← Firebase config
│   │
│   ├── utils/
│   │   └── defaultEmailTemplates.js         ← Email templates
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminSettings/
│   │   │   │   └── AdminSettings.jsx        ← Admin email inbox tab
│   │   │   └── AdminEmailInbox/
│   │   │       └── AdminEmailInbox.jsx      ← Email inbox component
│   │   │
│   │   └── services/
│   │       └── ServiceChat/
│   │           └── ServiceChat.jsx          ← Chat with email notify
│   │
│   ├── pages/
│   │   ├── ServiceDetailsPage.jsx           ← Booking form + emails
│   │   ├── CheckoutPage.jsx                 ← Order confirmation
│   │   └── VendorSignupPage.jsx             ← Vendor application
│   │
│   └── context/
│       └── AuthContext.jsx                  ← Welcome email on signup
│
├── backend/
│   ├── server.js                            ← SendGrid API endpoints
│   ├── package.json                         ← Dependencies
│   ├── .env.example                         ← Template
│   └── .env                                 ← Your credentials (gitignored)
│
└── .env                                     ← Frontend Brevo config
```

---

## Email Templates

### Where Templates Are Stored

1. **Default Templates** (Code-based):
   ```javascript
   // src/utils/defaultEmailTemplates.js
   export const DEFAULT_EMAIL_TEMPLATES = {
     welcome: { ... },
     orderConfirmation: { ... },
     vendorApplication: { ... }
   };
   ```

2. **Custom Templates** (Firestore):
   ```
   Firestore Collection: emailTemplates
   Documents:
   - welcome
   - orderConfirmation
   - vendorApplication
   - bookingConfirmation
   ```

### Template Variables

**Example Template:**
```html
<p>Hello {{firstName}},</p>
<p>Thank you for your order #{{orderId}}</p>
<p>Total: KES {{total}}</p>

<!-- Template replacement happens here -->
const content = template
  .replace(/{{firstName}}/g, 'John')
  .replace(/{{orderId}}/g, '12345')
  .replace(/{{total}}/g, '5000');
```

---

## Email Admin Inbox

### What Gets Saved?

All emails sent via Brevo can be automatically saved to admin inbox:

```javascript
// Firestore Collection: admin_emails
{
  id: "auto-generated",
  to: "recipient@example.com",
  from: "noreply@shopki.com",
  subject: "Order Confirmation",
  htmlContent: "<p>Your order...</p>",
  type: "order",
  isRead: false,
  createdAt: Timestamp,
  relatedData: {
    orderId: "123",
    customerName: "John"
  }
}
```

### Accessing Admin Inbox

**Location:** Admin Dashboard → Settings → Email Inbox

**Features:**
- View all sent emails
- Mark as read/unread
- Filter by type
- Search by subject/recipient
- Delete emails

---

## Troubleshooting

### Emails Not Sending?

**Check 1: Brevo (Frontend)**
```javascript
// In browser console
console.log('API Key:', process.env.REACT_APP_BREVO_API_KEY);
console.log('Sender Email:', process.env.REACT_APP_BREVO_SENDER_EMAIL);
// Should show your credentials, not undefined
```

**Check 2: SendGrid (Backend)**
```bash
# In backend terminal
echo $SENDGRID_API_KEY
# Should output your key

# Restart backend server
npm start
```

**Check 3: Firestore**
```javascript
// Check if emails collection exists
db.collection('admin_emails').get().then(snapshot => {
  console.log('Emails in Firestore:', snapshot.size);
});
```

**Check 4: Brevo Dashboard**
- Login to https://app.brevo.com
- Go to: Transactional → Logs
- Look for your email and check status
- Check if sender email is verified

**Check 5: SendGrid Dashboard**
- Login to https://app.sendgrid.com
- Go to: Activity → Logs
- Search for your recipient email
- Check delivery status

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit .env files**
   ```gitignore
   .env
   .env.local
   backend/.env
   ```

2. **API Keys should be:**
   - Stored in environment variables only
   - Never logged or exposed in console
   - Rotated regularly
   - Have minimal required permissions

3. **Email content should:**
   - Be validated before sending
   - Not include sensitive data in subject line
   - Use TLS/HTTPS for API calls
   - Have proper error handling

4. **Backend endpoints should:**
   - Have rate limiting
   - Validate all input
   - Check authentication if needed
   - Log all email sends

---

## Summary Table

| Feature | Service | Location | Trigger |
|---------|---------|----------|---------|
| Welcome Email | Brevo | Frontend | User signup |
| Order Confirmation | Brevo | Frontend | Order placed |
| Newsletter | Brevo | Frontend | Subscription |
| Vendor Application | Brevo | Frontend | Application submitted |
| Admin Notification | Brevo | Frontend | Application received |
| Booking (Vendor) | SendGrid | Backend | Booking created |
| Booking (Customer) | SendGrid | Backend | Booking created |
| Chat Notification | SendGrid | Backend | New message |
| Order Status Update | SendGrid | Backend | Admin updates status |

---

## Next Steps

1. ✅ **Set up Brevo account** - Get API key for frontend emails
2. ✅ **Set up SendGrid account** - Get API key for backend emails
3. ✅ **Configure .env files** - Add credentials to frontend and backend
4. ✅ **Test email flow** - Send test emails to verify setup
5. ✅ **Monitor email delivery** - Check dashboards for delivery status
6. ✅ **Customize templates** - Update email templates in Firestore if needed

