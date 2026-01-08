# Portfolio Upload Feature - Implementation Guide

## Overview

Added a complete portfolio image upload system to the "Sell Service" page, allowing service providers to showcase their work with up to 5 high-quality images.

## Features

✅ **Multi-file Upload** - Upload up to 5 images at once  
✅ **Progress Tracking** - Visual progress bars for each upload  
✅ **Image Preview** - Grid view of all uploaded images  
✅ **Quick Delete** - Remove images before posting service  
✅ **File Validation** - Only images, max 5MB per file  
✅ **Drag & Drop Ready** - Support for future drag-drop feature  
✅ **Firebase Storage** - Secure cloud storage for images  
✅ **Gallery Display** - Beautiful portfolio gallery on service detail page  

## Components Created

### 1. PortfolioUpload Component
**File**: [src/components/services/PortfolioUpload/PortfolioUpload.jsx](src/components/services/PortfolioUpload/PortfolioUpload.jsx)

Features:
- Multi-file selection
- Upload progress tracking
- Image preview grid
- Individual image removal
- File validation (type & size)

Usage:
```jsx
<PortfolioUpload
  images={formData.images}
  onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
  maxImages={5}
/>
```

### 2. Firebase Storage Helpers
**File**: [src/services/firebase/storageHelpers.js](src/services/firebase/storageHelpers.js)

Functions:
- `uploadServiceImage(file, onProgress)` - Upload service images
- `deleteServiceImage(imageUrl)` - Delete from storage
- `uploadProductImage(file, onProgress)` - Upload product images
- `uploadProfilePicture(file, userId)` - Upload profile pictures
- `uploadBannerImage(file, onProgress)` - Upload banner images

### 3. Portfolio Upload Styles
**File**: [src/styles/PortfolioUpload.css](src/styles/PortfolioUpload.css)

Includes:
- Upload area with drag-drop styling
- Progress bars for uploads
- Image grid layout
- Responsive design
- Hover effects

## Updated Files

### SellServicePage
[src/pages/SellServicePage.jsx](src/pages/SellServicePage.jsx)

Changes:
- Imported PortfolioUpload component
- Added images array to formData
- Updated handleSubmit to include images
- Added portfolio upload section in form

### ServiceDetailsPage
[src/pages/ServiceDetailsPage.jsx](src/pages/ServiceDetailsPage.jsx)

Changes:
- Display portfolio gallery when images exist
- Fallback to gradient placeholder if no images
- Responsive image grid (2 col layout)
- Main image with 4 smaller thumbnails

## How It Works

### Upload Flow

1. **User Selects Images**
   ```
   User clicks upload area → File dialog opens → Select up to 5 images
   ```

2. **Validation**
   ```
   Check: File type is image ✓
   Check: File size < 5MB ✓
   Check: Total images ≤ 5 ✓
   ```

3. **Upload to Firebase Storage**
   ```
   File uploaded to: storage/services/{timestamp}_{random}_{filename}
   Progress tracked in real-time
   Download URL returned
   ```

4. **Store in Firestore**
   ```
   When posting service, images array saved:
   {
     images: [
       { url: "https://...", name: "image1.jpg" },
       { url: "https://...", name: "image2.jpg" }
     ]
   }
   ```

5. **Display in Gallery**
   ```
   Service detail page shows portfolio
   First image as main, others as thumbnails
   ```

## Setup Required

### 1. Firebase Storage Rules

Update your Firebase Storage rules to allow uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Service images - authenticated users
    match /services/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Product images
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Profile pictures
    match /profiles/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Banners
    match /banners/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Default - deny all
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Service Document Structure

Ensure service documents now include images:

```javascript
{
  id: "service123",
  name: "Web Design",
  category: "design",
  price: 5000,
  duration: "daily",
  description: "Professional web design...",
  images: [
    { 
      url: "https://...", 
      name: "portfolio1.jpg" 
    },
    { 
      url: "https://...", 
      name: "portfolio2.jpg" 
    }
  ],
  sellerName: "John Doe",
  sellerEmail: "john@email.com",
  // ... other fields
}
```

## Usage

### For Service Providers

1. **Navigate to "Sell Service" page**
   - Click "Sell Service" in menu
   - Or go to `/sell-service`

2. **Fill Service Details**
   - Service name
   - Category
   - Description
   - Price
   - Duration

