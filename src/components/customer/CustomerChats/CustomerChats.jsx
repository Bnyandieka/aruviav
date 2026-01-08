import React, { useState, useEffect } from 'react';
import { FiX, FiSend, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { subscribeToMessages, sendMessage } from '../../../services/firebase/chatHelpers';
import { db } from '../../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './CustomerChats.css';

export default function CustomerChats() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Load all active chats for this customer
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadChats = async () => {
      try {
        setLoading(true);
        
        // Query service_chats where this customer has messages
        const chatsRef = collection(db, 'service_chats');
        const q = query(chatsRef, where('customerId', '==', user.uid));
        const snapshot = await getDocs(q);

        const chatsData = [];
        for (const doc of snapshot.docs) {
          const data = doc.data();
          // Get the latest message
          const messages = data.messages || [];
          const lastMessage = messages[messages.length - 1];
          
          chatsData.push({
            id: doc.id,
            ...data,
            lastMessage,
            lastMessageTime: lastMessage?.timestamp || null,
          });
        }

        // Sort by last message time (newest first)
        chatsData.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        setChats(chatsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading chats:', error);
        toast.error('Failed to load chats');
        setLoading(false);
      }
    };

    loadChats();
  }, [user?.uid]);

  // Subscribe to selected chat messages
  useEffect(() => {
    if (!selectedChat || !user?.uid) return;

    setLoadingChat(true);
    const chatRoomId = selectedChat.id;

    const unsubscribe = subscribeToMessages(chatRoomId, (messages) => {
      setChatMessages(messages);
      setLoadingChat(false);

      // Fire notification for new messages from provider
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.senderId !== user.uid && lastMsg.senderId === selectedChat.providerId) {
          // Message is from provider
        }
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        const chatBody = document.querySelector('.customer-chat-messages');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      }, 0);
    });

    return () => unsubscribe();
  }, [selectedChat, user?.uid]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    setSendingMessage(true);
    try {
      const chatRoomId = selectedChat.id;

      await sendMessage({
        chatRoomId,
        serviceId: selectedChat.serviceId,
        providerId: selectedChat.providerId,
        senderName: selectedChat.customerName || 'Customer',
        senderType: 'customer',
        message: messageInput.trim(),
        senderId: user.uid,
        receiverId: selectedChat.providerId,
      });

      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  if (!user) {
    return (
      <div className="customer-chats-container">
        <div className="chats-empty-state">
          <p>Please sign in to view your chats.</p>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="customer-chats-container">
        {/* Chat Window */}
        <div className="customer-chat-window">
          {/* Chat Header */}
          <div className="customer-chat-header">
            <div className="chat-header-content">
              <div className="chat-header-avatar">
                {selectedChat.providerName?.charAt(0).toUpperCase()}
              </div>
              <div className="chat-header-info">
                <div className="chat-header-name">{selectedChat.providerName}</div>
                <div className="chat-header-service">{selectedChat.serviceName}</div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={handleBackToList}>
              <FiX size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="customer-chat-messages">
            {loadingChat ? (
              <div className="chat-loading">
                <FiLoader className="spinner" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${
                    msg.senderId === user.uid ? 'message-sent' : 'message-received'
                  }`}
                >
                  <div className="message-bubble">{msg.message}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="customer-chat-input">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())
              }
              placeholder="Type a message..."
              className="message-input"
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageInput.trim()}
              className="send-btn"
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-chats-container">
      {/* Chats List */}
      <div className="customer-chats-list">
        <div className="chats-header">
          <h2>Messages</h2>
        </div>

        {loading ? (
          <div className="chats-loading">
            <FiLoader className="spinner" />
            <p>Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="chats-empty">
            <p>No chats yet</p>
            <p className="text-sm text-gray-500">Start chatting with vendors!</p>
          </div>
        ) : (
          <div className="chats-items">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="chat-item"
                onClick={() => handleSelectChat(chat)}
              >
                <div className="chat-item-avatar">
                  {chat.providerName?.charAt(0).toUpperCase()}
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <div className="chat-item-name">{chat.providerName}</div>
                    <div className="chat-item-time">
                      {chat.lastMessageTime &&
                        new Date(chat.lastMessageTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="chat-item-message">
                    {chat.lastMessage?.message?.substring(0, 50)}
                    {chat.lastMessage?.message?.length > 50 ? '...' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
