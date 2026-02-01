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
  serverTimestamp,
  setDoc 
} from 'firebase/firestore';
import { db } from './config';
import { sendOrderStatusUpdate } from '../email/emailAutomation';

/**
 * Generate a 10-character alphanumeric ID (uppercase letters + numbers)
 * Example: A1B2C3D4E5, X9Y8Z7W6V5
 */
const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderId = '';
  for (let i = 0; i < 10; i++) {
    orderId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return orderId;
};

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
    return { reviewId: docRef.id, error: null };
    
  } catch (error) {
    console.error('❌ Error adding review:', error);
    return { reviewId: null, error: error.message };
  }
};

/**
 * Create a new order
 * Validates stock before creating order, supports multiple vendors
 */
export const createOrder = async (orderData) => {
  try {
    // Step 1: Validate stock for ALL items before creating order
    const vendorIds = new Set(); // Support multiple vendors
    const stockValidation = {};
    
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        const productId = item.productId || item.id;
        const quantity = item.quantity || 1;
        
        if (productId) {
          try {
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);
            
            if (productSnap.exists()) {
              const productData = productSnap.data();
              const currentStock = productData.stock || 0;
              
              // Check if sufficient stock available
              if (currentStock < quantity) {
                console.error(`❌ Insufficient stock for product ${productId}: requested ${quantity}, available ${currentStock}`);
                return { 
                  orderId: null, 
                  error: `Insufficient stock for ${item.name || 'item'}. Available: ${currentStock}, Requested: ${quantity}` 
                };
              }
              
              // Store validation data for later use
              stockValidation[productId] = {
                productData,
                currentStock,
                quantity,
                vendorId: productData.vendorId
              };
              
              // Collect vendor IDs
              if (productData.vendorId) {
                vendorIds.add(productData.vendorId);
              }
            } else {
              return { orderId: null, error: `Product ${productId} not found` };
            }
          } catch (err) {
            console.error(`❌ Error validating stock for product ${productId}:`, err.message);
            return { orderId: null, error: `Error validating product ${productId}` };
          }
        }
      }
    }
    
    // Step 2: Create main order document with all vendor IDs
    const vendorIdArray = Array.from(vendorIds);
    
    // Generate custom 10-character order ID
    const orderId = generateOrderId();
    
    const orderDoc = {
      ...orderData,
      orderId: orderId, // Store the ID in the document as well
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      vendorIds: vendorIdArray, // Store ALL vendors for this order
      vendorId: vendorIdArray.length === 1 ? vendorIdArray[0] : null // Keep single vendorId for backward compatibility
    };
    
    // Use setDoc with custom ID instead of addDoc with auto-generated ID
    await setDoc(doc(db, 'orders', orderId), orderDoc);
    console.log(`📋 Created order with custom ID: ${orderId}`);
    
    // Step 3: DO NOT reduce stock here - wait for payment success
    // Stock will be reduced only after payment is successfully processed
    console.log(`⏳ Stock will be reduced after payment is confirmed for order: ${orderId}`);
    
    return { orderId, error: null };
    
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
    
    return { orders, error: null };
    
  } catch (error) {
    console.error('Error fetching orders:', error);
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
 * Recursively remove undefined values from an object (Firestore requirement)
 */
const cleanUndefinedValues = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
  
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = cleanUndefinedValues(value);
    }
    return acc;
  }, {});
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string|object} statusOrData - New status string OR object with {status, paymentStatus, transactionData, etc}
 * @param {string} vendorId - Optional vendor ID for permission check
 */
