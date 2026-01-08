import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaUser } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ServiceCard = ({ service }) => {
  const navigate = useNavigate();
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    navigate(`/service/${service.id}`);
  };

  const getDurationLabel = (duration) => {
    const labels = {
      hourly: '/hr',
      daily: '/day',
      'one-time': 'One-time'
    };
    return labels[duration] || '/hr';
  };

  // Get portfolio images or fallback
  const portfolioImages = service.images && service.images.length > 0 
    ? service.images.map(img => typeof img === 'string' ? img : img.url)
    : null;

  const currentImage = portfolioImages 
    ? portfolioImages[portfolioIndex]
    : null;

  const handlePrevious = (e) => {
    e.stopPropagation();
    if (portfolioImages) {
      setPortfolioIndex((prev) => (prev - 1 + portfolioImages.length) % portfolioImages.length);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (portfolioImages) {
      setPortfolioIndex((prev) => (prev + 1) % portfolioImages.length);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col h-full"
    >
      {/* Service Image / Portfolio */}
      <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 h-40 flex items-center justify-center text-white text-center p-4 overflow-hidden group">
        {currentImage && !imageError ? (
          <>
            <img
              src={currentImage}
              alt={`${service.name} portfolio`}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            
            {/* Portfolio Navigation */}
            {portfolioImages && portfolioImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition opacity-0 group-hover:opacity-100 z-10"
                >
                  <FiChevronLeft size={16} />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition opacity-0 group-hover:opacity-100 z-10"
                >
                  <FiChevronRight size={16} />
                </button>

                {/* Counter */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-semibold">
                  {portfolioIndex + 1}/{portfolioImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div>
            <FaClock className="text-4xl mx-auto mb-2" />
            <p className="text-sm font-semibold">{service.category}</p>
          </div>
        )}
      </div>

      {/* Service Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-800 line-clamp-2 mb-2">
          {service.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {service.description}
        </p>

        {/* Seller Info */}
        <div className="flex items-center text-sm text-gray-700 mb-3 pb-3 border-b border-gray-200">
          <FaUser className="text-gray-400 mr-2" />
          <span className="truncate">{service.sellerName || 'Service Provider'}</span>
        </div>

        {/* Price and Duration */}
        <div className="mb-3">
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-lg font-bold text-orange-600">
            KES {service.price?.toLocaleString()}
            <span className="text-sm text-gray-600 font-normal">
              {' '}{getDurationLabel(service.duration)}
            </span>
          </p>
        </div>

        {/* Rating - Below listing */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          {service.rating > 0 ? (
            <div className="flex items-center text-sm">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} size={14} fill={i < Math.round(service.rating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="text-gray-600 ml-2">
                {service.rating.toFixed(1)} ({service.reviewCount || 0} reviews)
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No ratings yet</p>
          )}
        </div>

        {/* View Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/service/${service.id}`);
          }}
          className="w-full mt-3 bg-orange-500 text-white px-3 py-2 rounded text-xs font-semibold hover:bg-orange-600 transition"
        >
          View
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
