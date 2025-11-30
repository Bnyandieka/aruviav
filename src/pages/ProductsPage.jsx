import React from 'react';
import { Link } from 'react-router-dom';

export const ProductsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">All Products</h1>
        <p className="text-gray-600 mb-4">Products page - Coming soon!</p>
        <Link to="/" className="text-orange-500 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
};

export default ProductsPage;