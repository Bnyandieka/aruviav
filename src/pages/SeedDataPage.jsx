import React, { useState } from 'react';
import { seedAllData } from '../utils/seedData';
import Loader from '../components/common/Loader/Spinner';

const SeedDataPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSeedDatabase = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await seedAllData();
      
      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Seed Database
        </h1>
        
        <p className="text-gray-600 text-center mb-8">
          Click the button below to populate your Firestore database with sample categories and products.
        </p>

        {loading && <Loader />}

        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ Error: {error}
          </div>
        )}

        <button
          onClick={handleSeedDatabase}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          {loading ? 'Seeding...' : 'Seed Database'}
        </button>

        <p className="text-gray-500 text-sm text-center mt-6">
          Note: You can delete this page after seeding is complete.
        </p>
      </div>
    </div>
  );
};

export default SeedDataPage;
