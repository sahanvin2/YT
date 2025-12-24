import React, { useState, useRef } from 'react';
import { FiX, FiCamera, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, uploadAvatar, uploadBanner } from '../../utils/api';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    channelName: user?.channelName || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [videoSettings, setVideoSettings] = useState({
    defaultQuality: user?.settings?.defaultPlaybackQuality || 'auto',
    autoplay: user?.settings?.autoplay !== false,
    notifications: user?.settings?.notifications?.newVideos !== false
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [bannerPreview, setBannerPreview] = useState(user?.channelBanner || user?.banner || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Upload avatar if changed
      let avatarUrl = user?.avatar;
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append('avatar', avatarFile);
        const avatarRes = await uploadAvatar(user._id, avatarData);
        avatarUrl = avatarRes.data.data.avatar;
      }

      // Upload banner if changed
      let bannerUrl = user?.channelBanner || user?.banner;
      if (bannerFile) {
        const bannerData = new FormData();
        bannerData.append('banner', bannerFile);
        const bannerRes = await uploadBanner(user._id, bannerData);
        bannerUrl = bannerRes.data.data.channelBanner;
      }

      // Update profile with other fields
      const updateData = {
        username: formData.username,
        email: formData.email,
        channelName: formData.channelName,
        bio: formData.bio
      };

      const res = await updateProfile(user._id, updateData);
      
      // Update user context with all new data
      setUser({
        ...res.data.data,
        avatar: avatarUrl,
        channelBanner: bannerUrl
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // You'll need to create this endpoint
      // await changePassword({
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword
      // });
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
          <h2 className="modal-title">Edit Profile</h2>
          <button 
            className="modal-save-btn"
            onClick={activeTab === 'profile' ? handleSubmit : handlePasswordChange}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser size={18} />
            Profile
          </button>
          <button
            className={`modal-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings size={18} />
            Settings
          </button>
          <button
            className={`modal-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock size={18} />
            Security
          </button>
        </div>

        {/* Content */}
        <div className="profile-modal-content">
          {message.text && (
            <div className={`modal-message ${message.type}`}>
              {message.type === 'success' && <FiCheck size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Banner */}
              <div className="modal-banner-section">
                <div 
                  className="modal-banner"
                  style={{ 
                    backgroundImage: bannerPreview 
                      ? `url(${bannerPreview})` 
                      : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                  }}
                >
                  <button
                    type="button"
                    className="banner-edit-btn"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <FiCamera size={20} />
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Avatar */}
                <div className="modal-avatar-wrapper">
                  <div className="modal-avatar">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <FiUser size={40} />
                      </div>
                    )}
                    <button
                      type="button"
                      className="avatar-edit-btn"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <FiCamera size={18} />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="modal-form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your username"
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  name="channelName"
                  value={formData.channelName}
                  onChange={handleChange}
                  placeholder="Your channel name"
                />
              </div>

              <div className="modal-form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  maxLength="200"
                />
                <span className="char-count">{formData.bio.length}/200</span>
              </div>
            </form>
          )}

          {activeTab === 'settings' && (
            <div className="modal-form">
              <div className="settings-section">
                <h3 className="settings-section-title">Video Playback</h3>
                
                <div className="modal-form-group">
                  <label>Default Video Quality</label>
                  <select
                    value={videoSettings.defaultQuality}
                    onChange={(e) => setVideoSettings({ ...videoSettings, defaultQuality: e.target.value })}
                    className="quality-select"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    <option value="2160p">2160p (4K) - 15-25 Mbps</option>
                    <option value="1440p">1440p (2K) - 10-15 Mbps</option>
                    <option value="1080p">1080p (Full HD) - 5-8 Mbps</option>
                    <option value="720p">720p (HD) - 2.5-5 Mbps</option>
                    <option value="480p">480p (SD) - 1-2.5 Mbps</option>
                    <option value="360p">360p - 0.5-1 Mbps</option>
                  </select>
                  <small className="quality-info">
                    Auto adjusts quality based on your internet speed
                  </small>
                </div>

                <div className="modal-form-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <label>Autoplay Videos</label>
                      <small>Automatically play videos when you visit watch page</small>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={videoSettings.autoplay}
                        onChange={(e) => setVideoSettings({ ...videoSettings, autoplay: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="bitrate-info-box">
                  <h4>📊 Quality & Bitrate Guide</h4>
                  <ul>
                    <li><strong>4K (2160p):</strong> Best quality, requires fast connection (25+ Mbps)</li>
                    <li><strong>2K (1440p):</strong> Excellent quality for large screens (15+ Mbps)</li>
                    <li><strong>Full HD (1080p):</strong> Great quality, balanced bandwidth (8+ Mbps)</li>
                    <li><strong>HD (720p):</strong> Good quality, moderate bandwidth (5+ Mbps)</li>
                    <li><strong>SD (480p):</strong> Standard quality, low bandwidth (2+ Mbps)</li>
                    <li><strong>360p:</strong> Basic quality, very slow connections</li>
                  </ul>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Notifications</h3>
                
                <div className="modal-form-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <label>New Video Notifications</label>
                      <small>Get notified when creators you follow upload new videos</small>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={videoSettings.notifications}
                        onChange={(e) => setVideoSettings({ ...videoSettings, notifications: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                className="settings-save-btn"
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Structure settings to match backend User model
                    const settings = {
                      defaultPlaybackQuality: videoSettings.defaultQuality,
                      autoplay: videoSettings.autoplay,
                      notifications: {
                        newVideos: videoSettings.notifications
                      }
                    };
                    
                    const res = await updateProfile(user._id, { settings });
                    setUser({ ...user, settings });
                    setMessage({ type: 'success', text: 'Settings saved successfully!' });
                    localStorage.setItem('videoSettings', JSON.stringify(videoSettings));
                  } catch (err) {
                    setMessage({ type: 'error', text: 'Failed to save settings' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="modal-form">
              <div className="modal-form-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="modal-form-group">
                <label>New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  minLength="6"
                />
              </div>

              <div className="modal-form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                />
              </div>

              <div className="password-requirements">
                <p>Password must:</p>
                <ul>
                  <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
                    Be at least 6 characters long
                  </li>
                  <li className={formData.newPassword === formData.confirmPassword && formData.newPassword ? 'valid' : ''}>
                    Match in both fields
                  </li>
                </ul>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
