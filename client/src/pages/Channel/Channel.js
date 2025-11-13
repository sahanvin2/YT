import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile, getUserVideos } from '../../utils/api';
import { formatViews } from '../../utils/helpers';
import VideoCard from '../../components/VideoCard/VideoCard';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import { useAuth } from '../../context/AuthContext';
import './Channel.css';

const Channel = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    fetchChannelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      const [profileRes, videosRes] = await Promise.all([
        getUserProfile(id),
        getUserVideos(id)
      ]);
      setChannel(profileRes.data.data);
      setVideos(videosRes.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load channel');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            <img src={channel.avatar} alt={channel.username} />
          </div>
          <div className="channel-details-header">
            <h1>{channel.channelName || channel.username}</h1>
            <div className="channel-stats">
              <span>@{channel.username}</span>
              <span>•</span>
              <span>{formatViews(channel.subscribers?.length || 0)} subscribers</span>
              <span>•</span>
              <span>{channel.videos?.length || 0} videos</span>
            </div>
            {channel.channelDescription && (
              <p className="channel-description">{channel.channelDescription}</p>
            )}
          </div>
          {isAuthenticated && user.id !== id && (
            <SubscribeButton
              channelId={id}
              initialSubscribed={channel.subscribers?.some(s => s._id === user.id)}
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
                <VideoCard key={video._id} video={video} />
              ))
            ) : (
              <div className="no-content">
                <p>No videos uploaded yet</p>
              </div>
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
