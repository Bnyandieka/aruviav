import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import ProductsPage from '../pages/ProductsPage';
import ProductDetailsPage from '../pages/ProductDetailsPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrderSuccessPage from '../pages/OrderSuccessPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ProfilePage from '../pages/ProfilePage';
import OrdersPage from '../pages/OrdersPage';
import WishlistPage from '../pages/WishlistPage';
import NotFoundPage from '../pages/NotFoundPage';
import TermsAndConditionsPage from '../pages/TermsAndConditionsPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import EmailVerificationPage from '../pages/EmailVerificationPage';

// Admin Pages
import SeedData from '../pages/admin/SeedData';

// Protected Route
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/terms" element={<TermsAndConditionsPage />} />
      <Route path="/auth/action" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      
      {/* Admin Routes - Add these */}
      <Route path="/seed-data" element={<SeedData />} />
      <Route path="/admin/seed" element={<SeedData />} />
      
      {/* Protected Routes - Require email verification for checkout/orders */}
      <Route path="/cart" element={<ProtectedRoute requireEmailVerification={false}><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute requireEmailVerification={true}><CheckoutPage /></ProtectedRoute>} />
      <Route path="/order-success" element={<ProtectedRoute requireEmailVerification={true}><OrderSuccessPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requireEmailVerification={false}><ProfilePage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute requireEmailVerification={true}><OrdersPage /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute requireEmailVerification={false}><WishlistPage /></ProtectedRoute>} />
      
      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;