3. **Upload Portfolio Images**
   - Click upload area or select files
   - Wait for upload to complete
   - View images in preview grid
   - Remove any unwanted images

4. **Publish Service**
   - Click "Publish Service"
   - Service saved with images
   - Portfolio displayed on service page

### For Customers

1. **View Service**
   - Navigate to service detail page
   - See portfolio gallery at top
   - Large main image with 4 thumbnails

2. **Browse Portfolio**
   - Click thumbnails to see different images
   - Hover effects for interactivity

## Code Examples

### Upload Service with Images

```javascript
import { createService } from '../services/firebase/firestoreHelpers';

const handlePublishService = async (formData) => {
  const serviceData = {
    name: formData.name,
    category: formData.category,
    price: formData.price,
    description: formData.description,
    images: formData.images.map(img => ({
      url: img.url,
      name: img.name
    })),
    // ... other fields
  };

  await createService(serviceData, userId);
};
```

### Handle Image Upload Progress

```javascript
import { uploadServiceImage } from '../services/firebase/storageHelpers';

const handleUpload = async (file) => {
  const url = await uploadServiceImage(file, (progress) => {
    console.log(`Upload: ${progress}%`);
    setProgressBar(progress);
  });
  
  return url;
};
```

### Delete an Image

```javascript
import { deleteServiceImage } from '../services/firebase/storageHelpers';

const handleRemoveImage = async (imageUrl) => {
  await deleteServiceImage(imageUrl);
  setImages(images.filter(img => img.url !== imageUrl));
};
```

## Customization

### Change Max Images

Edit `SellServicePage.jsx`:
```jsx
<PortfolioUpload
  maxImages={10}  // Change from 5 to 10
  // ...
/>
```

### Change Upload Size Limit

Edit `PortfolioUpload.jsx`:
```javascript
if (file.size > 10 * 1024 * 1024) {  // Change from 5MB to 10MB
  toast.error(`${file.name} is larger than 10MB`);
}
```

### Style the Gallery

Edit `ServiceDetailsPage.jsx`:
```jsx
<img
  src={service.images[0].url}
  alt={service.name}
  className="w-full h-96 object-cover rounded-xl shadow-lg"  // Customize
/>
```

## Troubleshooting

### Images Not Uploading

**Problem**: "Failed to upload image"

**Solutions**:
1. Check Firebase Storage rules are configured
2. Verify user is authenticated
3. Check file size is < 5MB
4. Ensure file is valid image format
5. Check browser console for errors

### Images Not Displaying

**Problem**: Images uploaded but not showing in gallery

**Solutions**:
1. Verify images array is saved in Firestore
2. Check Firebase Storage URLs are correct
3. Verify CORS is not blocking images
4. Clear browser cache and reload

### Upload Progress Not Showing

**Problem**: Progress bars not visible

**Solutions**:
1. Check CSS file is imported
2. Verify uploadServiceImage returns progress updates
3. Check uploadProgress state is updating

### Delete Not Working

**Problem**: Can't delete images from storage

**Solutions**:
1. Check Firebase Storage rules allow delete
2. Verify image URL is correctly formatted
3. Check user has permission to delete
4. Check browser console for errors

## Performance Tips

1. **Optimize Images Before Upload**
   - Compress images to < 1MB each
   - Use modern formats (WebP, JPEG)
   - Resize to max 2000x2000 pixels

2. **Limit File Types**
   - Only JPG, PNG, WebP, GIF
   - Reject other formats

3. **Cache Images**
   - Browser caches images automatically
   - CDN can cache Firebase URLs

4. **Lazy Load**
   - Load thumbnails first
   - Load full images on demand

## Future Enhancements

1. **Drag & Drop Upload**
   - Implement drag-drop into upload area
   - Visual feedback on drag-over

2. **Image Cropping**
   - Built-in image editor
   - Before upload adjustments

3. **Image Filtering**
   - Apply filters/effects
   - Aspect ratio adjustment

4. **Reorder Images**
   - Drag to reorder portfolio
   - Pin favorite image

5. **Batch Upload**
   - Upload entire folders
   - Select multiple galleries

6. **Image Compression**
   - Auto-compress before upload
   - Reduce file sizes

## Support

For issues:
1. Check Firebase configuration
2. Verify Storage rules in console
3. Check browser console for errors
4. Review this documentation
5. Check Firestore data structure
