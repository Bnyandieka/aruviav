import React from 'react';

export const OrdersPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No orders yet</p>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
