// src/pages/admin/FlashSalesAdmin.jsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiClock, FiStar } from 'react-icons/fi';
import {
  createAutoFlashSale,
  createManualFlashSale,
  getFlashSaleEligibleProducts,
  getAllFlashSales,
  updateFlashSale,
  endFlashSale,
  deleteFlashSale,
  getFlashSaleStats
} from '../../services/firebase/flashSalesHelper';
import { useNotifications } from '../../context/NotificationContext';
import Loader from '../../components/common/Loader/Spinner';

export const FlashSalesAdmin = () => {
  const { addNotification } = useNotifications();
  const [flashSales, setFlashSales] = useState([]);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 24
  });

  // Load flash sales and eligible products
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes, statsRes] = await Promise.all([
        getAllFlashSales(),
        getFlashSaleEligibleProducts(),
        getFlashSaleStats()
      ]);

      setFlashSales(salesRes.flashSales);
      setEligibleProducts(productsRes.products);
      setStats(statsRes.stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutoFlashSale = async () => {
    try {
      setLoading(true);
      const result = await createAutoFlashSale(formData.name || 'Auto Flash Sale', 10);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Flash sale created with ${result.productCount} products!`
        });
        setFormData({ name: '', description: '', duration: 24 });
        setShowForm(false);
        loadData();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualFlashSale = async () => {
    if (selectedProducts.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please select at least one product'
      });
      return;
    }

    try {
      setLoading(true);
      const result = await createManualFlashSale(
        formData.name,
        formData.description,
        selectedProducts,
        formData.duration
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Flash sale created with ${selectedProducts.length} products!`
        });
        setFormData({ name: '', description: '', duration: 24 });
        setSelectedProducts([]);
        setShowForm(false);
        loadData();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndFlashSale = async (flashSaleId) => {
    if (window.confirm('Are you sure you want to end this flash sale?')) {
      try {
        const result = await endFlashSale(flashSaleId);
        if (result.success) {
          loadData();
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message
        });
      }
    }
  };

  const handleDeleteFlashSale = async (flashSaleId) => {
    if (window.confirm('Are you sure you want to delete this flash sale?')) {
      try {
        const result = await deleteFlashSale(flashSaleId);
        if (result.success) {
          loadData();
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message
        });
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading && flashSales.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flash Sales Management</h1>
          <p className="text-gray-600 mt-1">Create and manage flash sales with AI algorithm</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMode('auto');
            setSelectedProducts([]);
          }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <FiPlus /> New Flash Sale
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Eligible Products</p>
            <p className="text-3xl font-bold text-orange-600">{stats.eligibleProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Flash Sales</p>
            <p className="text-3xl font-bold text-blue-600">{stats.activeFlashSales}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Products in Sales</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalProductsInSales}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Est. Savings</p>
            <p className="text-3xl font-bold text-purple-600">KSh {(stats.totalEstimatedSavings / 1000).toFixed(0)}K</p>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Create Flash Sale</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="mb-6 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'auto'}
                onChange={() => setMode('auto')}
              />
              <span className="font-semibold">🤖 Automatic (AI Algorithm)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'manual'}
                onChange={() => setMode('manual')}
              />
              <span className="font-semibold">✋ Manual Selection</span>
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Flash Sale Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={mode === 'auto' ? 'Leave blank for default' : 'e.g., Weekend Mega Sale'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>

            {mode === 'manual' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Flash sale description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (hours)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min="1"
                    max="168"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Product Selection (Manual Mode) */}
          {mode === 'manual' && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">
                Select Products ({selectedProducts.length} selected)
              </h3>
              <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
                <div className="space-y-2">
                  {eligibleProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <div className="flex gap-3 text-sm text-gray-600">
                          <span>⭐ {product.rating || 'N/A'}</span>
                          <span>📦 {product.stock} stock</span>
                          <span className="text-green-600 font-semibold">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Algorithm Info (Auto Mode) */}
          {mode === 'auto' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🤖 Algorithm Criteria</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Minimum 20+ items in stock</li>
                <li>✅ Rating 4+ stars</li>
                <li>✅ 20%+ discount</li>
                <li>✅ Popular categories prioritized</li>
                <li>✅ High review count preferred</li>
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={
                mode === 'auto'
                  ? handleCreateAutoFlashSale
                  : handleCreateManualFlashSale
              }
              disabled={loading}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Flash Sale'}
            </button>
          </div>
        </div>
      )}

      {/* Flash Sales List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Active Flash Sales</h2>
        {flashSales.filter(fs => fs.isActive).length > 0 ? (
          <div className="space-y-4">
            {flashSales
              .filter(fs => fs.isActive)
              .map((flashSale) => (
                <div
                  key={flashSale.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{flashSale.name}</h3>
                      <p className="text-gray-600">{flashSale.description}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <FiClock size={16} />
                          {flashSale.productIds?.length || 0} products
                        </span>
                        <span className="text-orange-600 font-semibold">
                          Source: {flashSale.source === 'automatic' ? '🤖 Automatic' : '✋ Manual'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEndFlashSale(flashSale.id)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                      >
                        End Sale
                      </button>
                      <button
                        onClick={() => handleDeleteFlashSale(flashSale.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Products Grid */}
                  {flashSale.products && flashSale.products.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                      {flashSale.products.slice(0, 5).map((product) => (
                        <div key={product.id} className="bg-gray-50 rounded p-2 text-center text-sm">
                          <p className="font-semibold truncate">{product.name}</p>
                          <p className="text-green-600 font-bold">{product.discount}% OFF</p>
                          <p className="text-gray-600">KSh {product.price?.toLocaleString()}</p>
                        </div>
                      ))}
                      {flashSale.products.length > 5 && (
                        <div className="bg-gray-50 rounded p-2 flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            +{flashSale.products.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No active flash sales. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Ended Flash Sales */}
      {flashSales.filter(fs => !fs.isActive).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Ended Flash Sales</h2>
          <div className="space-y-2">
            {flashSales
              .filter(fs => !fs.isActive)
              .slice(0, 5)
              .map((flashSale) => (
                <div key={flashSale.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{flashSale.name}</p>
                    <p className="text-sm text-gray-600">{flashSale.productIds?.length || 0} products</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFlashSale(flashSale.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSalesAdmin;
