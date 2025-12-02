import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserProfile, getUserVideos, deleteVideo, getPlaylists } from '../../utils/api';
import { formatViews } from '../../utils/helpers';
import VideoCard from '../../components/VideoCard/VideoCard';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import { useAuth } from '../../context/AuthContext';
import { FiSettings, FiPlay } from 'react-icons/fi';
import './Channel.css';

const Channel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [privateVideos, setPrivateVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Check if current user owns this channel
  const isOwnChannel = isAuthenticated && user && (
    (user.id || user._id) === id
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchChannelData(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwnChannel]);

  const fetchChannelData = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const promises = [getUserProfile(id)];
      
      // Fetch ALL videos for owner (no limit), or paginated for others
      if (isOwnChannel) {
        // Fetch all videos without pagination for owner
        promises.push(getUserVideos(id, { limit: 1000, page: 1 }));
        promises.push(getPlaylists());
      } else {
        promises.push(getUserVideos(id, { limit: 12, page: pageNum }));
      }
      
      const results = await Promise.all(promises);
      const profileRes = results[0];
      const videosRes = results[1];
      const playlistsRes = results[2];

      // Handle different response structures
      const channelData = profileRes.data?.data || profileRes.data;
      const allVideos = videosRes.data?.data || videosRes.data || [];
      const playlistsData = playlistsRes?.data?.data || playlistsRes?.data || [];

      if (!channelData) {
        throw new Error('Channel data not found');
      }

      if (pageNum === 1) {
        setChannel(channelData);
      }
      
      // Separate public and private videos
      const publicVids = allVideos.filter(v => v.visibility === 'public');
      const privateVids = allVideos.filter(v => v.visibility === 'private');
      
      if (append) {
        setVideos(prev => [...prev, ...publicVids]);
      } else {
        setVideos(publicVids);
        setPrivateVideos(privateVids);
      }
      
      // Check if there are more videos
      if (!isOwnChannel) {
        const totalPages = videosRes.data?.totalPages || 1;
        setHasMore(pageNum < totalPages);
      } else {
        setHasMore(false);
      }
      
      // Only set playlists if they belong to this channel
      if (isOwnChannel && Array.isArray(playlistsData)) {
        setPlaylists(playlistsData);
      }
      setError('');
    } catch (err) {
      setError('Failed to load channel');
      console.error('Error fetching channel data:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreVideos = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchChannelData(nextPage, true);
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
        <div 
          className="channel-banner"
          style={{
            backgroundImage: channel.channelBanner 
              ? `url(${channel.channelBanner})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="channel-info-header">
          <div className="channel-avatar-large">
            <img
              src={channel.avatar || '/avatars/avatar1.svg'}
              alt={channel.username || channel.name || 'User'}
              loading="lazy"
              decoding="async"
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
        </div>
      </div>

      <div className="channel-tabs-header">
        <div className="channel-tabs">
          <button
            className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Videos
          </button>
          <button
            className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            Playlists
          </button>
          {isOwnChannel && (
            <button
              className={`tab ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => setActiveTab('private')}
            >
              Private Videos
            </button>
          )}
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>
        {isOwnChannel && (
          <button
            className="video-manager-btn"
            onClick={() => navigate('/video-manager')}
            title="Video Manager"
          >
            <FiSettings size={18} />
            <span>Video Manager</span>
          </button>
        )}
      </div>

      <div className="channel-content">
        {activeTab === 'videos' && (
          <>
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
            {!isOwnChannel && hasMore && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={loadMoreVideos}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Videos'}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'private' && isOwnChannel && (
          <div className="videos-grid">
            {privateVideos.length > 0 ? (
              privateVideos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))
            ) : (
              <div className="no-content">
                <p>No private videos</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="playlists-section">
            {playlists.length > 0 ? (
              <div className="playlists-grid">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist._id}
                    to={`/playlist/${playlist._id}`}
                    className="playlist-card"
                  >
                    <div className="playlist-thumbnail">
                      {playlist.videos && playlist.videos.length > 0 ? (
                        <img
                          src={playlist.videos[0]?.thumbnailUrl || '/default-thumbnail.jpg'}
                          alt={playlist.name}
                        />
                      ) : (
                        <div className="playlist-placeholder">
                          <FiPlay size={32} />
                        </div>
                      )}
                      <div className="playlist-video-count">
                        {playlist.videos?.length || 0} videos
                      </div>
                    </div>
                    <div className="playlist-info">
                      <h3>{playlist.name}</h3>
                      {playlist.description && (
                        <p className="playlist-description">{playlist.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <p>No playlists created yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-section">
            {channel.channelDescription && (
              <div className="about-card">
                <h3>Description</h3>
                <p>{channel.channelDescription}</p>
              </div>
            )}
            <div className="about-card">
              <h3>Channel Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <strong>{formatViews(channel.subscribers?.length || 0)}</strong>
                  <span>Subscribers</span>
                </div>
                <div className="stat-item">
                  <strong>{formatViews(channel.totalViews || 0)}</strong>
                  <span>Total Views</span>
                </div>
                <div className="stat-item">
                  <strong>{videos.length + (isOwnChannel ? privateVideos.length : 0)}</strong>
                  <span>Videos</span>
                </div>
              </div>
            </div>
            {(channel.country || channel.language) && (
              <div className="about-card">
                <h3>Location & Language</h3>
                <div className="info-grid">
                  {channel.country && (
                    <div className="info-item">
                      <span className="info-label">Country:</span>
                      <span className="info-value">{channel.country}</span>
                    </div>
                  )}
                  {channel.language && (
                    <div className="info-item">
                      <span className="info-label">Language:</span>
                      <span className="info-value">{channel.language.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {channel.socialLinks && Object.values(channel.socialLinks).some(link => link) && (
              <div className="about-card">
                <h3>Social Media</h3>
                <div className="social-links">
                  {channel.socialLinks.youtube && (
                    <a href={channel.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="social-link">
                      YouTube
                    </a>
                  )}
                  {channel.socialLinks.twitter && (
                    <a href={channel.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                      Twitter
                    </a>
                  )}
                  {channel.socialLinks.instagram && (
                    <a href={channel.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                      Instagram
                    </a>
                  )}
                  {channel.socialLinks.facebook && (
                    <a href={channel.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                      Facebook
                    </a>
                  )}
                  {channel.socialLinks.tiktok && (
                    <a href={channel.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="social-link">
                      TikTok
                    </a>
                  )}
                  {channel.socialLinks.website && (
                    <a href={channel.socialLinks.website} target="_blank" rel="noopener noreferrer" className="social-link">
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
            {channel.contactInfo && (channel.contactInfo.email || channel.contactInfo.phone || channel.contactInfo.address) && (
              <div className="about-card">
                <h3>Contact Information</h3>
                <div className="contact-info">
                  {channel.contactInfo.email && (
                    <div className="contact-item">
                      <span className="contact-label">Email:</span>
                      <a href={`mailto:${channel.contactInfo.email}`} className="contact-value">
                        {channel.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {channel.contactInfo.phone && (
                    <div className="contact-item">
                      <span className="contact-label">Phone:</span>
                      <a href={`tel:${channel.contactInfo.phone}`} className="contact-value">
                        {channel.contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {channel.contactInfo.address && (
                    <div className="contact-item">
                      <span className="contact-label">Address:</span>
                      <span className="contact-value">{channel.contactInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
