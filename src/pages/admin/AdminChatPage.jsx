import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiMessageCircle } from 'react-icons/fi';
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import Loader from '../components/common/Loader/Spinner';
import { subscribeToAllServiceChats } from '../services/firebase/chatHelpers';
import '../styles/AdminChat.css';

const AdminChatPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        toast.error('Please log in');
        navigate('/login');
        return;
      }

      // You can replace this with actual admin check from Firestore
      // For now, we'll just allow logged-in users
      setLoading(false);
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  // Subscribe to all chats
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToAllServiceChats((chatsData) => {
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  const filteredChats = chats.filter((chat) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      chat.chatRoomId.toLowerCase().includes(searchLower) ||
      (chat.messages?.[0]?.senderName && chat.messages[0].senderName.toLowerCase().includes(searchLower)) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <Loader />;
  }

  if (!currentUser) {
    return null;
  }

  const selectedChatData = chats.find((c) => c.chatRoomId === selectedChat);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Breadcrumb items={[
          { label: 'Admin', path: '/admin' },
          { label: 'Chat Management' }
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chat Management</h1>
          <p className="text-gray-600">Monitor all customer-vendor communications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-screen max-h-96 lg:max-h-screen">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Chat List Items */}
              <div className="flex-1 overflow-y-auto">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <button
                      key={chat.chatRoomId}
                      onClick={() => setSelectedChat(chat.chatRoomId)}
                      className={`w-full px-4 py-3 border-b border-gray-200 text-left transition hover:bg-gray-50 ${
                        selectedChat === chat.chatRoomId ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {chat.messages?.[0]?.senderName || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {chat.lastMessage || 'No messages'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Service ID: {chat.serviceId}
                          </p>
                        </div>
                        {chat.messages?.length > 0 && (
                          <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {chat.messages.length}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <FiMessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chats found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat View */}
          <div className="lg:col-span-2">
            {selectedChatData ? (
              <div className="bg-white rounded-lg shadow-md flex flex-col h-screen max-h-96 lg:max-h-screen">
                {/* Chat Header */}
                <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Chat Details</h3>
                    <p className="text-sm text-orange-100">Service ID: {selectedChatData.serviceId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="p-2 hover:bg-orange-600 rounded-full transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* Chat Info */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">CUSTOMER</p>
                      {selectedChatData.messages?.[0] && (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FaUser size={12} className="text-orange-500" />
                            {selectedChatData.messages[0].senderName}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-2">
                            <FaEnvelope size={12} className="text-gray-500" />
                            {selectedChatData.messages[0].senderEmail}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">PROVIDER</p>
                      <p className="text-sm font-semibold text-gray-900">ID: {selectedChatData.providerId}</p>
                      <p className="text-xs text-gray-600 mt-1">Messages: {selectedChatData.messages?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                  {selectedChatData.messages && selectedChatData.messages.length > 0 ? (
                    selectedChatData.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === selectedChatData.providerId ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.senderId === selectedChatData.providerId
                              ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                              : 'bg-orange-500 text-white rounded-br-none'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">
                            {msg.senderName} ({msg.senderId === selectedChatData.providerId ? 'Provider' : 'Customer'})
                          </p>
                          <p className="text-sm break-words">{msg.message}</p>
                          <span
                            className={`text-xs mt-1 block ${
                              msg.senderId === selectedChatData.providerId
                                ? 'text-gray-500'
                                : 'text-orange-100'
                            }`}
                          >
                            {msg.timestamp && new Date(msg.timestamp.toDate?.() || msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No messages</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border-t border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This is an admin view. You can monitor all communications but cannot send messages directly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center flex items-center justify-center h-screen max-h-96 lg:max-h-screen">
                <div>
                  <FiMessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg">Select a chat to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatPage;
