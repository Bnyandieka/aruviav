// src/services/firebase/bookingHelpers.js

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';

const BOOKINGS_COLLECTION = 'service_bookings';

/**
 * Create a new booking
 */
export const createBooking = async (bookingData) => {
  try {
    const booking = {
      ...bookingData,
      status: 'pending', // pending, accepted, rescheduled, completed, cancelled
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), booking);
    return { id: docRef.id, ...booking };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
};

/**
 * Get all bookings for a specific service
 */
export const getServiceBookings = async (serviceId) => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('serviceId', '==', serviceId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const bookings = [];

    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching service bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
};

/**
 * Get all bookings for a vendor (all their services)
 */
export const getVendorBookings = async (vendorId) => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const bookings = [];

    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
};

/**
 * Get all bookings for a customer
 */
export const getCustomerBookings = async (customerId) => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const bookings = [];

    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
};

/**
 * Get a single booking by ID
 */
export const getBooking = async (bookingId) => {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw new Error('Failed to fetch booking');
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId, status, details = {}) => {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      status,
      ...details,
      updatedAt: serverTimestamp(),
    });

    return { id: bookingId, status, ...details };
  } catch (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking');
  }
};

/**
 * Accept a booking
 */
export const acceptBooking = async (bookingId, vendorNotes = '') => {
  try {
    return await updateBookingStatus(bookingId, 'accepted', {
      acceptedAt: serverTimestamp(),
      vendorNotes,
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    throw new Error('Failed to accept booking');
  }
};

/**
 * Reschedule a booking
 */
export const rescheduleBooking = async (bookingId, newDate, newTime, reason = '') => {
  try {
    return await updateBookingStatus(bookingId, 'rescheduled', {
      originalDate: new Date(), // Store original date
      rescheduleDate: newDate,
      rescheduleTime: newTime,
      rescheduleReason: reason,
      rescheduledAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw new Error('Failed to reschedule booking');
  }
};

/**
 * Reject/Cancel a booking
 */
export const cancelBooking = async (bookingId, reason = '') => {
  try {
    return await updateBookingStatus(bookingId, 'cancelled', {
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw new Error('Failed to cancel booking');
  }
};

/**
 * Complete a booking
 */
export const completeBooking = async (bookingId) => {
  try {
    return await updateBookingStatus(bookingId, 'completed', {
      completedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    throw new Error('Failed to complete booking');
  }
};

/**
 * Subscribe to vendor bookings in real-time
 */
export const subscribeToVendorBookings = (vendorId, callback) => {
  try {    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = [];
        snapshot.forEach((doc) => {
          bookings.push({
            id: doc.id,
            ...doc.data(),
          });
        });        callback(bookings);
      },
      (error) => {
        console.error('❌ subscribeToVendorBookings: Subscription error:', error);
        // Still call callback with empty array on error to prevent infinite loading
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ subscribeToVendorBookings: Setup error:', error);
    // Return a function that calls callback with empty array
    setTimeout(() => callback([]), 0);
    return () => {};
  }
};

/**
 * Subscribe to customer bookings in real-time
 */
export const subscribeToCustomerBookings = (customerId, callback) => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookings = [];
      snapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(bookings);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to customer bookings:', error);
    return () => {};
  }
};

/**
 * Get booking statistics for a vendor
 */
export const getVendorBookingStats = async (vendorId) => {
  try {
    const bookings = await getVendorBookings(vendorId);

    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      accepted: bookings.filter(b => b.status === 'accepted').length,
      rescheduled: bookings.filter(b => b.status === 'rescheduled').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting booking stats:', error);
    return null;
  }
};
