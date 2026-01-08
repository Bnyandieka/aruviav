// src/components/products/ProductCard/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiEye, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useNotifications } from '../../../context/NotificationContext';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addNotification } = useNotifications();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [portfolioIndex, setPortfolioIndex] = useState(0);

  // Calculate discount percentage
  const discountPercent = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login to add items to wishlist'
      });
      return;
    }
    setIsWishlisted(!isWishlisted);
    // TODO: Add Firebase wishlist functionality
  };

  // Handle add to cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock <= 0) {
      addNotification({
        type: 'error',
        title: 'Out of Stock',
        message: 'Product is out of stock'
      });
      return;
    }
    
    // Add product to cart
    addToCart(product);
    setAddedToCart(true);
    
    // Reset the added state after 2 seconds
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Get first image or fallback
  const productImage = imageError || !product.image 
    ? 'https://via.placeholder.com/400x400?text=No+Image'
    : (Array.isArray(product.images) && product.images.length > 0 
        ? product.images[0] 
        : product.image);

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 group/image">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            -{discountPercent}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            Out of Stock
          </div>
        )}

        {/* Product Image */}
        <div className="aspect-square relative">
          <img 
            src={productImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Portfolio Album - Slides in on Hover */}
        {product.images && product.images.length > 1 && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 translate-x-full group-hover/image:translate-x-0 transition-transform duration-500 ease-out flex items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-between px-2">
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setPortfolioIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
                }}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all z-20"
              >
                <FiChevronLeft size={20} />
              </button>

              {/* Portfolio Image */}
              <div className="flex-1 h-full flex items-center justify-center px-2">
                <img
                  src={product.images[portfolioIndex]}
                  alt={`Portfolio ${portfolioIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setPortfolioIndex((prev) => (prev + 1) % product.images.length);
                }}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all z-20"
              >
                <FiChevronRight size={20} />
              </button>

              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {portfolioIndex + 1} / {product.images.length}
              </div>
            </div>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover/image:opacity-100 z-10">
          <button
            onClick={handleWishlistToggle}
            className="bg-white text-gray-800 p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
            title="Add to Wishlist"
          >
            <FiHeart className={isWishlisted ? 'fill-current text-red-500' : ''} />
          </button>
          
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className={`p-3 rounded-full transition-all transform hover:scale-110 ${
                addedToCart
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-800 hover:bg-orange-500 hover:text-white'
              }`}
              title="Add to Cart"
            >
              <FiShoppingCart />
            </button>
          )}

          <button
            onClick={() => window.location.href = `/product/${product.id}`}
            className="bg-white text-gray-800 p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
            title="Quick View"
          >
            <FiEye />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2 text-gray-800 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-orange-500 font-bold text-lg">
              KSh {product.price?.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-400 text-sm line-through">
                KSh {product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-xs text-orange-600 mt-1">
              Only {product.stock} left in stock!
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;