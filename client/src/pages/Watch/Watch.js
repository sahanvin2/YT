import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiBookmark, FiChevronDown, FiChevronUp, FiZap, FiMaximize2, FiMinimize2, FiPlay } from 'react-icons/fi';
import { getVideo, likeVideo, dislikeVideo, addView, addToHistory, saveVideo, getSavedVideos } from '../../utils/api';
import { formatViews, formatDate, formatDuration } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/CommentSection/CommentSection';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import { useSmartlinkAd } from '../../components/Ads/SmartlinkAd';
import { useAds } from '../../context/AdContext';
import ShareModal from '../../components/ShareModal/ShareModal';
import VideoCard from '../../components/VideoCard/VideoCard';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const historyPostedRef = useRef({});
  const [video, setVideo] = useState(null);

  useEffect(() => {
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log("VIDEO PLAYER URL:", video?.cdnUrl, video?.videoUrl);
    }
    window.__lastVideo = video;
  }, [video]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [selectedSource, setSelectedSource] = useState(null);
  const [dislikesCount, setDislikesCount] = useState(0);
  const playerRef = useRef(null);
  const { openSmartlink } = useSmartlinkAd();
  const { adConfig } = useAds();
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [adShown, setAdShown] = useState(false);
  const [shouldPlayAfterAd, setShouldPlayAfterAd] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [videoFilter, setVideoFilter] = useState('all'); // 'all', 'from', 'related'
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

  // Filter videos based on selected filter
  useEffect(() => {
    if (!video || !relatedVideos.length) {
      setFilteredVideos([]);
      return;
    }

    let filtered = [];
    switch (videoFilter) {
      case 'from':
        filtered = relatedVideos.filter(v => v.user._id === video.user._id);
        break;
      case 'related':
        filtered = relatedVideos.filter(v => v.category === video.category && v._id !== video._id);
        break;
      case 'all':
      default:
        filtered = relatedVideos;
        break;
    }
    setFilteredVideos(filtered);
  }, [videoFilter, relatedVideos, video]);

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
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
    };

    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedMenu]);

  // Update player when quality changes
  useEffect(() => {
    if (playerRef.current && video) {
      // Force player to reload with new URL (prefer CDN URL)
      const newUrl = selectedSource
        ? (selectedSource.cdnUrl || selectedSource.url || selectedSource.videoUrl || video.cdnUrl || video.videoUrl)
        : (video.cdnUrl || video.videoUrl);

      // ReactPlayer will automatically update when url prop changes
    }
  }, [selectedSource, video]);


  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getVideo(id);
      const videoData = res.data.data;

      // Debug: Log video URLs to check CDN conversion (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Video Data Received:', {
          videoUrl: videoData.videoUrl,
          cdnUrl: videoData.cdnUrl,
          isBunnyCDN: videoData.videoUrl?.includes('b-cdn.net') || videoData.cdnUrl?.includes('b-cdn.net'),
          isB2Direct: videoData.videoUrl?.includes('backblazeb2.com') || videoData.cdnUrl?.includes('backblazeb2.com'),
        });
        
        const finalUrl = videoData.cdnUrl || videoData.videoUrl;
        if (finalUrl && finalUrl.includes('b-cdn.net')) {
          console.log('✅ Using Bunny CDN:', finalUrl);
        } else if (finalUrl && finalUrl.includes('backblazeb2.com')) {
          console.warn('⚠️ Still using B2 directly:', finalUrl);
        }
      }

      // Validate video URL exists (prefer CDN URL)
      const finalVideoUrl = videoData.cdnUrl || videoData.videoUrl;
      if (!finalVideoUrl) {
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
        const highestQuality = sorted[sorted.length - 1];
        // Ensure we use CDN URL for selected source
        if (highestQuality && !highestQuality.cdnUrl && highestQuality.url) {
          highestQuality.cdnUrl = highestQuality.url; // Fallback if cdnUrl not set
        }
        setSelectedSource(highestQuality);
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load video';
      setError(errorMessage);
      console.error('Error loading video:', err);
      
      // If it's a private video error, show helpful message
      if (errorMessage.includes('private') || err.response?.status === 403) {
        setError('This video is private. Only the channel owner can view it.');
      }
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
            {/* Player Settings Bar - Top */}
            <div className="player-settings-bar">
              {((video.sources && video.sources.length > 0) || (video.variants && video.variants.length > 0)) && (
                <div className="player-setting-item">
                  <label className="player-setting-label">Quality:</label>
                  <select
                    className="player-setting-select"
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
                    <option value="orig">Auto</option>
                    {[...(video.sources || video.variants || [])]
                      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
                      .map(s => (
                        <option key={s.quality} value={s.quality}>
                          {s.quality}p
                        </option>
                      ))}
                  </select>
                </div>
              )}
              
              <div className="player-setting-item" ref={speedMenuRef}>
                <label className="player-setting-label">Speed:</label>
                <button
                  className="player-setting-btn"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  {playbackRate}x
                  {showSpeedMenu && (
                    <div className="player-setting-menu">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <button
                          key={rate}
                          className={`player-setting-option ${playbackRate === rate ? 'active' : ''}`}
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
                </button>
              </div>

              <button
                className={`player-setting-btn ${pipEnabled ? 'active' : ''}`}
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
                <FiMinimize2 size={14} />
              </button>

              <button
                className="player-setting-btn"
                onClick={() => {
                  if (playerRef.current) {
                    const player = playerRef.current.getInternalPlayer();
                    if (player && player.requestFullscreen) {
                      player.requestFullscreen();
                    } else if (playerRef.current.wrapper && playerRef.current.wrapper.requestFullscreen) {
                      playerRef.current.wrapper.requestFullscreen();
                    }
                  }
                }}
                title="Fullscreen"
              >
                <FiMaximize2 size={14} />
              </button>
            </div>

            <ReactPlayer
              ref={playerRef}
              url={
                selectedSource
                ? (selectedSource.cdnUrl || selectedSource.url || selectedSource.videoUrl || video.cdnUrl || video.videoUrl)
                : (video.cdnUrl || video.videoUrl)
              }
              controls
              width="100%"
              height="100%"
              playing={videoPlayed && !error}
              key={`${video?._id || 'video'}-${selectedSource ? selectedSource.quality : 'original'}-${adShown ? 'ad-shown' : 'ad-not-shown'}`} // Force re-render when ad status changes
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload noremoteplayback'
                  }
                },
                youtube: {
                  playerVars: {
                    controls: 1,
                    modestbranding: 1,
                    rel: 0
                  }
                }
              }}
              playbackRate={playbackRate}
              pip={pipEnabled}
              onProgress={handleProgress}
              onPlay={() => {
                // Hide sidebar when video starts playing
                window.dispatchEvent(new CustomEvent('collapseSidebar'));
                
                // Advertisement functionality commented out - not needed
                // // Intercept play event - show smartlink ad first
                // // Check if ad was already shown for this specific video ID
                // const adShownForThisVideo = sessionStorage.getItem(`adShown_${id}`) === 'true';
                
                // if (!adShownForThisVideo && !adShown && adConfig.smartlinkEnabled && adConfig.smartlinkUrl) {
                //   setShouldPlayAfterAd(true);
                //   // Pause video immediately
                //   if (playerRef.current) {
                //     try {
                //       const player = playerRef.current.getInternalPlayer();
                //       if (player && typeof player.pause === 'function') {
                //         player.pause();
                //       }
                //     } catch (error) {
                //       console.error('Error pausing video:', error);
                //     }
                //   }
                //   // Open smartlink ad
                //   openSmartlink(() => {
                //     // Ad closed/completed - mark as watched for this video and play video
                //     setAdShown(true);
                //     sessionStorage.setItem(`adShown_${id}`, 'true'); // Store per video ID
                //     setVideoPlayed(true);
                //     setShouldPlayAfterAd(false);
                //     setTimeout(() => {
                //       if (playerRef.current && video) {
                //         try {
                //           const player = playerRef.current.getInternalPlayer();
                //           if (player && typeof player.play === 'function') {
                //             player.play().catch(err => {
                //               console.error('Error playing video after ad:', err);
                //               // If play fails, try reloading
                //               if (playerRef.current) {
                //                 const currentTime = playerRef.current.getCurrentTime();
                //                 playerRef.current.seekTo(currentTime || 0);
                //               }
                //             });
                //           }
                //         } catch (error) {
                //           console.error('Error accessing player after ad:', error);
                //         }
                //       }
                //     }, 300);
                //   });
                // } else {
                //   // Ad already shown for this video or disabled - play normally
                //   setVideoPlayed(true);
                //   setShouldPlayAfterAd(false);
                // }
                
                // Play video normally without ad
                setVideoPlayed(true);
                setShouldPlayAfterAd(false);
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
                  // Check if video URL exists (prefer CDN URL)
                  const videoUrl = selectedSource
                    ? (selectedSource.cdnUrl || selectedSource.url || selectedSource.videoUrl || video.cdnUrl || video.videoUrl)
                    : (video.cdnUrl || video.videoUrl);
                  
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

            <div className="video-meta-row">
              <div className="channel-info-section">
                <Link to={`/channel/${video.user._id}`} className="channel-avatar-link">
                  <div className="channel-avatar-wrapper">
                    <img 
                      src={video.user.avatar} 
                      alt={video.user.username}
                      className="channel-avatar-img"
                    />
                  </div>
                </Link>
                <div className="channel-meta">
                  <Link to={`/channel/${video.user._id}`} className="channel-name-large">
                    {video.user.channelName || video.user.username}
                  </Link>
                  <p className="subscriber-count-large">
                    {formatViews(video.user.subscribers?.length || 0)} subscribers
                  </p>
                </div>
                <SubscribeButton 
                  channelId={video.user._id}
                  channelName={video.user.channelName || video.user.username}
                />
              </div>

              <div className="video-actions-toolbar">
                <div className="like-dislike-group">
                  <button
                    className={`action-btn like-btn ${isLiked ? 'active' : ''}`}
                    onClick={handleLike}
                  >
                    <FiThumbsUp size={20} />
                    <span>{formatViews(likesCount)}</span>
                  </button>
                  <button
                    className={`action-btn dislike-btn ${isDisliked ? 'active' : ''}`}
                    onClick={handleDislike}
                  >
                    <FiThumbsDown size={20} />
                  </button>
                </div>

                <button className="action-btn" onClick={() => setShowShareModal(true)}>
                  <FiShare2 size={16} />
                  <span>Share</span>
                </button>

                {isAuthenticated && (
                  <button
                    className={`action-btn ${isSaved ? 'active' : ''}`}
                    onClick={handleSave}
                  >
                    <FiBookmark size={16} />
                    <span>Save</span>
                  </button>
                )}
              </div>
            </div>

          <div className="video-description-box">
            <div className="video-description-stats">
              <span>{formatViews(video.views)} Views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
            <div className="video-description-text">
              {showFullDescription ? (
                <p>{video.description || 'No description available.'}</p>
              ) : (
                <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {video.description || 'No description available.'}
                </p>
              )}
            </div>
            {video.description && video.description.length > 150 && (
              <button
                className="show-more-link"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'SHOW LESS' : 'SHOW MORE'}
              </button>
            )}
          </div>

          <CommentSection videoId={id} comments={video.comments} />
        </div>
        </div>

        <div className="suggested-videos">
          <div className="suggested-videos-header">
            <button 
              className={`suggested-filter-btn ${videoFilter === 'all' ? 'active' : ''}`}
              onClick={() => setVideoFilter('all')}
            >
              All
            </button>
            <button 
              className={`suggested-filter-btn ${videoFilter === 'from' ? 'active' : ''}`}
              onClick={() => setVideoFilter('from')}
            >
              From {video.user.channelName || video.user.username}
            </button>
            <button 
              className={`suggested-filter-btn ${videoFilter === 'related' ? 'active' : ''}`}
              onClick={() => setVideoFilter('related')}
            >
              Related
            </button>
          </div>
          {filteredVideos.length > 0 ? (
            <>
              {/* Desktop: Sidebar List View */}
              <div className="suggested-videos-list suggested-videos-desktop">
                {filteredVideos.map((relatedVideo) => (
                  <div 
                    key={relatedVideo._id} 
                    className="suggested-video-item"
                    onClick={() => navigate(`/watch/${relatedVideo._id}`)}
                  >
                    <div className="suggested-video-thumbnail">
                      <img 
                        src={relatedVideo.thumbnailUrl} 
                        alt={relatedVideo.title}
                        loading="lazy"
                      />
                      {relatedVideo.duration > 0 && (
                        <span className="suggested-video-duration">
                          {formatDuration(relatedVideo.duration)}
                        </span>
                      )}
                    </div>
                    <div className="suggested-video-info">
                      <h4 className="suggested-video-title">{relatedVideo.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mobile: Grid View (Same as Homepage - Simplified) */}
              <div className="suggested-videos-grid suggested-videos-mobile">
                {filteredVideos.map((relatedVideo) => (
                  <VideoCard key={relatedVideo._id} video={relatedVideo} simplified={true} />
                ))}
              </div>
            </>
          ) : (
            <p className="no-videos">No videos found</p>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && video && (
        <ShareModal video={video} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

export default Watch;
