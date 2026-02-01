// src/App.jsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout Components
import Header from './components/common/Header/Header';
import Footer from './components/common/Footer/Footer';

// Pages
import Home from './pages/Home';
import { ProductsPage } from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { NotFoundPage } from './pages/NotFoundPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import SeedDataPage from './pages/SeedDataPage';
import ServicesPage from './pages/ServicesPage';
import SellServicePage from './pages/SellServicePage';
import EditServicePage from './pages/EditServicePage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Vendor Pages
import VendorSignupPage from './pages/VendorSignupPage';
import VendorDashboard from './components/vendor/VendorDashboard/VendorDashboard';

// Protected Route Component
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// Notification Components
import NotificationContainer from './components/common/NotificationContainer';

// Global Styles
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <ThemeProvider>
              <div className="App min-h-screen flex flex-col">
              {/* Notification Container */}
              <NotificationContainer />

              {/* Toast Notifications */}
              <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailsPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/service/:id" element={<ServiceDetailsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/seed-data" element={<SeedDataPage />} />
                <Route path="/vendor-signup" element={<VendorSignupPage />} />

                {/* Checkout - Can be accessed by guests */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />

                {/* Service Routes - Require Authentication for Selling */}
                <Route
                  path="/sell-service"
                  element={
                    <ProtectedRoute>
                      <SellServicePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditServicePage />
                    </ProtectedRoute>
                  }
                />

                {/* Vendor Routes - Require Authentication */}
                <Route
                  path="/vendor/dashboard"
                  element={
                    <ProtectedRoute>
                      <VendorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Require Authentication */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <WishlistPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes - Require Admin Role */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />
              </div>
            </ThemeProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;