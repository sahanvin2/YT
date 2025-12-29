import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShield, FiVideo, FiEdit, FiTrash2, FiUserPlus, FiUserMinus, FiSearch, FiAlertCircle, FiBell, FiMail, FiSend } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Notification state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    recipients: 'all_users',
    selectedUsers: [],
    priority: 'normal',
    expiresAt: '',
    link: ''
  });
  const [allUsers, setAllUsers] = useState([]);
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // Email state
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    recipients: 'single',
    subject: '',
    message: ''
  });
  const [emailUsers, setEmailUsers] = useState([]);
  const [selectedEmailUsers, setSelectedEmailUsers] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailHealth, setEmailHealth] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch data on mount and tab change
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [activeTab, isAuthenticated, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (activeTab === 'users') {
        const res = await axios.get('/api/admin/users', config);
        setUsers(res.data.data.filter(u => !u.isUploadAdmin && u.role !== 'admin'));
      } else if (activeTab === 'admins') {
        const res = await axios.get('/api/admin/users', config);
        setAdmins(res.data.data.filter(u => u.isUploadAdmin || u.role === 'admin'));
      } else if (activeTab === 'videos') {
        const res = await axios.get('/api/admin/videos', config);
        setVideos(res.data.data);
      } else if (activeTab === 'notifications') {
        // Fetch all users for notification sending
        const res = await axios.get('/api/system-notifications/users', config);
        setAllUsers(res.data.data.users);
      } else if (activeTab === 'email') {
        // Fetch email service health and users
        try {
          const healthRes = await axios.get('/api/admin/email/health', config);
          setEmailHealth(healthRes.data.data);
        } catch (err) {
          setEmailHealth({ configured: false, working: false, message: 'Unable to check email health' });
        }
        const usersRes = await axios.get('/api/admin/email/users', config);
        setEmailUsers(usersRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const isMasterAdmin = user?.email === 'snawarathne60@gmail.com';

  const promoteToAdmin = async (userId) => {
    if (!window.confirm('Promote this user to admin?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/promote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User promoted to admin successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const demoteToUser = async (userId) => {
    if (!isMasterAdmin) {
      setError('Only master admin can demote admins');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm('Demote this admin to regular user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/demote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Admin demoted to user successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to demote admin');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteUser = async (userId) => {
    if (!isMasterAdmin) {
      setError('Only master admin can delete users');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm('Permanently delete this user? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Video deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete video');
      setTimeout(() => setError(''), 3000);
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!isMasterAdmin) {
      setError('Only master admin can send notifications');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!notificationForm.title || !notificationForm.message) {
      setError('Title and message are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSendingNotification(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/system-notifications', notificationForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Notification sent successfully!');
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all_users',
        selectedUsers: [],
        priority: 'normal',
        expiresAt: '',
        link: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleNotificationChange = (field, value) => {
    setNotificationForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleUserSelection = (userId) => {
    setNotificationForm(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  // Email functions
  const handleEmailChange = (field, value) => {
    setEmailForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleEmailUserSelection = (userId) => {
    setSelectedEmailUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const sendEmailHandler = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (emailForm.recipients === 'single') {
        // Send to single user
        if (!emailForm.recipient) {
          setError('Please enter a recipient email');
          setSendingEmail(false);
          return;
        }
        await axios.post('/api/admin/email/send', {
          to: emailForm.recipient,
          subject: emailForm.subject,
          message: emailForm.message
        }, config);
        setSuccess('Email sent successfully!');
      } else {
        // Broadcast to multiple users
        let recipients;
        if (emailForm.recipients === 'selected') {
          recipients = selectedEmailUsers;
          if (recipients.length === 0) {
            setError('Please select at least one user');
            setSendingEmail(false);
            return;
          }
        } else {
          recipients = emailForm.recipients; // 'all', 'admins', 'verified'
        }
        
        const res = await axios.post('/api/admin/email/broadcast', {
          recipients,
          subject: emailForm.subject,
          message: emailForm.message
        }, config);
        setSuccess(`Email broadcast complete! Sent: ${res.data.data.sent}, Failed: ${res.data.data.failed}`);
      }

      // Reset form
      setEmailForm({ recipient: '', recipients: 'single', subject: '', message: '' });
      setSelectedEmailUsers([]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdmins = admins.filter(a => 
    a.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(v => 
    v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        {isMasterAdmin && <span className="master-badge">Master Admin</span>}
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <FiAlertCircle /> {error}
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          {success}
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> Users ({users.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          <FiShield /> Admins ({admins.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <FiVideo /> Videos ({videos.length})
        </button>
        {isMasterAdmin && (
          <>
            <button 
              className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <FiBell /> Send Notification
            </button>
            <button 
              className={`admin-tab ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              <FiMail /> Send Email
            </button>
          </>
        )}
      </div>

      {activeTab !== 'notifications' && activeTab !== 'messages' && (
        <div className="admin-search">
          <FiSearch />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : (
        <div className="admin-content">
          {activeTab === 'users' && (
            <div className="admin-users-list">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Videos</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="6" className="no-data">No users found</td></tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u._id}>
                        <td>
                          <img 
                            src={u.avatar || '/avatars/default-avatar.png'} 
                            alt={u.username}
                            className="admin-avatar"
                          />
                        </td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>{u.videoCount || 0}</td>
                        <td>
                          <button 
                            className="admin-btn admin-btn-success"
                            onClick={() => promoteToAdmin(u._id)}
                            title="Promote to Admin"
                          >
                            <FiUserPlus />
                          </button>
                          {isMasterAdmin && (
                            <button 
                              className="admin-btn admin-btn-danger"
                              onClick={() => deleteUser(u._id)}
                              title="Delete User"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="admin-users-list">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Videos</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.length === 0 ? (
                    <tr><td colSpan="7" className="no-data">No admins found</td></tr>
                  ) : (
                    filteredAdmins.map(a => (
                      <tr key={a._id}>
                        <td>
                          <img 
                            src={a.avatar || '/avatars/default-avatar.png'} 
                            alt={a.username}
                            className="admin-avatar"
                          />
                        </td>
                        <td>
                          {a.username}
                          {a.email === 'snawarathne60@gmail.com' && (
                            <span className="master-badge-small">Master</span>
                          )}
                        </td>
                        <td>{a.email}</td>
                        <td>
                          <span className="role-badge">{a.role}</span>
                        </td>
                        <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td>{a.videoCount || 0}</td>
                        <td>
                          {isMasterAdmin && a.email !== 'snawarathne60@gmail.com' && (
                            <>
                              <button 
                                className="admin-btn admin-btn-warning"
                                onClick={() => demoteToUser(a._id)}
                                title="Demote to User"
                              >
                                <FiUserMinus />
                              </button>
                              <button 
                                className="admin-btn admin-btn-danger"
                                onClick={() => deleteUser(a._id)}
                                title="Delete Admin"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                          {a.email === 'snawarathne60@gmail.com' && (
                            <span className="protected-label">Protected</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="admin-videos-list">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Title</th>
                    <th>Uploader</th>
                    <th>Views</th>
                    <th>Duration</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.length === 0 ? (
                    <tr><td colSpan="7" className="no-data">No videos found</td></tr>
                  ) : (
                    filteredVideos.map(v => (
                      <tr key={v._id}>
                        <td>
                          <img 
                            src={v.thumbnail || '/default-thumbnail.jpg'} 
                            alt={v.title}
                            className="admin-thumbnail"
                          />
                        </td>
                        <td className="video-title">{v.title}</td>
                        <td>{v.user?.username || 'Unknown'}</td>
                        <td>{v.views?.toLocaleString() || 0}</td>
                        <td>{v.duration || 'N/A'}</td>
                        <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="admin-btn admin-btn-primary"
                            onClick={() => navigate(`/watch/${v._id}`)}
                            title="View Video"
                          >
                            <FiVideo />
                          </button>
                          <button 
                            className="admin-btn admin-btn-danger"
                            onClick={() => deleteVideo(v._id)}
                            title="Delete Video"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'notifications' && isMasterAdmin && (
            <div className="notification-form-container">
              <h2>Send System Notification</h2>
              <p className="notification-description">
                Send important announcements to users and admins
              </p>

              <form onSubmit={sendNotification} className="notification-form">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => handleNotificationChange('title', e.target.value)}
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => handleNotificationChange('message', e.target.value)}
                    placeholder="Enter notification message"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={notificationForm.type}
                      onChange={(e) => handleNotificationChange('type', e.target.value)}
                    >
                      <option value="info">💡 Info</option>
                      <option value="announcement">📢 Announcement</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="success">✅ Success</option>
                      <option value="error">❌ Error</option>
                      <option value="update">🔄 Update</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={notificationForm.priority}
                      onChange={(e) => handleNotificationChange('priority', e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Send To</label>
                  <select
                    value={notificationForm.recipients}
                    onChange={(e) => handleNotificationChange('recipients', e.target.value)}
                  >
                    <option value="all_users">All Users</option>
                    <option value="all_admins">All Admins</option>
                    <option value="selected">Selected Users</option>
                  </select>
                </div>

                {notificationForm.recipients === 'selected' && (
                  <div className="form-group">
                    <label>Select Users ({notificationForm.selectedUsers.length} selected)</label>
                    <div className="user-selection-grid">
                      {allUsers.map(user => (
                        <div key={user._id} className="user-checkbox">
                          <input
                            type="checkbox"
                            id={`user-${user._id}`}
                            checked={notificationForm.selectedUsers.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                          />
                          <label htmlFor={`user-${user._id}`}>
                            <img src={user.avatar || '/avatars/default-avatar.png'} alt={user.username} />
                            <span>{user.username}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Link (Optional)</label>
                    <input
                      type="text"
                      value={notificationForm.link}
                      onChange={(e) => handleNotificationChange('link', e.target.value)}
                      placeholder="/watch/12345 or full URL"
                    />
                  </div>

                  <div className="form-group">
                    <label>Expires At (Optional)</label>
                    <input
                      type="datetime-local"
                      value={notificationForm.expiresAt}
                      onChange={(e) => handleNotificationChange('expiresAt', e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="send-notification-btn"
                  disabled={sendingNotification}
                >
                  <FiSend /> {sendingNotification ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'email' && isMasterAdmin && (
            <div className="email-form-container">
              <h2>📧 Send Email</h2>
              
              {/* Email Health Status */}
              {emailHealth && (
                <div className={`email-health ${emailHealth.working ? 'healthy' : 'unhealthy'}`}>
                  {emailHealth.working ? (
                    <>✅ Email service is ready</>
                  ) : (
                    <>⚠️ Email service: {emailHealth.message}</>
                  )}
                </div>
              )}

              <form onSubmit={sendEmailHandler} className="email-form">
                <div className="form-group">
                  <label>Send To</label>
                  <select
                    value={emailForm.recipients}
                    onChange={(e) => handleEmailChange('recipients', e.target.value)}
                  >
                    <option value="single">Single User</option>
                    <option value="selected">Selected Users</option>
                    <option value="all">All Verified Users</option>
                    <option value="admins">All Admins</option>
                  </select>
                </div>

                {emailForm.recipients === 'single' && (
                  <div className="form-group">
                    <label>Recipient Email</label>
                    <input
                      type="email"
                      value={emailForm.recipient}
                      onChange={(e) => handleEmailChange('recipient', e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                )}

                {emailForm.recipients === 'selected' && (
                  <div className="form-group">
                    <label>Select Recipients ({selectedEmailUsers.length} selected)</label>
                    <div className="user-selection-grid">
                      {emailUsers.map(user => (
                        <div key={user._id} className="user-checkbox">
                          <input
                            type="checkbox"
                            id={`email-user-${user._id}`}
                            checked={selectedEmailUsers.includes(user._id)}
                            onChange={() => toggleEmailUserSelection(user._id)}
                          />
                          <label htmlFor={`email-user-${user._id}`}>
                            <img src={user.avatar || '/avatars/default-avatar.png'} alt={user.username} />
                            <span>{user.username}</span>
                            <small>{user.email}</small>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => handleEmailChange('subject', e.target.value)}
                    placeholder="Email subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => handleEmailChange('message', e.target.value)}
                    placeholder="Write your message here..."
                    rows="8"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="send-email-btn"
                  disabled={sendingEmail || !emailHealth?.working}
                >
                  <FiSend /> {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
