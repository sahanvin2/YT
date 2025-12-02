import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  updateProfile, 
  uploadAvatar, 
  uploadBanner, 
  updateSettings,
  createPlaylist,
  getPlaylists,
  deletePlaylist,
  createChannel,
  getMyChannels,
  deleteChannel
} from '../../utils/api';
import { FiUpload, FiX, FiSettings, FiImage, FiList, FiSave, FiTrash2, FiPlus, FiEdit2, FiVideo, FiTrash } from 'react-icons/fi';
import './Profile.css';

const avatarOptions = [
  '/avatars/avatar1.svg',
  '/avatars/avatar2.svg',
  '/avatars/avatar3.svg',
  '/avatars/avatar4.svg',
  '/avatars/avatar5.svg',
  '/avatars/avatar6.svg'
];

const Profile = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    username: '',
    email: '',
    channelName: '',
    channelDescription: '',
    avatar: '',
    country: '',
    language: 'en',
    socialLinks: {
      youtube: '',
      twitter: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      website: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      address: ''
    }
  });
  const [settings, setSettings] = useState({
    defaultPlaybackQuality: 'auto',
    defaultDownloadQuality: 'highest',
    downloadOverWifiOnly: false,
    autoplay: true,
    subtitles: false
  });
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isCustomAvatar, setIsCustomAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      const currentAvatar = user.avatar || avatarOptions[0];
      const isCustom = currentAvatar && !avatarOptions.includes(currentAvatar);
      
      setForm({
        username: user.username || user.name || '',
        email: user.email || '',
        channelName: user.channelName || user.username || user.name || '',
        channelDescription: user.channelDescription || '',
        avatar: currentAvatar,
        country: user.country || '',
        language: user.language || 'en',
        socialLinks: user.socialLinks || {
          youtube: '',
          twitter: '',
          instagram: '',
          facebook: '',
          tiktok: '',
          website: ''
        },
        contactInfo: user.contactInfo || {
          email: '',
          phone: '',
          address: ''
        }
      });
      setIsCustomAvatar(isCustom);
      setAvatarPreview(isCustom ? currentAvatar : null);
      setBannerPreview(user.channelBanner || null);
      
      if (user.settings) {
        setSettings({
          defaultPlaybackQuality: user.settings.defaultPlaybackQuality || 'auto',
          defaultDownloadQuality: user.settings.defaultDownloadQuality || 'highest',
          downloadOverWifiOnly: user.settings.downloadOverWifiOnly || false,
          autoplay: user.settings.autoplay !== undefined ? user.settings.autoplay : true,
          subtitles: user.settings.subtitles || false
        });
      }
      
      loadPlaylists();
      loadChannels();
    }
  }, [user]);

  const loadPlaylists = async () => {
    try {
      const res = await getPlaylists();
      setPlaylists(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  };

  const loadChannels = async () => {
    try {
      const res = await getMyChannels();
      setChannels(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Please sign in to manage your profile.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects (socialLinks, contactInfo)
    if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: value
        }
      }));
    } else if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarSelect = (avatarSrc) => {
    setForm(prev => ({ ...prev, avatar: avatarSrc }));
    setIsCustomAvatar(false);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setIsCustomAvatar(true);
      setForm(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
    setMessage('');
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('Banner size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setMessage('');
  };

  const handleUploadAvatar = async () => {
    if (!fileInputRef.current || !fileInputRef.current.files[0]) {
      setMessage('Please select an image file');
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('avatar', fileInputRef.current.files[0]);

      const res = await uploadAvatar(user.id, formData);
      
      if (res.data.success) {
        setForm(prev => ({ ...prev, avatar: res.data.data.avatar }));
        setAvatarPreview(res.data.data.avatar);
        setIsCustomAvatar(true);
        await refreshUser?.();
        setMessage('Avatar uploaded successfully!');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to upload avatar');
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerInputRef.current || !bannerInputRef.current.files[0]) {
      setMessage('Please select a banner image');
      return;
    }

    try {
      setUploadingBanner(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('banner', bannerInputRef.current.files[0]);

      const res = await uploadBanner(user.id, formData);
      
      if (res.data.success) {
        setBannerPreview(res.data.data.channelBanner);
        await refreshUser?.();
        setMessage('Banner uploaded successfully!');
        if (bannerInputRef.current) {
          bannerInputRef.current.value = '';
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to upload banner');
      console.error(err);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveCustomAvatar = () => {
    setAvatarPreview(null);
    setIsCustomAvatar(false);
    setForm(prev => ({ ...prev, avatar: avatarOptions[0] }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      await updateProfile(user.id, {
        email: form.email,
        channelDescription: form.channelDescription,
        avatar: form.avatar,
        country: form.country,
        language: form.language,
        socialLinks: form.socialLinks,
        contactInfo: form.contactInfo
        // username and channelName are not included - they cannot be changed
      });
      await refreshUser?.();
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage('');
      await updateSettings(user.id, settings);
      await refreshUser?.();
      setMessage('Settings saved successfully');
    } catch (err) {
      setMessage('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setMessage('Playlist name is required');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      await createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim(),
        isPublic: true
      });
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreatePlaylist(false);
      await loadPlaylists();
      setMessage('Playlist created successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create playlist');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;

    try {
      setSaving(true);
      await deletePlaylist(playlistId);
      await loadPlaylists();
      setMessage('Playlist deleted successfully');
    } catch (err) {
      setMessage('Failed to delete playlist');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      setMessage('Channel name is required');
      return;
    }

    if (channels.length >= 3) {
      setMessage('You can only create up to 3 channels');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      await createChannel({
        channelName: newChannelName.trim(),
        channelDescription: newChannelDesc.trim()
      });
      setNewChannelName('');
      setNewChannelDesc('');
      setShowCreateChannel(false);
      await loadChannels();
      setMessage('Channel created successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create channel');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to delete this channel? This action cannot be undone.')) return;

    try {
      setSaving(true);
      await deleteChannel(channelId);
      await loadChannels();
      setMessage('Channel deleted successfully');
    } catch (err) {
      setMessage('Failed to delete channel');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Banner Section */}
        <div className="profile-banner-section">
          <div 
            className="profile-banner"
            style={{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <div className="banner-overlay">
              <label className="banner-upload-btn">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleBannerSelect}
                  style={{ display: 'none' }}
                />
                <FiImage size={20} />
                {bannerPreview ? 'Change Banner' : 'Upload Banner'}
              </label>
              {bannerPreview && (
                <button
                  className="banner-save-btn"
                  onClick={handleUploadBanner}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? 'Uploading...' : 'Save Banner'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiEdit2 size={18} />
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            <FiList size={18} />
            Playlists
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings size={18} />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-card">
              <h2>Profile Information</h2>
              <form onSubmit={handleSave} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Username <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>(Cannot be changed)</span></label>
                    <input 
                      name="username" 
                      value={form.username} 
                      disabled
                      style={{ 
                        opacity: 0.6, 
                        cursor: 'not-allowed',
                        backgroundColor: 'var(--bg-color)'
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Channel Name <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>(Cannot be changed)</span></label>
                    <input 
                      name="channelName" 
                      value={form.channelName} 
                      disabled
                      style={{ 
                        opacity: 0.6, 
                        cursor: 'not-allowed',
                        backgroundColor: 'var(--bg-color)'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Channel Description</label>
                  <textarea name="channelDescription" rows={4} value={form.channelDescription} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Profile Picture</label>
                  
                  <div className="avatar-preview-section">
                    <div className="current-avatar-preview">
                      <img 
                        src={avatarPreview || form.avatar || avatarOptions[0]} 
                        alt="Current avatar" 
                        className="preview-image"
                      />
                      {isCustomAvatar && avatarPreview && (
                        <button
                          type="button"
                          className="remove-custom-avatar"
                          onClick={handleRemoveCustomAvatar}
                          title="Remove custom avatar"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="custom-avatar-upload">
                    <label className="upload-label">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <span className="upload-button">
                        <FiUpload size={18} />
                        Upload Custom Image
                      </span>
                    </label>
                    {avatarPreview && isCustomAvatar && (
                      <button
                        type="button"
                        className="btn-upload-avatar"
                        onClick={handleUploadAvatar}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Save Custom Avatar'}
                      </button>
                    )}
                    <p className="upload-hint">Max 5MB. JPEG, PNG, GIF, or WebP</p>
                  </div>

                  <div className="avatar-options-section">
                    <p className="avatar-options-label">Or choose from default avatars:</p>
                    <div className="avatar-grid">
                      {avatarOptions.map((src) => (
                        <button
                          type="button"
                          key={src}
                          className={`avatar-option ${form.avatar === src && !isCustomAvatar ? 'selected' : ''}`}
                          onClick={() => handleAvatarSelect(src)}
                        >
                          <img src={src} alt="avatar option" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="actions">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    <FiSave size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {message && (
                    <span className={`message ${message.includes('successfully') ? 'success' : message.includes('Failed') ? 'error' : ''}`}>
                      {message}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="profile-card">
              <div className="playlists-header">
                <h2>My Channels</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateChannel(!showCreateChannel)}
                  disabled={channels.length >= 3}
                >
                  <FiPlus size={18} />
                  Create Channel {channels.length >= 3 && '(Max 3)'}
                </button>
              </div>

              {showCreateChannel && (
                <div className="create-playlist-form">
                  <div className="form-group">
                    <label>Channel Name</label>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="Enter channel name"
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group">
                    <label>Channel Description (Optional)</label>
                    <textarea
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                      placeholder="Describe your channel..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                  <div className="actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateChannel}
                      disabled={saving || !newChannelName.trim()}
                    >
                      {saving ? 'Creating...' : 'Create Channel'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setShowCreateChannel(false);
                        setNewChannelName('');
                        setNewChannelDesc('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {channels.length > 0 ? (
                <div className="playlists-grid" style={{ marginTop: '24px' }}>
                  {channels.map((channel) => (
                    <div key={channel._id} className="playlist-card">
                      <div className="playlist-thumbnail">
                        {channel.avatar ? (
                          <img src={channel.avatar} alt={channel.channelName} />
                        ) : (
                          <div className="playlist-placeholder">
                            <FiVideo size={32} />
                          </div>
                        )}
                      </div>
                      <div className="playlist-info">
                        <h3>{channel.channelName}</h3>
                        {channel.channelDescription && (
                          <p className="playlist-description">{channel.channelDescription}</p>
                        )}
                        <div className="playlist-actions">
                          <Link
                            to={`/channel/${channel._id}`}
                            className="btn btn-outline"
                            style={{ marginRight: '8px' }}
                          >
                            View Channel
                          </Link>
                          <button
                            className="btn btn-outline"
                            onClick={() => handleDeleteChannel(channel._id)}
                            disabled={saving}
                          >
                            <FiTrash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-content">
                  <p>No channels created yet. Create your first channel to get started!</p>
                </div>
              )}
              {message && (
                <span className={`message ${message.includes('successfully') ? 'success' : message.includes('Failed') ? 'error' : ''}`}>
                  {message}
                </span>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="profile-card">
              <div className="playlists-header">
                <h2>My Playlists</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreatePlaylist(!showCreatePlaylist)}
                >
                  <FiPlus size={18} />
                  Create Playlist
                </button>
              </div>

              {showCreatePlaylist && (
                <div className="create-playlist-form">
                  <div className="form-group">
                    <label>Playlist Name</label>
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Enter playlist name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={newPlaylistDesc}
                      onChange={(e) => setNewPlaylistDesc(e.target.value)}
                      placeholder="Enter playlist description"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleCreatePlaylist} disabled={saving}>
                      Create
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                      setShowCreatePlaylist(false);
                      setNewPlaylistName('');
                      setNewPlaylistDesc('');
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="playlists-grid">
                {playlists.length === 0 ? (
                  <div className="no-playlists">
                    <p>No playlists yet. Create one to get started!</p>
                  </div>
                ) : (
                  playlists.map(playlist => (
                    <div key={playlist._id} className="playlist-card">
                      <div className="playlist-info">
                        <h3>{playlist.name}</h3>
                        <p>{playlist.description || 'No description'}</p>
                        <span className="playlist-count">{playlist.videos?.length || 0} videos</span>
                      </div>
                      <button
                        className="delete-playlist-btn"
                        onClick={() => handleDeletePlaylist(playlist._id)}
                        disabled={saving}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="profile-card">
              <h2>Video Settings</h2>
              <div className="settings-form">
                <div className="settings-section">
                  <h3>Playback Quality</h3>
                  <div className="form-group">
                    <label>Default Playback Quality</label>
                    <select
                      name="defaultPlaybackQuality"
                      value={settings.defaultPlaybackQuality}
                      onChange={handleSettingsChange}
                    >
                      <option value="auto">Auto</option>
                      <option value="144">144p</option>
                      <option value="240">240p</option>
                      <option value="360">360p</option>
                      <option value="480">480p</option>
                      <option value="720">720p</option>
                      <option value="1080">1080p</option>
                      <option value="1440">1440p</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Download Settings</h3>
                  <div className="form-group">
                    <label>Default Download Quality</label>
                    <select
                      name="defaultDownloadQuality"
                      value={settings.defaultDownloadQuality}
                      onChange={handleSettingsChange}
                    >
                      <option value="highest">Highest Available</option>
                      <option value="1080">1080p</option>
                      <option value="720">720p</option>
                      <option value="480">480p</option>
                      <option value="360">360p</option>
                      <option value="240">240p</option>
                      <option value="144">144p</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="downloadOverWifiOnly"
                        checked={settings.downloadOverWifiOnly}
                        onChange={handleSettingsChange}
                      />
                      <span>Download over Wi-Fi only</span>
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Player Settings</h3>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="autoplay"
                        checked={settings.autoplay}
                        onChange={handleSettingsChange}
                      />
                      <span>Autoplay videos</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="subtitles"
                        checked={settings.subtitles}
                        onChange={handleSettingsChange}
                      />
                      <span>Show subtitles by default</span>
                    </label>
                  </div>
                </div>

                <div className="actions">
                  <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
                    <FiSave size={18} />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  {message && (
                    <span className={`message ${message.includes('successfully') ? 'success' : message.includes('Failed') ? 'error' : ''}`}>
                      {message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
