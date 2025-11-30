import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VendorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // TODO: Check if user has vendor role from your backend
  const isVendor = user?.role === 'vendor';

  if (!user || !isVendor) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default VendorRoute;