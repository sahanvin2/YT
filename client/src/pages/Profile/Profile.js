import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../utils/api';
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
  const [form, setForm] = useState({
    username: '',
    email: '',
    channelName: '',
    channelDescription: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        channelName: user.channelName || user.username || '',
        channelDescription: user.channelDescription || '',
        avatar: user.avatar || avatarOptions[0]
      });
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
            <label>Choose Avatar</label>
            <div className="avatar-grid">
              {avatarOptions.map((src) => (
                <button
                  type="button"
                  key={src}
                  className={`avatar-option ${form.avatar === src ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, avatar: src }))}
                >
                  <img src={src} alt="avatar option" />
                </button>
              ))}
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {message && <span className="message">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
