// src/components/products/ProductCard/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiEye, FiStar } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculate discount percentage
  const discountPercent = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      return;
    }
    setIsWishlisted(!isWishlisted);
    // TODO: Add Firebase wishlist functionality
  };

  // Handle add to cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    // TODO: Add to cart functionality
    alert(`${product.name} added to cart!`);
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
      <div className="relative overflow-hidden bg-gray-100">
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

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
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
              className="bg-white text-gray-800 p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
              title="Add to Cart"
            >
              <FiShoppingCart />
            </button>
          )}

          <Link
            to={`/product/${product.id}`}
            className="bg-white text-gray-800 p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
            title="Quick View"
          >
            <FiEye />
          </Link>
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