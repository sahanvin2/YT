import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiDownload, FiBookmark, FiChevronDown, FiChevronUp, FiZap, FiMaximize2 } from 'react-icons/fi';
import { getVideo, likeVideo, dislikeVideo, addView, addToHistory, getDownloadUrl, saveVideo, getSavedVideos } from '../../utils/api';
import { formatViews, formatDate, formatFileSize } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/CommentSection/CommentSection';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
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
  const [isSaved, setIsSaved] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pipEnabled, setPipEnabled] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef(null);
  const viewCountedRef = useRef(false);
  const watchedDurationRef = useRef(0);
  const maxWatchedDurationRef = useRef(0);

  useEffect(() => {
    // Reset ad and video states when video ID changes
    setAdShown(false);
    setVideoPlayed(false);
    setShouldPlayAfterAd(false);
    setError('');
    viewCountedRef.current = false;
    watchedDurationRef.current = 0;
    maxWatchedDurationRef.current = 0;
    
    // Clear sessionStorage for this video ID to ensure ads play
    if (id) {
      sessionStorage.removeItem(`adShown_${id}`);
    }
    
    const loadVideo = async () => {
      await fetchVideo();
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

  // Check if user returned from smartlink redirect
  useEffect(() => {
    if (!video || !id) return; // Wait for video to load
    
    const checkSmartlinkReturn = () => {
      if (sessionStorage.getItem('smartlinkCallback') === 'true') {
        sessionStorage.removeItem('smartlinkCallback');
        sessionStorage.removeItem('smartlinkRedirect');
        
        // User returned from smartlink - mark ad as watched for this video and allow video to play
        setAdShown(true); // Mark as shown so video can play
        sessionStorage.setItem(`adShown_${id}`, 'true'); // Store per video ID
        setVideoPlayed(true);
        setShouldPlayAfterAd(false);
        setError(''); // Clear any errors
        
        // Execute callback if exists
        if (window.smartlinkCallback) {
          try {
            window.smartlinkCallback();
          } catch (error) {
            console.error('Error executing smartlink callback:', error);
          }
          delete window.smartlinkCallback;
        }
        
        // Force video to play after video is ready
        const tryPlayVideo = () => {
          if (playerRef.current && video) {
            try {
              const player = playerRef.current.getInternalPlayer();
              if (player) {
                if (typeof player.play === 'function') {
                  player.play().catch(err => {
                    console.error('Error playing video after smartlink return:', err);
                    // Retry after a longer delay
                    setTimeout(tryPlayVideo, 1000);
                  });
                } else {
                  // Player not ready yet, retry
                  setTimeout(tryPlayVideo, 500);
                }
              } else {
                // Player not initialized yet, retry
                setTimeout(tryPlayVideo, 500);
              }
            } catch (error) {
              console.error('Error accessing player:', error);
              // Retry after delay
              setTimeout(tryPlayVideo, 1000);
            }
          }
        };
        
        // Try to play video after a short delay
        setTimeout(tryPlayVideo, 500);
      }
    };
    
    // Check immediately and also on focus
    checkSmartlinkReturn();
    const handleFocus = () => checkSmartlinkReturn();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [video, id]);

  // Close download menu and speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
    };

    if (showDownloadMenu || showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu, showSpeedMenu]);

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
      
      // Check if video is saved
      if (isAuthenticated) {
        try {
          const savedRes = await getSavedVideos();
          const savedVideos = savedRes.data.data || [];
          setIsSaved(savedVideos.some(v => v._id === id));
        } catch (err) {
          console.error('Error checking saved status:', err);
        }
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
    // Prevent duplicate view counting
    if (viewCountedRef.current) {
      return;
    }

    try {
      const res = await addView(id);
      if (res.data?.success) {
        viewCountedRef.current = true;
        // Update video views count if returned
        if (res.data.data?.views && video) {
          setVideo(prev => ({ ...prev, views: res.data.data.views }));
        }
      }
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  // Track video progress to count views only when actually watched
  const handleProgress = (state) => {
    if (!video || viewCountedRef.current) return;

    const { playedSeconds } = state;
    const videoDuration = video.duration || 0;
    
    // Update max watched duration
    if (playedSeconds > maxWatchedDurationRef.current) {
      maxWatchedDurationRef.current = playedSeconds;
    }

    // Count view if:
    // 1. User watched at least 30 seconds, OR
    // 2. User watched at least 50% of the video
    const watched30Seconds = maxWatchedDurationRef.current >= 30;
    const watched50Percent = videoDuration > 0 && (maxWatchedDurationRef.current / videoDuration) >= 0.5;

    if (watched30Seconds || watched50Percent) {
      incrementView();
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

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await saveVideo(id);
      setIsSaved(res.data.data.saved);
    } catch (err) {
      console.error('Error saving video:', err);
    }
  };

  // Auto-collapse sidebar when video starts playing
  useEffect(() => {
    if (videoPlayed && !shouldPlayAfterAd && adShown) {
      window.dispatchEvent(new CustomEvent('collapseSidebar'));
    }
  }, [videoPlayed, shouldPlayAfterAd, adShown]);

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
              playing={videoPlayed && !shouldPlayAfterAd && !error && (adShown || !adConfig.smartlinkEnabled || !adConfig.smartlinkUrl)}
              key={`${video?._id || 'video'}-${selectedSource ? selectedSource.quality : 'original'}-${adShown ? 'ad-shown' : 'ad-not-shown'}`} // Force re-render when ad status changes
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload noremoteplayback'
                  }
                }
              }}
              playbackRate={playbackRate}
              pip={pipEnabled}
              onProgress={handleProgress}
              onPlay={() => {
                // Intercept play event - show smartlink ad first
                // Check if ad was already shown for this specific video ID
                const adShownForThisVideo = sessionStorage.getItem(`adShown_${id}`) === 'true';
                
                if (!adShownForThisVideo && !adShown && adConfig.smartlinkEnabled && adConfig.smartlinkUrl) {
                  setShouldPlayAfterAd(true);
                  // Pause video immediately
                  if (playerRef.current) {
                    try {
                      const player = playerRef.current.getInternalPlayer();
                      if (player && typeof player.pause === 'function') {
                        player.pause();
                      }
                    } catch (error) {
                      console.error('Error pausing video:', error);
                    }
                  }
                  // Open smartlink ad
                  openSmartlink(() => {
                    // Ad closed/completed - mark as watched for this video and play video
                    setAdShown(true);
                    sessionStorage.setItem(`adShown_${id}`, 'true'); // Store per video ID
                    setVideoPlayed(true);
                    setShouldPlayAfterAd(false);
                    setTimeout(() => {
                      if (playerRef.current && video) {
                        try {
                          const player = playerRef.current.getInternalPlayer();
                          if (player && typeof player.play === 'function') {
                            player.play().catch(err => {
                              console.error('Error playing video after ad:', err);
                              // If play fails, try reloading
                              if (playerRef.current) {
                                const currentTime = playerRef.current.getCurrentTime();
                                playerRef.current.seekTo(currentTime || 0);
                              }
                            });
                          }
                        } catch (error) {
                          console.error('Error accessing player after ad:', error);
                        }
                      }
                    }, 300);
                  });
                } else {
                  // Ad already shown for this video or disabled - play normally
                  setVideoPlayed(true);
                  setShouldPlayAfterAd(false);
                }
              }}
              onError={(e) => {
                console.error('ReactPlayer error:', e);
                const errorDetails = e?.target?.error || e;
                console.log('Error details:', errorDetails);
                
                // Don't show error if we're waiting for ad
                if (shouldPlayAfterAd) {
                  // Error occurred while waiting for ad - this is normal, will retry after ad
                  console.log('Video error while waiting for ad - will retry after ad closes');
                  return;
                }
                
                // If ad was just shown, try to recover silently
                if (adShown) {
                  console.log('Video error after ad - attempting recovery');
                  setTimeout(() => {
                    if (playerRef.current && video) {
                      try {
                        const player = playerRef.current.getInternalPlayer();
                        if (player && typeof player.load === 'function') {
                          // Try to reload the video
                          player.load();
                        }
                      } catch (error) {
                        console.error('Error recovering video player:', error);
                      }
                    }
                  }, 1000);
                  return;
                }
                
                // Only show error if ad was not shown and we're not waiting
                if (!adShown && video) {
                  // Check if video URL exists
                  const videoUrl = selectedSource
                    ? (selectedSource.url || selectedSource.videoUrl || video.videoUrl)
                    : video.videoUrl;
                  
                  if (!videoUrl) {
                    setError('Video URL is missing. Please try refreshing the page.');
                  } else {
                    setError('Failed to play video. Please check if the video URL is accessible.');
                    // Try to recover after 3 seconds
                    setTimeout(() => {
                      if (playerRef.current && video) {
                        try {
                          const player = playerRef.current.getInternalPlayer();
                          if (player && typeof player.load === 'function') {
                            player.load();
                          }
                        } catch (error) {
                          console.error('Error recovering video player:', error);
                        }
                      }
                    }, 3000);
                  }
                }
              }}
              onReady={() => {
                // Video is ready - clear any errors
                if (error && error.includes('Failed to play')) {
                  setError('');
                }
                
                // If ad was shown and video should play, try to play
                if (adShown && videoPlayed && !shouldPlayAfterAd && playerRef.current) {
                  setTimeout(() => {
                    try {
                      const player = playerRef.current.getInternalPlayer();
                      if (player && typeof player.play === 'function') {
                        player.play().catch(err => {
                          console.error('Error playing video on ready:', err);
                          // If play fails, try again after a delay
                          setTimeout(() => {
                            if (playerRef.current) {
                              try {
                                const retryPlayer = playerRef.current.getInternalPlayer();
                                if (retryPlayer && typeof retryPlayer.play === 'function') {
                                  retryPlayer.play();
                                }
                              } catch (retryError) {
                                console.error('Error retrying video play:', retryError);
                              }
                            }
                          }, 1000);
                        });
                      }
                    } catch (error) {
                      console.error('Error accessing player on ready:', error);
                    }
                  }, 500);
                }
                
                // Also check if we returned from smartlink redirect
                if (sessionStorage.getItem('smartlinkCallback') === 'true') {
                  // Video is ready and we returned from smartlink - play it
                  setTimeout(() => {
                    if (playerRef.current && video) {
                      try {
                        const player = playerRef.current.getInternalPlayer();
                        if (player && typeof player.play === 'function') {
                          player.play().catch(err => {
                            console.error('Error playing video after smartlink return on ready:', err);
                          });
                        }
                      } catch (error) {
                        console.error('Error accessing player after smartlink return on ready:', error);
                      }
                    }
                  }, 500);
                }
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
              <div className="video-actions-left">
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

                {isAuthenticated && (
                  <button
                    className={`action-btn ${isSaved ? 'active' : ''}`}
                    onClick={handleSave}
                  >
                    <FiBookmark size={20} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                )}
              </div>

              <div className="video-actions-right">
                {((video.sources && video.sources.length > 0) || (video.variants && video.variants.length > 0)) && (
                  <div className="quality-selector-inline">
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
                  </div>
                )}
                
                <div className="playback-controls">
                  <div className="speed-control" ref={speedMenuRef}>
                    <button
                      className="action-btn"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      title="Playback Speed"
                    >
                      <FiZap size={18} />
                      <span>{playbackRate}x</span>
                    </button>
                    {showSpeedMenu && (
                      <div className="speed-menu">
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                          <button
                            key={rate}
                            className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                            onClick={() => {
                              setPlaybackRate(rate);
                              setShowSpeedMenu(false);
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    className={`action-btn ${pipEnabled ? 'active' : ''}`}
                    onClick={() => {
                      if (playerRef.current) {
                        const player = playerRef.current.getInternalPlayer();
                        if (player && player.requestPictureInPicture) {
                          if (pipEnabled) {
                            document.exitPictureInPicture().catch(() => {});
                            setPipEnabled(false);
                          } else {
                            player.requestPictureInPicture().then(() => {
                              setPipEnabled(true);
                            }).catch(() => {});
                          }
                        }
                      }
                    }}
                    title="Picture in Picture"
                  >
                    <FiMaximize2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="channel-description-section">
            <div className="channel-description-left">
              <button
                className="description-toggle"
                onClick={() => setShowDescription(!showDescription)}
              >
                {showDescription ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                <span className="description-preview">
                  {showDescription ? 'Hide description' : (video.description ? video.description.substring(0, 100) + (video.description.length > 100 ? '...' : '') : 'No description')}
                </span>
              </button>
              {showDescription && (
                <div className="video-description-expanded">
                  <p>{video.description}</p>
                </div>
              )}
            </div>
            <div className="channel-description-right">
              <div className="channel-info-compact">
                <Link to={`/channel/${video.user._id}`} className="channel-avatar">
                  <img src={video.user.avatar} alt={video.user.username} />
                </Link>
                <div className="channel-meta-compact">
                  <Link to={`/channel/${video.user._id}`} className="channel-name">
                    {video.user.channelName || video.user.username}
                  </Link>
                  <span className="subscriber-count">
                    {formatViews(video.user.subscribers?.length || 0)} subscribers
                  </span>
                </div>
                <SubscribeButton channelId={video.user._id} />
              </div>
            </div>
          </div>

          <CommentSection videoId={id} comments={video.comments} />
        </div>

        <div className="suggested-videos">
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
