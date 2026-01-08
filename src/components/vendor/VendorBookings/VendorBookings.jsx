import React, { useState, useEffect } from 'react';
import {
  FiMessageSquare,
  FiCheck,
  FiX,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPhoneCall,
  FiMail,
  FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { subscribeToVendorBookings, acceptBooking, cancelBooking } from '../../../services/firebase/bookingHelpers';
import { subscribeToMessages, sendMessage } from '../../../services/firebase/chatHelpers';
import { useNotifications } from '../../../context/NotificationContext';
import { toast } from 'react-toastify';
import './VendorBookings.css';

export default function VendorBookings() {
  const { user, userData } = useAuth();
  const { addNotification } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [unreadByBooking, setUnreadByBooking] = useState({});

  // Subscribe to vendor bookings
  useEffect(() => {
    if (!user?.uid) {
      setLoading(true);
      return;
    }

    setLoading(true);
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (bookings.length === 0) {
        setLoading(false);
      }
    }, 5000);
    
    try {
      const unsubscribe = subscribeToVendorBookings(user.uid, (updatedBookings) => {
        clearTimeout(timeoutId);
        setBookings(updatedBookings);
        setLoading(false);
      });

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Error subscribing to bookings:', error);
      setLoading(false);
      toast.error('Failed to load bookings');
    }
  }, [user?.uid]);

  // Filter bookings
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filterStatus));
    }
  }, [bookings, filterStatus]);

  // Subscribe to chat messages when booking is selected
  useEffect(() => {
    if (!selectedBooking || !showChatModal) return;

    setLoadingChat(true);
    const chatRoomId = `service_${selectedBooking.serviceId}_customer_${selectedBooking.customerId}`;
    let previousMessageCount = 0;

    const unsubscribe = subscribeToMessages(chatRoomId, (messages) => {
      setChatMessages(messages);
      setLoadingChat(false);

      // Track unread and notify on new messages from customer
      if (messages.length > previousMessageCount) {
        const newMessages = messages.slice(previousMessageCount);
        
        // Check if any new messages are from customer
        for (const msg of newMessages) {
          if (msg.senderId !== user.uid && msg.senderId === selectedBooking.customerId) {
            // Fire notification for new message from customer
            addNotification({
              type: 'info',
              title: `New message from ${selectedBooking.customerName || 'Customer'}`,
              message: msg.message.substring(0, 50) + (msg.message.length > 50 ? '...' : ''),
            });
          }
        }
        previousMessageCount = messages.length;
      }

      // Scroll to bottom
      setTimeout(() => {
        const chatBody = document.querySelector('.vendor-chat-messages');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      }, 0);
    });

    return () => unsubscribe();
  }, [selectedBooking, showChatModal, user?.uid, addNotification]);

  const handleAcceptBooking = async (booking) => {
    setActionInProgress(booking.id);
    try {
      await acceptBooking(booking.id, '');
      toast.success('Booking accepted!');
    } catch (error) {
      toast.error('Failed to accept booking');
      console.error('Error:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User cancelled the dialog

    setActionInProgress(booking.id);
    try {
      await cancelBooking(booking.id, reason);
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error('Failed to cancel booking');
      console.error('Error:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedBooking) return;

    setSendingMessage(true);
    try {
      const chatRoomId = `service_${selectedBooking.serviceId}_customer_${selectedBooking.customerId}`;

      await sendMessage({
        chatRoomId,
        serviceId: selectedBooking.serviceId,
        providerId: user.uid,
        senderName: userData?.businessName || 'Service Provider',
        senderType: 'provider',
        message: messageInput.trim(),
        senderId: user.uid,
        receiverId: selectedBooking.customerId,
      });

      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f97316'; // Orange
      case 'accepted':
        return '#3b82f6'; // Blue
      case 'completed':
        return '#22c55e'; // Green
      case 'cancelled':
        return '#ef4444'; // Red
      case 'rescheduled':
        return '#a855f7'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiAlertCircle />;
      case 'accepted':
        return <FiCheck />;
      case 'completed':
        return <FiCheckCircle />;
      case 'cancelled':
        return <FiX />;
      case 'rescheduled':
        return <FiClock />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="vendor-bookings-container">
        <div className="loading-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="vendor-bookings-container">
      <div className="bookings-header">
        <h2>Service Bookings</h2>
        <p className="bookings-count">Total: {bookings.length} bookings</p>
      </div>

      {/* Filter Tabs */}
      <div className="bookings-filter-tabs">
        {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({bookings.filter(b => status === 'all' ? true : b.status === status).length})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <FiMessageSquare size={48} />
          <p>No {filterStatus !== 'all' ? filterStatus : ''} bookings yet</p>
          <p className="text-secondary">Bookings will appear here</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-title-section">
                  <h3>{booking.serviceName}</h3>
                  <span
                    className="booking-status"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {getStatusIcon(booking.status)}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{booking.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <span className="detail-label">Email:</span>
                    <a href={`mailto:${booking.customerEmail}`} className="detail-value email-link">
                      {booking.customerEmail}
                    </a>
                  </div>
                  {booking.customerPhone && (
                    <div className="detail-item">
                      <FiPhoneCall className="detail-icon" />
                      <span className="detail-label">Phone:</span>
                      <a href={`tel:${booking.customerPhone}`} className="detail-value phone-link">
                        {booking.customerPhone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Booking Details</h4>
                  <div className="detail-item">
                    <FiCalendar className="detail-icon" />
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{booking.bookingDate}</span>
                  </div>
                  {booking.bookingTime && (
                    <div className="detail-item">
                      <FiClock className="detail-icon" />
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{booking.bookingTime}</span>
                    </div>
                  )}
                  {booking.notes && (
                    <div className="detail-item notes">
                      <span className="detail-label">Notes:</span>
                      <p className="detail-value notes-text">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Dates</h4>
                  <div className="detail-item">
                    <span className="detail-label">Booked on:</span>
                    <span className="detail-value">
                      {booking.createdAt?.toDate?.().toLocaleDateString() ||
                        new Date().toLocaleDateString()}
                    </span>
                  </div>
                  {booking.acceptedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Accepted on:</span>
                      <span className="detail-value">
                        {booking.acceptedAt.toDate?.().toLocaleDateString() ||
                          new Date().toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="booking-actions">
                {booking.status === 'pending' && (
                  <>
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptBooking(booking)}
                      disabled={actionInProgress === booking.id}
                    >
                      <FiCheck /> Accept
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleCancelBooking(booking)}
                      disabled={actionInProgress === booking.id}
                    >
                      <FiX /> Decline
                    </button>
                  </>
                )}
                <button
                  className="btn-chat"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowChatModal(true);
                  }}
                >
                  <FiMessageSquare /> Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="facebook-chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Chat Header */}
            <div className="chat-header-facebook">
              <div className="chat-header-left">
                <div className="avatar-circle">
                  {selectedBooking.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="header-info">
                  <h3>{selectedBooking.customerName}</h3>
                  <p className="service-name">{selectedBooking.serviceName}</p>
                </div>
              </div>
              <button className="btn-close-chat" onClick={() => setShowChatModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="chat-messages-facebook">
              {loadingChat ? (
                <div className="chat-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="chat-empty-state">
                  <FiMessageSquare size={48} />
                  <p>No messages yet</p>
                  <p className="text-hint">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message-bubble ${msg.senderType === 'provider' ? 'provider' : 'customer'}`}
                  >
                    <div className="message-text">{msg.message}</div>
                    <div className="message-timestamp">
                      {msg.timestamp?.toDate?.().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Area */}
            <div className="chat-input-facebook">
              <div className="input-wrapper">
                <input
                  type="text"
                  className="message-input-facebook"
                  placeholder="Aa"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  disabled={sendingMessage}
                />
                <button 
                  className="btn-send-facebook" 
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageInput.trim()}
                  title="Send message"
                >
                  {sendingMessage ? (
                    <div className="spinner-small"></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <polyline points="16 11 19 14 22 11"></polyline>
                      <polyline points="19 11 19 19"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
