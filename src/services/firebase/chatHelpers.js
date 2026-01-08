// src/services/firebase/chatHelpers.js

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './config';

const CHATS_COLLECTION = 'service_chats';

/**
 * Send a message in a service chat
 */
export const sendMessage = async (messageData) => {
  try {
    const message = {
      ...messageData,
      timestamp: serverTimestamp(),
      read: false,
    };

    const docRef = await addDoc(collection(db, CHATS_COLLECTION), message);
    return { id: docRef.id, ...message };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

/**
 * Get all messages for a specific chat room
 */
export const getMessages = async (chatRoomId) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(q);
    const messages = [];

    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
};

/**
 * Subscribe to real-time messages for a chat room
 */
export const subscribeToMessages = (chatRoomId, callback) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Get all chats for a service provider
 */
export const getProviderChats = async (providerId) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('providerId', '==', providerId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const chats = {};

    snapshot.forEach((doc) => {
      const chatData = doc.data();
      const chatRoomId = chatData.chatRoomId;

      if (!chats[chatRoomId]) {
        chats[chatRoomId] = {
          chatRoomId,
          serviceId: chatData.serviceId,
          providerId: chatData.providerId,
          lastMessage: chatData.message,
          lastMessageTime: chatData.timestamp,
          messages: [],
        };
      }

      chats[chatRoomId].messages.push({
        id: doc.id,
        ...chatData,
      });
    });

    return Object.values(chats);
  } catch (error) {
    console.error('Error fetching provider chats:', error);
    throw new Error('Failed to fetch chats');
  }
};

/**
 * Get all chats for a customer
 */
export const getCustomerChats = async (customerId) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('senderId', '==', customerId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const chats = {};

    snapshot.forEach((doc) => {
      const chatData = doc.data();
      const chatRoomId = chatData.chatRoomId;

      if (!chats[chatRoomId]) {
        chats[chatRoomId] = {
          chatRoomId,
          serviceId: chatData.serviceId,
          providerId: chatData.providerId,
          lastMessage: chatData.message,
          lastMessageTime: chatData.timestamp,
          messages: [],
        };
      }

      chats[chatRoomId].messages.push({
        id: doc.id,
        ...chatData,
      });
    });

    return Object.values(chats);
  } catch (error) {
    console.error('Error fetching customer chats:', error);
    throw new Error('Failed to fetch chats');
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatRoomId, userId) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('chatRoomId', '==', chatRoomId),
      where('senderId', '!=', userId)
    );

    const snapshot = await getDocs(q);
    const updates = [];

    snapshot.forEach((docSnapshot) => {
      updates.push(
        updateDoc(doc(db, CHATS_COLLECTION, docSnapshot.id), {
          read: true,
        })
      );
    });

    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, CHATS_COLLECTION, messageId));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadCount = async (userId, chatRoomId) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('chatRoomId', '==', chatRoomId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Subscribe to unread messages
 */
export const subscribeToUnreadMessages = (chatRoomId, userId, callback) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('chatRoomId', '==', chatRoomId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to unread messages:', error);
    return () => {};
  }
};

/**
 * Get all chats (Admin only - all service chats)
 */
export const getAllServiceChats = async () => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const chats = {};

    snapshot.forEach((doc) => {
      const chatData = doc.data();
      const chatRoomId = chatData.chatRoomId;

      if (!chats[chatRoomId]) {
        chats[chatRoomId] = {
          chatRoomId,
          serviceId: chatData.serviceId,
          providerId: chatData.providerId,
          customerId: chatData.senderId,
          lastMessage: chatData.message,
          lastMessageTime: chatData.timestamp,
          messages: [],
        };
      }

      chats[chatRoomId].messages.push({
        id: doc.id,
        ...chatData,
      });
    });

    return Object.values(chats);
  } catch (error) {
    console.error('Error fetching all service chats:', error);
    throw new Error('Failed to fetch chats');
  }
};

/**
 * Subscribe to all service chats (Admin only)
 */
export const subscribeToAllServiceChats = (callback) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = {};

      snapshot.forEach((doc) => {
        const chatData = doc.data();
        const chatRoomId = chatData.chatRoomId;

        if (!chats[chatRoomId]) {
          chats[chatRoomId] = {
            chatRoomId,
            serviceId: chatData.serviceId,
            providerId: chatData.providerId,
            customerId: chatData.senderId,
            lastMessage: chatData.message,
            lastMessageTime: chatData.timestamp,
            messages: [],
          };
        }

        chats[chatRoomId].messages.push({
          id: doc.id,
          ...chatData,
        });
      });

      callback(Object.values(chats));
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to all service chats:', error);
    return () => {};
  }
};
