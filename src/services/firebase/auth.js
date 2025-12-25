// src/services/firebase/auth.js

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Sign up with email and password
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: displayName
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      photoURL: user.photoURL || null,
      role: 'customer', // default role
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Send email verification
    await sendEmailVerification(user);

    return { user, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, error: error.message };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    let errorMessage = 'Failed to sign in';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later';
    }
    
    return { user: null, error: errorMessage };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists, if not create it
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    let errorMessage = 'Failed to sign in with Google';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign in cancelled';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up blocked. Please allow pop-ups and try again';
    }
    
    return { user: null, error: errorMessage };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error.message };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    let errorMessage = 'Failed to send reset email';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { error: errorMessage };
  }
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Also update Firebase Auth profile if display name or photo changed
    if (data.displayName || data.photoURL) {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName || auth.currentUser.displayName,
        photoURL: data.photoURL || auth.currentUser.photoURL,
      });
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }
};

// Change password
export const changeUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    return { error: null };
  } catch (error) {
    console.error('Error changing password:', error);
    let errorMessage = 'Failed to change password';
    
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak';
    }
    
    return { error: errorMessage };
  }
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null };
    } else {
      return { data: null, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { data: null, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Send email verification
export const sendVerificationEmail = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
    return { error: null };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { error: error.message };
  }
};

// Verify password reset code
export const verifyResetCode = async (code) => {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return { email, error: null };
  } catch (error) {
    console.error('Error verifying reset code:', error);
    let errorMessage = 'Failed to verify reset code';
    
    if (error.code === 'auth/expired-action-code') {
      errorMessage = 'Password reset link has expired. Please request a new one.';
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'Invalid reset link. Please request a new password reset.';
    }
    
    return { email: null, error: errorMessage };
  }
};

// Confirm password reset with code
export const confirmReset = async (code, newPassword) => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return { error: null };
  } catch (error) {
    console.error('Error confirming password reset:', error);
    let errorMessage = 'Failed to reset password';
    
    if (error.code === 'auth/expired-action-code') {
      errorMessage = 'Password reset link has expired. Please request a new one.';
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'Invalid reset link. Please request a new password reset.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.';
    }
    
    return { error: errorMessage };
  }
};

export default {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  updateUserProfile,
  changeUserPassword,
  getUserData,
  onAuthStateChange,
  sendVerificationEmail,
  verifyResetCode,
  confirmReset,
};