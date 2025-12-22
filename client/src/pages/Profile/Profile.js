import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from '../../components/ProfileModal/ProfileModal';
import './Profile.css';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    // Auto-open modal when component mounts
    setIsModalOpen(true);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="profile-page-wrapper">
        <div className="profile-empty-state">
          <h2>Please log in to access your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page-wrapper">
        <div className="profile-content-center">
          <div className="profile-welcome">
            <div className="profile-avatar-display">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">{user?.username?.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <h1>Welcome, {user?.username}!</h1>
            <p className="profile-subtitle">Manage your profile and settings</p>
            <button 
              className="open-profile-btn"
              onClick={() => setIsModalOpen(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
      
      <ProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default Profile;
