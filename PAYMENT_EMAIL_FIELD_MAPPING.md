# 📧 Payment Success Email - Field Mapping & Email Templates

## Email Fields Extracted & Used

### From Order Document (Firestore)

```javascript
{
  id: "A1B2C3D4E5",                    // Order ID
  userEmail: "customer@example.com",   // ← Used for email recipient
  userId: "user123",
  items: [                              // ← Used in email body
    {
      id: "prod1",
      name: "Product Name",
      quantity: 2,
      price: 5000,                     // Price in KES
      productId: "prod1"
    }
  ],
  total: 15000,                        // ← Total amount in KES
  shippingFee: 500,                    // ← Shipping cost (optional)
  subtotal: 14500,
  shippingInfo: {                      // ← Delivery address info
    fullName: "John Doe",
    address: "123 Main Street",
    city: "Nairobi",
    county: "Nairobi",
    postalCode: "00100",
    phone: "254700123456"
  },
  paymentMethod: "mpesa",
  status: "pending",
  createdAt: "2024-01-15T10:30:00Z",   // ← Order date
  orderDate: "2024-01-15T10:30:00Z"
}
```

## How Each Field is Used in Email

| Order Field | Email Section | Example |
|---|---|---|
| `userEmail` | Email recipient | customer@example.com |
| `id` | Order ID display | A1B2C3D4E5 |
| `createdAt`/`orderDate` | Order Date | January 15, 2024 |
| `items[].name` | Product name in table | "Premium Shirt" |
| `items[].quantity` | Quantity in table | x2 |
| `items[].price` | Item price calculation | KES 5,000 |
| `total` | Total amount | KES 15,000 |
| `shippingFee` | Shipping line item | KES 500 |
| `shippingInfo.fullName` | Recipient name | John Doe |
| `shippingInfo.address` | Street address | 123 Main Street |
| `shippingInfo.city` | City | Nairobi |
| `shippingInfo.county` | County/State | Nairobi |
| `shippingInfo.postalCode` | Postal code | 00100 |
| `shippingInfo.phone` | Contact phone | 254700123456 |

## Email Template Sections

### Success Email Structure

```
┌─────────────────────────────────────────┐
│          HEADER (Gradient)              │
│   Payment Successful! ✅                │
│   Your order has been confirmed         │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│        ORDER DETAILS BOX                │
│  Order ID: A1B2C3D4E5                   │
│  Order Date: January 15, 2024           │
│  Status: COMPLETED                      │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│      ITEMS TABLE                        │
│  Product | Qty | Price                  │
│  -------|-----|--------                 │
│  Shirt  | x2  | KES 10,000              │
│  Shoes  | x1  | KES 5,000               │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│       TOTAL CALCULATION                 │
│  Subtotal:        KES 15,000            │
│  Shipping Fee:    KES 500               │
│  ────────────────────────────           │
│  Total Amount:    KES 15,500            │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│     SHIPPING ADDRESS                    │
│  John Doe                               │
│  123 Main Street                        │
│  Nairobi, Nairobi 00100                 │
│  📞 254700123456                        │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│       NEXT STEPS INFO                   │
│  ✓ Order will be processed              │
│  ✓ Tracking will be sent                │
│  ✓ Expected delivery: 3-5 days          │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│    [TRACK YOUR ORDER] BUTTON            │
└─────────────────────────────────────────┘
```

### Failure Email Structure

```
┌─────────────────────────────────────────┐
│          HEADER (Red Gradient)          │
│   Payment Failed ❌                     │
│   Please try again                      │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│     FAILURE INFO BOX (Red)              │
│  Order ID: A1B2C3D4E5                   │
│  Status: Payment Failed                 │
│  Your order is still saved!             │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│     WHAT YOU CAN DO                     │
│  ✓ Try the payment again                │
│  ✓ Check M-Pesa balance                 │
│  ✓ Use different payment method         │
│  ✓ Contact support                      │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│    [RETRY PAYMENT] BUTTON               │
└─────────────────────────────────────────┘
```

## Email Content Details

### Success Email Content

#### Subject
```
Order Confirmed - A1B2C3D4E5
```

#### Header Section
```
Payment Successful! ✅
Your order has been confirmed
```

#### Main Message
```
Thank you for your purchase!
Your payment has been processed successfully. 
Here's your order summary:
```

#### Order Details Box
```
Order ID: A1B2C3D4E5
Order Date: January 15, 2024
Status: COMPLETED (in green)
```

#### Items Table Header
```
Product | Qty | Price
```

#### Items Row (Repeated for each item)
```
Premium Shirt | x2 | KES 10,000
```

#### Total Box
```
Subtotal:          KES 15,000
Shipping Fee:      KES 500 (if applicable)
─────────────────────────
Total Amount:      KES 15,500
```

#### Shipping Address
```
John Doe
123 Main Street
Nairobi, Nairobi 00100
📞 254700123456
```

