import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { listenToVendorProducts } from '../../../services/vendor/vendorService';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import AddProductModal from '../AddProductModal';
import { toast } from 'react-toastify';
import './VendorProducts.css';

export default function VendorProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user) {      // Set up real-time listener for products
      const unsubscribe = listenToVendorProducts(user.uid, (updatedProducts) => {        setProducts(updatedProducts);
      });

      // Cleanup listener on unmount
      return () => {        unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  useEffect(() => {  }, [products]);

  const handleRefresh = () => {    toast.info('Products are updating in real-time. Last sync just now.');
  };

  const filterProducts = () => {
    const filtered = products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingId(productId);
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success('✅ Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleProductSaved = () => {  };

  return (
    <div className="vendor-products-container">
      <div className="products-header">
        <h2>My Products</h2>
        <button className="btn-add-product" onClick={handleAddProduct}>
          <FiPlus /> Add New Product
        </button>
      </div>

      <div className="products-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {loading && !products.length ? (
        <div className="loading-state">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>
            {products.length === 0
              ? '📭 You have not added any products yet. Click "Add New Product" to get started!'
              : '🔍 No products match your search'}
          </p>
          {products.length === 0 && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              <p>Total products in state: {products.length}</p>
              <p>Filtered products: {filteredProducts.length}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="products-grid">
            {filteredProducts.map(product => {              return (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>

                  <div className="product-details">
                    <div className="detail-row">
                      <span className="label">Price:</span>
                      <span className="value">KES {product.price?.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Stock:</span>
                      <span className="value">{product.stock || 0} units</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Sold:</span>
                      <span className="value">{product.sold || 0} units</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Rating:</span>
                      <span className="value">⭐ {(product.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="product-actions">
                  <button
                    className="btn-action btn-edit"
                    onClick={() => handleEditProduct(product)}
                    title="Edit product"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={deletingId === product.id}
                    title="Delete product"
                  >
                    <FiTrash2 /> {deletingId === product.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
            })}
          </div>

          <div className="products-summary">
            <div className="summary-card">
              <span className="label">Total Products:</span>
              <span className="value">{products.length}</span>
            </div>
            <div className="summary-card">
              <span className="label">Total Stock:</span>
              <span className="value">{products.reduce((sum, p) => sum + (p.stock || 0), 0)}</span>
            </div>
            <div className="summary-card">
              <span className="label">Total Sold:</span>
              <span className="value">{products.reduce((sum, p) => sum + (p.sold || 0), 0)}</span>
            </div>
          </div>
        </>
      )}

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        onProductAdded={handleProductSaved}
        editingProduct={editingProduct}
      />
    </div>
  );
}
