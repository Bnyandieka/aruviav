// src/services/cloudinary/upload.js
import axios from 'axios';

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;// Upload single image to Cloudinary
export const uploadImage = async (file) => {
  try {    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary credentials not configured. Check .env file.');
    }

    if (!file || file.size === 0) {
      throw new Error('File is empty or invalid');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // DO NOT append cloud_name - it goes in the URL only    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 seconds timeout
      }
    );    return {
      success: true,
      data: {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        width: response.data.width,
        height: response.data.height
      }
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
  }
};

// Upload with folder and custom options
export const uploadToCloudinary = async (file, folder = 'aruviah') => {
  try {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary credentials not configured. Check .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000
      }
    );

    return response.data.secure_url;
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
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