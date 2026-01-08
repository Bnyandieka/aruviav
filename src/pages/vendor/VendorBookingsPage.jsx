import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { FaCalendar, FaClock, FaUser, FaPhone, FaEnvelope, FaCheck, FaClock as FaClockIcon, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import Loader from '../components/common/Loader/Spinner';
import { subscribeToVendorBookings, acceptBooking, rescheduleBooking, cancelBooking } from '../services/firebase/bookingHelpers';
import '../styles/VendorBookings.css';

const VendorBookingsPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rescheduled, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (!currentUser) {
      toast.error('Please log in to view bookings');
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [currentUser, navigate]);

  // Subscribe to vendor bookings
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToVendorBookings(currentUser.uid, (bookingsData) => {
      setBookings(bookingsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const handleAcceptBooking = async (booking) => {
    try {
      setSubmitting(true);
      await acceptBooking(booking.id, '');
      
      // Send email to customer
      try {
        await fetch('/api/booking/notify-customer-acceptance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: booking.customerEmail,
            customerName: booking.customerName,
            vendorName: booking.vendorName,
            serviceName: booking.serviceName,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            vendorNotes: ''
          })
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }

      toast.success('Booking accepted!');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error('Failed to accept booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleClick = (booking) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleForm.date) {
      toast.error('Please select a new date');
      return;
    }

    try {
      setSubmitting(true);
      await rescheduleBooking(
        selectedBooking.id,
        rescheduleForm.date,
        rescheduleForm.time,
        rescheduleForm.reason
      );

      // Send email to customer
      try {
        await fetch('/api/booking/notify-customer-reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: selectedBooking.customerEmail,
            customerName: selectedBooking.customerName,
            vendorName: selectedBooking.vendorName,
            serviceName: selectedBooking.serviceName,
            originalDate: selectedBooking.bookingDate,
            newDate: rescheduleForm.date,
            newTime: rescheduleForm.time,
            reason: rescheduleForm.reason
          })
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }

      toast.success('Booking rescheduled!');
      setShowRescheduleModal(false);
      setRescheduleForm({ date: '', time: '', reason: '' });
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast.error('Failed to reschedule booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        setSubmitting(true);
        await cancelBooking(booking.id, 'Cancelled by vendor');
        toast.success('Booking cancelled');
        setSelectedBooking(null);
      } catch (error) {
        console.error('Error cancelling booking:', error);
        toast.error('Failed to cancel booking');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rescheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClockIcon size={16} />;
      case 'accepted':
        return <FaCheck size={16} />;
      case 'rescheduled':
        return <FaCalendar size={16} />;
      case 'completed':
        return <FaCheck size={16} />;
      case 'cancelled':
        return <FaTimes size={16} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Breadcrumb items={[
          { label: 'Dashboard', path: '/vendor/dashboard' },
          { label: 'My Bookings' }
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Service Bookings</h1>
          <p className="text-gray-600">Manage all your service bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'accepted', 'rescheduled', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition font-semibold ${
                  filter === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold">{booking.serviceName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Customer Information</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaUser size={14} className="text-orange-500" />
                            <span className="font-semibold">{booking.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaEnvelope size={14} className="text-orange-500" />
                            <span>{booking.customerEmail}</span>
                          </div>
                          {booking.customerPhone && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <FaPhone size={14} className="text-orange-500" />
                              <span>{booking.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">Booking Details</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaCalendar size={14} className="text-orange-500" />
                            <span>{booking.bookingDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaClock size={14} className="text-orange-500" />
                            <span>{booking.bookingTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-semibold mb-1">Customer Notes:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                      </div>
                    )}

                    {/* Reschedule Info */}
                    {booking.status === 'rescheduled' && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Rescheduled</p>
                        <p className="text-sm text-blue-800">New Date: {booking.rescheduleDate}</p>
                        <p className="text-sm text-blue-800">New Time: {booking.rescheduleTime}</p>
                        {booking.rescheduleReason && (
                          <p className="text-sm text-blue-700 mt-1">Reason: {booking.rescheduleReason}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptBooking(booking)}
                          disabled={submitting}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition font-semibold text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRescheduleClick(booking)}
                          disabled={submitting}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-semibold text-sm"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          disabled={submitting}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition font-semibold text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => handleRescheduleClick(booking)}
                          disabled={submitting}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-semibold text-sm"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => navigate(`/booking/${booking.id}/chat`)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold text-sm"
                        >
                          Chat
                        </button>
                      </>
                    )}

                    {booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'pending' && (
                      <button
                        onClick={() => navigate(`/booking/${booking.id}/chat`)}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold text-sm"
                      >
                        Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No bookings found</p>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Reschedule Booking</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Service: <span className="font-semibold text-gray-800">{selectedBooking.serviceName}</span></p>
              <p className="text-sm text-gray-600">Customer: <span className="font-semibold text-gray-800">{selectedBooking.customerName}</span></p>
              <p className="text-sm text-gray-600">Original Date: <span className="font-semibold text-gray-800">{selectedBooking.bookingDate}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">New Date</label>
                <input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">New Time (Optional)</label>
                <input
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Reason for Reschedule (Optional)</label>
                <textarea
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  placeholder="Explain why you're rescheduling..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmitReschedule}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Reschedule'}
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleForm({ date: '', time: '', reason: '' });
                    setSelectedBooking(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBookingsPage;
