import React, { useState } from 'react';
import { FiLock, FiUser, FiPackage, FiBarChart2, FiClock, FiRefreshCw, FiTruck, FiCheckCircle, FiXCircle, FiRotateCcw, FiMail } from 'react-icons/fi';
import useEmailTemplates from '../../../hooks/useEmailTemplates';
import './EmailTemplateEditor.css';

const TEMPLATE_LABELS = {
  passwordReset: [<FiLock key="icon" size={16} />, ' Password Reset'],
  welcome: [<FiUser key="icon" size={16} />, ' Welcome Email'],
  orderConfirmation: [<FiPackage key="icon" size={16} />, ' Order Confirmation'],
  orderStatus: [<FiBarChart2 key="icon" size={16} />, ' Order Status Update'],
  orderPending: [<FiClock key="icon" size={16} />, ' Order Pending'],
  orderProcessing: [<FiRefreshCw key="icon" size={16} />, ' Order Processing'],
  orderShipped: [<FiTruck key="icon" size={16} />, ' Order Shipped'],
  orderCompleted: [<FiCheckCircle key="icon" size={16} />, ' Order Completed'],
  orderCancelled: [<FiXCircle key="icon" size={16} />, ' Order Cancelled'],
  orderReturned: [<FiRotateCcw key="icon" size={16} />, ' Order Returned'],
  newsletter: [<FiMail key="icon" size={16} />, ' Newsletter'],
  contactFormConfirmation: [<FiMail key="icon" size={16} />, ' Contact Form Response']
};

const TEMPLATE_VARIABLES = {
  passwordReset: [
    { label: 'Reset Link', variable: '{{resetLink}}' },
    { label: 'Expiration Time', variable: '{{expirationTime}}' },
    { label: 'Email', variable: '{{email}}' }
  ],
  welcome: [
    { label: 'Display Name', variable: '{{displayName}}' },
    { label: 'Email', variable: '{{email}}' },
    { label: 'Confirmation Link', variable: '{{confirmationLink}}' },
    { label: 'Current Year', variable: '{{currentYear}}' }
  ],
  orderConfirmation: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Order Date', variable: '{{orderDate}}' },
    { label: 'Items', variable: '{{items}}' },
    { label: 'Subtotal', variable: '{{subtotal}}' },
    { label: 'Total', variable: '{{total}}' },
    { label: 'Shipping Fee', variable: '{{shippingFee}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' },
    { label: 'Current Year', variable: '{{currentYear}}' }
  ],
  orderStatus: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Status', variable: '{{status}}' },
    { label: 'Status Message', variable: '{{statusMessage}}' },
    { label: 'Tracking Number', variable: '{{trackingNumber}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' },
    { label: 'Current Year', variable: '{{currentYear}}' }
  ],
  orderPending: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Order Date', variable: '{{orderDate}}' },
    { label: 'Total', variable: '{{total}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' }
  ],
  orderProcessing: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Items', variable: '{{items}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' }
  ],
  orderShipped: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Tracking Number', variable: '{{trackingNumber}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' },
    { label: 'Estimated Delivery', variable: '{{estimatedDelivery}}' }
  ],
  orderCompleted: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' },
    { label: 'Current Year', variable: '{{currentYear}}' }
  ],
  orderCancelled: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Status Message', variable: '{{statusMessage}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' }
  ],
  orderReturned: [
    { label: 'Order Number', variable: '{{orderNumber}}' },
    { label: 'Status Message', variable: '{{statusMessage}}' },
    { label: 'Tracking URL', variable: '{{trackingUrl}}' }
  ],
  newsletter: [
    { label: 'Display Name', variable: '{{displayName}}' },
    { label: 'Email', variable: '{{email}}' },
    { label: 'Unsubscribe Link', variable: '{{unsubscribeLink}}' },
    { label: 'Current Year', variable: '{{currentYear}}' }
  ],
  contactFormConfirmation: [
    { label: 'Customer Name', variable: '{{name}}' },
    { label: 'Customer Email', variable: '{{email}}' },
    { label: 'Message Subject', variable: '{{subject}}' },
    { label: 'Message', variable: '{{message}}' },
    { label: 'Phone', variable: '{{phone}}' },
    { label: 'Current Year', variable: '{{currentYear}}' }
  ]
};

const EmailTemplateEditor = () => {
  const { templates, loading, error, updateTemplate, resetTemplate, getDefaultTemplate, emailTypes } = useEmailTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState('passwordReset');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Load template when selected or when templates load
  React.useEffect(() => {
    if (templates[selectedTemplate]) {
      setSubject(templates[selectedTemplate].subject || '');
      setHtmlContent(templates[selectedTemplate].htmlContent || '');
    }
  }, [selectedTemplate, templates]);

  const handleSave = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      showMessage('Please fill in both subject and content', 'error');
      return;
    }

    setSaving(true);
    const success = await updateTemplate(selectedTemplate, {
      subject,
      htmlContent
    });

    if (success) {
      showMessage('Template saved successfully!', 'success');
    } else {
      showMessage('Failed to save template', 'error');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset this template to default?')) {
      setSaving(true);
      const success = await resetTemplate(selectedTemplate);
      if (success) {
        const defaultTemplate = getDefaultTemplate(selectedTemplate);
        setSubject(defaultTemplate.subject);
        setHtmlContent(defaultTemplate.htmlContent);
        showMessage('Template reset to default', 'success');
      } else {
        showMessage('Failed to reset template', 'error');
      }
      setSaving(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const insertVariable = (variable) => {
    const textarea = document.querySelector('.html-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = htmlContent.substring(0, start) + variable + htmlContent.substring(end);
      setHtmlContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  if (loading) {
    return <div className="email-editor-loading">Loading templates...</div>;
  }

  const variables = TEMPLATE_VARIABLES[selectedTemplate] || [];

  return (
    <div className="email-template-editor">
      <h2><FiMail size={24} style={{marginRight: '12px', display: 'inline'}} /> Email Template Manager</h2>
      
      {error && <div className="editor-alert editor-alert-error">{error}</div>}
      {message && <div className={`editor-alert editor-alert-${messageType}`}>{message}</div>}

      <div className="editor-container">
        {/* Template Selector */}
        <div className="template-tabs">
          {emailTypes.map(type => (
            <button
              key={type}
              className={`template-tab ${selectedTemplate === type ? 'active' : ''}`}
              onClick={() => setSelectedTemplate(type)}
            >
              {TEMPLATE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="editor-content">
          {/* Main Editor */}
          <div className="editor-main">
            <div className="form-group">
              <label>Email Subject</label>
              <input
                type="text"
                className="subject-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
              />
            </div>

            <div className="form-group">
              <label>HTML Content</label>
              <textarea
                className="html-editor"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter HTML email content"
              />
            </div>

            {/* Editor Actions */}
            <div className="editor-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Template'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleReset}
                disabled={saving}
              >
                ↻ Reset to Default
              </button>
            </div>
          </div>

          {/* Variables Panel */}
          <div className="editor-sidebar">
            <h4>📝 Available Variables</h4>
            <p className="sidebar-hint">Click a variable to insert it at cursor position</p>
            <div className="variables-grid">
              {variables.map((v, idx) => (
                <button
                  key={idx}
                  className="variable-btn"
                  onClick={() => insertVariable(v.variable)}
                  title={v.label}
                >
                  <span className="variable-text">{v.variable}</span>
                  <span className="variable-label">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
