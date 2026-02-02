import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDoc,
  limit,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateOrderStatus as updateOrderStatusFromFirestore } from '../firebase/firestoreHelpers';

// ========================================
// VENDOR APPLICATION FUNCTIONS
// ========================================

/**
 * Submit a vendor application
 * @param {Object} applicationData - { userId, email, businessName, businessDescription, businessCategory, contactPhone, businessAddress }
 * @returns {Object} - { success, applicationId, error }
 */
export const submitVendorApplication = async (applicationData) => {
  try {
    if (!applicationData.userId || !applicationData.email || !applicationData.businessName) {
      return { success: false, error: 'Missing required fields' };
    }

    const application = {
      ...applicationData,
      status: 'pending', // pending, approved, rejected
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      reviewedBy: null,
      rejectionReason: null
    };

    const docRef = await addDoc(collection(db, 'vendor_applications'), application);
    
    return {
      success: true,
      applicationId: docRef.id
    };
  } catch (error) {
    console.error('Error submitting vendor application:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all vendor applications (admin only)
 * @param {string} status - Filter by status: 'pending', 'approved', 'rejected', or null for all
 * @returns {Array} - Array of applications with their IDs
 */
export const getVendorApplications = async (status = null) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, 'vendor_applications'),
        where('status', '==', status),
        orderBy('submittedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'vendor_applications'),
        orderBy('submittedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return applications;
  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return [];
  }
};

/**
 * Approve a vendor application
 * @param {string} applicationId - ID of the application
 * @param {string} adminId - ID of the admin approving
 * @returns {Object} - { success, error }
 */
export const approveVendorApplication = async (applicationId, adminId) => {
  try {
    const appRef = doc(db, 'vendor_applications', applicationId);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
      return { success: false, error: 'Application not found' };
    }

    const applicationData = appSnap.data();
    const userId = applicationData.userId;

    // Update application status
    await updateDoc(appRef, {
      status: 'approved',
      reviewedBy: adminId,
      updatedAt: Timestamp.now()
    });

    // Update user vendor status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isVendor: true,
      vendorStatus: 'approved',
      vendorApplicationId: applicationId,
      vendorApprovedAt: Timestamp.now(),
      businessName: applicationData.businessName,
      businessDescription: applicationData.businessDescription,
      businessCategory: applicationData.businessCategory,
      contactPhone: applicationData.contactPhone,
      businessAddress: applicationData.businessAddress
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving vendor application:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject a vendor application
 * @param {string} applicationId - ID of the application
 * @param {string} adminId - ID of the admin rejecting
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Object} - { success, error }
 */
export const rejectVendorApplication = async (applicationId, adminId, rejectionReason) => {
  try {
    const appRef = doc(db, 'vendor_applications', applicationId);
    
    await updateDoc(appRef, {
      status: 'rejected',
      reviewedBy: adminId,
      rejectionReason: rejectionReason || 'No reason provided',
      updatedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting vendor application:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has pending vendor application
 * @param {string} userId - User ID
 * @returns {Object} - { hasPending, applicationId, submittedAt }
 */
export const checkPendingVendorApplication = async (userId) => {
  try {
    const q = query(
      collection(db, 'vendor_applications'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { hasPending: false };
    }

    const doc = snapshot.docs[0];
    return {
      hasPending: true,
      applicationId: doc.id,
      submittedAt: doc.data().submittedAt
    };
  } catch (error) {
    console.error('Error checking pending application:', error);
    return { hasPending: false };
  }
};

// ========================================
// VENDOR MANAGEMENT FUNCTIONS
// ========================================

/**
 * Manually convert a user to vendor (admin action)
 * @param {string} userId - User ID
 * @param {Object} vendorData - { businessName, businessDescription, businessCategory, contactPhone, businessAddress }
 * @param {string} adminId - Admin ID
 * @returns {Object} - { success, error }
 */
export const convertUserToVendor = async (userId, vendorData, adminId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    await updateDoc(userRef, {
      isVendor: true,
      vendorStatus: 'approved',
      ...vendorData,
      vendorApprovedAt: Timestamp.now(),
      convertedBy: adminId
    });

    return { success: true };
  } catch (error) {
    console.error('Error converting user to vendor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Revoke vendor status from a user (admin action)
 * @param {string} userId - User ID
 * @returns {Object} - { success, error }
 */
export const revokeVendorStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      isVendor: false,
      vendorStatus: 'revoked',
      revokedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error revoking vendor status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get vendor profile information
 * @param {string} userId - User ID
 * @returns {Object} - Vendor profile data
 */
export const getVendorProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    
    if (!userData.isVendor) {
      return { success: false, error: 'User is not a vendor' };
    }

    return {
      success: true,
      profile: {
        userId,
        displayName: userData.displayName,
        email: userData.email,
        businessName: userData.businessName,
        businessDescription: userData.businessDescription,
        businessCategory: userData.businessCategory,
        contactPhone: userData.contactPhone,
        businessAddress: userData.businessAddress,
        vendorStatus: userData.vendorStatus,
        vendorApprovedAt: userData.vendorApprovedAt
      }
    };
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// VENDOR PRODUCTS FUNCTIONS
// ========================================

/**
 * Get all products by vendor
 * @param {string} vendorId - Vendor user ID
 * @returns {Array} - Array of vendor's products
 */
export const getVendorProducts = async (vendorId) => {
  try {
    if (!vendorId) {
      console.error('Vendor ID is required');
      return [];
    }

    // Note: Composite index required for where + orderBy
    // Create index at: https://console.firebase.google.com/project/aruviah-7c395/firestore/indexes
    const q = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId)
      // Temporarily removed orderBy - will be restored after index is created
      // orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    const products = [];
    
    snapshot.forEach(doc => {
      const productData = doc.data();
      products.push({
        id: doc.id,
        ...productData
      });
    });

    return products;
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return [];
  }
};

// ========================================
// VENDOR ORDERS FUNCTIONS
// ========================================

/**
 * Get all orders for a vendor's products
 * @param {string} vendorId - Vendor user ID
 * @returns {Array} - Array of vendor's orders
 */
export const getVendorOrders = async (vendorId) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const orders = [];
    
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return orders;
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return [];
  }
};

/**
 * Update order status (vendor action)
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New order status
 * @param {string} vendorId - Vendor ID (for validation)
 * @returns {Object} - { success, error }
 */
export const updateVendorOrderStatus = async (orderId, newStatus, vendorId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderSnap.data();
    
    // Verify vendor ownership
    if (orderData.vendorId !== vendorId) {
      return { success: false, error: 'Unauthorized: You can only update your own orders' };
    }

    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Confirm order by vendor
 * @param {string} orderId - Order ID
 * @param {string} vendorId - Vendor ID
 * @returns {Object} - { success, error }
 */
export const confirmVendorOrder = async (orderId, vendorId) => {
  try {
    return await updateVendorOrderStatus(orderId, 'confirmed', vendorId);
  } catch (error) {
    console.error('Error confirming order:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// VENDOR ANALYTICS FUNCTIONS
// ========================================

/**
 * Get vendor sales summary
 * @param {string} vendorId - Vendor user ID
 * @returns {Object} - Sales summary data
 */
export const getVendorSalesSummary = async (vendorId) => {
  try {
    // Get all orders for vendor
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId)
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    
    let totalSales = 0;
    let totalOrders = 0;
    let totalAmount = 0;
    const statusCount = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0
    };

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      totalOrders++;
      const orderAmount = order.totalAmount || order.total || 0;
      totalAmount += orderAmount;
      
      const status = order.status || 'pending';
      if (statusCount[status] !== undefined) {
        statusCount[status]++;
      }

      if (order.status === 'completed' || order.status === 'shipped') {
        totalSales += orderAmount;
      }
    });

    // Get total products
    const productsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const totalProducts = productsSnapshot.size;

    return {
      success: true,
      summary: {
        totalSales,
        totalOrders,
        totalAmount,
        totalProducts,
        statusCount
      }
    };
  } catch (error) {
    console.error('Error fetching vendor sales summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get top selling products for vendor
 * @param {string} vendorId - Vendor user ID
 * @param {number} limit - Number of top products to return
 * @returns {Array} - Array of top products
 */
export const getVendorTopProducts = async (vendorId, limitCount = 5) => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId),
      orderBy('sold', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(productsQuery);
    const products = [];

    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return products;
  } catch (error) {
    console.error('Error fetching top products:', error);
    return [];
  }
};

// ========================================
// VENDOR NOTIFICATION FUNCTIONS
// ========================================

/**
 * Create a notification for user
 * @param {Object} notificationData - { userId, type, title, message, relatedId, relatedType }
 * @returns {Object} - { success, notificationId, error }
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = {
      userId: notificationData.userId,
      type: notificationData.type, // 'vendor_approved', 'vendor_rejected', 'vendor_application_received'
      title: notificationData.title,
      message: notificationData.message,
      relatedId: notificationData.relatedId || null,
      relatedType: notificationData.relatedType || 'vendor_application',
      isRead: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    
    return {
      success: true,
      notificationId: docRef.id
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {number} limit - Number of notifications to fetch
 * @returns {Array} - Array of notifications
 */
export const getUserNotifications = async (userId, limitCount = 50) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(notificationsQuery);
    const notifications = [];

    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Object} - { success, error }
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isRead: true,
      updatedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Approve vendor application with email and notification
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 * @param {Object} appData - Application data including email and userId
 * @returns {Object} - { success, error }
 */
export const approveVendorWithNotification = async (applicationId, adminId, appData) => {
  try {
    // First, approve the application
    const approvalResult = await approveVendorApplication(applicationId, adminId);
    
    if (!approvalResult.success) {
      return approvalResult;
    }

    const { userId, email, businessName, firstName } = appData;
    const displayName = firstName || email.split('@')[0];

    // Send approval email
    const { sendVendorApprovedEmail } = await import('../email/emailAutomation');
    await sendVendorApprovedEmail(email, displayName, businessName);

    // Create notification
    await createNotification({
      userId,
      type: 'vendor_approved',
      title: '✅ Vendor Application Approved!',
      message: `Congratulations! Your application for ${businessName} has been approved. You can now access the vendor dashboard.`,
      relatedId: applicationId,
      relatedType: 'vendor_application'
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving vendor with notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject vendor application with email and notification
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 * @param {Object} appData - Application data including email, userId, businessName
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Object} - { success, error }
 */
export const rejectVendorWithNotification = async (applicationId, adminId, appData, rejectionReason) => {
  try {
    // First, reject the application
    const rejectionResult = await rejectVendorApplication(applicationId, adminId, rejectionReason);
    
    if (!rejectionResult.success) {
      return rejectionResult;
    }

    const { userId, email, businessName, firstName } = appData;
    const displayName = firstName || email.split('@')[0];

    // Send rejection email
    const { sendVendorRejectedEmail } = await import('../email/emailAutomation');
    await sendVendorRejectedEmail(email, displayName, businessName, rejectionReason);

    // Create notification
    await createNotification({
      userId,
      type: 'vendor_rejected',
      title: '⚠️ Application Status Update',
      message: `Your vendor application for ${businessName} was not approved at this time. Please check your email for more details.`,
      relatedId: applicationId,
      relatedType: 'vendor_application'
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting vendor with notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send application received notification
 * @param {Object} appData - Application data including email, userId, businessName, firstName
 * @param {string} applicationId - Application ID
 * @returns {Object} - { success, error }
 */
export const sendApplicationReceivedNotification = async (appData, applicationId) => {
  try {
    const { userId, email, businessName, firstName } = appData;
    const displayName = firstName || email.split('@')[0];

    // Send received email
    const { sendVendorApplicationReceivedEmail } = await import('../email/emailAutomation');
    await sendVendorApplicationReceivedEmail(email, displayName, businessName);

    // Send admin notification email
    await sendAdminVendorApplicationNotification(appData, applicationId);

    // Create notification
    await createNotification({
      userId,
      type: 'vendor_application_received',
      title: '✓ Application Received',
      message: `Your vendor application for ${businessName} has been received and is under review. We'll notify you soon.`,
      relatedId: applicationId,
      relatedType: 'vendor_application'
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending application received notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send admin notification email for new vendor application
 * @param {Object} appData - { userId, email, businessName, businessDescription, businessCategory, contactPhone, businessAddress, firstName }
 * @param {string} applicationId - Application ID
 * @returns {Object} - { success, error }
 */
export const sendAdminVendorApplicationNotification = async (appData, applicationId) => {
  try {
    const { 
      email, 
      businessName, 
      businessDescription, 
      businessCategory, 
      contactPhone, 
      businessAddress,
      firstName = '',
      lastName = ''
    } = appData;

    // Import email services
    const { sendBrevEmail } = await import('../email/brevoService');
    const { saveEmailToAdminInbox } = await import('../email/adminEmailService');
    const { DEFAULT_EMAIL_TEMPLATES } = await import('../../utils/defaultEmailTemplates');

    // Get admin email (usually from settings, fallback to default)
    let adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'admin@aruviah.com';
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'emails'));
      if (settingsDoc.exists() && settingsDoc.data().adminEmail) {
        adminEmail = settingsDoc.data().adminEmail;
      }
    } catch (err) {
      console.warn('Could not fetch admin email from settings, using default');
    }

    // Get template or use default
    let template;
    try {
      const templateDoc = await getDoc(doc(db, 'emailTemplates', 'vendorApplication'));
      if (templateDoc.exists()) {
        template = templateDoc.data();
      } else {
        template = DEFAULT_EMAIL_TEMPLATES.vendorApplication;
      }
    } catch (err) {
      template = DEFAULT_EMAIL_TEMPLATES.vendorApplication;
    }

    // Prepare dynamic content
    const adminDashboardLink = `${process.env.REACT_APP_BASE_URL}/admin?tab=vendors`;
    const submittedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Replace template variables
    let htmlContent = template.htmlContent
      .replace(/\{\{firstName\}\}/g, firstName || 'Vendor')
      .replace(/\{\{lastName\}\}/g, lastName || '')
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{phone\}\}/g, contactPhone)
      .replace(/\{\{businessName\}\}/g, businessName)
      .replace(/\{\{businessCategory\}\}/g, businessCategory)
      .replace(/\{\{businessAddress\}\}/g, businessAddress)
      .replace(/\{\{businessDescription\}\}/g, businessDescription)
      .replace(/\{\{applicationId\}\}/g, applicationId)
      .replace(/\{\{submittedDate\}\}/g, submittedDate)
      .replace(/\{\{adminDashboardLink\}\}/g, adminDashboardLink);

    const subject = template.subject
      .replace(/\{\{businessName\}\}/g, businessName);

    // Send email via Brevo
    const emailPayload = {
      to: [{
        email: adminEmail,
        name: 'Admin'
      }],
      subject,
      htmlContent
    };

    await sendBrevEmail(emailPayload);
    
    // Save to admin inbox regardless of Brevo result (for internal storage)
    await saveEmailToAdminInbox({
      to: adminEmail,
      from: email,
      subject,
      htmlContent,
      type: 'vendor_application',
      relatedId: applicationId,
      relatedData: {
        firstName,
        lastName,
        email,
        phone: contactPhone,
        businessName,
        businessCategory,
        businessAddress,
        businessDescription,
        applicationId,
        submittedDate
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending admin vendor application notification:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// REAL-TIME LISTENER FUNCTIONS
// ========================================

/**
 * Listen to real-time product stock updates for vendor
 * @param {string} vendorId - Vendor ID
 * @param {function} onProductsUpdate - Callback function with products array
 * @returns {function} - Unsubscribe function to stop listening
 */
export const listenToVendorProducts = (vendorId, onProductsUpdate) => {
  try {
    if (!vendorId) {
      console.error('Vendor ID required for real-time product listener');
      return () => {};
    }

    const q = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = [];
      snapshot.forEach(doc => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      onProductsUpdate(products);
    }, (error) => {
      console.error('Error in real-time product listener:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time product listener:', error);
    return () => {};
  }
};

/**
 * Listen to real-time vendor orders
 * @param {string} vendorId - Vendor ID
 * @param {function} onOrdersUpdate - Callback function with orders array
 * @returns {function} - Unsubscribe function to stop listening
 */
export const listenToVendorOrders = (vendorId, onOrdersUpdate) => {
  try {
    if (!vendorId) {
      console.error('Vendor ID required for real-time orders listener');
      return () => {};
    }

    // Listen to orders where vendorId matches (backward compatibility)
    const q1 = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    // Also listen to orders where vendorId is in the vendorIds array (new multi-vendor support)
    const q2 = query(
      collection(db, 'orders'),
      where('vendorIds', 'array-contains', vendorId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Also get orders from vendorIds query
      const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
        const ordersFromVendorIds = [];
        snapshot2.forEach(doc => {
          // Avoid duplicates
          if (!orders.find(o => o.id === doc.id)) {
            ordersFromVendorIds.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        
        // Combine both queries and sort by date
        const allOrders = [...orders, ...ordersFromVendorIds].sort((a, b) => 
          (b.createdAt?.toDate?.() || new Date(b.createdAt)) - 
          (a.createdAt?.toDate?.() || new Date(a.createdAt))
        );
        onOrdersUpdate(allOrders);
      }, (error) => {
        console.error('Error in real-time orders listener (vendorIds):', error);
      });
      
      return unsubscribe2;
    }, (error) => {
      console.error('Error in real-time orders listener:', error);
    });

    // Return a cleanup function that unsubscribes from both listeners
    let unsubscribe2 = null;
    const cleanup = () => {
      unsubscribe1();
      if (unsubscribe2) unsubscribe2();
    };

    return cleanup;
  } catch (error) {
    console.error('Error setting up real-time orders listener:', error);
    return () => {};
  }
};

/**
 * Update vendor order status - delegates to firestoreHelpers with vendor authorization
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status (pending, processing, shipped, delivered, cancelled, confirmed, completed)
 * @param {string} vendorId - Vendor ID (for validation)
 * @returns {Object} - { success, error }
 */
export const updateOrderStatus = async (orderId, newStatus, vendorId) => {
  try {
    if (!orderId || !newStatus || !vendorId) {
      return { success: false, error: 'Order ID, status, and vendor ID are required' };
    }

    // Map vendor status names to standard names if needed
    const statusMap = {
      'confirmed': 'confirmed',
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    
    const finalStatus = statusMap[newStatus] || newStatus;

    // Call the main updateOrderStatus with vendorId for authorization
    const result = await updateOrderStatusFromFirestore(orderId, finalStatus, vendorId);
    
    if (result.success) {
    } else {
      console.error('❌ Failed to update vendor order:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating vendor order status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get real-time analytics for vendor (sales summary with live updates)
 * @param {string} vendorId - Vendor ID
 * @param {function} onAnalyticsUpdate - Callback function with analytics data
 * @returns {function} - Unsubscribe function to stop listening
 */
export const listenToVendorAnalytics = (vendorId, onAnalyticsUpdate) => {
  try {
    if (!vendorId) {
      console.error('Vendor ID required for real-time analytics listener');
      return () => {};
    }

    const q = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const orders = [];
        let totalSales = 0;
        let totalOrders = 0;
        let totalAmount = 0;
        const statusCount = {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        };

        snapshot.forEach(doc => {
          const order = doc.data();
          orders.push({
            id: doc.id,
            ...order
          });
          totalOrders++;
          totalAmount += order.totalAmount || 0;
          
          const status = order.status || 'pending';
          if (statusCount[status] !== undefined) {
            statusCount[status]++;
          }

          if (order.status === 'completed' || order.status === 'delivered') {
            totalSales += order.totalAmount || 0;
          }
        });

        // Get product count
        const productsQuery = query(
          collection(db, 'products'),
          where('vendorId', '==', vendorId)
        );
        const productsSnapshot = await getDocs(productsQuery);

        const analytics = {
          totalSales,
          totalOrders,
          totalAmount,
          totalProducts: productsSnapshot.size,
          statusCount,
          orders
        };
        onAnalyticsUpdate(analytics);
      } catch (error) {
        console.error('Error processing analytics snapshot:', error);
      }
    }, (error) => {
      console.error('Error in real-time analytics listener:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time analytics listener:', error);
    return () => {};
  }
};
