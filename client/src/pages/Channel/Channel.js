import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile, getUserVideos, deleteVideo } from '../../utils/api';
import { formatViews } from '../../utils/helpers';
import VideoCard from '../../components/VideoCard/VideoCard';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import { useAuth } from '../../context/AuthContext';
import { FiTrash2, FiMoreVertical, FiEdit } from 'react-icons/fi';
import EditVideoModal from '../../components/EditVideoModal/EditVideoModal';
import './Channel.css';

const Channel = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const deleteMenuRef = useRef(null);

  useEffect(() => {
    fetchChannelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Close delete dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target)) {
        setShowDeleteConfirm(null);
      }
    };

    if (showDeleteConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteConfirm]);

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      const [profileRes, videosRes] = await Promise.all([
        getUserProfile(id),
        getUserVideos(id)
      ]);

      // Handle different response structures
      const channelData = profileRes.data?.data || profileRes.data;
      const videosData = videosRes.data?.data || videosRes.data || [];

      if (!channelData) {
        throw new Error('Channel data not found');
      }

      setChannel(channelData);
      setVideos(Array.isArray(videosData) ? videosData : []);
      setError('');
    } catch (err) {
      setError('Failed to load channel');
      console.error('Error fetching channel data:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user owns this channel
  const isOwnChannel = isAuthenticated && user && (
    (user.id || user._id) === id
  );

  const handleDeleteClick = (videoId) => {
    setShowDeleteConfirm(videoId);
  };

  const handleEditClick = (video) => {
    setEditingVideo(video);
    setShowDeleteConfirm(null);
  };

  const handleEditUpdate = (updatedVideo) => {
    setVideos(prevVideos => prevVideos.map(v =>
      v._id === updatedVideo._id ? updatedVideo : v
    ));
    setEditingVideo(null);
  };

  const handleDeleteConfirm = async (videoId) => {
    try {
      setDeletingVideoId(videoId);
      await deleteVideo(videoId);

      // Remove video from list
      setVideos(prevVideos => prevVideos.filter(v => v._id !== videoId));
      setShowDeleteConfirm(null);

      // Update channel video count
      if (channel) {
        setChannel(prev => ({
          ...prev,
          videos: (prev.videos || []).filter(v => v._id !== videoId)
        }));
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video. Please try again.');
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="error-container">
        <p className="error-message">{error || 'Channel not found'}</p>
      </div>
    );
  }

  return (
    <div className="channel-page">
      <div className="channel-header">
        <div className="channel-banner"></div>
        <div className="channel-info-header">
          <div className="channel-avatar-large">
            <img
              src={channel.avatar || '/avatars/avatar1.svg'}
              alt={channel.username || channel.name || 'User'}
              onError={(e) => {
                e.target.src = '/avatars/avatar1.svg';
              }}
            />
          </div>
          <div className="channel-details-header">
            <h1>{channel.channelName || channel.username || channel.name}</h1>
            <div className="channel-stats">
              <span>@{channel.username || channel.name || 'user'}</span>
              <span>•</span>
              <span>{formatViews(channel.subscribers?.length || 0)} subscribers</span>
              <span>•</span>
              <span>{videos.length || channel.videos?.length || 0} videos</span>
            </div>
            {channel.channelDescription && (
              <p className="channel-description">{channel.channelDescription}</p>
            )}
          </div>
          {isAuthenticated && user && (user.id || user._id) !== id && (
            <SubscribeButton
              channelId={id}
              initialSubscribed={channel.subscribers?.some(s => {
                const subId = s._id || s;
                const userId = user.id || user._id;
                return subId.toString() === userId.toString();
              })}
              subscriberCount={channel.subscribers?.length || 0}
            />
          )}
        </div>
      </div>

      <div className="channel-tabs">
        <button
          className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      <div className="channel-content">
        {activeTab === 'videos' && (
          <div className="videos-grid">
            {videos.length > 0 ? (
              videos.map((video) => (
                <div key={video._id} className="video-item-wrapper">
                  <VideoCard video={video} />
                  {isOwnChannel && (
                    <div className="video-actions-menu" ref={showDeleteConfirm === video._id ? deleteMenuRef : null}>
                      <button
                        className="video-menu-btn"
                        onClick={() => handleEditClick(video)}
                        title="Edit video"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        className="video-menu-btn"
                        onClick={() => handleDeleteClick(video._id)}
                        title="Delete video"
                        disabled={deletingVideoId === video._id}
                      >
                        <FiTrash2 size={18} />
                      </button>
                      {showDeleteConfirm === video._id && (
                        <div className="delete-confirm-dialog">
                          <p>Are you sure you want to delete this video?</p>
                          <p className="delete-warning">This action cannot be undone.</p>
                          <div className="delete-confirm-actions">
                            <button
                              className="btn-delete-cancel"
                              onClick={handleDeleteCancel}
                              disabled={deletingVideoId === video._id}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn-delete-confirm"
                              onClick={() => handleDeleteConfirm(video._id)}
                              disabled={deletingVideoId === video._id}
                            >
                              {deletingVideoId === video._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-content">
                <p>No videos uploaded yet</p>
              </div>
            )}
            {editingVideo && (
              <EditVideoModal
                video={editingVideo}
                onClose={() => setEditingVideo(null)}
                onUpdate={handleEditUpdate}
              />
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-section">
            <div className="about-card">
              <h3>Description</h3>
              <p>{channel.channelDescription || 'No description provided'}</p>
            </div>
            <div className="about-card">
              <h3>Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <strong>{formatViews(channel.subscribers?.length || 0)}</strong>
                  <span>Subscribers</span>
                </div>
                <div className="stat-item">
                  <strong>{channel.videos?.length || 0}</strong>
                  <span>Videos</span>
                </div>
                <div className="stat-item">
                  <strong>{formatViews(channel.subscribedTo?.length || 0)}</strong>
                  <span>Subscriptions</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
