import React, { useState } from 'react';
import { FiSettings, FiMail, FiUsers, FiShoppingCart, FiInbox } from 'react-icons/fi';
import { useLogoSettings } from '../../../hooks/useLogoSettings';
import { uploadToCloudinary } from '../../../services/cloudinary/upload';
import EmailTemplateEditor from '../EmailTemplateEditor/EmailTemplateEditor';
import NewsletterSubscribers from '../Newsletter/NewsletterSubscribers';
import VendorApplications from '../vendor/VendorApplications';
import AdminEmailInbox from '../AdminEmailInbox/AdminEmailInbox';
import './AdminSettings.css';

const AdminSettings = () => {
  const { logo, updateLogo } = useLogoSettings();
  const [logoPreview, setLogoPreview] = useState(logo);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'email', 'newsletter', or 'vendors'

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file, 'aruviah_logo');
      
      // Update Firestore
      const result = await updateLogo(cloudinaryUrl);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update logo');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-settings-container">
      {/* Settings Tabs */}
      <div className="settings-tabs-wrapper">
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
            title="Branding"
          >
            <FiSettings size={18} />
            <span className="tab-label">Branding</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'emails-inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('emails-inbox')}
            title="Email Inbox"
          >
            <FiInbox size={18} />
            <span className="tab-label">Email Inbox</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
            title="Email Templates"
          >
            <FiMail size={18} />
            <span className="tab-label">Email Templ</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'newsletter' ? 'active' : ''}`}
            onClick={() => setActiveTab('newsletter')}
            title="Newsletter"
          >
            <FiUsers size={18} />
            <span className="tab-label">Newsletter</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendors')}
            title="Vendor Applications"
          >
            <FiShoppingCart size={18} />
            <span className="tab-label">Vendor Apps</span>
          </button>
        </div>
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="settings-card">
          <div className="settings-header">
            <h2 className="settings-title"><FiSettings size={24} style={{marginRight: '12px', display: 'inline'}} /> Branding Settings</h2>
            <p className="settings-subtitle">Manage your store's logo and branding</p>
          </div>

          <div className="logo-section">
            <h3 className="section-title">Store Logo</h3>
            <p className="section-description">Upload a logo that will appear in your navbar and emails (PNG, JPG, recommended 200x80px)</p>

            {/* Logo Preview */}
            <div className="logo-preview-container">
              <div className="logo-preview">
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="logo-image"
                    onError={() => setLogoPreview('/logo.png')}
                  />
                )}
              </div>
              <p className="preview-label">Current Logo</p>
            </div>

            {/* File Upload */}
            <div className="upload-section">
              <label className="upload-label">
                <div className="upload-box">
                  <div className="upload-icon">📤</div>
                  <p className="upload-text">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="upload-hint">PNG, JPG, GIF (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="upload-input"
                />
              </label>
            </div>

            {/* Messages */}
            {success && (
              <div className="alert alert-success">
                ✅ Logo updated successfully! Changes will appear across your store.
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                ❌ {error}
              </div>
            )}

            {uploading && (
              <div className="loading-bar">
                <div className="progress"></div>
              </div>
            )}

            {/* Info */}
            <div className="info-box">
              <h4>ℹ️ Where your logo appears:</h4>
              <ul>
                <li>✓ Website navbar (top left)</li>
                <li>✓ Welcome emails</li>
                <li>✓ Order confirmation emails</li>
                <li>✓ Shipping notification emails</li>
                <li>✓ All transactional emails</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Email Inbox Tab */}
      {activeTab === 'emails-inbox' && (
        <AdminEmailInbox />
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <EmailTemplateEditor />
      )}

      {/* Newsletter Subscribers Tab */}
      {activeTab === 'newsletter' && (
        <NewsletterSubscribers />
      )}

      {/* Vendor Applications Tab */}
      {activeTab === 'vendors' && (
        <VendorApplications />
      )}
    </div>
  );
};

export default AdminSettings;
