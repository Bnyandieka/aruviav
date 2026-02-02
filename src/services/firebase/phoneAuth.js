// src/services/firebase/phoneAuth.js

import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './config';

let recaptchaVerifier = null;

/**
 * Initialize reCAPTCHA verifier for phone authentication
 * Must be called before sendPhoneOTP
 */
export const initRecaptchaVerifier = (containerId = 'recaptcha-container') => {
  try {
    // Check if already initialized
    if (recaptchaVerifier) {
      return recaptchaVerifier;
    }

    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
      const error = `❌ reCAPTCHA container not found: #${containerId}\n` +
        'Make sure this div exists in public/index.html:\n' +
        `<div id="${containerId}" style="display: none;"></div>`;
      console.error(error);
      throw new Error(`reCAPTCHA container "${containerId}" not found in DOM`);
    }
    recaptchaVerifier = new RecaptchaVerifier(containerId, {
      'size': 'invisible',
      'callback': (response) => {
      },
      'expired-callback': () => {
        console.warn('⚠️ reCAPTCHA expired, clearing verifier');
        recaptchaVerifier = null;
      },
      'error-callback': () => {
        console.error('❌ reCAPTCHA error occurred');
        recaptchaVerifier = null;
      }
    }, auth);
    return recaptchaVerifier;
  } catch (error) {
    console.error('❌ Failed to initialize reCAPTCHA:', error);
    console.error('Error details:', error.message);
    recaptchaVerifier = null;
    throw new Error(`reCAPTCHA initialization failed: ${error.message}`);
  }
};

/**
 * Clear reCAPTCHA verifier
 */
export const clearRecaptchaVerifier = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +254712345678)
 * @returns {Promise<string>} - Confirmation result
 */
export const sendPhoneOTP = async (phoneNumber) => {
  try {
    // Initialize reCAPTCHA if not already done
    if (!recaptchaVerifier) {
      initRecaptchaVerifier();
    }
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    // Clear reCAPTCHA on error so it can be retried
    clearRecaptchaVerifier();

    // Handle specific errors
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please use format like +254712345678');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('Too many OTP requests. Please try again later.');
    } else if (error.code === 'auth/missing-recaptcha-token') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
      throw new Error('Phone authentication is not available. Please check your Firebase configuration.');
    } else if (error.message?.includes('reCAPTCHA')) {
      throw new Error('reCAPTCHA verification failed. Please refresh and try again.');
    }

    throw new Error(error.message || 'Failed to send OTP');
  }
};

/**
 * Verify OTP code and complete phone authentication
 * @param {object} confirmationResult - Result from sendPhoneOTP
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} - User credential
 */
export const verifyPhoneOTP = async (confirmationResult, otp) => {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    const user = userCredential.user;
    // Clear reCAPTCHA after successful verification
    clearRecaptchaVerifier();

    return user;
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP code has expired. Please request a new one.');
    }

    throw new Error(error.message || 'Failed to verify OTP');
  }
};

/**
 * Complete phone signup - Create user profile in Firestore
 * @param {object} user - Firebase user object
 * @param {string} displayName - User display name
 * @returns {Promise<object>} - User data
 */
export const completePhoneSignup = async (user, displayName) => {
  try {
    // Check if user already exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Check if this is the first user (only if creating new user)
    let isFirstUser = false;
    if (!userDocSnap.exists()) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const snapshot = await getDocs(q);
      isFirstUser = snapshot.empty;
    }

    let userData = {
      uid: user.uid,
      displayName: displayName,
      phoneNumber: user.phoneNumber,
      createdAt: serverTimestamp(),
      photoURL: user.photoURL || null,
      isAdmin: isFirstUser ? true : false,
      verified: false,
      phoneVerified: true,
      signupMethod: 'phone',
      role: isFirstUser ? 'admin' : 'customer',
      email: user.email || null,
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
        newsletter: true,
        productUpdates: true,
        promotionalEmails: false,
      }
    };

    // Only create if doesn't exist, or update if it does
    if (!userDocSnap.exists()) {
      try {
        await setDoc(userDocRef, userData);
      } catch (err) {
        console.error('Failed to create phone user document:', err);
        throw new Error('Failed to create user profile: ' + (err.message || err));
      }
    } else {
      // Update existing user with phone info if signing in
      userData = {
        ...userDocSnap.data(),
        phoneNumber: user.phoneNumber,
        phoneVerified: true
      };
      try {
        await setDoc(userDocRef, userData, { merge: true });
      } catch (err) {
        console.error('Failed to update phone user document:', err);
        throw new Error('Failed to update user profile: ' + (err.message || err));
      }
    }
    return userData;
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

/**
 * Check if phone number exists in Firestore
 * @param {string} phoneNumber - Phone number to check
 * @returns {Promise<boolean>} - true if exists, false otherwise
 */
export const checkPhoneNumberExists = async (phoneNumber) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking phone number:', error);
    return false;
  }
};

/**
 * Format phone number to international format
 * @param {string} phoneNumber - Raw phone number
 * @param {string} countryCode - Country code (default: +254 for Kenya)
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber, countryCode = '+254') => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If starts with 0, remove it and add country code
  if (digits.startsWith('0')) {
    return countryCode + digits.substring(1);
  }

  // If already has country code (without +), add +
  if (digits.startsWith(countryCode.replace('+', ''))) {
    return countryCode + digits.substring(countryCode.length - 1);
  }

  // If no country code, add it
  if (!digits.startsWith(countryCode.replace('+', ''))) {
    return countryCode + digits;
  }

  return countryCode + digits;
};

export default {
  initRecaptchaVerifier,
  clearRecaptchaVerifier,
  sendPhoneOTP,
  verifyPhoneOTP,
  completePhoneSignup,
  checkPhoneNumberExists,
  formatPhoneNumber
};