#### Next Steps Section
```
What happens next?
• Your order will be processed and prepared for shipment
• You will receive tracking information via email
• Expected delivery: 3-5 business days
```

#### Call to Action Button
```
[TRACK YOUR ORDER]
Link: shopki.com/orders/A1B2C3D4E5
```

#### Support Message
```
If you have any questions, please contact us at 
support@shopki.com
```

## Failure Email Content

### Subject
```
Payment Failed - Order A1B2C3D4E5
```

### Header Section
```
Payment Failed ❌
Please try again or use a different payment method
```

### Main Message
```
We couldn't process your payment

Unfortunately, your M-Pesa payment for order A1B2C3D4E5 
could not be processed.
```

### Failure Info Box
```
Order ID: A1B2C3D4E5
Status: Payment Failed
Your order is still saved and you can retry the payment.
```

### What to Do Section
```
What you can do:
• Try the payment again
• Check your M-Pesa balance
• Use a different payment method
• Contact our support team
```

### Retry Button
```
[RETRY PAYMENT]
Link: shopki.com/order-success?orderId=A1B2C3D4E5
```

## Data Calculations in Email

### Item Total Calculation
```javascript
// For each item:
itemTotal = item.price * item.quantity

// Example:
// Product price: 5000
// Quantity: 2
// Item total: 10,000
```

### Order Total Calculation
```javascript
// If shipping info included:
orderTotal = sum(all items) + shippingFee

// Format as currency:
KES 15,000.00  // With thousands separator
```

### Formatted Numbers
```javascript
// Currency formatting (Kenyan Shilling)
(15000).toLocaleString()  // → "15,000"

// Date formatting
new Date().toLocaleDateString('en-US', { 
  year: 'numeric',      // 2024
  month: 'long',        // January
  day: 'numeric'        // 15
})  // → "January 15, 2024"
```

## HTML Email Features

### Styling Applied
- **Font:** Arial, sans-serif
- **Max Width:** 600px (mobile friendly)
- **Colors:**
  - Success: Purple gradient (#667eea to #764ba2)
  - Failure: Red gradient (#f44336 to #d32f2f)
  - Accent: Orange (#ff9800)
  - Text: Dark gray (#333)
  - Borders: Light gray (#ddd)

### Responsive Design
```css
/* All content fits on mobile */
max-width: 600px;
padding: 20px;
border-radius: 8px;

/* Tables are readable */
table {
  width: 100%;
  border-collapse: collapse;
}

/* Text is readable */
line-height: 1.6;
font-size: 14px;
```

### Interactive Elements
- Clickable buttons with hover effects
- Links to order tracking page
- Email addresses for support contact

## Sample Email Output

### Success Email Example

```
TO: customer@example.com
FROM: orders@shopki.com
SUBJECT: Order Confirmed - A1B2C3D4E5

Dear Customer,

Thank you for your purchase!

Your payment has been processed successfully.

ORDER DETAILS:
Order ID: A1B2C3D4E5
Date: January 15, 2024
Status: COMPLETED

ITEMS:
Premium Shirt (x2) ......... KES 10,000
Running Shoes (x1) ......... KES 5,000

TOTAL: KES 15,500

SHIPPING TO:
John Doe
123 Main Street
Nairobi, Kenya 00100

[TRACK YOUR ORDER]

Questions? Contact support@shopki.com
```

### Failure Email Example

```
TO: customer@example.com
FROM: orders@shopki.com
SUBJECT: Payment Failed - Order A1B2C3D4E5

Unfortunately, your M-Pesa payment could not be processed.

Order ID: A1B2C3D4E5
Status: Payment Failed

What you can do:
✓ Try the payment again
✓ Check your M-Pesa balance
✓ Use a different payment method

[RETRY PAYMENT]

Need help? Contact support@shopki.com
```

## Customization Points

You can customize the following in `backend/server.js`:

```javascript
// Change sender
from: 'your-email@company.com'

// Change subject
subject: 'Your custom subject here'

// Change button text/link
<a href="${customLink}">Click here</a>

// Change colors
style="background: #yourcolor"

// Change company name
© 2024 Your Company Name
```

## Environment Variables Used

```env
# Sender email address
SENDGRID_FROM_EMAIL=orders@shopki.com

# Website base URL (for links)
REACT_APP_BASE_URL=https://shopki.com

# Email service API key
SENDGRID_API_KEY=SG.xxxxx
```

## Validation Checks

Before sending email, the system checks:

```javascript
✓ Order ID exists
✓ Customer email exists
✓ Order items array populated
✓ Order total > 0
✓ Shipping info provided (for address)
```

If any critical field is missing, email is still attempted but may have incomplete data.

---

**Last Updated:** January 2026  
**Fields Verified:** ✅ All order fields mapped  
**Email Templates:** ✅ Success & Failure both implemented
