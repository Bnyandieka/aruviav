import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiX, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { sendMessage, subscribeToMessages } from '../../../services/firebase/chatHelpers';
import { getAuth } from 'firebase/auth';
import { useNotifications } from '../../../context/NotificationContext';
import '../../../styles/ServiceChat.css';

const ServiceChat = ({ serviceId, providerId, providerName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const { addNotification } = useNotifications();

  // Create a unique chat room ID
  const chatRoomId = `service_${serviceId}_customer_${currentUser?.uid || 'guest'}`;

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (!serviceId || !currentUser) return;

    setLoading(true);
    const unsubscribe = subscribeToMessages(chatRoomId, (messagesData) => {
      setMessages(messagesData);
      
      // Count unread messages from provider (when chat is closed)
      if (!chatOpen && messagesData.length > 0) {
        const unreadFromProvider = messagesData.filter(
          m => m.senderId !== currentUser?.uid && m.senderId === providerId
        ).length;
        setUnreadCount(unreadFromProvider);

        // Show notification for new messages
        const lastMessage = messagesData[messagesData.length - 1];
        if (lastMessage && lastMessage.senderId === providerId) {
          addNotification({
            type: 'info',
            title: `New message from ${providerName || 'Service Provider'}`,
            message: lastMessage.message.substring(0, 50) + (lastMessage.message.length > 50 ? '...' : ''),
          });
        }
      }
      
      scrollToBottom();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatRoomId, serviceId, currentUser, chatOpen, providerId, providerName, addNotification]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatOpen = () => {
    setChatOpen(true);
    setUnreadCount(0);
  };

  const handleChatClose = () => {
    setChatOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      setLoading(true);
      await sendMessage({
        chatRoomId,
        serviceId,
        providerId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderEmail: currentUser.email,
        senderType: 'customer',
        message: newMessage.trim(),
        timestamp: new Date(),
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button - Only show FAB when not in inline mode */}
      {!onClose && (
        <button
          onClick={handleChatOpen}
          className="service-chat-fab"
          title="Open chat"
        >
          <FiMessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="service-chat-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Modal - Facebook Style */}
      {chatOpen && (
        <div className="service-chat-overlay" onClick={handleChatClose}>
          <div className="service-chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Chat Header */}
            <div className="service-chat-header">
              <div className="service-chat-header-left">
                <div className="service-chat-avatar">
                  {(providerName || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="service-chat-header-info">
                  <h3>{providerName || 'Service Provider'}</h3>
                  <p className="online-status">Active now</p>
                </div>
              </div>
              <button 
                className="service-chat-close" 
                onClick={handleChatClose}
                title="Close chat"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Messages Container - Facebook Style */}
            <div className="service-chat-messages">
              {messages.length === 0 ? (
                <div className="service-chat-empty">
                  <FiMessageCircle size={48} />
                  <p>No messages yet</p>
                  <p className="service-chat-empty-hint">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`service-chat-message ${
                      msg.senderId === currentUser?.uid ? 'customer' : 'provider'
                    }`}
                  >
                    <div className="service-message-bubble">
                      <div className="service-message-text">{msg.message}</div>
                      <div className="service-message-time">
                        {msg.timestamp && 
                          new Date(msg.timestamp.toDate?.() || msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Facebook Style */}
            <form onSubmit={handleSendMessage} className="service-chat-input-form">
              <div className="service-chat-input-wrapper">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Aa"
                  className="service-chat-input"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="service-chat-send-btn"
                  title="Send message"
                >
                  {loading ? (
                    <div className="service-chat-spinner"></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 11 19 14 22 11"></polyline>
                      <polyline points="19 11 19 19"></polyline>
                      <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2"></path>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceChat;
