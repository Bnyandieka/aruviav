// Admin Email Inbox Component with Gmail-like Sections
import React, { useState, useEffect } from 'react';
import {
  MdOutlineMailOutline,
  MdDeleteOutline,
  MdSearch,
  MdOutlineMarkEmailRead,
  MdClear,
  MdExpandMore,
  MdOutlineStarOutline,
  MdOutlineStar,
  MdOutlineSnooze,
  MdOutlineSend,
  MdOutlineEdit,
  MdOutlineInbox,
  MdMoreVert,
  MdRefresh,
  MdOutlineArchive,
  MdUndo
} from 'react-icons/md';
import {
  getEmailsBySection,
  deleteAdminEmail,
  markEmailAsRead,
  deleteAdminEmails,
  markEmailsAsRead,
  toggleEmailStar,
  snoozeEmail,
  unsnoozeEmail,
  markAllAsRead,
  createDraftEmail,
  sanitizeEmailContent,
  detectTemplateType,
  extractTextPreview
} from '../../../services/email/adminEmailService';
import { toast } from 'react-toastify';
import './AdminEmailInbox.css';

export default function AdminEmailInbox() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentSection, setCurrentSection] = useState('inbox');
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState({ to: '', subject: '', htmlContent: '' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailCounts, setEmailCounts] = useState({
    inbox: 0,
    unread: 0,
    starred: 0,
    snoozed: 0,
    draft: 0,
    sent: 0
  });

  const sections = [
    { id: 'inbox', label: 'Inbox', icon: MdOutlineInbox, badge: emailCounts.inbox },
    { id: 'unread', label: 'Unread', icon: MdOutlineMarkEmailRead, badge: emailCounts.unread },
    { id: 'starred', label: 'Starred', icon: MdOutlineStarOutline, badge: emailCounts.starred },
    { id: 'snoozed', label: 'Snoozed', icon: MdOutlineSnooze, badge: emailCounts.snoozed },
    { id: 'draft', label: 'Draft', icon: MdOutlineEdit, badge: emailCounts.draft },
    { id: 'sent', label: 'Sent', icon: MdOutlineSend, badge: emailCounts.sent }
  ];

  // Load emails when section changes
  useEffect(() => {    fetchEmailsBySection();
  }, [currentSection]);

  // Filter emails based on search and sort
  useEffect(() => {
    let filtered = [...emails];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject?.toLowerCase().includes(searchLower) ||
        email.to?.toLowerCase().includes(searchLower) ||
        email.relatedData?.businessName?.toLowerCase().includes(searchLower) ||
        email.relatedData?.email?.toLowerCase().includes(searchLower)
      );
    }

    if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredEmails(filtered);
  }, [emails, searchTerm, sortBy]);

  const fetchEmailsBySection = async () => {
    setLoading(true);
    try {      const result = await getEmailsBySection(currentSection, 100);

      if (result.success) {        setEmails(result.emails);
        
        // Calculate email counts for all sections
        const allEmailsResult = await getEmailsBySection('all', 1000);
        if (allEmailsResult.success) {
          const allEmails = allEmailsResult.emails;
          setEmailCounts({
            inbox: allEmails.filter(e => !e.isSnoozed && !e.isDraft && !e.isSent).length,
            unread: allEmails.filter(e => !e.isRead && !e.isSnoozed && !e.isDraft).length,
            starred: allEmails.filter(e => e.isStarred === true).length,
            snoozed: allEmails.filter(e => e.isSnoozed === true).length,
            draft: allEmails.filter(e => e.isDraft === true).length,
            sent: allEmails.filter(e => e.isSent === true).length
          });
        }
        
        const unread = result.emails.filter(e => !e.isRead).length;
        setUnreadCount(unread);
      } else {
        console.error('❌ Failed to load emails:', result.error);
        toast.error('Failed to load emails: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Error loading emails: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    if (!window.confirm('Delete this email?')) return;

    try {
      const result = await deleteAdminEmail(emailId);
      if (result.success) {
        setEmails(emails.filter(e => e.id !== emailId));
        setSelectedEmail(null);
        toast.success('Email deleted');
      } else {
        toast.error(result.error || 'Failed to delete email');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error('Error deleting email');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEmails.size === 0) {
      toast.warning('Select emails to delete');
      return;
    }

    if (!window.confirm(`Delete ${selectedEmails.size} email(s)?`)) return;

    try {
      const result = await deleteAdminEmails(Array.from(selectedEmails));
      if (result.success) {
        setEmails(emails.filter(e => !selectedEmails.has(e.id)));
        setSelectedEmails(new Set());
        setSelectedEmail(null);
        toast.success(`${selectedEmails.size} email(s) deleted`);
      } else {
        toast.error(result.error || 'Failed to delete emails');
      }
    } catch (error) {
      console.error('Error deleting emails:', error);
      toast.error('Error deleting emails');
    }
  };

  const handleMarkAsRead = async (emailId) => {
    try {
      const result = await markEmailAsRead(emailId);
      if (result.success) {
        setEmails(emails.map(e =>
          e.id === emailId ? { ...e, isRead: true } : e
        ));
        toast.success('Marked as read');
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
      toast.error('Error updating email');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead();
      if (result.success) {
        setEmails(emails.map(e => ({ ...e, isRead: true })));
        toast.success('All emails marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error updating emails');
    }
  };

  const handleToggleStar = async (emailId, currentStarred) => {
    try {
      const result = await toggleEmailStar(emailId, !currentStarred);
      if (result.success) {
        setEmails(emails.map(e =>
          e.id === emailId ? { ...e, isStarred: !currentStarred } : e
        ));
        toast.success(!currentStarred ? 'Added to starred' : 'Removed from starred');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Error updating email');
    }
  };

  const handleSnoozeEmail = async (emailId, snoozeDays) => {
    try {
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + snoozeDays);

      const result = await snoozeEmail(emailId, snoozeDate);
      if (result.success) {
        setEmails(emails.filter(e => e.id !== emailId));
        setSelectedEmail(null);
        setShowSnoozeMenu(null);
        toast.success(`Email snoozed until ${snoozeDate.toLocaleDateString()}`);
      }
    } catch (error) {
      console.error('Error snoozing email:', error);
      toast.error('Error snoozing email');
    }
  };

  const toggleEmailSelection = (emailId) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (d.getFullYear() === today.getFullYear()) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
  };

  const getEmailTypeLabel = (type) => {
    const labels = {
      vendor_application: '🏪 Vendor App',
      order: '📦 Order',
      general: '📧 General',
      draft: '✏️ Draft'
    };
    return labels[type] || '📧 ' + (type || 'General');
  };

  return (
    <div className="admin-email-inbox-v2">
      {/* Sidebar */}
      <div className="email-sidebar">
        <button className="btn-new-email" onClick={() => setShowDraftModal(true)}>
          <MdOutlineEdit size={18} /> Compose
        </button>

        <div className="email-sections">
          {sections.map(section => (
            <button
              key={section.id}
              className={`section-item ${currentSection === section.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentSection(section.id);
                setSelectedEmails(new Set());
              }}
            >
              <span className="section-icon">{section.label.split(' ')[0]}</span>
              <span className="section-label">{section.label.split(' ').slice(1).join(' ')}</span>
              {section.id === 'unread' && unreadCount > 0 && (
                <span className="section-count">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="email-main-content">
        {/* Header */}
        <div className="email-header-v2">
          <div>
            <h2>{sections.find(s => s.id === currentSection)?.label}</h2>
            <p className="email-count">{emails.length} email{emails.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="btn-action-header" onClick={handleMarkAllAsRead}>
                <MdOutlineMarkEmailRead size={16} /> Mark All Read
              </button>
            )}
            <button className="btn-refresh" onClick={() => fetchEmailsBySection()} disabled={loading}>
              {loading ? '⟳ Loading...' : '⟳ Refresh'}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="email-toolbar-v2">
          <div className="search-bar">
            <MdSearch size={18} />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="toolbar-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {selectedEmails.size > 0 && (
              <div className="batch-actions">
                <button
                  className="btn-batch"
                  onClick={handleMarkAsRead}
                  title="Mark as read"
                >
                  <MdOutlineMarkEmailRead size={16} /> Mark read
                </button>
                <button
                  className="btn-batch"
                  onClick={handleDeleteSelected}
                  title="Delete"
                >
                  <MdDeleteOutline size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Email List */}
        {filteredEmails.length === 0 ? (
          <div className="email-empty-v2">
            <MdOutlineMailOutline size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No emails in this section</p>
          </div>
        ) : (
          <div className="email-list-v2">
            {/* List Header */}
            <div className="email-list-header-v2">
              <label className="email-checkbox">
                <input
                  type="checkbox"
                  checked={selectedEmails.size === filteredEmails.length && filteredEmails.length > 0}
                  onChange={toggleAllSelection}
                />
              </label>
              <div className="email-list-columns">
                <div className="col-star"></div>
                <div className="col-subject">Subject</div>
                <div className="col-from">From</div>
                <div className="col-date">Date</div>
              </div>
            </div>

            {/* Email Items */}
            {filteredEmails.map(email => (
              <div
                key={email.id}
                className={`email-item-v2 ${email.isRead ? '' : 'unread'} ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <label
                  className="email-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEmailSelection(email.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    readOnly
                  />
                </label>

                <button
                  className={`star-btn ${email.isStarred ? 'starred' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStar(email.id, email.isStarred);
                  }}
                  title={email.isStarred ? 'Unstar' : 'Star'}
                >
                  {email.isStarred ? <MdOutlineStar size={16} /> : <MdOutlineStarOutline size={16} />}
                </button>

                <div className="email-list-columns">
                  <div className="col-subject">
                    <div className="subject-text">
                      {!email.isRead && <span className="unread-dot">●</span>}
                      {email.subject || '(no subject)'}
                    </div>
                    <div className="email-preview">{email.relatedData?.businessName || email.from}</div>
                  </div>
                  <div className="col-from">{email.relatedData?.email || email.from.split('@')[0]}</div>
                  <div className="col-date">{formatDate(email.createdAt)}</div>
                </div>

                <div className="email-item-actions" onClick={(e) => e.stopPropagation()}>
                  {email.isSnoozed && (
                    <button
                      className="action-btn"
                      onClick={() => unsnoozeEmail(email.id).then(() => fetchEmailsBySection())}
                      title="Unsnooze"
                    >
                      <MdOutlineSnooze size={14} />
                    </button>
                  )}
                  <button
                    className="action-btn"
                    onClick={() => handleDeleteEmail(email.id)}
                    title="Delete"
                  >
                    <MdDeleteOutline size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Preview Panel */}
      {selectedEmail && (
        <div className="email-preview-panel-v2">
          <div className="preview-header-v2">
            <div>
              <h3>{selectedEmail.subject || '(no subject)'}</h3>
              <p className="preview-meta">
                From: <strong>{selectedEmail.from}</strong>
              </p>
              {selectedEmail.relatedData?.businessName && (
                <p className="preview-meta">
                  Business: <strong>{selectedEmail.relatedData.businessName}</strong>
                </p>
              )}
            </div>
            <div className="preview-actions-top">
              <button
                className={`star-btn ${selectedEmail.isStarred ? 'starred' : ''}`}
                onClick={() => handleToggleStar(selectedEmail.id, selectedEmail.isStarred)}
                title={selectedEmail.isStarred ? 'Unstar' : 'Star'}
              >
                {selectedEmail.isStarred ? <MdOutlineStar size={20} /> : <MdOutlineStarOutline size={20} />}
              </button>

              <div className="snooze-menu-container">
                <button
                  className="preview-action-btn"
                  onClick={() => setShowSnoozeMenu(showSnoozeMenu ? null : selectedEmail.id)}
                  title="Snooze"
                >
                  <MdOutlineSnooze size={18} />
                </button>
                {showSnoozeMenu === selectedEmail.id && (
                  <div className="snooze-menu">
                    <button onClick={() => handleSnoozeEmail(selectedEmail.id, 1)}>Later today</button>
                    <button onClick={() => handleSnoozeEmail(selectedEmail.id, 1)}>Tomorrow</button>
                    <button onClick={() => handleSnoozeEmail(selectedEmail.id, 7)}>Next week</button>
                    <button onClick={() => handleSnoozeEmail(selectedEmail.id, 30)}>Next month</button>
                  </div>
                )}
              </div>

              <button
                className="preview-action-btn btn-delete"
                onClick={() => handleDeleteEmail(selectedEmail.id)}
                title="Delete"
              >
                <MdDeleteOutline size={18} />
              </button>

              <button
                className="preview-action-btn btn-close"
                onClick={() => setSelectedEmail(null)}
                title="Close"
              >
                <MdClear size={18} />
              </button>
            </div>
          </div>

          {/* Business Details */}
          {selectedEmail.type === 'vendor_application' && selectedEmail.relatedData && (
            <div className="preview-details-v2">
              <div className="details-section">
                <h4>Applicant Information</h4>
                <div className="detail-row">
                  <span>Name:</span>
                  <span>{selectedEmail.relatedData.firstName} {selectedEmail.relatedData.lastName}</span>
                </div>
                <div className="detail-row">
                  <span>Email:</span>
                  <span>{selectedEmail.relatedData.email}</span>
                </div>
                <div className="detail-row">
                  <span>Phone:</span>
                  <span>{selectedEmail.relatedData.phone}</span>
                </div>
              </div>

              <div className="details-section">
                <h4>Business Details</h4>
                <div className="detail-row">
                  <span>Business Name:</span>
                  <span>{selectedEmail.relatedData.businessName}</span>
                </div>
                <div className="detail-row">
                  <span>Category:</span>
                  <span>{selectedEmail.relatedData.businessCategory}</span>
                </div>
                <div className="detail-row">
                  <span>Address:</span>
                  <span>{selectedEmail.relatedData.businessAddress}</span>
                </div>
              </div>

              <div className="details-section">
                <h4>Business Description</h4>
                <p className="detail-description">{selectedEmail.relatedData.businessDescription}</p>
              </div>
            </div>
          )}

          {/* Email Content */}
          <div className="preview-content-v2">
            <div
              className="email-body"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeEmailContent(selectedEmail.htmlContent).html 
              }}
            />
          </div>
        </div>
      )}

      {/* Draft Compose Modal */}
      {showDraftModal && (
        <div className="draft-modal">
          <div className="draft-modal-content">
            <div className="draft-modal-header">
              <h3>Compose Email</h3>
              <button onClick={() => setShowDraftModal(false)}>
                <MdClear size={20} />
              </button>
            </div>

            <input
              type="email"
              placeholder="To:"
              value={draftData.to}
              onChange={(e) => setDraftData({ ...draftData, to: e.target.value })}
              className="draft-input"
            />

            <input
              type="text"
              placeholder="Subject:"
              value={draftData.subject}
              onChange={(e) => setDraftData({ ...draftData, subject: e.target.value })}
              className="draft-input"
            />

            <textarea
              placeholder="Message body..."
              value={draftData.htmlContent}
              onChange={(e) => setDraftData({ ...draftData, htmlContent: e.target.value })}
              className="draft-textarea"
            />

            <div className="draft-modal-actions">
              <button
                className="btn-draft-save"
                onClick={async () => {
                  const result = await createDraftEmail(draftData);
                  if (result.success) {
                    toast.success('Draft saved');
                    setDraftData({ to: '', subject: '', htmlContent: '' });
                    setShowDraftModal(false);
                  }
                }}
              >
                Save Draft
              </button>
              <button
                className="btn-draft-cancel"
                onClick={() => setShowDraftModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
