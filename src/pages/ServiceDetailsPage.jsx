import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaMapPin, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import Loader from '../components/common/Loader/Spinner';
import ServiceChat from '../components/services/ServiceChat/ServiceChat';

import { getService } from '../services/firebase/firestoreHelpers';
import { createBooking } from '../services/firebase/bookingHelpers';
import { sendTransactionalEmail } from '../services/email/brevoService';

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
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

  const handleBookService = async () => {
    if (!bookingForm.name || !bookingForm.email) {
      toast.error('Please enter your name and email');
      return;
    }

    if (!bookingForm.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      setBookingSubmitting(true);

      // Create booking in Firestore
      const bookingData = {
        serviceId: id,
        serviceName: service.name,
        vendorId: service.sellerId,
        vendorName: service.sellerName,
        vendorEmail: service.sellerEmail,
        customerId: currentUser?.uid || 'guest',
        customerName: bookingForm.name,
        customerEmail: bookingForm.email,
        customerPhone: bookingForm.phone || '',
        bookingDate: bookingForm.date,
        bookingTime: bookingForm.time || 'Not specified',
        notes: bookingForm.notes,
        status: 'pending',
      };

      const booking = await createBooking(bookingData);

      // Send email notification to vendor
      try {
        const vendorEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">New Booking Request</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Service: ${service.name}</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; color: #f97316;">Customer Details</h3>
              <p><strong>Name:</strong> ${bookingForm.name}</p>
              <p><strong>Email:</strong> ${bookingForm.email}</p>
              ${bookingForm.phone ? `<p><strong>Phone:</strong> ${bookingForm.phone}</p>` : ''}
              
              <h3 style="color: #f97316;">Booking Details</h3>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Preferred Date:</strong> ${bookingForm.date}</p>
              ${bookingForm.time ? `<p><strong>Preferred Time:</strong> ${bookingForm.time}</p>` : ''}
              
              ${bookingForm.notes ? `
                <h3 style="color: #f97316;">Notes from Customer</h3>
                <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316;">
                  <p style="margin: 0; white-space: pre-wrap;">${bookingForm.notes}</p>
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f97316;">
                <p style="margin: 0;"><strong>Next Steps:</strong></p>
                <p style="margin: 10px 0 0 0;">1. Review this booking request</p>
                <p style="margin: 5px 0;">2. Log into Aruviah to accept or reschedule</p>
                <p style="margin: 5px 0;">3. Contact the customer to confirm details</p>
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
              <p>© 2026 Aruviah. All rights reserved.</p>
            </div>
          </div>
        `;

        await sendTransactionalEmail({
          email: service.sellerEmail,
          subject: `New Booking Request - ${service.name}`,
          htmlContent: vendorEmailHtml,
          senderName: 'Aruviah Bookings',
          senderEmail: process.env.REACT_APP_BREVO_SENDER_EMAIL,
          saveToAdminInbox: true,
          emailType: 'booking',
          relatedData: {
            bookingId: booking.id,
            customerName: bookingForm.name,
            customerEmail: bookingForm.email,
            serviceName: service.name,
            vendorId: service.sellerId
          }
        });
      } catch (emailError) {
        console.error('Error sending vendor notification email:', emailError);
      }

      // Send confirmation email to customer
      try {
        const customerEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">✓ Booking Request Submitted</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Service: ${service.name}</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
              <p>Hi ${bookingForm.name},</p>
              
              <p>Thank you for submitting your booking request! We've received your request for <strong>${service.name}</strong> from <strong>${service.sellerName}</strong>.</p>
              
              <div style="background-color: white; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
                <p><strong>Your Booking Details:</strong></p>
                <p style="margin: 10px 0;">📅 Requested Date: ${bookingForm.date}</p>
                ${bookingForm.time ? `<p style="margin: 10px 0;">🕐 Requested Time: ${bookingForm.time}</p>` : ''}
                <p style="margin: 10px 0;">🏢 Service Provider: ${service.sellerName}</p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                <p style="margin-top: 0;"><strong>What happens next?</strong></p>
                <p style="margin: 10px 0;">✓ We've notified ${service.sellerName} about your booking request</p>
                <p style="margin: 10px 0;">✓ They will review your request and contact you within 24 hours</p>
                <p style="margin: 10px 0;">✓ You can chat with them directly in your Aruviah account</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">If you have any questions, you can reply to this email or contact the service provider through the Aruviah platform.</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
              <p>© 2026 Aruviah. All rights reserved.</p>
            </div>
          </div>
        `;

        await sendTransactionalEmail({
          email: bookingForm.email,
          subject: `Booking Confirmation - ${service.name}`,
          htmlContent: customerEmailHtml,
          senderName: 'Aruviah Bookings',
          senderEmail: process.env.REACT_APP_BREVO_SENDER_EMAIL,
          saveToAdminInbox: true,
          emailType: 'booking',
          relatedData: {
            bookingId: booking.id,
            customerName: bookingForm.name,
            customerEmail: bookingForm.email,
            serviceName: service.name,
            vendorId: service.sellerId,
            vendorName: service.sellerName
          }
        });
      } catch (emailError) {
        console.error('Error sending customer confirmation email:', emailError);
      }

      toast.success('Booking request sent! Check your email for confirmation. The service provider will contact you soon.');
      setBookingForm({ name: '', email: '', phone: '', date: '', time: '', notes: '' });
    } catch (error) {
      console.error('Error booking service:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
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
            {/* Portfolio Gallery */}
            {service.images && service.images.length > 0 ? (
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Main Image */}
                  <div className="col-span-2 sm:col-span-1 sm:row-span-2">
                    <img
                      src={service.images[0].url}
                      alt={service.name}
                      className="w-full h-64 sm:h-96 object-cover rounded-lg shadow-md"
                    />
                  </div>
                  {/* Other Images */}
                  {service.images.slice(1, 5).map((image, idx) => (
                    <img
                      key={idx}
                      src={image.url}
                      alt={`${service.name} ${idx + 2}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg h-96 flex items-center justify-center text-white text-center mb-8">
                <div>
                  <FaClock className="text-6xl mx-auto mb-4" />
                  <p className="text-2xl font-bold">{service.category}</p>
                </div>
              </div>
            )}

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

              {/* Edit Button - Only show if user is the owner */}
              {currentUser?.uid === service.sellerId && (
                <button
                  onClick={() => navigate(`/service/${id}/edit`)}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition mb-3 font-semibold"
                >
                  Edit Service
                </button>
              )}

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
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={bookingForm.name}
                    onChange={handleBookingChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={bookingForm.email}
                    onChange={handleBookingChange}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingForm.phone || ''}
                    onChange={handleBookingChange}
                    placeholder="Enter your phone number (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Preferred Date *</label>
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
                <div className="flex gap-3">
                  <button
                    onClick={handleBookService}
                    disabled={bookingSubmitting}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition font-bold text-lg"
                  >
                    {bookingSubmitting ? 'Submitting...' : 'Request Booking'}
                  </button>
                  {currentUser && (
                    <button
                      onClick={() => setShowChat(true)}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-bold text-lg"
                    >
                      💬 Message Vendor
                    </button>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  📞 The service provider will contact you within 24 hours to confirm.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      {currentUser && service && showChat && (
        <ServiceChat
          serviceId={id}
          providerId={service.sellerId}
          providerName={service.sellerName}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default ServiceDetailsPage;
