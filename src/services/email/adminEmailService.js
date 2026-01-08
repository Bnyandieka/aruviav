// Admin Email Service - Store and manage emails in admin inbox
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Save email to admin inbox
 * @param {Object} emailData - { to, from, subject, htmlContent, type, relatedId, relatedData, isSent }
 * @returns {Object} - { success, emailId, error }
 */
export const saveEmailToAdminInbox = async (emailData) => {
  try {
    const {
      to,
      from,
      subject,
      htmlContent,
      type = 'general', // 'vendor_application', 'order', 'general', 'order_status'
      relatedId,
      relatedData = {},
      isSent = false // Mark if this is an outgoing email
    } = emailData;

    if (!to || !subject || !htmlContent) {
      return { success: false, error: 'Missing required email fields' };
    }

    const email = {
      to,
      from: from || 'noreply@aruviah.com',
      subject,
      htmlContent,
      type,
      relatedId,
      relatedData,
      isRead: isSent ? true : false, // Mark sent emails as read
      isStarred: false,
      isDraft: false,
      isSent: isSent, // Track if this is an outgoing email
      isSnoozed: false,
      snoozeUntil: null,
      labels: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'admin_emails'), email);
    
    console.log(`📧 Email saved to admin inbox: ${docRef.id} (Type: ${type}, Sent: ${isSent})`);
    return { success: true, emailId: docRef.id };
  } catch (error) {
    console.error('Error saving email to admin inbox:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all admin emails with optional filtering
 * @param {Object} filters - { type, isRead, limit }
 * @returns {Object} - { success, emails, error }
 */
export const getAdminEmails = async (filters = {}) => {
  try {
    const { type, isRead, limit = 50 } = filters;
    let constraints = [];

    if (type && type !== 'all') {
      constraints.push(where('type', '==', type));
    }

    if (isRead !== undefined) {
      constraints.push(where('isRead', '==', isRead));
    }

    let q = query(
      collection(db, 'admin_emails'),
      ...constraints,
      orderBy('createdAt', 'desc'),
      ...(limit ? [] : [])
    );

    const snapshot = await getDocs(q);
    const emails = [];

    snapshot.forEach(doc => {
      emails.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      });
    });

    return { success: true, emails: emails.slice(0, limit) };
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return { success: false, emails: [], error: error.message };
  }
};

/**
 * Mark email as read
 * @param {string} emailId - Email document ID
 * @returns {Object} - { success, error }
 */
