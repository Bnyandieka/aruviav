// src/services/cloudinary/upload.js
import axios from 'axios';

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Upload single image to Cloudinary
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );

    return {
      success: true,
      data: {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        width: response.data.width,
        height: response.data.height
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (files) => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImage(file));
    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    return {
      success: failedUploads.length === 0,
      data: successfulUploads.map(r => r.data),
      failed: failedUploads.length,
      total: files.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to upload images'
    };
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    // Note: Deleting images requires authentication from backend
    // This is a placeholder - implement backend API endpoint for deletion
    return {
      success: true,
      message: 'Image deletion should be handled by backend'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get optimized image URL
export const getOptimizedImageUrl = (url, options = {}) => {
  const {
    width = 'auto',
    quality = 'auto',
    format = 'auto'
  } = options;

  // Extract public ID from Cloudinary URL
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = `w_${width},q_${quality},f_${format}`;
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
};

// Generate thumbnail URL
export const getThumbnailUrl = (url, size = 200) => {
  return getOptimizedImageUrl(url, {
    width: size,
    quality: 'auto',
    format: 'auto'
  });
};