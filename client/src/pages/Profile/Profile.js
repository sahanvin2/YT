import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, uploadAvatar } from '../../utils/api';
import { FiUpload, FiX } from 'react-icons/fi';
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
  const [form, setForm] = useState({
    username: '',
    email: '',
    channelName: '',
    channelDescription: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isCustomAvatar, setIsCustomAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      const currentAvatar = user.avatar || avatarOptions[0];
      const isCustom = currentAvatar && !avatarOptions.includes(currentAvatar);
      
      setForm({
        username: user.username || '',
        email: user.email || '',
        channelName: user.channelName || user.username || '',
        channelDescription: user.channelDescription || '',
        avatar: currentAvatar
      });
      setIsCustomAvatar(isCustom);
      setAvatarPreview(isCustom ? currentAvatar : null);
    }
  }, [user]);

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
    setForm(prev => ({ ...prev, [name]: value }));
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setIsCustomAvatar(true);
      setForm(prev => ({ ...prev, avatar: reader.result }));
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
        // Clear file input
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
        username: form.username,
        email: form.email,
        channelName: form.channelName,
        channelDescription: form.channelDescription,
        avatar: form.avatar
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

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Profile Settings</h2>
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input name="username" value={form.username} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Channel Name</label>
              <input name="channelName" value={form.channelName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Channel Description</label>
            <textarea name="channelDescription" rows={4} value={form.channelDescription} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Profile Picture</label>
            
            {/* Current Avatar Preview */}
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

            {/* Custom Avatar Upload */}
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

            {/* Default Avatar Options */}
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
    </div>
  );
};

export default Profile;
