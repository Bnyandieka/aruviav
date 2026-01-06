// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { FiEdit2, FiTrash2, FiX, FiUpload, FiShoppingCart, FiBarChart2, FiCheck } from 'react-icons/fi';
import { CATEGORIES } from '../../utils/constants';
import { useNotifications } from '../../context/NotificationContext';
import CategoryDropdown from '../../components/admin/CategoryDropdown';
import FinanceAnalytics from '../../components/admin/FinanceAnalytics';
import ProductImageUpload from '../../components/admin/Products/ProductImageUpload';
import AdminSettings from '../../components/admin/AdminSettings/AdminSettings';
import { updateOrderStatus } from '../../services/firebase/firestoreHelpers';
import { sendOrderStatusUpdate } from '../../services/email/emailAutomation';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [orderUpdateMessage, setOrderUpdateMessage] = useState(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
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

  // Filter members based on search term and role
  useEffect(() => {
    let filtered = members;

    // Filter by search term
    if (memberSearchTerm.trim()) {
      const searchLower = memberSearchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        member.email?.toLowerCase().includes(searchLower) ||
        member.displayName?.toLowerCase().includes(searchLower) ||
        member.uid?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by role
    if (memberRoleFilter !== 'all') {
      filtered = filtered.filter(member => (member.role || 'customer') === memberRoleFilter);
    }

    setFilteredMembers(filtered);
  }, [members, memberSearchTerm, memberRoleFilter]);

  // Filter orders based on search term, status, and date
  useEffect(() => {
    let filtered = orders;

    // Filter by search term
    if (orderSearchTerm.trim()) {
      const searchLower = orderSearchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        (order.userName && order.userName.toLowerCase().includes(searchLower)) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === orderStatusFilter);
    }

    // Filter by date
    if (orderDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(order => {
        const orderDate = order.createdAt 
          ? new Date(order.createdAt)
          : new Date(0);
        
        switch (orderDateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString();
          case 'week':
            return orderDate >= sevenDaysAgo && orderDate <= today;
          case 'month':
            return orderDate >= thirtyDaysAgo && orderDate <= today;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [orders, orderSearchTerm, orderStatusFilter, orderDateFilter]);

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

      // Fetch all members/users
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));
      
      // Sort members by creation date descending
      usersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA;
      });
      
      setMembers(usersData);

      // Set up real-time listener for orders
      const ordersRef = collection(db, 'orders');
      const unsubscribeOrders = onSnapshot(ordersRef, async (ordersSnap) => {
        const ordersData = await Promise.all(ordersSnap.docs.map(async (doc) => {
          let orderData = {
            id: doc.id,
            ...doc.data()
          };
          
          // If order doesn't have userName/userEmail, fetch from users collection
          if ((!orderData.userName || !orderData.userEmail) && orderData.userId) {
            try {
              const userRef = doc(db, 'users', orderData.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                orderData.userName = orderData.userName || userData.displayName || 'N/A';
                orderData.userEmail = orderData.userEmail || userData.email || 'N/A';
              }
            } catch (err) {
              console.warn(`Could not fetch user data for order ${doc.id}:`, err.message);
            }
          }
          
          return orderData;
        }));
        
        // Sort orders by date descending
        ordersData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
          return dateB - dateA;
        });
        
        setOrders(ordersData);
        console.log('📊 Orders updated in real-time:', ordersData.length);
      });

      // Fetch all orders once (for initial data)
      const ordersSnap = await getDocs(ordersRef);
      const ordersData = await Promise.all(ordersSnap.docs.map(async (doc) => {
        let orderData = {
          id: doc.id,
          ...doc.data()
        };
        
        // If order doesn't have userName/userEmail, fetch from users collection
        if ((!orderData.userName || !orderData.userEmail) && orderData.userId) {
          try {
            const userRef = doc(db, 'users', orderData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              orderData.userName = orderData.userName || userData.displayName || 'N/A';
              orderData.userEmail = orderData.userEmail || userData.email || 'N/A';
            }
          } catch (err) {
            console.warn(`Could not fetch user data for order ${doc.id}:`, err.message);
          }
        }
        
        return orderData;
      }));
      
      // Sort orders by date descending
      ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA;
      });
      
      setOrders(ordersData);
      
      // Return cleanup function to unsubscribe
      return unsubscribeOrders;
    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error loading data: ' + error.message
      });
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

  // Handle image upload via Cloudinary
  const handleImageUpload = (uploadedUrls) => {
    if (!uploadedUrls || uploadedUrls.length === 0) return;

    // Add uploaded URLs to existing images
    const currentUrls = formData.images ? formData.images.split(',').filter(u => u.trim()) : [];
    const allUrls = [...currentUrls, ...uploadedUrls];
    setFormData({ ...formData, images: allUrls.join(', ') });
    toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`);
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
      addNotification({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields (Name, Price, Stock)'
      });
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
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Product updated successfully!'
        });
      } else {
        // Add new product
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Product added successfully!'
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error saving product: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      // Find the order to get customer email
      const order = orders.find(o => o.id === orderId);
      
      // Send order status email to customer
      if (order && order.userEmail) {
        const emailData = {
          id: orderId,
          status: newStatus,
          trackingNumber: order.trackingNumber || null
        };
        await sendOrderStatusUpdate(order.userEmail, emailData);
      }
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      setOrderUpdateMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
    } else {
      setOrderUpdateMessage({ type: 'error', text: `Failed to update order: ${result.error}` });
    }
    
    setUpdatingOrderId(null);
    setTimeout(() => setOrderUpdateMessage(null), 3000);
  };

  const handleMemberRoleUpdate = async (memberId, newRole) => {
    setUpdatingMemberId(memberId);
    try {
      const memberRef = doc(db, 'users', memberId);
      await updateDoc(memberRef, {
        role: newRole,
        isAdmin: newRole === 'admin' ? true : false,
        updatedAt: new Date().toISOString()
      });
      
      setMembers(members.map(member =>
        member.id === memberId ? { ...member, role: newRole, isAdmin: newRole === 'admin' ? true : false } : member
      ));
      toast.success(`Member role updated to ${newRole}`);
    } catch (error) {
      toast.error('Error updating member role');
      console.error('Error:', error);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleDeleteMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to delete "${memberEmail}"? This action cannot be undone.`)) {
      return;
    }

    setUpdatingMemberId(memberId);
    try {
      await deleteDoc(doc(db, 'users', memberId));
      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member deleted successfully');
    } catch (error) {
      toast.error('Error deleting member');
      console.error('Error:', error);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleVerificationToggle = async (memberId, currentStatus) => {
    setUpdatingMemberId(memberId);
    try {
      const memberRef = doc(db, 'users', memberId);
      await updateDoc(memberRef, {
        verified: !currentStatus,
        verifiedAt: !currentStatus ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      
      setMembers(members.map(member =>
        member.id === memberId 
          ? { ...member, verified: !currentStatus, verifiedAt: !currentStatus ? new Date().toISOString() : null } 
          : member
      ));
      toast.success(`Member ${!currentStatus ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      toast.error('Error updating verification status');
      console.error('Error:', error);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Product deleted successfully!'
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error deleting product: ' + error.message
      });
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your products and inventory</p>
            </div>
            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base ${
                showForm
                  ? 'bg-gray-500 text-white hover:bg-gray-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {showForm ? 'Cancel' : '+ Add Product'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6 border-b overflow-x-auto">
          <div className="flex min-w-max sm:min-w-full">
            <button
              onClick={() => {
                setActiveTab('products');
                setShowForm(false);
              }}
              className={`py-2 sm:py-4 px-2 sm:px-6 font-semibold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === 'products'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 <span className="hidden sm:inline">Products</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 sm:py-4 px-2 sm:px-6 font-semibold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === 'orders'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiShoppingCart /> <span className="hidden sm:inline">Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 sm:py-4 px-2 sm:px-6 font-semibold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === 'members'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 <span className="hidden sm:inline">Members</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`py-2 sm:py-4 px-2 sm:px-6 font-semibold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === 'finance'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiBarChart2 /> <span className="hidden sm:inline">Finance & Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 sm:py-4 px-2 sm:px-6 font-semibold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === 'settings'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          {activeTab === 'products' ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Total Products</div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-500">{products.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Categories</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-500">{categories.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">In Stock</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-500">
                  {products.filter(p => p.stock > 0).length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Low Stock</div>
                <div className="text-2xl sm:text-3xl font-bold text-red-500">
                  {products.filter(p => p.stock < 10 && p.stock > 0).length}
                </div>
              </div>
            </>
          ) : activeTab === 'orders' ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Total Orders</div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-500">{orders.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Pending</div>
                <div className="text-2xl sm:text-3xl font-bold text-yellow-500">{orders.filter(o => o.status === 'pending').length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Processing</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-500">{orders.filter(o => o.status === 'processing').length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Completed</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-500">{orders.filter(o => o.status === 'completed').length}</div>
              </div>
            </>
          ) : activeTab === 'members' ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Total Members</div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-500">{members.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Customers</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-500">{members.filter(m => !m.role || m.role === 'customer').length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Vendors</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-500">{members.filter(m => m.role === 'vendor').length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                <div className="text-gray-600 text-xs sm:text-sm">Admins</div>
                <div className="text-2xl sm:text-3xl font-bold text-red-500">{members.filter(m => m.role === 'admin').length}</div>
              </div>
            </>
          ) : null}
        </div>

        {/* Update Message */}
        {orderUpdateMessage && activeTab === 'orders' && (
          <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 border text-sm sm:text-base ${
            orderUpdateMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {orderUpdateMessage.text}
          </div>
        )}

        {/* Products Section */}
        {activeTab === 'products' && (
          <>
            {/* Add/Edit Product Form */}
            {showForm && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                    placeholder="Samsung Galaxy S23"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Category *</label>
                  <CategoryDropdown 
                    value={formData.category}
                    onChange={handleInputChange}
                    required={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  placeholder="Detailed product description..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Price (KES) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                    placeholder="89999"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Original Price (KES)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                    placeholder="119999"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                    placeholder="50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                    placeholder="25"
                  />
                </div>
              </div>

              {/* Multiple Image URLs with Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">
                  Product Images *
                </label>
                
                {/* Display current images */}
                {formData.images && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3">
                    {formData.images.split(',').filter(url => url.trim()).map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url.trim()}
                          alt={`Product ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-lg border-2 border-gray-200"
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 bg-gray-50">
                  <div className="mb-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById('tabUpload').click()}
                        className="flex-1 py-2 px-3 sm:px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <FiUpload />
                          <span className="font-medium">Upload Files</span>
                        </div>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div>
                      {/* Cloudinary Image Upload Component */}
                      <ProductImageUpload 
                        onImagesUpload={handleImageUpload}
                        initialImages={formData.images ? formData.images.split(',').map(u => u.trim()).filter(u => u) : []}
                        maxImages={5}
                        title="Product Images (Powered by Cloudinary)"
                      />

                      {/* URL Input Section */}
                      <div className="pt-3 border-t mt-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Or add image URLs manually:</p>
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

                        {/* Bulk URL Paste */}
                        <details className="bg-white rounded-lg p-3 border mt-3">
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

                        <p className="text-xs text-gray-500 mt-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Rating (0-5)</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="5"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Review Count</label>
                  <input
                    type="number"
                    name="reviewCount"
                    value={formData.reviewCount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="mr-2 w-4 sm:w-5 h-4 sm:h-5"
                    />
                    <span className="text-xs sm:text-sm font-medium">Featured Product</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">All Products ({products.length})</h2>
          
          {loading && products.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-base sm:text-lg">No products yet. Add your first product!</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4">Product</th>
                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Category</th>
                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4">Price</th>
                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden md:table-cell">Stock</th>
                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden lg:table-cell">Rating</th>
                    <th className="text-center py-2 sm:py-3 px-3 sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <img
                            src={product.images?.[0] || product.image || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-10 sm:w-12 h-10 sm:h-12 object-cover rounded"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs sm:text-sm truncate">{product.name}</div>
                            {product.featured && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 capitalize hidden sm:table-cell">{product.category}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <div className="font-semibold text-xs sm:text-sm">{formatPrice(product.price)}</div>
                        {product.discount > 0 && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                          product.stock === 0 
                            ? 'bg-red-100 text-red-600' 
                            : product.stock < 10 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-yellow-400">★</span>
                          <span>{product.rating}</span>
                          <span className="text-gray-400 text-xs">({product.reviewCount})</span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            disabled={loading}
                            className="bg-blue-500 text-white p-1.5 sm:p-2 rounded hover:bg-blue-600 transition disabled:opacity-50 text-xs sm:text-base"
                            title="Edit Product"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={loading}
                            className="bg-red-500 text-white p-1.5 sm:p-2 rounded hover:bg-red-600 transition disabled:opacity-50 text-xs sm:text-base"
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
          </>
        )}

        {/* Orders Section */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Search and Filters */}
            <div className="p-3 sm:p-6 border-b">
              {/* Search Bar */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-semibold mb-2">Search Orders</label>
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, or Email..."
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Filter by Status</label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Filter by Date</label>
                  <select
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Clear Filters</label>
                  <button
                    onClick={() => {
                      setOrderSearchTerm('');
                      setOrderStatusFilter('all');
                      setOrderDateFilter('all');
                    }}
                    className="w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium text-sm"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-4">
                Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4">Order ID</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Invoice #</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4">Customer</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden md:table-cell">Email</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden lg:table-cell">Phone</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Date</th>
                      <th className="text-left py-3 px-4">Items</th>
                      <th className="text-left py-3 px-4">Total</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-4 px-4 font-mono text-xs text-gray-600">{order.invoiceNumber || 'N/A'}</td>
                        <td className="py-4 px-4">{order.userName || 'N/A'}</td>
                        <td className="py-4 px-4 text-sm">{order.userEmail || 'N/A'}</td>
                        <td className="py-4 px-4 text-sm">{order.userPhone || 'N/A'}</td>
                        <td className="py-4 px-4 text-sm">
                          {order.createdAt
                            ? (() => {
                                const date = order.createdAt?.toDate?.() || new Date(order.createdAt);
                                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                              })()
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-sm">{order.items?.length || 0}</td>
                        <td className="py-4 px-4 font-semibold">{formatPrice(order.total)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'shipped'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {['pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleOrderStatusUpdate(order.id, status)}
                                disabled={updatingOrderId === order.id || order.status === status}
                                className={`px-2 py-1 text-xs rounded font-medium transition ${
                                  order.status === status
                                    ? 'bg-gray-300 text-gray-600 cursor-default'
                                    : updatingOrderId === order.id
                                    ? 'bg-gray-200 text-gray-500 cursor-wait'
                                    : status === 'completed'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : status === 'processing'
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : status === 'shipped'
                                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                    : status === 'pending'
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : status === 'cancelled'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                                title={`Change to ${status}`}
                              >
                                {status.slice(0, 3).toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiShoppingCart className="mx-auto text-gray-300 text-4xl mb-3" />
                <p className="text-gray-500">
                  {orderSearchTerm ? 'No orders found matching your search' : 'No orders yet'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Finance & Analytics Section */}
        {activeTab === 'finance' && (
          <FinanceAnalytics orders={orders} products={products} />
        )}

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <AdminSettings />
        )}

        {/* Members Section */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Search and Filters */}
            <div className="p-3 sm:p-6 border-b">
              {/* Search Bar */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-semibold mb-2">Search Members</label>
                <input
                  type="text"
                  placeholder="Search by Name, Email, or ID..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Filter by Role</label>
                  <select
                    value={memberRoleFilter}
                    onChange={(e) => setMemberRoleFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div></div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Clear Filters</label>
                  <button
                    onClick={() => {
                      setMemberSearchTerm('');
                      setMemberRoleFilter('all');
                    }}
                    className="w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium text-sm"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-4">
                Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4">Member</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Email</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4">Role</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden md:table-cell">Status</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden lg:table-cell">Joined Date</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 hidden xl:table-cell">Phone</th>
                      <th className="text-center py-2 sm:py-3 px-3 sm:px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {member.photoURL ? (
                              <img
                                src={member.photoURL}
                                alt={member.displayName}
                                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center text-xs sm:text-sm font-bold text-orange-600">
                                {member.displayName?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="font-semibold text-xs sm:text-sm truncate">{member.displayName || 'Unknown'}</span>
                                {member.verified && (
                                  <div className="relative group">
                                    <FiCheck className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 bg-white rounded-full border border-blue-500 flex items-center justify-center" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                      Verified
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{member.uid.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{member.email || 'N/A'}</td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                            member.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : member.role === 'vendor'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(member.role || 'customer').charAt(0).toUpperCase() + (member.role || 'customer').slice(1)}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 hidden md:table-cell">
                          <button
                            onClick={() => handleVerificationToggle(member.id, member.verified)}
                            disabled={updatingMemberId === member.id}
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition ${
                              member.verified
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            } ${updatingMemberId === member.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                            title={member.verified ? 'Click to unverify' : 'Click to verify'}
                          >
                            {member.verified ? '✓ Verified' : '○ Unverified'}
                          </button>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm hidden xl:table-cell">{member.phone || 'N/A'}</td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <div className="flex flex-wrap gap-0.5 sm:gap-1 justify-center">
                            {['customer', 'vendor', 'admin'].map((role) => (
                              <button
                                key={role}
                                onClick={() => handleMemberRoleUpdate(member.id, role)}
                                disabled={updatingMemberId === member.id || (member.role || 'customer') === role}
                                className={`px-2 py-1 text-xs rounded font-medium transition ${
                                  (member.role || 'customer') === role
                                    ? 'bg-gray-300 text-gray-600 cursor-default'
                                    : updatingMemberId === member.id
                                    ? 'bg-gray-200 text-gray-500 cursor-wait'
                                    : role === 'admin'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : role === 'vendor'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                                title={`Change to ${role}`}
                              >
                                {role.slice(0, 3).toUpperCase()}
                              </button>
                            ))}
                            <button
                              onClick={() => handleDeleteMember(member.id, member.email)}
                              disabled={updatingMemberId === member.id}
                              className="px-2 py-1 text-xs rounded font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                              title="Delete Member"
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
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {memberSearchTerm ? 'No members found matching your search' : 'No members yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;