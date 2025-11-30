import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, userData } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                {userData?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{userData?.displayName || 'User'}</h2>
              <p className="text-gray-600">{userData?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
