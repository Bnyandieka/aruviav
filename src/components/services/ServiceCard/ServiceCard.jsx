import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaUser } from 'react-icons/fa';

const ServiceCard = ({ service }) => {
  const navigate = useNavigate();

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

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Service Image */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 h-40 flex items-center justify-center text-white text-center p-4">
        <div>
          <FaClock className="text-4xl mx-auto mb-2" />
          <p className="text-sm font-semibold">{service.category}</p>
        </div>
      </div>

      {/* Service Info */}
      <div className="p-4">
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

        {/* Rating */}
        {service.rating > 0 && (
          <div className="flex items-center mb-3 text-sm">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} size={14} fill={i < Math.round(service.rating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="text-gray-600 ml-2">
              {service.rating.toFixed(1)} ({service.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Price and Duration */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-lg font-bold text-orange-600">
              KES {service.price?.toLocaleString()}
              <span className="text-sm text-gray-600 font-normal">
                {' '}{getDurationLabel(service.duration)}
              </span>
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/service/${service.id}`);
            }}
            className="bg-orange-500 text-white px-3 py-2 rounded text-xs font-semibold hover:bg-orange-600 transition"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
