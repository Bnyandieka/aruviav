// src/pages/admin/SeedData.jsx
import React, { useState } from 'react';
import { FiDatabase, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { seedAllData, seedCategories, seedProducts } from '../../utils/seedData';

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeedAll = async () => {
    if (!window.confirm('This will add sample data to your database. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const result = await seedAllData();
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedCategories = async () => {
    if (!window.confirm('This will add sample categories to your database. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const result = await seedCategories();
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedProducts = async () => {
    if (!window.confirm('This will add sample products to your database. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const result = await seedProducts();
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FiDatabase className="text-4xl text-orange-500" />
              <div>
                <h1 className="text-3xl font-bold">Database Seeding</h1>
                <p className="text-gray-600">Populate your Firestore with sample data</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-yellow-400 text-xl mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Warning</p>
                  <p className="text-yellow-700 text-sm">
                    This will add sample categories and products to your database. 
                    Only use this once on a fresh database.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSeedAll}
                disabled={loading}
                className="w-full bg-orange-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <FiDatabase />
                    Seed All Data (Categories + Products)
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSeedCategories}
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seed Categories Only
                </button>
                <button
                  onClick={handleSeedProducts}
                  disabled={loading}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seed Products Only
                </button>
              </div>
            </div>

            {result && (
              <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <FiCheck className="text-green-600 text-xl mt-0.5 flex-shrink-0" />
                  ) : (
                    <FiAlertCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? 'Success!' : 'Error'}
                    </p>
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message || result.error}
                    </p>
                    {result.success && (
                      <p className="text-sm text-green-600 mt-2">
                        You can now go to the home page to see the products!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">What will be added?</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• 6 Product Categories (Electronics, Fashion, Home & Garden, etc.)</li>
              <li>• 18+ Sample Products with images, prices, and descriptions</li>
              <li>• Products include ratings, stock levels, and discount information</li>
              <li>• All products are properly categorized and ready to display</li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> After seeding, you can view your data in the Firebase Console under 
                Firestore Database → Collections → products/categories
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedData;