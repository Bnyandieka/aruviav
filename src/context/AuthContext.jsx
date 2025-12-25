// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// Import the already initialized Firebase instances
import { auth, db } from '../services/firebase/config';
// Import email automation
import { sendAccountConfirmationEmail } from '../services/email/emailAutomation';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser?.email || 'No user');
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: displayName
      });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL || null,
        isAdmin: false,
        verified: false,
        emailVerified: false,
        signupMethod: 'email', // Track that this is email signup (not social)
        role: 'customer',
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          newsletter: true,
          productUpdates: true,
          promotionalEmails: true,
          orderUpdates: true,
          theme: 'light',
          language: 'en',
          currency: 'KES',
          privateProfile: false,
          showOnlineStatus: true,
          allowPersonalization: true,
          saveCartItems: true,
          rememberPaymentMethod: false,
          showRecommendations: true,
          frequency: 'weekly'
        },
        cart: [],
        orders: [],
        wishlist: []
      };

      await setDoc(userDocRef, userData);
      setUserData(userData);

      // Send email verification link
      try {
        await sendEmailVerification(user);
        console.log('✅ Verification email sent to:', email);
      } catch (verificationError) {
        console.error('⚠️ Error sending verification email:', verificationError);
        // Don't fail signup if email fails
      }

      // Send account confirmation email with Brevo
      try {
        await sendAccountConfirmationEmail(email, displayName);
        console.log('✅ Welcome email sent to:', email);
      } catch (emailError) {
        console.error('⚠️ Email service error (account still created):', emailError);
        // Don't fail signup if email fails
      }

      return { success: true, user, needsEmailVerification: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(userCredential.user.uid);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user document
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date().toISOString(),
          photoURL: user.photoURL,
          isAdmin: false,
          verified: false,
          role: 'customer',
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            newsletter: true,
            productUpdates: true,
            promotionalEmails: true,
            orderUpdates: true,
            theme: 'light',
            language: 'en',
            currency: 'KES',
            privateProfile: false,
            showOnlineStatus: true,
            allowPersonalization: true,
            saveCartItems: true,
            rememberPaymentMethod: false,
            showRecommendations: true,
            frequency: 'weekly'
          },
          cart: [],
          orders: [],
          wishlist: []
        };
        await setDoc(userDocRef, userData);
        setUserData(userData);

        // Send welcome email
        try {
          await sendAccountConfirmationEmail(user.email, user.displayName || 'User');
          console.log('✅ Welcome email sent to:', user.email);
        } catch (emailError) {
          console.error('⚠️ Email service error:', emailError);
        }
      } else {
        await fetchUserData(user.uid);
      }

      return { success: true, user };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userData,
    loading,
    isAuthenticated,
    isAdmin: userData?.isAdmin || false,
    signup,
    login,
    loginWithGoogle,
    logout,
    fetchUserData
  };

  console.log('AuthProvider: Rendering, loading =', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 