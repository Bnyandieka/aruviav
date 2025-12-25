// src/services/firebase/firestoreHelpers.js

import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { sendOrderStatusUpdate } from '../email/emailAutomation';

/**
 * Get all products or limited number
 */
export const getProducts = async (limitCount = null, filters = {}) => {
  try {
    let q = collection(db, 'products');
    const constraints = [];
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.minPrice) {
      constraints.push(where('price', '>=', filters.minPrice));
    }
    
    if (filters.maxPrice) {
      constraints.push(where('price', '<=', filters.maxPrice));
    }
    
    if (filters.featured) {
      constraints.push(where('featured', '==', true));
    }
    
    if (filters.sortBy === 'price-asc') {
      constraints.push(orderBy('price', 'asc'));
    } else if (filters.sortBy === 'price-desc') {
      constraints.push(orderBy('price', 'desc'));
    } else if (filters.sortBy === 'rating') {
      constraints.push(orderBy('rating', 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, 'products'), ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Fetched ${products.length} products`);
    return { products, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return { products: [], error: error.message };
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        product: { id: docSnap.id, ...docSnap.data() }, 
        error: null 
      };
    } else {
      return { 
        product: null, 
        error: 'Product not found' 
      };
    }
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    return { product: null, error: error.message };
  }
};

/**
 * Alias for getProductById
 */
export const getProduct = async (productId) => {
  return getProductById(productId);
};

/**
 * Get all categories
 */
export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Fetched ${categories.length} categories`);
    return { categories, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return { categories: [], error: error.message };
  }
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (categoryId) => {
  try {
    const docRef = doc(db, 'categories', categoryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        category: { id: docSnap.id, ...docSnap.data() }, 
        error: null 
      };
    } else {
      return { 
        category: null, 
        error: 'Category not found' 
      };
    }
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    return { category: null, error: error.message };
  }
};

/**
 * Add a new product
 */
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Product added:', docRef.id);
    return { productId: docRef.id, error: null };
    
  } catch (error) {
    console.error('❌ Error adding product:', error);
    return { productId: null, error: error.message };
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId, updates) => {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Product updated:', productId);
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    console.log('✅ Product deleted:', productId);
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search products by name or keywords
 */
export const searchProducts = async (searchTerm) => {
  try {
    const { products, error } = await getProducts();
    
    if (error) {
      return { products: [], error };
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = products.filter(product => 
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
    
    console.log(`✅ Found ${filtered.length} products matching "${searchTerm}"`);
    return { products: filtered, error: null };
    
  } catch (error) {
    console.error('❌ Error searching products:', error);
    return { products: [], error: error.message };
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (categorySlug, limitCount = null) => {
  return getProducts(limitCount, { category: categorySlug });
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limitCount = 10) => {
  return getProducts(limitCount, { featured: true });
};

/**
 * Get product reviews
 */
export const getProductReviews = async (productId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Fetched ${reviews.length} reviews`);
    return { reviews, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return { reviews: [], error: error.message };
  }
};

/**
 * Add a review for a product
 */
export const addReview = async (productId, reviewData) => {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      productId,
      ...reviewData,
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Review added:', docRef.id);
    return { reviewId: docRef.id, error: null };
    
  } catch (error) {
    console.error('❌ Error adding review:', error);
    return { reviewId: null, error: error.message };
  }
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Order created:', docRef.id);
    return { orderId: docRef.id, error: null };
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return { orderId: null, error: error.message };
  }
};

/**
 * Get orders for a specific user
 */
export const getUserOrders = async (userId) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort on client side by createdAt descending
    orders.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
    
    console.log(`✅ Fetched ${orders.length} orders`);
    return { orders, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return { orders: [], error: error.message };
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        order: { id: docSnap.id, ...docSnap.data() }, 
        error: null 
      };
    } else {
      return { 
        order: null, 
        error: 'Order not found' 
      };
    }
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    return { order: null, error: error.message };
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log(`📝 Updating order ${orderId} status to: ${status}`);
    
    const docRef = doc(db, 'orders', orderId);
    
    // Fetch the order to get user and order details
    const orderSnap = await getDoc(docRef);
    if (!orderSnap.exists()) {
      console.error('❌ Order not found:', orderId);
      return { success: false, error: 'Order not found' };
    }
    
    let orderData = orderSnap.data();
    console.log('✅ Order found:', { userEmail: orderData.userEmail, userName: orderData.userName });
    
    // If email is not in order, fetch from user document
    if (!orderData.userEmail && orderData.userId) {
      try {
        const userRef = doc(db, 'users', orderData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          orderData.userEmail = userData.email;
          orderData.userName = userData.displayName || 'Customer';
          console.log(`✅ Fetched user email from users collection: ${orderData.userEmail}`);
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch user data:', err.message);
      }
    }
    
    // Update the order status in Firestore
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    console.log(`✅ Status updated in Firestore for order ${orderId}`);
    
    // Send email notification to user
    if (orderData.userEmail) {
      console.log(`📧 Sending status update email to ${orderData.userEmail}...`);
      const orderInfo = {
        id: orderId,
        status: status,
        trackingNumber: orderData.trackingNumber || null
      };
      const emailResult = await sendOrderStatusUpdate(orderData.userEmail, orderInfo);
      console.log('📧 Email result:', emailResult);
    } else {
      console.warn('⚠️ No email found for order:', orderId);
    }
    
    console.log('✅ Order status updated successfully:', orderId);
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return { success: false, error: error.message };
  }
};