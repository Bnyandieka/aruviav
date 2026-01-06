import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaMapPin, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import Loader from '../components/common/Loader/Spinner';
import { getService } from '../services/firebase/firestoreHelpers';

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const serviceData = await getService(id);
        
        if (serviceData) {
          setService(serviceData);
        } else {
          toast.error('Service not found');
          navigate('/services');
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        toast.error('Failed to load service details');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id, navigate]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookService = () => {
    if (!bookingForm.date) {
      toast.error('Please select a date');
      return;
    }
    
    toast.success('Booking request sent! The service provider will contact you soon.');
    setBookingForm({ date: '', time: '', notes: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Service not found</h2>
          <button
            onClick={() => navigate('/services')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Services', path: '/services' },
          { label: service.name }
        ]} />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 font-semibold"
        >
          <FaArrowLeft size={18} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Service Image Placeholder */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg h-96 flex items-center justify-center text-white text-center mb-8">
              <div>
                <FaClock className="text-6xl mx-auto mb-4" />
                <p className="text-2xl font-bold">{service.category}</p>
              </div>
            </div>

            {/* Service Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h1 className="text-3xl font-bold mb-4">{service.name}</h1>

              {/* Rating and Reviews */}
              {service.rating > 0 && (
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} size={18} fill={i < Math.round(service.rating) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="text-gray-700 font-semibold">
                    {service.rating.toFixed(1)} ({service.reviewCount || 0} reviews)
                  </span>
                  <span className="text-gray-600">
                    {service.bookings || 0} bookings
                  </span>
                </div>
              )}

              {/* Price and Duration */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="text-gray-600 text-sm mb-2">Price</div>
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  KES {service.price?.toLocaleString()}
                </div>
                <div className="text-gray-700 font-semibold">
                  <FaClock className="inline mr-2" size={16} />
                  {service.duration === 'hourly' && 'Per Hour'}
                  {service.duration === 'daily' && 'Per Day'}
                  {service.duration === 'one-time' && 'One-time Service'}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">About this service</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>

              {/* Service Details */}
              {service.details && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">What's included</h2>
                  <ul className="space-y-2 text-gray-700">
                    {Array.isArray(service.details) 
                      ? service.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-3 font-bold">✓</span>
                            {detail}
                          </li>
                        ))
                      : <li className="flex items-start">
                          <span className="text-orange-500 mr-3 font-bold">✓</span>
                          {service.details}
                        </li>
                    }
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Seller Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Service Provider</h2>
              
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {service.sellerName ? service.sellerName.charAt(0).toUpperCase() : 'S'}
              </div>

              <p className="text-center text-lg font-semibold text-gray-800 mb-4">
                {service.sellerName || 'Service Provider'}
              </p>

              {/* Contact Info */}
              <div className="space-y-3 border-t border-b border-gray-200 py-4 mb-4">
                {service.sellerPhone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaPhone className="text-orange-500" size={16} />
                    <span>{service.sellerPhone}</span>
                  </div>
                )}
                {service.sellerEmail && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaEnvelope className="text-orange-500" size={16} />
                    <span className="break-all text-sm">{service.sellerEmail}</span>
                  </div>
                )}
                {service.location && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <FaMapPin className="text-orange-500 mt-1" size={16} />
                    <span>{service.location}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => toast.info('Contacting service provider...')}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition mb-2 font-semibold"
              >
                Contact Provider
              </button>
            </div>

            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Book this Service</h2>
              
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Preferred Date</label>
                  <input
                    type="date"
                    name="date"
                    value={bookingForm.date}
                    onChange={handleBookingChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Time */}
                {service.duration !== 'one-time' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Preferred Time</label>
                    <input
                      type="time"
                      name="time"
                      value={bookingForm.time}
                      onChange={handleBookingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={bookingForm.notes}
                    onChange={handleBookingChange}
                    placeholder="Any special requirements or questions?"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBookService}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-bold text-lg"
                >
                  Request Booking
                </button>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  📞 The service provider will contact you within 24 hours to confirm.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsPage;
