import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { CATEGORIES } from '../../utils/constants';
import { FiX } from 'react-icons/fi';
import ProductImageUpload from '../admin/Products/ProductImageUpload';
import { toast } from 'react-toastify';
import './AddProductModal.css';

export default function AddProductModal({ isOpen, onClose, onProductAdded, editingProduct = null }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    images: '',
    rating: '4.5',
    reviewCount: '0',
    featured: false,
    discount: ''
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.price || '',
        originalPrice: editingProduct.originalPrice || '',
        category: editingProduct.category || '',
        stock: editingProduct.stock || '',
        images: (editingProduct.images || []).join(','),
        rating: editingProduct.rating || '4.5',
        reviewCount: editingProduct.reviewCount || '0',
        featured: editingProduct.featured || false,
        discount: editingProduct.discount || ''
      });
    } else {
      resetForm();
    }
  }, [editingProduct, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      stock: '',
      images: '',
      rating: '4.5',
      reviewCount: '0',
      featured: false,
      discount: ''
    });
  };

  const handleImageUpload = (uploadedUrls) => {
    if (!uploadedUrls || uploadedUrls.length === 0) return;

    // Add uploaded URLs to existing images
    const currentUrls = formData.images ? formData.images.split(',').filter(u => u.trim()) : [];
    const allUrls = [...currentUrls, ...uploadedUrls];
    setFormData({ ...formData, images: allUrls.join(', ') });
    toast.success(`✅ ${uploadedUrls.length} image(s) uploaded successfully!`);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.price) {
      toast.error('Price is required');
      return;
    }
    if (!formData.stock) {
      toast.error('Stock quantity is required');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price),
        category: formData.category,
        categoryId: formData.category,
        stock: parseInt(formData.stock),
        images: formData.images
          .split(',')
          .map(url => url.trim())
          .filter(url => url),
        image: formData.images
          .split(',')[0]
          ?.trim() || '',
        rating: parseFloat(formData.rating) || 4.5,
        reviewCount: parseInt(formData.reviewCount) || 0,
        featured: formData.featured,
        discount: parseInt(formData.discount) || 0,
        keywords: formData.name.toLowerCase().split(' '),
        vendorId: user.uid,
        vendorEmail: user.email,
        updatedAt: new Date().toISOString(),
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        sold: editingProduct?.sold || 0
      };      if (editingProduct) {
        // Update existing product
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);        toast.success('✅ Product updated successfully!');
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, 'products'), productData);        toast.success('✅ Product added successfully!');
      }

      resetForm();
      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Original Price</label>
              <input
                type="number"
                name="originalPrice"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <input
                type="number"
                name="rating"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Review Count</label>
              <input
                type="number"
                name="reviewCount"
                value={formData.reviewCount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Image Upload</label>
            <ProductImageUpload 
              onImagesUpload={handleImageUpload}
              initialImages={formData.images ? formData.images.split(',').map(u => u.trim()).filter(u => u) : []}
              maxImages={5}
              title="Product Images"
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              Mark as Featured Product
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
