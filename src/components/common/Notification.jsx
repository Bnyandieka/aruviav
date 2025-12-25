import React from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import '../../styles/Notification.css';

const Notification = ({ id, type, message, title, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="notification-icon success-icon" />;
      case 'error':
        return <FiAlertCircle className="notification-icon error-icon" />;
      case 'warning':
        return <FiAlertTriangle className="notification-icon warning-icon" />;
      case 'alert':
        return <FiAlertCircle className="notification-icon alert-icon" />;
      default:
        return <FiInfo className="notification-icon info-icon" />;
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {getIcon()}
        <div className="notification-text">
          {title && <div className="notification-title">{title}</div>}
          <div className="notification-message">{message}</div>
        </div>
      </div>
      <button
        className="notification-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <FiX size={20} />
      </button>
    </div>
  );
};

export default Notification;
