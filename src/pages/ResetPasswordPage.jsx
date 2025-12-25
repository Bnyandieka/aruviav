import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import '../styles/ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const oobCode = searchParams.get('oobCode');

  // Verify the reset code on component mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid or missing reset code. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      try {
        // Verify the code is valid
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);
        setVerifying(false);
      } catch (error) {
        console.error('Error verifying reset code:', error);
        
        let errorMessage = 'Failed to verify reset code';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'Password reset link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid reset link. Please request a new password reset.';
        }
        
        setError(errorMessage);
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const validatePassword = () => {
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      
      let errorMessage = 'Failed to reset password';
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'Password reset link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid reset link. Please request a new password reset.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="loading-spinner"></div>
          <p>Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card error-state">
          <h2>Password Reset Failed</h2>
          <p className="error-message">{error}</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card success-state">
          <div className="success-icon">✓</div>
          <h2>Password Reset Successfully!</h2>
          <p>Your password has been reset. You can now log in with your new password.</p>
          <p className="redirect-message">Redirecting to login page...</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/login', { replace: true })}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h1>Reset Your Password</h1>
        {userEmail && <p className="user-email">Account: {userEmail}</p>}
        
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small>At least 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="help-text">
          <p>Remember your password? <a href="/login">Back to Login</a></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
