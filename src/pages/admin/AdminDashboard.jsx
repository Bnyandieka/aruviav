// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase/config';
import { FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi';
import { CATEGORIES } from '../../utils/constants';
import CategoryDropdown from '../../components/admin/CategoryDropdown';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsRef = collection(db, 'products');
      const productsSnap = await getDocs(productsRef);
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Fetch categories
      const categoriesRef = collection(db, 'categories');
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = categoriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

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
    setEditingProduct(null);
    setShowForm(false);
  };

  // Handle image file upload to Firebase Storage
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is 5MB`);
          continue;
        }

        // Create unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        const fileName = `products/${timestamp}_${randomStr}_${file.name}`;
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      }

      // Add uploaded URLs to existing images
      if (uploadedUrls.length > 0) {
        const currentUrls = formData.images ? formData.images.split(',').filter(u => u.trim()) : [];
        const allUrls = [...currentUrls, ...uploadedUrls];
        setFormData({ ...formData, images: allUrls.join(', ') });
        alert(`Successfully uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      category: product.category || '',
      stock: product.stock || '',
      images: Array.isArray(product.images) ? product.images.join(', ') : (product.image || ''),
      rating: product.rating || '4.5',
      reviewCount: product.reviewCount || '0',
      featured: product.featured || false,
      discount: product.discount || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price || !formData.stock) {
      alert('Please fill in all required fields (Name, Price, Stock)');
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
        images: formData.images.split(',').map(url => url.trim()).filter(url => url),
        image: formData.images.split(',')[0]?.trim() || '',
        rating: parseFloat(formData.rating) || 4.5,
        reviewCount: parseInt(formData.reviewCount) || 0,
        featured: formData.featured,
        discount: parseInt(formData.discount) || 0,
        keywords: formData.name.toLowerCase().split(' '),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        // Update existing product
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
        alert('Product updated successfully!');
      } else {
        // Add new product
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
        alert('Product added successfully!');
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      alert('Product deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your products and inventory</p>
            </div>
            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                showForm
                  ? 'bg-gray-500 text-white hover:bg-gray-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {showForm ? 'Cancel' : '+ Add Product'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm">Total Products</div>
            <div className="text-3xl font-bold text-orange-500">{products.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm">Categories</div>
            <div className="text-3xl font-bold text-blue-500">{categories.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm">In Stock</div>
            <div className="text-3xl font-bold text-green-500">
              {products.filter(p => p.stock > 0).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm">Low Stock</div>
            <div className="text-3xl font-bold text-red-500">
              {products.filter(p => p.stock < 10 && p.stock > 0).length}
            </div>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="Samsung Galaxy S23"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <CategoryDropdown 
                    value={formData.category}
                    onChange={handleInputChange}
                    required={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Detailed product description..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price (KES) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="89999"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Original Price (KES)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="119999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="25"
                  />
                </div>
              </div>

              {/* Multiple Image URLs with Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Images *
                </label>
                
                {/* Display current images */}
                {formData.images && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {formData.images.split(',').filter(url => url.trim()).map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url.trim()}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x200?text=Invalid+URL';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const urls = formData.images.split(',').filter(u => u.trim());
                            urls.splice(index, 1);
                            setFormData({ ...formData, images: urls.join(', ') });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Remove image"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Methods Tabs */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="mb-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById('tabUpload').click()}
                        className="flex-1 py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <FiUpload />
                          <span className="font-medium">Upload Files</span>
                        </div>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div>
                      {/* File Upload Section */}
                      <div className="space-y-3">
                        <label
                          htmlFor="imageFileInput"
                          className="block w-full cursor-pointer"
                        >
                          <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-500 transition bg-white">
                            <FiUpload className="mx-auto text-3xl text-orange-500 mb-2" />
                            <p className="font-medium text-gray-700">
                              {uploadingImage ? 'Uploading...' : 'Click to upload images'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              or drag and drop images here
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              PNG, JPG, WEBP up to 5MB each
                            </p>
                          </div>
                          <input
                            id="imageFileInput"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e.target.files)}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>

                        {uploadingImage && (
                          <div className="flex items-center justify-center gap-2 text-orange-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                            <span className="text-sm">Uploading images...</span>
                          </div>
                        )}

                        {/* URL Input Section */}
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Or add image URL:</p>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              id="imageUrlInput"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                              placeholder="https://example.com/image.jpg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('imageUrlInput');
                                const url = input.value.trim();
                                if (url) {
                                  const currentUrls = formData.images ? formData.images.split(',').filter(u => u.trim()) : [];
                                  currentUrls.push(url);
                                  setFormData({ ...formData, images: currentUrls.join(', ') });
                                  input.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition whitespace-nowrap text-sm"
                            >
                              Add URL
                            </button>
                          </div>
                        </div>

                        {/* Bulk URL Paste */}
                        <details className="bg-white rounded-lg p-3 border">
                          <summary className="cursor-pointer text-sm font-medium text-gray-700">
                            Paste multiple URLs at once
                          </summary>
                          <textarea
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                            rows="3"
                            placeholder="https://image1.jpg, https://image2.jpg&#10;https://image3.jpg"
                            onBlur={(e) => {
                              const text = e.target.value.trim();
                              if (text) {
                                const urls = text.split(/[,\n]/).map(u => u.trim()).filter(u => u);
                                const currentUrls = formData.images ? formData.images.split(',').filter(u => u.trim()) : [];
                                const allUrls = [...new Set([...currentUrls, ...urls])];
                                setFormData({ ...formData, images: allUrls.join(', ') });
                                e.target.value = '';
                              }
                            }}
                          />
                        </details>

                        <p className="text-xs text-gray-500">
                          💡 Free images:{' '}
                          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Unsplash
                          </a>
                          {' • '}
                          <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Pexels
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden radio to make tabs work */}
              <input type="radio" id="tabUpload" name="imageTab" className="hidden" defaultChecked />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating (0-5)</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Review Count</label>
                  <input
                    type="number"
                    name="reviewCount"
                    value={formData.reviewCount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="mr-2 w-5 h-5"
                    />
                    <span className="text-sm font-medium">Featured Product</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (editingProduct ? 'Updating...' : 'Adding...') 
                  : (editingProduct ? 'Update Product' : 'Add Product')
                }
              </button>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">All Products ({products.length})</h2>
          
          {loading && products.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products yet. Add your first product!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">Rating</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || product.image || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <div className="font-semibold">{product.name}</div>
                            {product.featured && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">{product.category}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold">{formatPrice(product.price)}</div>
                        {product.discount > 0 && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          product.stock === 0 
                            ? 'bg-red-100 text-red-600' 
                            : product.stock < 10 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span>{product.rating}</span>
                          <span className="text-gray-400 text-sm">({product.reviewCount})</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            disabled={loading}
                            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
                            title="Edit Product"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={loading}
                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition disabled:opacity-50"
                            title="Delete Product"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;