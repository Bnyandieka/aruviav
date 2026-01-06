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
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import ProductCard from '../components/products/ProductCard/ProductCard';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

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

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        setLoadingReviews(true);
        const reviewsRef = collection(db, 'products', id, 'reviews');
        const q = query(reviewsRef);
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

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

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login to write a review',
      });
      navigate('/login');
      return;
    }

    if (!reviewForm.title || !reviewForm.comment) {
      addNotification({
        type: 'error',
        title: 'Invalid Review',
        message: 'Please fill in all review fields',
      });
      return;
    }

    try {
      // Create review object
      const newReview = {
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || user?.email || 'Anonymous',
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        createdAt: new Date().toISOString(),
        helpful: 0,
        notHelpful: 0,
      };

      // Save review to Firebase subcollection
      const reviewsRef = collection(db, 'products', id, 'reviews');
      await addDoc(reviewsRef, newReview);
      
      // Update product rating and review count
      const productRef = doc(db, 'products', id);
      const productSnap = await getDoc(productRef);
      const currentData = productSnap.data();
      const currentReviews = currentData?.reviewCount || 0;
      const currentRating = currentData?.rating || 0;
      
      const newReviewCount = currentReviews + 1;
      const newRating = ((currentRating * currentReviews) + reviewForm.rating) / newReviewCount;
      
      await updateDoc(productRef, {
        reviewCount: newReviewCount,
        rating: parseFloat(newRating.toFixed(1)),
      });

      console.log('Review submitted and saved:', newReview);
      
      addNotification({
        type: 'success',
        title: 'Review Submitted',
        message: 'Thank you for your review!',
      });
      
      // Reset form and close modal
      setShowReviewModal(false);
      setReviewForm({
        rating: 5,
        title: '',
        comment: ''
      });

      // Refresh product data to show updated rating
      const updatedProductSnap = await getDoc(productRef);
      setProduct({ id: updatedProductSnap.id, ...updatedProductSnap.data() });
    } catch (error) {
      console.error('Error submitting review:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to submit review',
      });
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full px-3 sm:px-4 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm mb-4 sm:mb-6 flex-wrap">
          <Link to="/" className="text-gray-600 hover:text-orange-500">Home</Link>
          <FiChevronRight className="text-gray-400" size={16} />
          <Link to="/products" className="text-gray-600 hover:text-orange-500">Products</Link>
          <FiChevronRight className="text-gray-400" size={16} />
          <Link to={`/products?category=${product.category}`} className="text-gray-600 hover:text-orange-500 capitalize">
            {product.category}
          </Link>
          <FiChevronRight className="text-gray-400" size={16} />
          <span className="text-gray-800 truncate text-xs sm:text-sm">{product.name}</span>
        </div>

        {/* Product Main Section - Single Column Jumia Style */}
        <div className="w-full mb-0">
          {/* Full Width: Image Gallery on Top */}
          <div className="space-y-0">
            {/* Main Image - Full Width */}
            <div className="bg-white overflow-hidden relative w-full">
              {discountPercent > 0 && (
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-orange-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded z-10">
                  -{discountPercent}% OFF
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-red-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded z-10">
                  Out of Stock
                </div>
              )}
              <div className="aspect-square w-full">
                <img
                  src={imageError ? 'https://via.placeholder.com/600x600?text=Image+Error' : productImages[selectedImage]}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnail Images - Horizontal Scroll */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 px-3 sm:px-4 bg-gray-50">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageError(false);
                    }}
                    className={`flex-shrink-0 w-16 sm:w-20 h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === index
                        ? 'border-orange-500'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="w-full h-full">
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

          {/* Product Info Card - Full Width Below Image */}
          <div className="bg-white p-4 sm:p-6 w-full border-b">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 leading-tight">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-4 sm:w-5 h-4 sm:h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-xs sm:text-sm">
                  ({product.reviewCount || 0} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-4 border-b pb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-orange-500">
                  KSh {product.price?.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg sm:text-xl text-gray-400 line-through">
                    KSh {product.originalPrice?.toLocaleString()}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <p className="text-green-600 font-semibold text-xs sm:text-sm">
                  You save KSh {(product.originalPrice - product.price).toLocaleString()} ({discountPercent}%)
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {product.stock > 0 ? (
                <div>
                  <p className="text-green-600 font-semibold text-sm">In Stock</p>
                  {product.stock <= 10 && (
                    <p className="text-orange-600 text-xs">
                      Only {product.stock} items left
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-red-600 font-semibold text-sm">Out of Stock</p>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium mb-2">Quantity:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                    <button
                      onClick={() => handleQuantityChange('decrease')}
                      className="p-2 hover:bg-gray-100 transition"
                      disabled={quantity <= 1}
                    >
                      <FiMinus size={14} className={quantity <= 1 ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                    <span className="px-4 sm:px-6 font-semibold text-xs sm:text-sm">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange('increase')}
                      className="p-2 hover:bg-gray-100 transition"
                      disabled={quantity >= product.stock}
                    >
                      <FiPlus size={14} className={quantity >= product.stock ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600">
                    ({product.stock} available)
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mb-5">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-orange-500 text-white py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FiShoppingCart size={18} />
                Add to Cart
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWishlistToggle}
                  className={`py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'border border-orange-500 text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <FiHeart size={16} className={isWishlisted ? 'fill-current' : ''} />
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
                
                <button
                  onClick={handleShare}
                  className="border border-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <FiShare2 size={16} />
                  Share
                </button>
              </div>
            </div>

            {/* Shipping & Returns Info */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-start gap-3 text-xs">
                <FiTruck className="text-orange-500 flex-shrink-0 mt-1" size={16} />
                <div>
                  <p className="font-semibold">Free Delivery</p>
                  <p className="text-gray-600">For orders over KSh 5,000</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-xs">
                <FiRefreshCw className="text-orange-500 flex-shrink-0 mt-1" size={16} />
                <div>
                  <p className="font-semibold">Easy Returns</p>
                  <p className="text-gray-600">7-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="bg-white p-4 sm:p-6 mb-8 sm:mb-12 border-b">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Product Details</h2>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line mb-4">
            {product.description || 'No description available for this product.'}
          </p>
          
          {/* Brand Info */}
          {product.brand && (
            <div className="pt-4 border-t">
              <p className="text-xs sm:text-sm"><span className="font-semibold">Brand:</span> {product.brand}</p>
            </div>
          )}
        </div>

        {/* Specifications */}
        {product.specifications && (
          <div className="bg-white p-4 sm:p-6 mb-8 sm:mb-12 border-b">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Specifications</h2>
            <div className="space-y-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b text-xs sm:text-sm">
                  <span className="font-semibold text-gray-700">{key}:</span>
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white p-4 sm:p-6 mb-8 sm:mb-12 border-b">
          <h2 className="text-lg sm:text-xl font-bold mb-6">Customer Reviews</h2>
          
          {/* Review Summary */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="text-4xl font-bold text-orange-500">
                  {product.rating?.toFixed(1) || 'N/A'}
                </div>
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {product.reviewCount || 0} reviews
                </p>
              </div>
              
              {/* Rating Breakdown */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-12">{stars} stars</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{width: `${Math.random() * 100}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Write Review Button */}
          <button 
            onClick={() => setShowReviewModal(true)}
            className="mb-8 px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition text-sm sm:text-base"
          >
            Write a Review
          </button>

          {/* Reviews List */}
          <div className="space-y-6">
            {loadingReviews ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <>
                {/* Display actual reviews from database */}
                {reviews.slice(0, 5).map((review) => {
                  const reviewDate = new Date(review.createdAt);
                  const daysAgo = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
                  const timeAgo = daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

                  return (
                    <div key={review.id} className="pb-6 border-b last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm sm:text-base">{review.userName}</p>
                          <p className="text-xs text-gray-500">Verified Buyer • {timeAgo}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold mb-2">{review.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">{review.comment}</p>
                      <div className="flex gap-4 text-xs">
                        <button className="text-orange-500 hover:underline">
                          👍 Helpful ({review.helpful || 0})
                        </button>
                        <button className="text-orange-500 hover:underline">
                          👎 Not Helpful ({review.notHelpful || 0})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>

          {reviews.length > 5 && (
            <div className="mt-6 text-center">
              <button className="text-orange-500 hover:text-orange-600 font-semibold text-sm">
                Load More Reviews ({reviews.length - 5} more)
              </button>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Related Products</h2>
              <Link 
                to={`/products?category=${product.category}`}
                className="text-orange-500 hover:underline font-semibold text-xs sm:text-sm"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold">Write a Review</h3>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="p-4 sm:p-6 space-y-4">
                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className="focus:outline-none"
                      >
                        <FiStar
                          size={28}
                          className={`cursor-pointer transition ${
                            star <= reviewForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Review Title *</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                    placeholder="E.g., Great product!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Review *</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    placeholder="Share your experience with this product..."
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold text-sm"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;