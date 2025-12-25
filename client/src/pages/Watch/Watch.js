import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiBookmark, FiChevronDown, FiChevronUp, FiZap, FiMaximize2, FiMinimize2, FiPlay, FiClosedCaptioning } from 'react-icons/fi';
import { getVideo, likeVideo, dislikeVideo, addView, addToHistory, saveVideo, getSavedVideos } from '../../utils/api';
import { formatViews, formatDate, formatDuration } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/CommentSection/CommentSection';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
// TEMPORARILY DISABLED FOR HIGH TRAFFIC
// import { useSmartlinkAd } from '../../components/Ads/SmartlinkAd';
// import { useAds } from '../../context/AdContext';
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
  // TEMPORARILY DISABLED FOR HIGH TRAFFIC
  // const { adConfig } = useAds();
  // const { openSmartlink } = useSmartlinkAd();
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [videoFilter, setVideoFilter] = useState('all'); // 'all', 'from', 'related'
  const [isSaved, setIsSaved] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [lastAdTime, setLastAdTime] = useState(0);
  const [waitingForAdPlay, setWaitingForAdPlay] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [firstAdShown, setFirstAdShown] = useState(false);
  
  // TEMPORARILY DISABLED FOR HIGH TRAFFIC - Ads commented out to prevent crashes
  // Sequential ad URLs - shown one by one every 20 minutes
  /* const adUrls = [
    'https://ferntravelleddeduct.com/gtrc1veb7i?key=b0b98b004d66f73292231e7413bd2b3d',
    'https://ferntravelleddeduct.com/ngw7f9w7ar?key=1d03ce84598475a5c0ae7b0e970be386',
    'https://ferntravelleddeduct.com/tnku73k6e8?key=447538fcc223d88734b4f7f5f5be2b54',
    'https://ferntravelleddeduct.com/idfx3p15i3?key=9d603a856f9d9a37ec5ef196269b06e7',
    'https://ferntravelleddeduct.com/bgusytk8f?key=9c413adfc9220ea82965cd0da534ce6e',
    'https://ferntravelleddeduct.com/j23e4fkk?key=523fef688a467d6f64fdd802524115f9',
    'https://ferntravelleddeduct.com/dcymz8b5?key=3c409df2cb253703547b6069590d19dd',
    'https://ferntravelleddeduct.com/skrjybktk?key=5c9a385ddc45f9ed2cbe812d9b5d8df3',
    'https://ferntravelleddeduct.com/b467swwk68?key=83daee009e4befaeaba7c9dea1c856e8',
    'https://ferntravelleddeduct.com/drfzz5nfc?key=a65ddcb5be118c6be68e516713aea33b'
  ]; */
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pipEnabled, setPipEnabled] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef(null);
  const viewCountedRef = useRef(false);
  const watchedDurationRef = useRef(0);
  const maxWatchedDurationRef = useRef(0);

  useEffect(() => {
    // Reset video states when video ID changes
    setVideoPlayed(false);
    setError('');
    viewCountedRef.current = false;
    watchedDurationRef.current = 0;
    maxWatchedDurationRef.current = 0;
    setLastAdTime(0);
    setWaitingForAdPlay(false);
    setCurrentAdIndex(0);
    setFirstAdShown(false);
    
    // Clear sessionStorage for this video ID
    if (id) {
      sessionStorage.removeItem(`smartlinkShown_${id}`);
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
    if (video) {
      // Priority: primaryGenre > mainCategory (don't use deprecated 'category' field)
      const searchParam = video.primaryGenre || video.mainCategory || 'all';
      console.log(`🎬 Fetching related videos for: mainCategory="${video.mainCategory}", primaryGenre="${video.primaryGenre}" -> using "${searchParam}"`);
      fetchRelatedVideos(searchParam);
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
        // Match by mainCategory or primaryGenre (not deprecated 'category')
        filtered = relatedVideos.filter(v => 
          (v.mainCategory === video.mainCategory || v.primaryGenre === video.primaryGenre) && v._id !== video._id
        );
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
        
        // User returned from smartlink
        sessionStorage.setItem(`smartlinkShown_${id}`, 'true');
        setVideoPlayed(true);
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

  // Timed ads are now handled in handleProgress based on actual video playback time

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



  const fetchRelatedVideos = async (categoryOrGenre) => {
    try {
      const { getVideos } = require('../../utils/api');
      // Fetch videos with category/genre if provided, otherwise get recent videos
      const params = categoryOrGenre && categoryOrGenre !== 'all' && categoryOrGenre !== 'Other'
        ? { category: categoryOrGenre, limit: 12 } 
        : { limit: 12, sort: '-createdAt' };
      const res = await getVideos(params);
      const videos = res.data.data || [];
      // Filter out current video
      const filtered = videos.filter(v => v._id !== id);
      setRelatedVideos(filtered);
      console.log(`✅ Loaded ${filtered.length} related videos for "${categoryOrGenre}"`);
    } catch (err) {
      console.error('Error fetching related videos:', err);
      // Try to fetch any videos as fallback
      try {
        const { getVideos } = require('../../utils/api');
        const res = await getVideos({ limit: 12 });
        const videos = res.data.data || [];
        setRelatedVideos(videos.filter(v => v._id !== id));
        console.log(`✅ Loaded ${videos.length - 1} fallback videos`);
      } catch (fallbackErr) {
        console.error('Fallback fetch failed:', fallbackErr);
      }
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
    if (!video) return;

    const { playedSeconds } = state;
    const videoDuration = video.duration || 0;
    
    // Update max watched duration
    if (playedSeconds > maxWatchedDurationRef.current) {
      maxWatchedDurationRef.current = playedSeconds;
    }

    // Count view if:
    // 1. User watched at least 30 seconds, OR
    // 2. User watched at least 50% of the video
    if (!viewCountedRef.current) {
      const watched30Seconds = maxWatchedDurationRef.current >= 30;
      const watched50Percent = videoDuration > 0 && (maxWatchedDurationRef.current / videoDuration) >= 0.5;

      if (watched30Seconds || watched50Percent) {
        incrementView();
      }
    }

    // TEMPORARILY DISABLED ADS FOR HIGH TRAFFIC
    /* Show ad every 5 minutes (300 seconds)
    if (playedSeconds > 300 && !waitingForAdPlay && currentAdIndex < adUrls.length) {
      const currentMinuteMark = Math.floor(playedSeconds / 300);
      const lastAdMinuteMark = Math.floor(lastAdTime / 300);
      
      if (currentMinuteMark > lastAdMinuteMark && currentMinuteMark > 0) {
        console.log(`Opening ad ${currentAdIndex + 1} at ${Math.floor(playedSeconds / 60)}:${Math.floor(playedSeconds % 60).toString().padStart(2, '0')}...`);
        
        const adUrl = adUrls[currentAdIndex];
        if (adUrl) {
          try {
            const win = window.open(adUrl, '_blank', 'noopener,noreferrer');
            if (win) {
              console.log('✅ Ad opened successfully');
              setCurrentAdIndex(prev => prev + 1);
              setLastAdTime(playedSeconds);
            } else {
              console.warn('⚠️ Ad popup blocked');
            }
          } catch (error) {
            console.error('❌ Error opening ad:', error);
          }
        }
        
        setWaitingForAdPlay(false);
      }
    } */
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
    if (videoPlayed) {
      window.dispatchEvent(new CustomEvent('collapseSidebar'));
    }
  }, [videoPlayed]);

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
              {/* Quality Selector - More Prominent */}
              {((video.sources && video.sources.length > 0) || (video.variants && video.variants.length > 0)) ? (
                <div className="player-setting-item quality-selector">
                  <label className="player-setting-label">Quality:</label>
                  <select
                    className="player-setting-select quality-select"
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
                    <option value="orig">Auto (Best)</option>
                    {[...(video.sources || video.variants || [])]
                      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
                      .map(s => (
                        <option key={s.quality} value={s.quality}>
                          {s.quality}p {s.quality >= 1080 ? 'HD' : s.quality >= 720 ? 'HD' : 'SD'}
                        </option>
                      ))}
                  </select>
                  <span className="quality-badge">
                    {selectedSource ? `${selectedSource.quality}p` : 'Auto'}
                  </span>
                </div>
              ) : (
                <div className="player-setting-item">
                  <span className="quality-badge">Original</span>
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

            {/* Use native HTML5 video if subtitles are available, otherwise use ReactPlayer */}
            {video.subtitles && video.subtitles.length > 0 ? (
              <video
                ref={playerRef}
                src={selectedSource
                  ? (selectedSource.cdnUrl || selectedSource.url || selectedSource.videoUrl || video.cdnUrl || video.videoUrl)
                  : (video.cdnUrl || video.videoUrl)
                }
                controls
                controlsList="nodownload"
                playsInline
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onPlay={() => {
                  window.dispatchEvent(new CustomEvent('collapseSidebar'));
                  // TEMPORARILY DISABLED FOR HIGH TRAFFIC
                  /* if (!firstAdShown && currentAdIndex < adUrls.length) {
                    setTimeout(() => {
                      const adUrl = adUrls[currentAdIndex];
                      try {
                        window.open(adUrl, '_blank', 'noopener,noreferrer');
                        setCurrentAdIndex(prev => prev + 1);
                      } catch (e) {
                        console.error('Error opening first ad:', e);
                      }
                    }, 3000);
                    setFirstAdShown(true);
                  } */
                  setVideoPlayed(true);
                  setError(''); // Clear any previous errors
                }}
                onTimeUpdate={(e) => {
                  handleProgress({ playedSeconds: e.target.currentTime });
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setError('Failed to play video. Please check if the video URL is accessible.');
                }}
              >
                {video.subtitles.map((subtitle, index) => (
                  <track
                    key={index}
                    kind="subtitles"
                    src={subtitle.url}
                    srcLang={subtitle.language}
                    label={subtitle.label}
                    default={subtitle.isDefault || index === 0}
                  />
                ))}
                Your browser does not support the video tag.
              </video>
            ) : (
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
                key={`${video?._id || 'video'}-${selectedSource ? selectedSource.quality : 'original'}`}
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
                  window.dispatchEvent(new CustomEvent('collapseSidebar'));
                  
                  // TEMPORARILY DISABLED FOR HIGH TRAFFIC
                  /* Show first ad when video starts playing (only once)
                  if (!firstAdShown && currentAdIndex < adUrls.length) {
                    setTimeout(() => {
                      const adUrl = adUrls[currentAdIndex];
                      console.log(`Opening first ad (${currentAdIndex + 1}/${adUrls.length}):`, adUrl);
                      try {
                        window.open(adUrl, '_blank', 'noopener,noreferrer');
                        setCurrentAdIndex(prev => prev + 1);
                      } catch (e) {
                        console.error('Error opening first ad:', e);
                      }
                    }, 3000); // Show first ad after 3 seconds of video start
                    setFirstAdShown(true);
                  } */
                  
                  setVideoPlayed(true);
                  setError(''); // Clear any error on play
                  setWaitingForAdPlay(false);
                }}
                onError={(e) => {
                  console.error('ReactPlayer error:', e);
                  const errorDetails = e?.target?.error || e;
                  console.log('Error details:', errorDetails);
                  
                  // Try to recover from error
                  console.log('Video error - attempting recovery');
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
                  
                  // Show error if video exists but can't play
                  if (video) {
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
                  if (error && error.includes('Failed to play')) {
                    setError('');
                  }
                  
                  if (videoPlayed && playerRef.current) {
                    setTimeout(() => {
                      try {
                        const player = playerRef.current.getInternalPlayer();
                        if (player && typeof player.play === 'function') {
                          player.play().catch(err => {
                            console.error('Error playing video on ready:', err);
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
                  
                  if (sessionStorage.getItem('smartlinkCallback') === 'true') {
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
            )}
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
