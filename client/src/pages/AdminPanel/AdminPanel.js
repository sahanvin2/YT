import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShield, FiVideo, FiEdit, FiTrash2, FiUserPlus, FiUserMinus, FiSearch, FiAlertCircle } from 'react-icons/fi';
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
      </div>

      <div className="admin-search">
        <FiSearch />
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

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
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
