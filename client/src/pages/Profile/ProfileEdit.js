import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiCamera, FiUser, FiMail, FiMapPin, FiLink, FiAlertCircle, 
  FiCheckCircle, FiMonitor, FiShield, FiBell, FiSave, FiCheck,
  FiEdit3, FiGlobe, FiType, FiImage
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { user, setUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  });

  const maxBioLength = 160;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'bio' && value.length > maxBioLength) {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');
    setIsSaved(false);
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.website && !formData.website.match(/^https?:\/\//)) {
      setError('Website URL must start with http:// or https://');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('/api/users/profile', formData);
      
      if (response.data) {
        setUser(response.data.user);
        setSuccess('Profile updated successfully!');
        setIsSaved(true);
        setHasChanges(false);
        
        setTimeout(() => {
          setSuccess('');
          setIsSaved(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-settings-container">
      
      {/* Floating Save Button */}
      {hasChanges && !isSaved && (
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="floating-save-btn"
        >
          {loading ? (
            <>
              <div className="spinner" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave size={18} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      )}

      {isSaved && (
        <div className="success-toast">
          <FiCheck size={20} />
          <span>Changes saved successfully</span>
        </div>
      )}

      {/* Main Container */}
      <div className="settings-wrapper">
        
        {/* Sidebar Navigation */}
        <aside className="settings-sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">Settings</h1>
            <p className="sidebar-subtitle">Manage your profile</p>
          </div>
          
          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('profile')}
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <FiUser size={20} />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            >
              <FiImage size={20} />
              <span>Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('streaming')}
              className={`nav-item ${activeTab === 'streaming' ? 'active' : ''}`}
            >
              <FiMonitor size={20} />
              <span>Streaming</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            >
              <FiShield size={20} />
              <span>Security</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            >
              <FiBell size={20} />
              <span>Notifications</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="settings-content">
          
          {error && (
            <div className="alert alert-error">
              <FiAlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Profile Information</h2>
                <p className="section-description">Update your profile details and manage your public presence</p>
              </div>

              {/* Profile Header */}
              <div className="profile-header-card">
                <div className="profile-banner">
                  <img 
                    src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1400&q=80" 
                    alt="Banner" 
                  />
                  <button className="edit-banner-btn">
                    <FiCamera size={16}/>
                    <span>Change Cover</span>
                  </button>
                </div>
                
                <div className="profile-info">
                  <div className="avatar-wrapper">
                    <div className="avatar-container">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          <FiUser size={40} />
                        </div>
                      )}
                    </div>
                    <button className="edit-avatar-btn">
                      <FiCamera size={14} />
                    </button>
                  </div>
                  
                  <div className="profile-meta">
                    <h3 className="profile-name">{formData.username || 'Your Name'}</h3>
                    <p className="profile-username">@{user?.username || 'username'}</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-card">
                <div className="form-section">
                  <label className="form-label">
                    <FiUser size={16} />
                    <span>Display Name</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="form-section">
                  <label className="form-label">
                    <FiMail size={16} />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-section">
                  <label className="form-label">
                    <FiEdit3 size={16} />
                    <span>Bio</span>
                  </label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-textarea"
                    rows="4"
                    maxLength={maxBioLength}
                    placeholder="Tell us about yourself..."
                  />
                  <div className="char-counter">
                    <span className={formData.bio.length > maxBioLength * 0.9 ? 'warning' : ''}>
                      {formData.bio.length} / {maxBioLength}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-section">
                    <label className="form-label">
                      <FiMapPin size={16} />
                      <span>Location</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">
                      <FiGlobe size={16} />
                      <span>Website</span>
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Appearance</h2>
                <p className="section-description">Customize how your profile looks</p>
              </div>

              <div className="form-card">
                <div className="info-box">
                  <FiImage size={24} />
                  <div>
                    <h4>Profile Customization</h4>
                    <p>Additional appearance options coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'streaming' && (
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Streaming Settings</h2>
                <p className="section-description">Configure your broadcast preferences</p>
              </div>

              <div className="form-card">
                <div className="info-box">
                  <FiMonitor size={24} />
                  <div>
                    <h4>Streaming Configuration</h4>
                    <p>Advanced streaming options coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Security & Privacy</h2>
                <p className="section-description">Manage your account security</p>
              </div>

              <div className="form-card">
                <div className="info-box">
                  <FiShield size={24} />
                  <div>
                    <h4>Account Security</h4>
                    <p>Security options coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Notifications</h2>
                <p className="section-description">Control your notification preferences</p>
              </div>

              <div className="form-card">
                <div className="info-box">
                  <FiBell size={24} />
                  <div>
                    <h4>Notification Settings</h4>
                    <p>Notification controls coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfileEdit;
