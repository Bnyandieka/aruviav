# Shopify Checkout Integration Guide for Shopki

## Overview
This guide shows how to integrate Shopify's Storefront API for real checkout functionality with your React e-commerce platform.

## Architecture
```
Your App → Shopify Storefront API → Shopify Payment Processing
           (GraphQL)
                ↓
        Backend (Node.js) - Creates checkout
                ↓
        Firebase - Stores order data
```

## Step 1: Get Shopify Credentials

### Option A: Create a Development Store (Easiest)
1. Go to https://accounts.shopify.com/signup
2. Choose "Create a development store"
3. Fill in store details and create

### Option B: Use Existing Store
If you already have a Shopify store, skip above.

### Get API Credentials (UPDATED METHOD)

1. **Go to Shopify Admin**
   - Log in to https://admin.shopify.com/

2. **Create a Custom App**
   - Left sidebar → Apps → Apps and sales channels
   - Click "App and sales channel settings"
   - Click "Develop an app"
   - Click "Create an app"
   - Name it: `Shopki Checkout`
   - Click "Create app"

3. **Set App URLs (IMPORTANT)**
   - Go to "Configuration" tab
   - Find "URLs" section
   - **App URL**: Your app's base URL
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.com`
   - **Redirect URLs**: Where Shopify sends users after checkout
     - Add: `http://localhost:3000/checkout-success` (development)
     - Add: `https://your-domain.com/checkout-success` (production)
   - Click "Save"

4. **Configure Admin API Scopes**
   - Go to "Configuration" tab
   - Scroll to "Admin API access scopes"
   - Enable:
     - `read_products`
     - `read_checkouts`
   - Click "Save"

4. **Generate Access Tokens**
   - Click on "API credentials" tab
   - You'll see:
     - **Admin API access token** (for backend)
     - **Access scopes**
   
5. **Enable Storefront API**
   - Scroll down to "Storefront API"
   - Toggle it ON
   - Select these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_products`
     - `unauthenticated_read_checkouts`
   - Click "Save"
   - Copy your **Storefront API access token** (different from Admin API token)

6. **Get Your Store Info**
   - Store URL: Your Shopify admin URL (e.g., `https://your-store.myshopify.com`)
   - Storefront API endpoint: `https://your-store.myshopify.com/api/2024-01/graphql.json`

### Setup App Proxy (Optional - for advanced features)

App Proxy allows Shopify to make server-to-server requests to your backend without exposing your tokens in the frontend.

1. **Go to Configuration tab**
2. **Scroll to "App proxies"**
3. **Click "Create an app proxy"**
   - Subpath: `/apps/shopki`
   - Subpath prefix: `api`
   - Root URL: `https://your-backend.com` (or `http://localhost:5000` for development)
4. **Click "Save"**

This allows Shopify to call your backend endpoints like:
```
https://your-store.myshopify.com/apps/shopki/api/sync-inventory
https://your-store.myshopify.com/apps/shopki/api/create-order
```

### Your Credentials Summary
```
SHOPIFY_STORE_URL = https://your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN = your-storefront-access-token
SHOPIFY_ADMIN_TOKEN = your-admin-access-token (optional, for advanced features)
SHOPIFY_APP_PROXY_ROOT = https://your-backend.com (for app proxy)
```

## Step 2: Update Backend (Node.js)

### Install Shopify SDK
```bash
cd backend
npm install @shopify/buy-sdk graphql-request
```

### Update backend/server.js

Add this to your backend server:

