import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiDownload } from 'react-icons/fi';
import { getVideo, likeVideo, dislikeVideo, addView, addToHistory, getDownloadUrl } from '../../utils/api';
import { formatViews, formatDate, formatFileSize } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/CommentSection/CommentSection';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const historyPostedRef = useRef({});
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [selectedSource, setSelectedSource] = useState(null);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadMenuRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const loadVideo = async () => {
      await fetchVideo();
      await incrementView();
      if (isAuthenticated) {
        await addVideoToHistory();
      }
    };
    loadVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  // Update player when quality changes
  useEffect(() => {
    if (playerRef.current && video) {
      // Force player to reload with new URL
      const newUrl = selectedSource
        ? (selectedSource.url || selectedSource.videoUrl || video.videoUrl)
        : video.videoUrl;
      
      // ReactPlayer will automatically update when url prop changes
    }
  }, [selectedSource, video]);
  

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await getVideo(id);
      const videoData = res.data.data;
      
      // Validate video URL exists
      if (!videoData.videoUrl) {
        setError('Video URL is missing');
        setLoading(false);
        return;
      }
      
      setVideo(videoData);
      setLikesCount(videoData.likes?.length || 0);
      setDislikesCount(videoData.dislikes?.length || 0);
      setError('');
      // Prefer a selected quality if exists, else choose highest available, else original
      // Check both sources and variants arrays
      const sources = videoData.sources || videoData.variants || [];
      if (sources.length > 0) {
        const sorted = [...sources].sort((a,b)=>a.quality-b.quality);
        setSelectedSource(sorted[sorted.length-1]);
      } else {
        setSelectedSource(null);
      }
    } catch (err) {
      setError('Failed to load video');
      console.error('Error loading video:', err);
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      await addView(id);
    } catch (err) {
      console.error(err);
    }
  };

  const addVideoToHistory = async () => {
    try {
      if (historyPostedRef.current[id]) return;
      await addToHistory(id);
      historyPostedRef.current[id] = true;
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await likeVideo(id);
      setIsLiked(res.data.data.isLiked);
      setIsDisliked(false);
      setLikesCount(res.data.data.likes);
      setDislikesCount(res.data.data.dislikes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await dislikeVideo(id);
      setIsDisliked(res.data.data.isDisliked);
      setIsLiked(false);
      setLikesCount(res.data.data.likes);
      setDislikesCount(res.data.data.dislikes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleDownload = async (quality = 'orig') => {
    try {
      setDownloading(true);
      const res = await getDownloadUrl(id, quality);
      
      if (res.data.success) {
        const { downloadUrl, filename } = res.data.data;
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setShowDownloadMenu(false);
      }
    } catch (err) {
      console.error('Error downloading video:', err);
      alert('Failed to download video. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="error-container">
        <p className="error-message">{error || 'Video not found'}</p>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <div className="watch-content">
        <div className="video-player-section">
          <div className="video-player">
            <ReactPlayer
              ref={playerRef}
              url={selectedSource
                ? (selectedSource.url || selectedSource.videoUrl || video.videoUrl)
                : video.videoUrl
              }
              controls
              width="100%"
              height="100%"
              playing
              key={selectedSource ? selectedSource.quality : 'original'} // Force re-render on quality change
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
              onError={(e) => {
                console.error('ReactPlayer error:', e);
                setError('Failed to play video. Please check if the video URL is accessible.');
              }}
            />
          </div>

          <div className="video-info-section">
            <h1 className="video-title">{video.title}</h1>

            <div className="video-stats">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>

            <div className="video-actions">
              <button
                className={`action-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <FiThumbsUp size={20} />
                <span>{formatViews(likesCount)}</span>
              </button>

              <button
                className={`action-btn ${isDisliked ? 'active' : ''}`}
                onClick={handleDislike}
              >
                <FiThumbsDown size={20} />
                <span>{formatViews(dislikesCount)}</span>
              </button>

              <button className="action-btn" onClick={handleShare}>
                <FiShare2 size={20} />
                <span>Share</span>
              </button>

              <div className="download-menu-container" ref={downloadMenuRef}>
                <button 
                  className="action-btn" 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={downloading}
                >
                  <FiDownload size={20} />
                  <span>{downloading ? 'Downloading...' : 'Download'}</span>
                </button>
                {showDownloadMenu && (
                  <div className="download-quality-menu">
                    <div className="download-menu-header">
                      <span>Choose Quality</span>
                      <button 
                        className="close-download-menu"
                        onClick={() => setShowDownloadMenu(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="download-options">
                      <button
                        className="download-option"
                        onClick={() => handleDownload('orig')}
                        disabled={downloading}
                      >
                        <span className="quality-name">Original</span>
                        <span className="quality-size">
                          {video.videoUrl ? 'Full quality' : 'N/A'}
                        </span>
                      </button>
                      {[...(video.sources || video.variants || [])]
                        .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
                        .map(variant => (
                          <button
                            key={variant.quality}
                            className="download-option"
                            onClick={() => handleDownload(variant.quality)}
                            disabled={downloading}
                          >
                            <span className="quality-name">{variant.quality}p</span>
                            <span className="quality-size">
                              {variant.size ? formatFileSize(variant.size) : 'N/A'}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="channel-info">
            <div className="channel-details">
              <Link to={`/channel/${video.user._id}`} className="channel-avatar">
                <img src={video.user.avatar} alt={video.user.username} />
              </Link>

              <div className="channel-meta">
                <Link to={`/channel/${video.user._id}`} className="channel-name">
                  {video.user.channelName || video.user.username}
                </Link>
                <span className="subscriber-count">
                  {formatViews(video.user.subscribers?.length || 0)} subscribers
                </span>
              </div>
            </div>

            <SubscribeButton channelId={video.user._id} />
          </div>

          <div className="quality-select">
            {((video.sources && video.sources.length > 0) || (video.variants && video.variants.length > 0)) && (
              <div className="quality-selector">
                <span className="quality-label">Quality:</span>
                <select
                  className="quality-dropdown"
                  value={selectedSource ? selectedSource.quality : 'orig'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'orig') {
                      setSelectedSource(null);
                    } else {
                      const sources = video.sources || video.variants || [];
                      const match = sources.find(s => String(s.quality) === String(val));
                      setSelectedSource(match || null);
                    }
                  }}
                >
                  <option value="orig">Auto (Recommended)</option>
                  {[...(video.sources || video.variants || [])]
                    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
                    .map(s => (
                      <option key={s.quality} value={s.quality}>
                        {s.quality}p {s.size ? `(${formatFileSize(s.size)})` : ''}
                      </option>
                    ))}
                </select>
                {selectedSource && (
                  <span className="current-quality">
                    Currently playing: {selectedSource.quality}p
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="video-description">
            <p className={showFullDescription ? 'expanded' : ''}>
              {video.description}
            </p>
            {video.description.length > 200 && (
              <button
                className="show-more-btn"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          <CommentSection videoId={id} comments={video.comments} />
        </div>

        <div className="suggested-videos">
          <h3>Suggested Videos</h3>
          {/* This would be populated with related videos in a real app */}
          <p className="no-videos">No suggested videos yet</p>
        </div>
      </div>
    </div>
  );
};

export default Watch;
