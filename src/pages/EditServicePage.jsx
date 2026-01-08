import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import PortfolioUpload from '../components/services/PortfolioUpload/PortfolioUpload';
import { CATEGORIES } from '../utils/constants';
import { getService, updateService } from '../services/firebase/firestoreHelpers';
import Loader from '../components/common/Loader/Spinner';

const EditServicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: 'hourly',
    images: []
  });

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const service = await getService(id);
        
        if (!service) {
          toast.error('Service not found');
          navigate('/services');
          return;
        }

        // Check if user is the owner
        if (service.sellerId !== user?.uid) {
          toast.error('You can only edit your own services');
          navigate(`/service/${id}`);
          return;
        }

        setFormData({
          name: service.name,
          description: service.description,
          category: service.category,
          price: service.price.toString(),
          duration: service.duration,
          images: service.images || []
        });
      } catch (error) {
        console.error('Error fetching service:', error);
        toast.error('Failed to load service');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchService();
    }
  }, [id, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        duration: formData.duration,
        images: formData.images.map(img => 
          typeof img === 'string' 
            ? img 
            : { url: img.url, name: img.name }
        )
      };

      await updateService(id, updateData);
      
      toast.success('Service updated successfully! 🎉');
      navigate(`/service/${id}`);
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to edit services.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Services', link: '/services' },
          { label: formData.name, link: `/service/${id}` },
          { label: 'Edit' }
        ]} />

        {/* Header */}
        <h1 className="text-3xl font-bold mb-8">Edit Service</h1>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Web Design"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your service in detail..."
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (KES) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration *
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:bg-gray-400"
                  >
                    {submitting ? 'Updating...' : 'Update Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Portfolio Upload Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <PortfolioUpload
                images={formData.images}
                onImagesChange={(images) => 
                  setFormData(prev => ({ ...prev, images }))
                }
                maxImages={5}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditServicePage;
