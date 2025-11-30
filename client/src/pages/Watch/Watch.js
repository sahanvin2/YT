import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiDownload } from 'react-icons/fi';
import { getVideo, likeVideo, dislikeVideo, addView, addToHistory, getDownloadUrl } from '../../utils/api';
import { formatViews, formatDate, formatFileSize } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/CommentSection/CommentSection';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import AdBanner from '../../components/Ad/AdBanner';
import NativeAd from '../../components/Ads/NativeAd';
import PopUnderAd from '../../components/Ads/PopUnderAd';
import { useSmartlinkAd } from '../../components/Ads/SmartlinkAd';
import { useAds } from '../../context/AdContext';
import ShareModal from '../../components/ShareModal/ShareModal';
import DownloadModal from '../../components/DownloadModal/DownloadModal';
import VideoCard from '../../components/VideoCard/VideoCard';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const { openSmartlink } = useSmartlinkAd();
  const { adConfig } = useAds();
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [adShown, setAdShown] = useState(false);
  const [shouldPlayAfterAd, setShouldPlayAfterAd] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);

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

  // Fetch related videos when video data is loaded
  useEffect(() => {
    if (video?.category) {
      fetchRelatedVideos(video.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

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
        const sorted = [...sources].sort((a, b) => a.quality - b.quality);
        setSelectedSource(sorted[sorted.length - 1]);
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

  const fetchRelatedVideos = async (category) => {
    try {
      const { getVideos } = require('../../utils/api');
      const res = await getVideos({ category, limit: 10 });
      const videos = res.data.data || [];
      // Filter out current video
      setRelatedVideos(videos.filter(v => v._id !== id));
    } catch (err) {
      console.error('Error fetching related videos:', err);
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


  const handleDownload = () => {
    setShowDownloadModal(true);
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
      <PopUnderAd trigger="video-play" />
      <AdBanner location="watch" />
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
              playing={videoPlayed && !shouldPlayAfterAd}
              key={selectedSource ? selectedSource.quality : 'original'} // Force re-render on quality change
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
              onPlay={() => {
                // Intercept play event - show smartlink ad first
                if (!adShown && adConfig.smartlinkEnabled && adConfig.smartlinkUrl) {
                  setAdShown(true);
                  setShouldPlayAfterAd(true);
                  // Pause video immediately
                  if (playerRef.current) {
                    const player = playerRef.current.getInternalPlayer();
                    if (player) {
                      player.pause();
                    }
                  }
                  // Open smartlink ad
                  openSmartlink(() => {
                    // Ad closed/completed - now play video
                    setAdShown(false);
                    setVideoPlayed(true);
                    setShouldPlayAfterAd(false);
                    setTimeout(() => {
                      if (playerRef.current) {
                        const player = playerRef.current.getInternalPlayer();
                        if (player) {
                          player.play();
                        }
                      }
                    }, 200);
                  });
                } else {
                  setVideoPlayed(true);
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

              <button className="action-btn" onClick={() => setShowShareModal(true)}>
                <FiShare2 size={20} />
                <span>Share</span>
              </button>

              <button
                className="action-btn"
                onClick={handleDownload}
              >
                <FiDownload size={20} />
                <span>Download</span>
              </button>
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
          <AdBanner location="sidebar" />
          <h3>Related Videos</h3>
          {relatedVideos.length > 0 ? (
            <div className="related-videos-list">
              {relatedVideos.map((relatedVideo) => (
                <VideoCard key={relatedVideo._id} video={relatedVideo} layout="horizontal" />
              ))}
            </div>
          ) : (
            <p className="no-videos">No related videos yet</p>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && video && (
        <ShareModal video={video} onClose={() => setShowShareModal(false)} />
      )}

      {/* Download Modal */}
      {showDownloadModal && video && (
        <DownloadModal video={video} onClose={() => setShowDownloadModal(false)} />
      )}
    </div>
  );
};

export default Watch;
