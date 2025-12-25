import React, { useState } from 'react';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { sendPasswordResetEmail } from '../../../services/email/brevoService';
import { auth } from '../../../services/firebase/config';
import { sendPasswordResetEmail as firebaseSendReset } from 'firebase/auth';
import './ForgotPassword.css';

const ForgotPassword = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send reset email via Firebase
      // This will send an email with Firebase's default reset link
      await firebaseSendReset(auth, email);

      // Also send via Brevo with professional template
      try {
        await sendPasswordResetEmail(email);
      } catch (brevoError) {
        console.warn('Brevo email send failed, but Firebase reset email was sent:', brevoError);
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(onSuccess, 3000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many reset attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
          <h3 className="text-green-800 font-semibold mb-2">✓ Check Your Email</h3>
          <p className="text-green-700 text-sm">
            We've sent a password reset link to <strong>{email}</strong>. 
          </p>
          <p className="text-green-700 text-sm mt-2">
            Please check your email (and spam folder) and click the reset link. 
            The link will expire in 1 hour.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-orange-500 hover:underline font-semibold flex items-center gap-2 mx-auto"
        >
          <FiArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-orange-500 hover:underline font-semibold mb-6"
      >
        <FiArrowLeft size={16} />
        Back to Login
      </button>

      <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
      <p className="text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
