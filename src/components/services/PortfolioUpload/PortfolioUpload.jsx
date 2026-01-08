import React, { useState } from 'react';
import { FiUpload, FiX, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { uploadServiceImage } from '../../../services/firebase/storageHelpers';
import '../../../styles/PortfolioUpload.css';

const PortfolioUpload = ({ images = [], onImagesChange, maxImages = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      for (let file of files) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 5MB`);
          continue;
        }        // Upload file
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        const url = await uploadServiceImage(
          file,
          (progress) => {            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        );        // Add to images array
        onImagesChange([
          ...images,
          {
            id: Date.now() + Math.random(),
            url,
            name: file.name
          }
        ]);

        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress({});
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (image) => {
    try {
      // Remove from array
      onImagesChange(images.filter(img => img.id !== image.id));
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="portfolio-upload">
      <label className="block text-sm font-semibold mb-3">
        Portfolio Images
        <span className="text-gray-600 font-normal ml-2">({images.length}/{maxImages})</span>
      </label>

      {/* Upload Area */}
      <div className="upload-area mb-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxImages}
          className="hidden"
          id="portfolio-input"
        />
        <label
          htmlFor="portfolio-input"
          className={`upload-label ${uploading ? 'uploading' : ''} ${
            images.length >= maxImages ? 'disabled' : ''
          }`}
        >
          <div className="upload-content">
            {uploading ? (
              <>
                <FiLoader className="upload-icon spinning" size={32} />
                <p>Uploading...</p>
              </>
            ) : (
              <>
                <FiUpload className="upload-icon" size={32} />
                <p className="font-semibold">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-600">PNG, JPG, GIF up to 5MB</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="progress-list mb-4">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="progress-item">
              <p className="text-sm font-medium text-gray-700">{name}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-gray-600">{Math.round(progress)}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="images-grid">
          {images.map((image, index) => (
            <div key={image.id} className="image-card">
              <div className="image-wrapper">
                <img src={image.url} alt={`Portfolio ${index + 1}`} className="image" />
                <div className="image-overlay">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image)}
                    className="remove-btn"
                    title="Remove image"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>
              <p className="image-label text-xs text-center text-gray-600 mt-2 truncate">
                {image.name || `Image ${index + 1}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Upload clear, high-quality photos of your work. Images should show your best work
          or relevant portfolio pieces. Good images help attract more customers!
        </p>
      </div>
    </div>
  );
};

export default PortfolioUpload;