export const updateOrderStatus = async (orderId, statusOrData, vendorId = null) => {
  try {
    const docRef = doc(db, 'orders', orderId);
    
    // Normalize input: handle both string and object formats
    let updatePayload = {};
    let statusString = '';
    
    if (typeof statusOrData === 'string') {
      // Legacy: status is a simple string
      statusString = statusOrData;
      updatePayload = { status: statusString };
    } else if (typeof statusOrData === 'object' && statusOrData !== null) {
      // New: object with paymentStatus, transactionData, etc.
      const { paymentStatus, status, transactionId, checkoutRequestID, transactionData, paymentError, lastUpdated } = statusOrData;
      
      statusString = status || paymentStatus || 'payment_processing';
      updatePayload.status = statusString;
      
      // Only add non-undefined fields
      if (paymentStatus) updatePayload.paymentStatus = paymentStatus;
      if (transactionId) updatePayload.transactionId = transactionId;
      if (checkoutRequestID) updatePayload.checkoutRequestID = checkoutRequestID;
      // Clean transactionData to remove undefined fields
      if (transactionData) updatePayload.transactionData = cleanUndefinedValues(transactionData);
      if (paymentError) updatePayload.paymentError = paymentError;
    } else {
      return { success: false, error: 'Invalid status parameter' };
    }

    console.log(`📝 Updating order ${orderId} status to: ${statusString}${vendorId ? ` (vendor: ${vendorId})` : ' (admin/user)'}`);
    
    // Fetch the order to get user and order details
    const orderSnap = await getDoc(docRef);
    if (!orderSnap.exists()) {
      console.error('❌ Order not found:', orderId);
      return { success: false, error: 'Order not found' };
    }
    
    let orderData = orderSnap.data();
    // If vendorId is provided, verify vendor ownership
    if (vendorId && orderData.vendorId && orderData.vendorId !== vendorId) {
      console.error('❌ Unauthorized: Vendor does not own this order');
      return { success: false, error: 'Unauthorized: This is not your order' };
    }
    
    // If email is not in order, fetch from user document
    if (!orderData.userEmail && orderData.userId) {
      try {
        const userRef = doc(db, 'users', orderData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          orderData.userEmail = userData.email;
          orderData.userName = userData.displayName || 'Customer';
        }
      } catch (err) {
        console.warn('Could not fetch user data:', err.message);
      }
    }
    
    // Add timestamp
    updatePayload.updatedAt = serverTimestamp();
    
    // Clean the entire payload to remove undefined values
    const cleanPayload = cleanUndefinedValues(updatePayload);
    
    // Update the order in Firestore
    await updateDoc(docRef, cleanPayload);
    
    // Send email notification to user (only for non-payment status updates)
    if (orderData.userEmail && !statusString.includes('payment')) {
      const orderInfo = {
        id: orderId,
        status: statusString,
        trackingNumber: orderData.trackingNumber || null
      };
      await sendOrderStatusUpdate(orderData.userEmail, orderInfo);
    } else if (!orderData.userEmail) {
      console.warn('⚠️ No email found for order:', orderId);
    }
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all services or filtered
 */
export const getServices = async (limitCount = null, filters = {}) => {
  try {
    let q = collection(db, 'services');
    const constraints = [];
    
    // Filter out deleted services by default
    constraints.push(where('status', '!=', 'deleted'));
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.minPrice) {
      constraints.push(where('price', '>=', filters.minPrice));
    }
    
    if (filters.maxPrice) {
      constraints.push(where('price', '<=', filters.maxPrice));
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
      q = query(q, ...constraints);
    }
    
    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Get single service by ID
 */
export const getService = async (serviceId) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
};

/**
 * Create a new service
 */
export const createService = async (serviceData, userId) => {
  try {
    const newService = {
      ...serviceData,
      sellerId: userId,
      status: 'active', // New field: active, under_review, rejected, deleted
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rating: 0,
      reviewCount: 0,
      bookings: 0
    };
    
    const docRef = await addDoc(collection(db, 'services'), newService);
    return {
      id: docRef.id,
      ...newService
    };
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Update service
 */
export const updateService = async (serviceId, updateData) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      id: serviceId
    };
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

/**
 * Delete service
 */
export const deleteService = async (serviceId) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      message: 'Service deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

/**
 * Search services
 */
export const searchServices = async (searchTerm) => {
  try {
    const allServices = await getServices();
    
    const filtered = allServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
  } catch (error) {
    console.error('Error searching services:', error);
    return [];
  }
};

/**
 * Get services by seller ID
 */
export const getServicesBySeller = async (sellerId) => {
  try {
    const q = query(
      collection(db, 'services'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return services;
  } catch (error) {
    console.error('Error fetching seller services:', error);
    return [];
  }
};

/**
 * Get all services for admin (including hidden/under review)
 */
export const getAllServicesAdmin = async () => {
  try {
    const q = query(
      collection(db, 'services'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return services;
  } catch (error) {
    console.error('Error fetching services for admin:', error);
    return [];
  }
};

/**
 * Update service status (admin only)
 * status: 'active', 'under_review', 'rejected', 'deleted'
 */
export const updateServiceStatus = async (serviceId, status, adminNotes = '') => {
  try {
    const docRef = doc(db, 'services', serviceId);
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    if (status === 'under_review') {
      updateData.reviewRequestedAt = serverTimestamp();
    }
    
    await updateDoc(docRef, updateData);
    
    return {
      success: true,
      message: `Service status updated to ${status}`
    };
  } catch (error) {
    console.error('Error updating service status:', error);
    throw error;
  }
};

/**
 * Admin edit service (correct spelling, etc.)
 */
export const adminEditService = async (serviceId, editData) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    
    const updateData = {
      ...editData,
      updatedAt: serverTimestamp(),
      lastEditedByAdmin: true
    };
    
    await updateDoc(docRef, updateData);
    
    return {
      success: true,
      message: 'Service updated by admin'
    };
  } catch (error) {
    console.error('Error editing service as admin:', error);
    throw error;
  }
};

/**
 * Admin delete service (permanent)
 */
export const adminDeleteService = async (serviceId) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      deletedByAdmin: true,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Service deleted by admin'
    };
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

/**
 * Owner delete service
 */
export const ownerDeleteService = async (serviceId, sellerId) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    const serviceSnap = await getDoc(docRef);
    
    if (!serviceSnap.exists()) {
      throw new Error('Service not found');
    }
    
    const serviceData = serviceSnap.data();
    
    if (serviceData.sellerId !== sellerId) {
      throw new Error('Unauthorized: You do not own this service');
    }
    
    await updateDoc(docRef, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      deletedByOwner: true,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Service deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting service by owner:', error);
    throw error;
  }
};

/**
 * Reduce stock for an order after successful payment
 * This is called from the backend after M-Pesa payment is successful
 */
export const reduceStockAfterPayment = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.error(`❌ Order ${orderId} not found`);
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderSnap.data();
    
    // Check if stock already reduced (prevent double reduction)
    if (orderData.stockReduced) {
      console.log(`⏭️  Stock already reduced for order ${orderId}`);
      return { success: true, message: 'Stock already reduced' };
    }

    // Reduce stock for each item
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        const productId = item.productId || item.id;
        const quantity = item.quantity || 1;

        if (productId) {
          try {
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
              const productData = productSnap.data();
              const currentStock = productData.stock || 0;
              const newStock = Math.max(0, currentStock - quantity);

              await updateDoc(productRef, {
                stock: newStock,
                sold: (productData.sold || 0) + quantity,
                updatedAt: serverTimestamp()
              });

              console.log(`📊 Stock reduced for ${item.name}: ${currentStock} → ${newStock}`);
            }
          } catch (err) {
            console.error(`❌ Error reducing stock for product ${productId}:`, err.message);
          }
        }
      }
    }

    // Mark order as having stock reduced
    await updateDoc(orderRef, {
      stockReduced: true,
      updatedAt: serverTimestamp()
    });

    console.log(`✅ Stock reduced successfully for order ${orderId}`);
    return { success: true, message: 'Stock reduced after payment' };

  } catch (error) {
    console.error('❌ Error reducing stock after payment:', error);
    return { success: false, error: error.message };
  }
};