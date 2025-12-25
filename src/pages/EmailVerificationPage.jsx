import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, checkActionCode, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import '../styles/EmailVerificationPage.css';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, error, pending
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const oobCode = searchParams.get('oobCode');

  // Handle verification link from email
  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode) {
        // No code in URL - user just signed up or navigated here
        const currentUser = auth.currentUser;
        if (currentUser?.email) {
          setEmail(currentUser.email);
          if (currentUser.emailVerified) {
            setVerificationStatus('success');
          } else {
            setVerificationStatus('pending');
          }
        } else {
          setVerificationStatus('error');
          setError('No verification code provided. Please check your email for the verification link.');
        }
        return;
      }

      try {
        // Verify the code is valid first
        const actionCodeData = await checkActionCode(auth, oobCode);
        
        if (actionCodeData.operation !== 'VERIFY_EMAIL') {
          setVerificationStatus('error');
          setError('This link is not for email verification.');
          return;
        }

        setEmail(actionCodeData.data.email);

        // Apply the verification code
        await applyActionCode(auth, oobCode);
        
        // Reload the current user to get updated emailVerified status
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload();
        }

        setVerificationStatus('success');
      } catch (error) {
        console.error('Email verification error:', error);
        
        let errorMessage = 'Failed to verify email';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'Verification link has expired. Please request a new one.';
          setVerificationStatus('error-expired');
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid verification link.';
          setVerificationStatus('error');
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled.';
          setVerificationStatus('error');
        }
        
        setError(errorMessage);
        setVerificationStatus('error');
      }
    };

    verifyEmail();
  }, [oobCode]);

  // Handle cooldown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('User not found. Please sign up again.');
        return;
      }

      // Send verification email using Firebase
      await sendEmailVerification(currentUser);

      setResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    // Redirect to home page or profile
    navigate('/', { replace: true });
  };

  if (verificationStatus === 'verifying') {
    return (
      <div className="email-verification-container">
        <div className="verification-card loading-state">
          <div className="loading-spinner"></div>
          <p>Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="email-verification-container">
        <div className="verification-card success-state">
          <div className="success-icon">✓</div>
          <h2>Email Verified!</h2>
          <p className="email-display">{email || user?.email}</p>
          <p className="success-message">
            Thank you for verifying your email. Your account is now fully activated.
          </p>
          <button onClick={handleContinue} className="btn-primary">
            Continue to Shopki
          </button>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <div className="email-verification-container">
        <div className="verification-card pending-state">
          <div className="pending-icon">📧</div>
          <h2>Verify Your Email</h2>
          <p className="email-display">{email || auth.currentUser?.email}</p>
          
          <div className="steps-section">
            <h3>How to verify your email:</h3>
            <ol className="steps-list">
              <li>
                <span className="step-number">1</span>
                <span className="step-text">Open your email app or go to your email provider</span>
              </li>
              <li>
                <span className="step-number">2</span>
                <span className="step-text">Look for an email from "Shopki" or "noreply@firebaseapp.com"</span>
              </li>
              <li>
                <span className="step-number">3</span>
                <span className="step-text">Subject: "Verify your email for Shopki"</span>
              </li>
              <li>
                <span className="step-number">4</span>
                <span className="step-text">Click the blue "Verify Email" button in the email</span>
              </li>
              <li>
                <span className="step-number">5</span>
                <span className="step-text">You'll be redirected back to Shopki and verified!</span>
              </li>
            </ol>
          </div>

          <div className="quick-links">
            <p className="quick-links-title">Quick access to your email:</p>
            <div className="email-links">
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="email-link">
                📧 Gmail
              </a>
              <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer" className="email-link">
                📧 Outlook
              </a>
              <a href="https://www.yahoo.com" target="_blank" rel="noopener noreferrer" className="email-link">
                📧 Yahoo
              </a>
              <a href="https://www.icloud.com" target="_blank" rel="noopener noreferrer" className="email-link">
                📧 iCloud
              </a>
            </div>
          </div>

          <div className="info-box">
            <p><strong>💡 Helpful Tips:</strong></p>
            <ul>
              <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder if you don't see the email</li>
              <li>The email was sent to: <strong>{email || auth.currentUser?.email}</strong></li>
              <li>Verification links expire in <strong>24 hours</strong></li>
              <li>The email may take a few minutes to arrive</li>
              <li>Click the link in the email to complete verification</li>
            </ul>
          </div>

          {resendSuccess && (
            <div className="alert alert-success">
              ✓ Verification email sent to {email || user?.email}
            </div>
          )}

          <div className="button-group">
            <button
              onClick={handleResendVerification}
              disabled={resendLoading || resendCooldown > 0}
              className="btn-secondary"
            >
              {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
          </div>

          <p className="footer-text">
            You can continue browsing Shopki, but you'll need to verify your email before placing an order.
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error-expired') {
    return (
      <div className="email-verification-container">
        <div className="verification-card error-state">
          <div className="error-icon">⏱️</div>
          <h2>Verification Link Expired</h2>
          <p className="error-message">
            Your verification link has expired. Please request a new one.
          </p>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading || resendCooldown > 0}
            className="btn-primary"
          >
            {resendLoading ? 'Sending...' : 'Send New Verification Email'}
          </button>
        </div>
      </div>
    );
  }

  // Generic error state
  return (
    <div className="email-verification-container">
      <div className="verification-card error-state">
        <div className="error-icon">❌</div>
        <h2>Verification Failed</h2>
        <p className="error-message">{error}</p>
        <button
          onClick={handleResendVerification}
          disabled={resendLoading || resendCooldown > 0}
          className="btn-secondary"
        >
          {resendLoading ? 'Sending...' : 'Request New Verification Email'}
        </button>
        <a href="/" className="footer-link">Back to Home</a>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