```javascript
// Add these imports
const axios = require('axios');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Shopify configuration
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL; // e.g., https://your-store.myshopify.com
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

/**
 * POST /api/shopify/checkout
 * Create a Shopify checkout
 */
app.post('/api/shopify/checkout', async (req, res) => {
  try {
    const { lineItems, email, shippingAddress } = req.body;

    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart items required'
      });
    }

    // GraphQL mutation to create checkout
    const mutation = `
      mutation CreateCheckout($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            subtotalPrice {
              amount
              currencyCode
            }
            totalPrice {
              amount
              currencyCode
            }
          }
          checkoutUserErrors {
            message
            field
          }
        }
      }
    `;

    const variables = {
      input: {
        lineItems: lineItems.map(item => ({
          variantId: item.variantId, // Shopify variant ID
          quantity: item.quantity
        })),
        email: email,
        shippingAddress: shippingAddress ? {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address1: shippingAddress.address1,
          city: shippingAddress.city,
          province: shippingAddress.province,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
          phone: shippingAddress.phone
        } : undefined
      }
    };

    const response = await fetch(`${SHOPIFY_STORE}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({
        success: false,
        error: data.errors[0].message
      });
    }

    const checkout = data.data.checkoutCreate.checkout;

    res.json({
      success: true,
      checkout: {
        id: checkout.id,
        webUrl: checkout.webUrl,
        total: checkout.totalPrice.amount,
        currency: checkout.totalPrice.currencyCode
      }
    });
  } catch (error) {
    console.error('Shopify checkout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/shopify/products
 * Fetch products from Shopify
 */
app.get('/api/shopify/products', async (req, res) => {
  try {
    const query = `
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    src
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    available
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`${SHOPIFY_STORE}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables: { first: 50 } })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({
        success: false,
        error: data.errors[0].message
      });
    }

    res.json({
      success: true,
      products: data.data.products.edges.map(edge => edge.node)
    });
  } catch (error) {
    console.error('Shopify products error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Update backend/.env

```env
# Shopify Configuration
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token_here
```

## Step 3: Update Frontend (React)

### Create Shopify Service

Create `src/services/shopify/shopifyService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const shopifyApi = axios.create({
  baseURL: `${API_BASE_URL}/api/shopify`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const shopifyService = {
  /**
   * Create a Shopify checkout
   */
  async createCheckout(lineItems, email, shippingAddress = null) {
    try {
      const response = await shopifyApi.post('/checkout', {
        lineItems,
        email,
        shippingAddress
      });
      return response.data;
    } catch (error) {
      console.error('Checkout creation failed:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all Shopify products
   */
  async getProducts() {
    try {
      const response = await shopifyApi.get('/products');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Redirect to Shopify hosted checkout
   */
  redirectToCheckout(webUrl) {
    window.location.href = webUrl;
  }
};

export default shopifyService;
```

### Create Checkout Component

Create `src/components/checkout/ShopifyCheckout.jsx`:

```jsx
import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { shopifyService } from '../../services/shopify/shopifyService';
import { toast } from 'react-toastify';

const ShopifyCheckout = () => {
  const { cart, cartCount } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    province: '',
    zip: '',
    country: 'KE',
    phone: ''
  });

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!user?.email) {
      toast.error('Please sign in to continue');
      return;
    }

    if (cartCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Map your cart items to Shopify format
      // Make sure you have Shopify variant IDs in your products
      const lineItems = cart.map(item => ({
        variantId: item.shopifyVariantId, // Must have this from product
        quantity: item.quantity
      }));

      const response = await shopifyService.createCheckout(
        lineItems,
        user.email,
        shippingInfo
      );

      if (response.success) {
        // Redirect to Shopify hosted checkout
        shopifyService.redirectToCheckout(response.checkout.webUrl);
      } else {
        toast.error(response.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopify-checkout bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Checkout with Shopify</h2>

      <form onSubmit={handleCheckout} className="space-y-6">
        {/* Shipping Information */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={shippingInfo.firstName}
              onChange={handleShippingChange}
              required
              className="col-span-1 p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={shippingInfo.lastName}
              onChange={handleShippingChange}
              required
              className="col-span-1 p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="address1"
              placeholder="Street Address"
              value={shippingInfo.address1}
              onChange={handleShippingChange}
              required
              className="col-span-2 p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={shippingInfo.city}
              onChange={handleShippingChange}
              required
              className="col-span-1 p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="zip"
              placeholder="Postal Code"
              value={shippingInfo.zip}
              onChange={handleShippingChange}
              required
              className="col-span-1 p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={shippingInfo.phone}
              onChange={handleShippingChange}
              required
              className="col-span-2 p-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Total:</span>
            <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || cartCount === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Processing...' : 'Proceed to Shopify Checkout'}
        </button>
      </form>
    </div>
  );
};

export default ShopifyCheckout;
```

### Update environment variables

Update `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SHOPIFY_STORE=your-store.myshopify.com
```

## Step 4: Sync Products with Your Firestore

Create `src/services/firebase/shopifySync.js`:

```javascript
import { db } from '../firebase/config';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import shopifyService from '../shopify/shopifyService';

export const syncShopifyProducts = async () => {
  try {
    const response = await shopifyService.getProducts();
    const productsRef = collection(db, 'products');

    for (const product of response.products) {
      const variant = product.variants.edges[0]?.node;
      
      const productData = {
        name: product.title,
        description: product.description,
        price: parseFloat(variant?.price?.amount || 0),
        currency: variant?.price?.currencyCode || 'USD',
        image: product.images.edges[0]?.node?.src || '',
        shopifyId: product.id,
        shopifyVariantId: variant?.id, // Important for checkout
        available: variant?.available || false,
        createdAt: new Date(),
        source: 'shopify'
      };

      await addDoc(productsRef, productData);
    }

    console.log('✅ Products synced from Shopify');
  } catch (error) {
    console.error('Sync error:', error);
  }
};
```

## Step 5: Integration Points

### In your Cart Context
Make sure your cart items include `shopifyVariantId`:

```javascript
const addToCart = (product) => {
  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    shopifyVariantId: product.shopifyVariantId, // Add this
    image: product.image
  };
  // ... rest of add to cart logic
};
```

### In your checkout button
```jsx
<button 
  onClick={() => navigate('/checkout')}
  className="..."
>
  Proceed to Checkout
</button>
```

### Create Checkout Success Page

Create `src/pages/CheckoutSuccess.jsx`:

```jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get checkout ID from URL params
    const checkoutId = searchParams.get('checkout_id');
    
    if (checkoutId) {
      // Clear the cart after successful checkout
      clearCart();
      toast.success('🎉 Order placed successfully!');
      
      // Redirect to orders page after 3 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } else {
      // If no checkout ID, redirect to home
      navigate('/');
    }
  }, [searchParams, navigate, clearCart]);

  return (
    <div className="checkout-success min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">✓</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-green-900 mb-2">
          Thank You!
        </h1>
        <p className="text-gray-600 mb-4">
          Your order has been successfully placed.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You'll be redirected to your orders page shortly...
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Go to Orders
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
```

### Add Route to App.jsx

In `src/App.jsx`, add this route:

```jsx
import CheckoutSuccess from './pages/CheckoutSuccess';

// Inside your Routes:
<Route path="/checkout-success" element={<CheckoutSuccess />} />
```

## Testing Checklist

- [ ] Shopify store created and app configured
- [ ] App URL set in Shopify configuration
- [ ] Redirect URLs configured (development & production)
- [ ] Storefront token obtained
- [ ] Backend environment variables set
- [ ] Backend endpoints tested with Postman
- [ ] Products synced to Firestore
- [ ] Cart includes Shopify variant IDs
- [ ] Checkout form working
- [ ] Redirects to Shopify checkout
- [ ] Checkout success page working
- [ ] Order confirmation received from Shopify

## Redirect URLs Explained

### Development Setup
```
Your App URL: http://localhost:3000
Redirect URL: http://localhost:3000/checkout-success
```

### Production Setup
```
Your App URL: https://shopki.example.com
Redirect URL: https://shopki.example.com/checkout-success
```

### What Happens
1. User clicks "Proceed to Shopify Checkout"
2. User is redirected to Shopify's hosted checkout page
3. User completes payment on Shopify
4. Shopify redirects back to your Redirect URL with `?checkout_id=...`
5. CheckoutSuccess page clears cart and shows confirmation
6. User is redirected to Orders page

### Updating URLs When Deploying
When you deploy to production:
1. Go to Shopify app Configuration
2. Update App URL to your production domain
3. Update Redirect URL to your production domain
4. Redeploy backend and frontend

## Troubleshooting

### "Storefront API error"
- Check token is correct
- Verify scopes are enabled in Shopify app
- Check store URL format

### "Variant ID not found"
- Ensure products have `shopifyVariantId`
- Use Shopify GraphQL Admin API to get variant IDs

### "Checkout redirect not working"
- Check browser console for errors
- Verify `webUrl` is a valid URL
- Check CORS settings on backend

## Advanced: POS & App Proxy Integration

### What is App Proxy?

App Proxy lets Shopify call your backend server securely without exposing credentials:

```
Shopify → App Proxy Request → Your Backend → Firebase/Database
```

**Benefits:**
- Shopify validates requests before sending
- No need to expose API tokens in frontend
- Can sync inventory, orders, products automatically
- Enable webhooks for real-time updates

### POS Integration Setup

For a Point-of-Sale system (if you have one), configure these app proxy endpoints:

#### 1. Create POS Webhook Endpoint

Add to `backend/server.js`:

```javascript
/**
 * POST /apps/shopki/api/sync-inventory
 * Shopify calls this when inventory changes
 */
app.post('/apps/shopki/api/sync-inventory', async (req, res) => {
  try {
    // Verify Shopify request signature
    const hmac = req.get('X-Shopify-Hmac-SHA256');
    const body = req.rawBody; // You need to capture raw body
    
    // Verify request is from Shopify
    const verified = verifyShopifyRequest(hmac, body);
    if (!verified) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { inventory, shopifyStoreId } = req.body;

    // Sync to Firebase
    const inventoryRef = db.collection('inventory').doc(shopifyStoreId);
    await inventoryRef.set({
      items: inventory,
      lastSynced: new Date(),
      source: 'shopify-webhook'
    });

    console.log('✅ Inventory synced from Shopify');
    res.json({ success: true, synced: inventory.length });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /apps/shopki/api/create-pos-order
 * Create order from POS system via Shopify
 */
app.post('/apps/shopki/api/create-pos-order', async (req, res) => {
  try {
    const { items, customerEmail, totalAmount, paymentMethod } = req.body;

    // Create Shopify order via Admin API
    const orderQuery = `
      mutation CreateOrder($input: OrderCreateInput!) {
        orderCreate(input: $input) {
          order {
            id
            name
            total
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`${process.env.SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        query: orderQuery,
        variables: {
          input: {
            email: customerEmail,
            lineItems: items.map(item => ({
              variantId: item.shopifyVariantId,
              quantity: item.quantity
            })),
            transactions: [{
              kind: paymentMethod,
              status: 'SUCCESS',
              amount: totalAmount
            }]
          }
        }
      })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({
        success: false,
        error: data.errors[0].message
      });
    }

    const order = data.data.orderCreate.order;

    // Save to Firebase
    const orderRef = db.collection('orders').doc(order.id);
    await orderRef.set({
      shopifyOrderId: order.id,
      shopifyOrderName: order.name,
      customerEmail: order.email,
      items: items,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      status: 'completed',
      createdAt: new Date(),
      source: 'pos'
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        name: order.name,
        total: order.total
      }
    });
  } catch (error) {
    console.error('POS order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /apps/shopki/api/pos/products
 * Get products for POS system
 */
app.get('/apps/shopki/api/pos/products', async (req, res) => {
  try {
    const query = `
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`${process.env.SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({ query, variables: { first: 100 } })
    });

    const data = await response.json();

    res.json({
      success: true,
      products: data.data.products.edges.map(edge => edge.node)
    });
  } catch (error) {
    console.error('POS products error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to verify Shopify requests
function verifyShopifyRequest(hmac, body) {
  const crypto = require('crypto');
  const message = body;
  const secret = process.env.SHOPIFY_API_SECRET;
  const computed_hmac = crypto
    .createHmac('sha256', secret)
    .update(message, 'utf8')
    .digest('base64');

  return computed_hmac === hmac;
}
```

#### 2. Enable Webhooks in Shopify Admin

```
Apps → Your App → Configuration
Scroll to "Webhooks"
Add webhook:
  - Event: inventory_levels/update
  - URL: https://your-backend.com/apps/shopki/api/sync-inventory
```

### POS Client Setup

Create `src/services/pos/posService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const posApi = axios.create({
  baseURL: `${API_BASE_URL}/apps/shopki/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const posService = {
  /**
   * Get all products for POS
   */
  async getProducts() {
    try {
      const response = await posApi.get('/pos/products');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch POS products:', error);
      throw error;
    }
  },

  /**
   * Create order from POS
   */
  async createPOSOrder(items, customerEmail, totalAmount, paymentMethod = 'cash') {
    try {
      const response = await posApi.post('/create-pos-order', {
        items,
        customerEmail,
        totalAmount,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('POS order creation failed:', error);
      throw error;
    }
  },

  /**
   * Get inventory/stock levels
   */
  async getInventory(shopifyStoreId) {
    try {
      const response = await posApi.get(`/inventory/${shopifyStoreId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      throw error;
    }
  }
};

export default posService;
```

### App Proxy Request Flow

```
1. Shopify Admin → App Proxy Endpoint
2. Headers include:
   - X-Shopify-Shop-Id: your-store.myshopify.com
   - X-Shopify-Hmac-SHA256: request signature
   - X-Shopify-Access-Token: (if configured)
3. Your backend verifies signature
4. Processes request securely
5. Returns response to Shopify
```

### Environment Variables for POS

Add to `backend/.env`:

```env
# Shopify App Proxy
SHOPIFY_API_SECRET=your_api_secret_from_shopify
SHOPIFY_ADMIN_TOKEN=your_admin_token_here
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Firebase (for order storage)
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY=your_firebase_key
FIREBASE_CLIENT_EMAIL=your_firebase_email
```

## Next Steps

1. **Setup Webhooks**: Enable Shopify webhooks for inventory & order updates
2. **Add M-Pesa Integration**: For payment after Shopify checkout
3. **Create POS Mobile App**: Use Capacitor to build a POS app
4. **Real-time Sync**: Use Firebase Realtime Database for live inventory
5. **Order Management**: Create dashboard to view Shopify + POS orders

---

**Security Note**: 
- Always verify Shopify request signatures
- Never expose your Storefront token in frontend code
- Use App Proxy for sensitive operations
- Keep Admin API token secure on backend only
