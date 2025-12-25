import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requireEmailVerification = true }) => {
  const { user, loading } = useAuth();
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if email verification is required
  if (requireEmailVerification && !user.emailVerified) {
    const handleResendEmail = async () => {
      setResendLoading(true);
      setResendMessage('');

      try {
        const { sendVerificationEmail } = await import('../services/firebase/auth');
        const result = await sendVerificationEmail();

        if (result.error) {
          setResendMessage(`Error: ${result.error}`);
        } else {
          setResendMessage('✓ Verification email sent! Check your inbox and spam folder.');
          setTimeout(() => {
            setResendMessage('');
          }, 5000);
        }
      } catch (error) {
        setResendMessage('Failed to resend verification email. Please try again.');
      } finally {
        setResendLoading(false);
      }
    };

    if (showVerificationAlert) {
      return (
        <div className="email-verification-alert-overlay">
          <div className="email-verification-alert-modal">
            <div className="alert-header">
              <div className="alert-icon">⚠️</div>
              <h2>Email Verification Required</h2>
            </div>

            <div className="alert-content">
              <p className="alert-message">
                To access this feature, you need to verify your email address.
              </p>

              <div className="email-display-box">
                <span className="label">Your Email:</span>
                <span className="email">{user.email}</span>
              </div>

              <div className="instructions">
                <p><strong>What to do:</strong></p>
                <ol>
                  <li>Check your email inbox for a verification link</li>
                  <li>Look in your spam/junk folder if not in inbox</li>
                  <li>Click the verification link to verify your email</li>
                  <li>Return here to continue</li>
                </ol>
              </div>

              {resendMessage && (
                <div className={`alert-message ${resendMessage.includes('Error') ? 'error' : 'success'}`}>
                  {resendMessage}
                </div>
              )}
            </div>

            <div className="alert-actions">
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="btn-resend"
              >
                {resendLoading ? 'Sending...' : '📧 Resend Verification Email'}
              </button>

              <button
                onClick={() => window.location.href = '/verify-email'}
                className="btn-go-verify"
              >
                Go to Verification Page →
              </button>

              <button
                onClick={() => setShowVerificationAlert(false)}
                className="btn-close"
              >
                Close (You can't access this page yet)
              </button>
            </div>

            <div className="alert-footer">
              <p>Verified your email? <button onClick={() => window.location.reload()} className="reload-link">Click here to refresh</button></p>
            </div>
          </div>
        </div>
      );
    }

    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

export default ProtectedRoute;