export const markEmailAsRead = async (emailId) => {
  try {
    const emailRef = doc(db, 'admin_emails', emailId);
    await updateDoc(emailRef, {
      isRead: true,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking email as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark multiple emails as read
 * @param {Array} emailIds - Array of email document IDs
 * @returns {Object} - { success, error }
 */
export const markEmailsAsRead = async (emailIds) => {
  try {
    const promises = emailIds.map(emailId =>
      updateDoc(doc(db, 'admin_emails', emailId), {
        isRead: true,
        updatedAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error('Error marking emails as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete email from admin inbox
 * @param {string} emailId - Email document ID
 * @returns {Object} - { success, error }
 */
export const deleteAdminEmail = async (emailId) => {
  try {
    await deleteDoc(doc(db, 'admin_emails', emailId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete multiple emails from admin inbox
 * @param {Array} emailIds - Array of email document IDs
 * @returns {Object} - { success, error }
 */
export const deleteAdminEmails = async (emailIds) => {
  try {
    const promises = emailIds.map(emailId =>
      deleteDoc(doc(db, 'admin_emails', emailId))
    );
    
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error('Error deleting emails:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email count by type (for dashboard stats)
 * @returns {Object} - { success, counts, error }
 */
export const getEmailCountByType = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'admin_emails'));
    const counts = {
      total: snapshot.size,
      vendor_application: 0,
      order: 0,
      general: 0,
      unread: 0
    };

    snapshot.forEach(doc => {
      const type = doc.data().type || 'general';
      counts[type] = (counts[type] || 0) + 1;
      if (!doc.data().isRead) {
        counts.unread += 1;
      }
    });

    return { success: true, counts };
  } catch (error) {
    console.error('Error getting email counts:', error);
    return { success: false, counts: {}, error: error.message };
  }
};

/**
 * Search emails by subject or content
 * @param {string} searchTerm - Search term
 * @returns {Object} - { success, emails, error }
 */
export const searchAdminEmails = async (searchTerm) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'admin_emails'),
        orderBy('createdAt', 'desc')
      )
    );

    const searchLower = searchTerm.toLowerCase();
    const emails = [];

    snapshot.forEach(doc => {
      const email = doc.data();
      if (
        email.subject?.toLowerCase().includes(searchLower) ||
        email.to?.toLowerCase().includes(searchLower) ||
        email.relatedData?.businessName?.toLowerCase().includes(searchLower) ||
        email.relatedData?.email?.toLowerCase().includes(searchLower)
      ) {
        emails.push({
          id: doc.id,
          ...email,
          createdAt: email.createdAt?.toDate?.() || new Date()
        });
      }
    });

    return { success: true, emails };
  } catch (error) {
    console.error('Error searching emails:', error);
    return { success: false, emails: [], error: error.message };
  }
};

/**
 * Toggle starred status of email
 * @param {string} emailId - Email document ID
 * @param {boolean} starred - True to star, false to unstar
 * @returns {Object} - { success, error }
 */
export const toggleEmailStar = async (emailId, starred = true) => {
  try {
    const emailRef = doc(db, 'admin_emails', emailId);
    await updateDoc(emailRef, {
      isStarred: starred,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error toggling star:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Snooze email until specified time
 * @param {string} emailId - Email document ID
 * @param {Date} snoozeUntil - When to show email again
 * @returns {Object} - { success, error }
 */
export const snoozeEmail = async (emailId, snoozeUntil) => {
  try {
    const emailRef = doc(db, 'admin_emails', emailId);
    await updateDoc(emailRef, {
      isSnoozed: true,
      snoozeUntil: snoozeUntil,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error snoozing email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unsnooze email (bring it back to inbox)
 * @param {string} emailId - Email document ID
 * @returns {Object} - { success, error }
 */
export const unsnoozeEmail = async (emailId) => {
  try {
    const emailRef = doc(db, 'admin_emails', emailId);
    await updateDoc(emailRef, {
      isSnoozed: false,
      snoozeUntil: null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error unsnoozing email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get emails by section
 * @param {string} section - 'inbox', 'unread', 'starred', 'snoozed', 'draft', 'sent', 'all'
 * @param {number} limit - Max results
 * @returns {Object} - { success, emails, error }
 */
export const getEmailsBySection = async (section, limit = 100) => {
  try {
    // Fetch all emails first (single query, no composite index needed)
    let q = query(
      collection(db, 'admin_emails'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let emails = [];    snapshot.forEach(doc => {
      const email = doc.data();
      emails.push({
        id: doc.id,
        ...email,
        createdAt: email.createdAt?.toDate?.() || new Date(),
        snoozeUntil: email.snoozeUntil?.toDate?.() || null
      });
    });

    // Filter in JavaScript based on section
    if (section !== 'all') {
      switch(section) {
        case 'unread':
          emails = emails.filter(e => !e.isRead && !e.isSnoozed && !e.isDraft);
          break;
        case 'starred':
          emails = emails.filter(e => e.isStarred === true);
          break;
        case 'snoozed':
          emails = emails.filter(e => e.isSnoozed === true);
          break;
        case 'draft':
          emails = emails.filter(e => e.isDraft === true);
          break;
        case 'sent':
          emails = emails.filter(e => e.isSent === true);          break;
        case 'inbox':
        default:
          emails = emails.filter(e => !e.isSnoozed && !e.isDraft && !e.isSent);      }
    }    return { success: true, emails: emails.slice(0, limit) };
  } catch (error) {
    console.error('Error getting emails by section:', error);
    return { success: false, emails: [], error: error.message };
  }
};

/**
 * Create draft email
 * @param {Object} draftData - { to, subject, htmlContent, relatedData }
 * @returns {Object} - { success, draftId, error }
 */
export const createDraftEmail = async (draftData) => {
  try {
    const {
      to = '',
      subject = '',
      htmlContent = '',
      relatedData = {}
    } = draftData;

    const draft = {
      to,
      from: 'noreply@aruviah.com',
      subject,
      htmlContent,
      type: 'draft',
      relatedData,
      isRead: false,
      isStarred: false,
      isDraft: true,
      isSent: false,
      isSnoozed: false,
      snoozeUntil: null,
      labels: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'admin_emails'), draft);
    return { success: true, draftId: docRef.id };
  } catch (error) {
    console.error('Error creating draft:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update draft email
 * @param {string} draftId - Draft email ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - { success, error }
 */
export const updateDraftEmail = async (draftId, updates) => {
  try {
    const draftRef = doc(db, 'admin_emails', draftId);
    await updateDoc(draftRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating draft:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send draft email
 * @param {string} draftId - Draft email ID
 * @returns {Object} - { success, error }
 */
export const sendDraftEmail = async (draftId) => {
  try {
    const draftRef = doc(db, 'admin_emails', draftId);
    await updateDoc(draftRef, {
      isDraft: false,
      isSent: true,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending draft:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all emails as read
 * @returns {Object} - { success, error }
 */
export const markAllAsRead = async () => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'admin_emails'),
        where('isRead', '==', false)
      )
    );

    const promises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        isRead: true,
        updatedAt: serverTimestamp()
      })
    );

    await Promise.all(promises);
    return { success: true, count: promises.length };
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sent emails (outgoing emails from admin)
 * @param {number} limit - Max results
 * @returns {Object} - { success, emails, error }
 */
export const getSentEmails = async (limit = 100) => {
  try {
    const q = query(
      collection(db, 'admin_emails'),
      where('isSent', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const emails = [];

    snapshot.forEach(doc => {
      const email = doc.data();
      emails.push({
        id: doc.id,
        ...email,
        createdAt: email.createdAt?.toDate?.() || new Date(),
        snoozeUntil: email.snoozeUntil?.toDate?.() || null
      });
    });

    return { success: true, emails: emails.slice(0, limit) };
  } catch (error) {
    console.error('Error getting sent emails:', error);
    return { success: false, emails: [], error: error.message };
  }
};

/**
 * Sanitize and prepare HTML email content for display
 * @param {string} htmlContent - Raw HTML content
 * @returns {Object} - { html, isTemplate, templateType }
 */
export const sanitizeEmailContent = (htmlContent) => {
  if (!htmlContent) return { html: '<p>No content</p>', isTemplate: false };

  // Check if it's a template (contains template variables)
  const isTemplate = /{{.*?}}/g.test(htmlContent);
  
  // Create a temporary div to sanitize
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Remove scripts and iframes
  const scripts = tempDiv.querySelectorAll('script, iframe, object, embed');
  scripts.forEach(script => script.remove());

  // Remove dangerous attributes
  const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onchange', 'onsubmit'];
  tempDiv.querySelectorAll('*').forEach(el => {
    dangerousAttrs.forEach(attr => el.removeAttribute(attr));
  });

  return {
    html: tempDiv.innerHTML,
    isTemplate: isTemplate,
    templateType: detectTemplateType(htmlContent)
  };
};

/**
 * Detect email template type from content
 * @param {string} htmlContent - HTML content
 * @returns {string} - Template type
 */
export const detectTemplateType = (htmlContent) => {
  const content = htmlContent.toLowerCase();
  
  if (content.includes('order') && content.includes('confirmation')) return 'orderConfirmation';
  if (content.includes('order') && content.includes('status')) return 'orderStatus';
  if (content.includes('order') && content.includes('shipped')) return 'orderShipped';
  if (content.includes('vendor') && content.includes('application')) return 'vendorApplication';
  if (content.includes('password') && content.includes('reset')) return 'passwordReset';
  if (content.includes('email') && content.includes('verification')) return 'emailVerification';
  if (content.includes('welcome')) return 'welcome';
  if (content.includes('notification')) return 'notification';
  
  return 'general';
};

/**
 * Extract plain text preview from HTML
 * @param {string} htmlContent - HTML content
 * @returns {string} - Plain text preview (first 100 chars)
 */
export const extractTextPreview = (htmlContent) => {
  if (!htmlContent) return 'No preview available';
  
  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, '');
  // Remove extra whitespace
  const clean = text.replace(/\s+/g, ' ').trim();
  // Return first 100 characters
  return clean.substring(0, 100) + (clean.length > 100 ? '...' : '');
};
