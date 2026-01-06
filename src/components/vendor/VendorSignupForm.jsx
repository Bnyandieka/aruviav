import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { submitVendorApplication, checkPendingVendorApplication, sendApplicationReceivedNotification } from '../../services/vendor/vendorService';
import { CATEGORIES } from '../../utils/constants';
import { toast } from 'react-toastify';
import './VendorSignupForm.css';

export default function VendorSignupForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessCategory: '',
    contactPhone: '',
    businessAddress: ''
  });

  React.useEffect(() => {
    checkUserApplication();
  }, [user]);

  const checkUserApplication = async () => {
    if (!user) return;
    
    const result = await checkPendingVendorApplication(user.uid);
    if (result.hasPending) {
      setHasPendingApplication(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to apply as a vendor');
      return;
    }

    // Validation
    if (!formData.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    if (!formData.businessDescription.trim()) {
      toast.error('Business description is required');
      return;
    }

    if (!formData.businessCategory) {
      toast.error('Please select a business category');
      return;
    }

    if (!formData.contactPhone.trim()) {
      toast.error('Contact phone is required');
      return;
    }

    if (!formData.businessAddress.trim()) {
      toast.error('Business address is required');
      return;
    }

    setLoading(true);

    try {
      const result = await submitVendorApplication({
        userId: user.uid,
        email: user.email,
        businessName: formData.businessName.trim(),
        businessDescription: formData.businessDescription.trim(),
        businessCategory: formData.businessCategory,
        contactPhone: formData.contactPhone.trim(),
        businessAddress: formData.businessAddress.trim()
      });

      if (result.success) {
        // Send application received email and notification
        await sendApplicationReceivedNotification({
          userId: user.uid,
          email: user.email,
          businessName: formData.businessName.trim(),
          firstName: user.displayName || formData.businessName.trim().split(' ')[0]
        }, result.applicationId);

        setSubmitted(true);
        toast.success('✅ Application submitted! Check your email for confirmation.');
        setFormData({
          businessName: '',
          businessDescription: '',
          businessCategory: '',
          contactPhone: '',
          businessAddress: ''
        });
      } else {
        toast.error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting vendor application:', error);
      toast.error('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="vendor-signup-container">
        <div className="vendor-signup-card">
          <div className="vendor-signup-header">
            <h2>Become a Vendor</h2>
          </div>
          <div className="vendor-signup-body">
            <p className="text-center text-gray-600">
              Please log in to your account to apply as a vendor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasPendingApplication) {
    return (
      <div className="vendor-signup-container">
        <div className="vendor-signup-card">
          <div className="vendor-signup-header">
            <h2>Vendor Application Pending</h2>
          </div>
          <div className="vendor-signup-body">
            <div className="alert alert-info">
              <p>You have already submitted a vendor application. Our admin team is reviewing your application and will get back to you soon.</p>
              <p>Thank you for your patience!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="vendor-signup-container">
        <div className="vendor-signup-card">
          <div className="vendor-signup-header success">
            <h2>✓ Application Submitted</h2>
          </div>
          <div className="vendor-signup-body">
            <div className="success-message">
              <p><strong>Thank you for applying!</strong></p>
              <p>Your vendor application has been successfully submitted. Our admin team will review your information and send you an email notification about the status of your application.</p>
              <p className="mt-4">Expected response time: 1-3 business days</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-signup-container">
      <div className="vendor-signup-card">
        <div className="vendor-signup-header">
          <h2>Become a Vendor</h2>
          <p className="subtitle">Start selling on Aruviah today</p>
        </div>

        <form className="vendor-signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="businessName">Business Name *</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Your business name"
              maxLength={100}
              required
            />
            <small>{formData.businessName.length}/100 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="businessDescription">Business Description *</label>
            <textarea
              id="businessDescription"
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleChange}
              placeholder="Tell us about your business, products, and what makes you unique"
              maxLength={500}
              rows={4}
              required
            />
            <small>{formData.businessDescription.length}/500 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="businessCategory">Business Category *</label>
            <select
              id="businessCategory"
              name="businessCategory"
              value={formData.businessCategory}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone *</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+254 XXX XXX XXX"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="businessAddress">Business Address *</label>
            <textarea
              id="businessAddress"
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              placeholder="Your business address"
              maxLength={200}
              rows={2}
              required
            />
            <small>{formData.businessAddress.length}/200 characters</small>
          </div>

          <div className="form-info">
            <p><strong>Note:</strong> Once you submit this application, our admin team will review your information. You'll be notified via email about the approval status.</p>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
