import React from 'react';

export const WishlistPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Your wishlist is empty</p>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
