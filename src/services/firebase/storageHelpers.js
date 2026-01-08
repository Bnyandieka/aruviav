// src/services/firebase/storageHelpers.js
import axios from 'axios';

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a service image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export const uploadServiceImage = async (file, onProgress = null) => {
  try {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary credentials not configured. Check .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'services_portfolio');    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(Math.round(progress));
          }
        }
      }
    );    return response.data.secure_url;
  } catch (error) {
    console.error('❌ Error uploading service image:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};

/**
 * Delete a service image from Cloudinary
 * @param {string} imageUrl - The download URL of the image to delete
 */
export const deleteServiceImage = async (imageUrl) => {
  try {
    // For Cloudinary, deletion requires the public_id and API key
    // For now, we'll just log that deletion would happen server-side  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - continue if deletion fails
  }
};


