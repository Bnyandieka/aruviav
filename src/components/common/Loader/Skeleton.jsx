import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="bg-gray-200 h-48 rounded mb-3"></div>
      <div className="bg-gray-200 h-4 rounded mb-2"></div>
      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
    </div>
  );
};

export default SkeletonCard;