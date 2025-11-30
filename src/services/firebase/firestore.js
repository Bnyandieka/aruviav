// src/services/firebase/firestore.js
// This file contains all Firestore helper functions for the application

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

// ==================== PRODUCTS ====================

/**
 * Get all products or limited number with optional filters
 * @param {number} limitCount - Optional limit on number of products
 * @param {object} filters - Optional filters (category, price range, featured, sortBy)
 * @returns {Promise<object>} - { products: [], error: null }
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
 * @param {string} productId - Product document ID
 * @returns {Promise<object>} - { product: {}, error: null }
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
 * Alias for getProductById (for compatibility)
 * @param {string} productId - Product document ID
 * @returns {Promise<object>} - { product: {}, error: null }
 */
export const getProduct = async (productId) => {
  return getProductById(productId);
};

/**
 * Add a new product
 * @param {object} productData - Product data to add
 * @returns {Promise<object>} - { productId: string, error: null }
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
 * @param {string} productId - Product document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - { success: boolean, error: null }
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
 * @param {string} productId - Product document ID
 * @returns {Promise<object>} - { success: boolean, error: null }
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
 * @param {string} searchTerm - Search term
 * @returns {Promise<object>} - { products: [], error: null }
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
 * @param {string} categorySlug - Category slug (e.g., 'electronics')
 * @param {number} limitCount - Optional limit
 * @returns {Promise<object>} - { products: [], error: null }
 */
export const getProductsByCategory = async (categorySlug, limitCount = null) => {
  return getProducts(limitCount, { category: categorySlug });
};

/**
 * Get featured products
 * @param {number} limitCount - Optional limit (default: 10)
 * @returns {Promise<object>} - { products: [], error: null }
 */
export const getFeaturedProducts = async (limitCount = 10) => {
  return getProducts(limitCount, { featured: true });
};

// ==================== CATEGORIES ====================

/**
 * Get all categories
 * @returns {Promise<object>} - { categories: [], error: null }
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
 * @param {string} categoryId - Category document ID
 * @returns {Promise<object>} - { category: {}, error: null }
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

// ==================== REVIEWS ====================

/**
 * Get product reviews
 * @param {string} productId - Product document ID
 * @returns {Promise<object>} - { reviews: [], error: null }
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
 * @param {string} productId - Product document ID
 * @param {object} reviewData - Review data (rating, comment, userId, userName)
 * @returns {Promise<object>} - { reviewId: string, error: null }
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

// ==================== ORDERS ====================

/**
 * Create a new order
 * @param {object} orderData - Order data (items, total, userId, shippingAddress, etc.)
 * @returns {Promise<object>} - { orderId: string, error: null }
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
 * @param {string} userId - User ID
 * @returns {Promise<object>} - { orders: [], error: null }
 */
export const getUserOrders = async (userId) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
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
 * @param {string} orderId - Order document ID
 * @returns {Promise<object>} - { order: {}, error: null }
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
 * @param {string} orderId - Order document ID
 * @param {string} status - New status (pending, processing, shipped, delivered, cancelled)
 * @returns {Promise<object>} - { success: boolean, error: null }
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Order status updated:', orderId);
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return { success: false, error: error.message };
  }
};