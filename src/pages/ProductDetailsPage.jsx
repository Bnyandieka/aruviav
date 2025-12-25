// src/pages/ProductDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiHeart, 
  FiShoppingCart, 
  FiMinus, 
  FiPlus, 
  FiTruck, 
  FiRefreshCw, 
  FiShield,
  FiStar,
  FiChevronRight,
  FiShare2
} from 'react-icons/fi';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import ProductCard from '../components/products/ProductCard/ProductCard';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addNotification } = useNotifications();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [imageError, setImageError] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          setProduct(productData);
          
          // Fetch related products
          await fetchRelatedProducts(productData.category);
        } else {
          console.error('Product not found');
          navigate('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Fetch related products
  const fetchRelatedProducts = async (category) => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef, 
        where('category', '==', category),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const related = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.id !== id);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  // Handle quantity changes
  const handleQuantityChange = (type) => {
    if (type === 'increase' && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login to add items to wishlist',
      });
      return;
    }
    setIsWishlisted(!isWishlisted);
    // TODO: Implement Firebase wishlist
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (product.stock === 0) {
      addNotification({
        type: 'error',
        title: 'Out of Stock',
        message: 'Product is out of stock',
      });
      return;
    }
    // Add the product to cart with the selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    addNotification({
      type: 'success',
      title: 'Added to Cart',
      message: `Added ${quantity} ${product.name} to cart!`,
    });
  };

  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        addNotification({
          type: 'success',
          title: 'Copied',
          message: 'Link copied to clipboard!',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get product images
  const productImages = product?.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product?.image 
    ? [product.image]
    : ['https://via.placeholder.com/600x600?text=No+Image'];

  // Calculate discount
  const discountPercent = product?.originalPrice && product?.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Link to="/products" className="text-orange-500 hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link to="/" className="text-gray-600 hover:text-orange-500">Home</Link>
          <FiChevronRight className="text-gray-400" />
          <Link to="/products" className="text-gray-600 hover:text-orange-500">Products</Link>
          <FiChevronRight className="text-gray-400" />
          <Link to={`/products?category=${product.category}`} className="text-gray-600 hover:text-orange-500 capitalize">
            {product.category}
          </Link>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-800 truncate">{product.name}</span>
        </div>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md relative">
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded z-10">
                  -{discountPercent}% OFF
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded z-10">
                  Out of Stock
                </div>
              )}
              <div className="aspect-square">
                <img
                  src={imageError ? 'https://via.placeholder.com/600x600?text=Image+Error' : productImages[selectedImage]}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageError(false);
                    }}
                    className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-orange-500 shadow-md' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="aspect-square">
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
            <h1 className="text-2xl lg:text-3xl font-bold mb-4">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating} ({product.reviewCount || 0} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-orange-500">
                  KSh {product.price?.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-gray-400 line-through">
                    KSh {product.originalPrice?.toLocaleString()}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <p className="text-green-600 font-semibold">
                  You save KSh {(product.originalPrice - product.price).toLocaleString()} ({discountPercent}%)
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <div>
                  <p className="text-green-600 font-semibold mb-1">In Stock</p>
                  {product.stock <= 10 && (
                    <p className="text-orange-600 text-sm">
                      Only {product.stock} items left - Order soon!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-red-600 font-semibold">Out of Stock</p>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange('decrease')}
                      className="p-3 hover:bg-gray-100 transition"
                      disabled={quantity <= 1}
                    >
                      <FiMinus className={quantity <= 1 ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                    <span className="px-6 font-semibold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange('increase')}
                      className="p-3 hover:bg-gray-100 transition"
                      disabled={quantity >= product.stock}
                    >
                      <FiPlus className={quantity >= product.stock ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.stock} available)
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FiShoppingCart />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWishlistToggle}
                  className={`py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'border-2 border-orange-500 text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <FiHeart className={isWishlisted ? 'fill-current' : ''} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
                
                <button
                  onClick={handleShare}
                  className="border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <FiShare2 />
                  Share
                </button>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center gap-3 text-sm">
                <FiTruck className="text-orange-500 text-xl flex-shrink-0" />
                <div>
                  <p className="font-semibold">Free Delivery</p>
                  <p className="text-gray-600">For orders over KSh 5,000</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <FiRefreshCw className="text-orange-500 text-xl flex-shrink-0" />
                <div>
                  <p className="font-semibold">Easy Returns</p>
                  <p className="text-gray-600">7-day return policy</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <FiShield className="text-orange-500 text-xl flex-shrink-0" />
                <div>
                  <p className="font-semibold">Secure Payment</p>
                  <p className="text-gray-600">100% secure transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-12">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition ${
                  activeTab === 'description'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition ${
                  activeTab === 'specifications'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition ${
                  activeTab === 'reviews'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                Reviews ({product.reviewCount || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Product Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Product Specifications</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 font-semibold text-gray-700">Category</td>
                      <td className="py-3 text-gray-600 capitalize">{product.category}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-semibold text-gray-700">Stock</td>
                      <td className="py-3 text-gray-600">{product.stock} units</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-semibold text-gray-700">Rating</td>
                      <td className="py-3 text-gray-600">{product.rating || 'N/A'} / 5.0</td>
                    </tr>
                    {/* Add more specifications as needed */}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>
                <div className="text-center py-12 text-gray-500">
                  <p>No reviews yet. Be the first to review this product!</p>
                  <button className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
                    Write a Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Related Products</h2>
              <Link 
                to={`/products?category=${product.category}`}
                className="text-orange-500 hover:underline font-semibold"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;