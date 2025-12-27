import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiBookmark, FiChevronDown, FiChevronUp, FiZap, FiMaximize2, FiMinimize2, FiPlay, FiPause, FiVolume2, FiVolumeX, FiSkipBack, FiSkipForward, FiSettings } from 'react-icons/fi';
import { getVideo, getProcessingStatus, likeVideo, dislikeVideo, addView, addToHistory, saveVideo, getSavedVideos } from '../../utils/api';
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

// Helper function to format time in MM:SS or HH:MM:SS
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === 0) {
    return '0:00';
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

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
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const videoContainerRef = useRef(null);
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
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const qualityMenuRef = useRef(null);
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedHlsLevel, setSelectedHlsLevel] = useState(-1); // -1 = Auto
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const viewCountedRef = useRef(false);
  const watchedDurationRef = useRef(0);
  const maxWatchedDurationRef = useRef(0);
  
  // Video player overlay controls state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

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
              setPlaying(true);
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

  // Close download menu, speed menu, and quality menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target)) {
        setShowQualityMenu(false);
      }
    };

    if (showSpeedMenu || showQualityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedMenu, showQualityMenu]);

  // Keyboard shortcuts for video player
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      const player = playerRef.current;
      if (!player) return;

      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          // Play/Pause
          e.preventDefault();
          setPlaying(!playing);
          break;
        
        case 'arrowleft':
          // Rewind 5 seconds
          e.preventDefault();
          player.seekTo(Math.max(0, player.getCurrentTime() - 5));
          break;
        
        case 'arrowright':
          // Forward 5 seconds
          e.preventDefault();
          player.seekTo(player.getCurrentTime() + 5);
          break;
        
        case 'j':
          // Rewind 10 seconds
          e.preventDefault();
          player.seekTo(Math.max(0, player.getCurrentTime() - 10));
          break;
        
        case 'l':
          // Forward 10 seconds
          e.preventDefault();
          player.seekTo(player.getCurrentTime() + 10);
          break;
        
        case 'arrowup':
          // Volume up
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          setMuted(false);
          break;
        
        case 'arrowdown':
          // Volume down
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        
        case 'm':
          // Toggle mute
          e.preventDefault();
          setMuted(!muted);
          break;
        
        case 'f':
          // Toggle fullscreen
          e.preventDefault();
          if (!document.fullscreenElement) {
            videoContainerRef.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Seek to percentage (0-90%)
          e.preventDefault();
          const percentage = parseInt(e.key) / 10;
          player.seekTo(percentage, 'fraction');
          break;
        
        case '<':
        case ',':
          // Decrease playback speed
          e.preventDefault();
          setPlaybackRate(prev => Math.max(0.25, prev - 0.25));
          break;
        
        case '>':
        case '.':
          // Increase playback speed
          e.preventDefault();
          setPlaybackRate(prev => Math.min(2, prev + 0.25));
          break;
        
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [playing, volume, muted]);

  // Update player when quality changes
  useEffect(() => {
    if (playerRef.current && video) {
      // Force player to reload with new URL (prefer CDN URL)
      const newUrl = selectedSource
        ? (selectedSource.cdnUrl || selectedSource.url || selectedSource.videoUrl || video.cdnUrl || video.videoUrl)
        : (video.cdnUrl || video.videoUrl);

      console.log('🎬 ReactPlayer URL:', {
        url: newUrl,
        isHLS: newUrl?.includes('.m3u8'),
        isProxy: newUrl?.includes('localhost:5000/api/hls'),
        isCDN: newUrl?.includes('b-cdn.net'),
        isB2: newUrl?.includes('backblazeb2.com')
      });

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
      }

      // ✅ Prioritize localhost proxy URLs (no CORS issues) over CDN URLs
      let finalVideoUrl;
      if (videoData.videoUrl?.includes('localhost:5000/api/hls')) {
        finalVideoUrl = videoData.videoUrl; // Use proxy URL
        console.log('✅ Using proxy URL (no CORS):', finalVideoUrl);
        // Update videoData to use proxy URL
        videoData.videoUrl = finalVideoUrl;
        videoData.cdnUrl = finalVideoUrl; // Override cdnUrl with proxy
      } else {
        finalVideoUrl = videoData.cdnUrl || videoData.videoUrl; // Fallback to CDN
        if (finalVideoUrl?.includes('b-cdn.net')) {
          console.log('✅ Using Bunny CDN:', finalVideoUrl);
        } else if (finalVideoUrl?.includes('backblazeb2.com')) {
          console.warn('⚠️ Still using B2 directly:', finalVideoUrl);
        }
      }
      const isStillProcessing =
        typeof videoData.processingStatus === 'string' && videoData.processingStatus !== 'completed';
      const isPlaceholder =
        typeof finalVideoUrl === 'string' && finalVideoUrl.trim().toLowerCase() === 'processing';

      if ((!finalVideoUrl || isPlaceholder) && !isStillProcessing) {
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
      const isHlsVideo =
        (typeof videoData.hlsUrl === 'string' && (videoData.hlsUrl.includes('.m3u8') || videoData.hlsUrl.includes('/api/hls/'))) ||
        (typeof videoData.videoUrl === 'string' && (videoData.videoUrl.includes('.m3u8') || videoData.videoUrl.includes('/api/hls/')));

      if (isHlsVideo) {
        // HLS should default to Auto (master playlist). User can still manually pick a quality.
        setSelectedSource(null);
      } else if (sources.length > 0) {
        const sorted = [...sources].sort((a, b) => {
          const aq = parseInt(String(a.quality).replace(/[^0-9]/g, ''), 10);
          const bq = parseInt(String(b.quality).replace(/[^0-9]/g, ''), 10);
          return (aq || 0) - (bq || 0);
        });
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

  const normalizePlaybackUrl = (inputUrl) => {
    if (!inputUrl || typeof inputUrl !== 'string') return inputUrl;

    // ✅ FIX: Keep ALL /api/hls/ URLs as proxy URLs (don't convert to CDN)
    // This ensures videos play through the backend proxy which handles B2 access
    if (inputUrl.includes('/api/hls/')) {
      // Convert relative URLs to absolute URLs
      if (!inputUrl.startsWith('http')) {
        // Use production domain in production, localhost in development
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5000' 
          : window.location.origin;
        return `${baseUrl}${inputUrl}`;
      }
      
      // Fix localhost URLs to use production domain if we're in production
      if (window.location.hostname !== 'localhost' && 
          (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1'))) {
        // Replace localhost with production domain
        return inputUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, window.location.origin);
      }
      
      return inputUrl;
    }

    // Keep localhost URLs as-is for local development/testing
    if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
      // But fix them if we're in production
      if (window.location.hostname !== 'localhost') {
        return inputUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, window.location.origin);
      }
      return inputUrl;
    }

    // For production: If you want to use CDN, uncomment this
    // const proxyMatch = inputUrl.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
    // if (proxyMatch) {
    //   const [, userId, videoId, file] = proxyMatch;
    //   const cdnBase = process.env.REACT_APP_CDN_BASE || 'https://Xclub.b-cdn.net';
    //   return `${cdnBase}/videos/${userId}/${videoId}/${file}`;
    // }

    return inputUrl;
  };

  const isPlaceholderUrl = (value) => {
    if (typeof value !== 'string') return false;
    return value.trim().toLowerCase() === 'processing';
  };

  const pickPlaybackUrl = () => {
    if (!video) return undefined;

    // HLS-only mode: only consider HLS playlist URLs.
    const baseCandidates = [video.hlsUrl, video.videoUrl, video.cdnUrl];

    const candidates = selectedSource
      ? [
          selectedSource.videoUrl,
          selectedSource.url,
          selectedSource.cdnUrl,
          ...baseCandidates,
        ]
      : baseCandidates;

    const isHlsUrl = (u) => typeof u === 'string' && (u.includes('/api/hls/') || u.includes('.m3u8'));
    const isLocalhostUrl = (u) => typeof u === 'string' && (u.includes('localhost') || u.includes('127.0.0.1'));

    // Support localhost URLs for local development/testing
    const localhostCandidate = candidates.find(
      (u) => isLocalhostUrl(u) && u.trim().length > 0 && !isPlaceholderUrl(u)
    );
    if (localhostCandidate) {
      console.log('🏠 Using localhost URL:', localhostCandidate);
      return localhostCandidate; // Don't normalize localhost URLs
    }

    // Prefer proxy URLs for HLS.
    const proxyCandidate = candidates.find(
      (u) => isHlsUrl(u) && u.includes('/api/hls/') && u.trim().length > 0 && !isPlaceholderUrl(u)
    );
    const firstHlsCandidate = candidates.find(
      (u) => isHlsUrl(u) && u.trim().length > 0 && !isPlaceholderUrl(u)
    );

    return normalizePlaybackUrl(proxyCandidate || firstHlsCandidate);
  };

  const playbackUrl = pickPlaybackUrl();
  
  // Debug logging
  useEffect(() => {
    if (video) {
      console.log('🎬 Video Data:', {
        hlsUrl: video.hlsUrl,
        videoUrl: video.videoUrl,
        cdnUrl: video.cdnUrl,
        playbackUrl: playbackUrl,
        processingStatus: video.processingStatus
      });
    }
  }, [video, playbackUrl]);
  
  const isHlsPlayback = typeof playbackUrl === 'string' && (
    playbackUrl.includes('.m3u8') || playbackUrl.includes('/api/hls/')
  );

  const isProcessing = Boolean(
    video && (
      (typeof video.processingStatus === 'string' && video.processingStatus !== 'completed') ||
      isPlaceholderUrl(video.videoUrl) ||
      isPlaceholderUrl(video.cdnUrl)
    )
  );

  // HLS-only UX: if video isn't ready as HLS, treat it as needing processing.
  const needsHls = Boolean(video && !isHlsPlayback);

  const hasPlayableUrl = typeof playbackUrl === 'string' && playbackUrl.trim().length > 0 && !isPlaceholderUrl(playbackUrl);

  // Poll processing status for queued/processing videos and refresh once ready.
  useEffect(() => {
    if (!id || !video) return;
    if (!isProcessing) return;

    let isCancelled = false;

    const pollOnce = async () => {
      try {
        const res = await getProcessingStatus(id);
        const data = res?.data?.data;
        if (!data) return;

        setVideo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            processingStatus: data.status ?? prev.processingStatus,
            processingError: data.error ?? prev.processingError,
            hlsUrl: data.hlsUrl ?? prev.hlsUrl,
          };
        });

        if (data.isReady && !isCancelled) {
          await fetchVideo();
        }
      } catch (e) {
        // Ignore transient polling errors.
      }
    };

    pollOnce();
    const intervalId = setInterval(pollOnce, 5000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, video?.processingStatus, video?.videoUrl, video?.cdnUrl]);

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
          <div 
            className="video-player" 
            ref={videoContainerRef}
            onMouseMove={() => {
              if (hasPlayableUrl && !isProcessing && !needsHls) {
                setShowControls(true);
                if (controlsTimeoutRef.current) {
                  clearTimeout(controlsTimeoutRef.current);
                }
                controlsTimeoutRef.current = setTimeout(() => {
                  if (playing) setShowControls(false);
                }, 3000);
              }
            }}
            onMouseLeave={() => {
              if (playing && hasPlayableUrl && !isProcessing && !needsHls) {
                setShowControls(false);
              }
            }}
            onClick={() => {
              if (hasPlayableUrl && !isProcessing && !needsHls) {
                setPlaying(!playing);
              }
            }}
          >
            {(!hasPlayableUrl || isProcessing || needsHls) ? (
              <div className="error-container">
                <p className="error-message">
                  {video?.processingStatus === 'failed'
                    ? (video?.processingError || 'Video processing failed')
                    : needsHls
                      ? 'Converting video to HLS… Please wait…'
                      : 'Video is still processing. Please wait…'}
                </p>
              </div>
            ) : (
              <>
                <ReactPlayer
                  ref={playerRef}
                  url={playbackUrl}
                  playing={playing}
                  volume={volume}
                  muted={muted}
                  playbackRate={playbackRate}
                  onReady={() => {
                    console.log('🎬 ReactPlayer ready');
                    console.log('🔊 Audio settings - Volume:', volume, 'Muted:', muted);
                    console.log('📹 Video URL:', playbackUrl);
                    // Get HLS levels if available (wait for HLS.js to initialize)
                    setTimeout(() => {
                      if (playerRef.current) {
                        try {
                          const internalPlayer = playerRef.current.getInternalPlayer();
                          console.log('🔍 Internal Player:', internalPlayer);
                          console.log('🔍 Player type:', internalPlayer?.constructor?.name);
                          
                          // For HLS.js player
                          if (internalPlayer && typeof internalPlayer.levels !== 'undefined') {
                            const levels = internalPlayer.levels || [];
                            console.log('📊 HLS Levels detected:', levels.length, levels);
                            
                            if (levels.length > 0) {
                              setHlsLevels(levels);
                              
                              // Get current level
                              const currentLevel = internalPlayer.currentLevel ?? -1;
                              if (currentLevel === -1) {
                                setCurrentQuality('Auto');
                              } else if (levels[currentLevel]) {
                                setCurrentQuality(`${levels[currentLevel].height}p`);
                              }
                              
                              // Listen for level changes
                              if (internalPlayer.on) {
                                internalPlayer.on('levelSwitched', (event, data) => {
                                  console.log('📊 Level switched:', data);
                                  if (data.level === -1) {
                                    setCurrentQuality('Auto');
                                  } else if (levels[data.level]) {
                                    setCurrentQuality(`${levels[data.level].height}p`);
                                  }
                                });
                              }
                            } else {
                              console.warn('⚠️ HLS levels array is empty');
                            }
                          } else {
                            console.warn('⚠️ HLS levels not available - player type:', internalPlayer?.constructor?.name);
                            console.log('Available properties:', Object.keys(internalPlayer || {}));
                          }
                        } catch (error) {
                          console.error('❌ Error detecting HLS levels:', error);
                        }
                      }
                    }, 1500);
                  }}
                  onProgress={(state) => {
                    if (!seeking) {
                      setPlayed(state.played);
                    }
                    handleProgress(state);
                  }}
                  onDuration={setDuration}
                  controls={false}
                  width="100%"
                  height="100%"
                  config={{
                    file: {
                      attributes: {
                        poster: video.thumbnailUrl || video.thumbnail,
                        controlsList: 'nodownload',
                        crossOrigin: 'anonymous',
                        playsInline: true
                      },
                      hlsOptions: {
                        enableWorker: true,
                        lowLatencyMode: false,
                        backBufferLength: 90,
                        maxBufferLength: 30,
                        maxMaxBufferLength: 600,
                        startLevel: -1, // Auto quality
                        debug: process.env.NODE_ENV === 'development',
                        // Ensure audio track is enabled
                        audioTrackSwitchingMode: 'immediate'
                      },
                      forceHLS: isHlsPlayback,
                      forceSafariHLS: true
                    }
                  }}
                  onPlay={() => {
                    window.dispatchEvent(new CustomEvent('collapseSidebar'));
                    setPlaying(true);
                    setVideoPlayed(true);
                    setError('');
                    setWaitingForAdPlay(false);
                  }}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  onError={(e) => {
                    console.error('❌ ReactPlayer error:', e);
                    console.error('Video URL:', playbackUrl);
                    console.error('Is HLS:', isHlsPlayback);
                    
                    let errorMsg = 'Failed to play video. ';
                    if (!playbackUrl) {
                      errorMsg += 'Video URL is missing. ';
                    } else if (video?.processingStatus !== 'completed') {
                      errorMsg += 'Video is still processing. ';
                    } else {
                      errorMsg += 'Please try refreshing the page.';
                    }
                    
                    setError(errorMsg);
                  }}
                />

                {/* YouTube-Style Overlay Controls */}
                <div className={`video-controls-overlay ${showControls ? 'visible' : ''}`}>
                  {/* Big Center Play Button */}
                  {!playing && (
                    <div className="center-play-button" onClick={(e) => {
                      e.stopPropagation();
                      setPlaying(true);
                    }}>
                      <FiPlay size={60} />
                    </div>
                  )}

                  {/* Progress Bar at Bottom */}
                  <div className="controls-bottom-section">
                    <div className="progress-bar-section">
                      <input
                        type="range"
                        min={0}
                        max={0.999999}
                        step="any"
                        value={played}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSeeking(true);
                        }}
                        onChange={(e) => {
                          e.stopPropagation();
                          setPlayed(parseFloat(e.target.value));
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          setSeeking(false);
                          playerRef.current?.seekTo(parseFloat(e.target.value));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="video-progress-bar"
                      />
                    </div>

                    {/* Bottom Controls Row */}
                    <div className="controls-bottom-row" onClick={(e) => e.stopPropagation()}>
                      <div className="controls-left-group">
                        <button
                          className="video-control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaying(!playing);
                          }}
                          title={playing ? 'Pause (k)' : 'Play (k)'}
                        >
                          {playing ? <FiPause size={24} /> : <FiPlay size={24} />}
                        </button>

                        <button
                          className="video-control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playerRef.current) {
                              playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10);
                            }
                          }}
                          title="Rewind 10s (j)"
                        >
                          <FiSkipBack size={20} />
                        </button>

                        <button
                          className="video-control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playerRef.current) {
                              playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10);
                            }
                          }}
                          title="Forward 10s (l)"
                        >
                          <FiSkipForward size={20} />
                        </button>

                        <div className="volume-control-group">
                          <button
                            className="video-control-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMuted(!muted);
                            }}
                            title={muted ? 'Unmute (m)' : 'Mute (m)'}
                          >
                            {muted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={muted ? 0 : volume}
                            onChange={(e) => {
                              e.stopPropagation();
                              const v = parseFloat(e.target.value);
                              setVolume(v);
                              if (v > 0) setMuted(false);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="volume-slider-overlay"
                          />
                        </div>

                        <span className="time-display-overlay">
                          {formatTime(played * duration)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="controls-right-group">
                        <div className="quality-control" ref={qualityMenuRef}>
                          <button 
                            className="video-control-btn quality-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQualityMenu(!showQualityMenu);
                            }}
                            title="Quality Settings"
                          >
                            <FiSettings size={18} />
                            <span className="quality-text">{currentQuality}</span>
                          </button>
                          {showQualityMenu && (
                            <div className="quality-menu-dropdown">
                              <button
                                className={`quality-option ${selectedHlsLevel === -1 ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (playerRef.current) {
                                    const internalPlayer = playerRef.current.getInternalPlayer();
                                    if (internalPlayer && internalPlayer.levels) {
                                      internalPlayer.currentLevel = -1; // Auto
                                      setSelectedHlsLevel(-1);
                                      setCurrentQuality('Auto');
                                      console.log('✅ Set quality to Auto');
                                    }
                                  }
                                  setShowQualityMenu(false);
                                }}
                              >
                                Auto
                              </button>
                              {hlsLevels.map((level, index) => (
                                <button
                                  key={index}
                                  className={`quality-option ${selectedHlsLevel === index ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (playerRef.current) {
                                      const internalPlayer = playerRef.current.getInternalPlayer();
                                      if (internalPlayer && internalPlayer.levels) {
                                        internalPlayer.currentLevel = index;
                                        setSelectedHlsLevel(index);
                                        setCurrentQuality(`${level.height}p`);
                                        console.log(`✅ Set quality to ${level.height}p`);
                                      }
                                    }
                                    setShowQualityMenu(false);
                                  }}
                                >
                                  {level.height}p
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="speed-control" ref={speedMenuRef}>
                          <button 
                            className="video-control-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSpeedMenu(!showSpeedMenu);
                            }}
                            title="Playback Speed"
                          >
                            <span className="speed-text">{playbackRate}x</span>
                          </button>
                          {showSpeedMenu && (
                            <div className="speed-menu-dropdown">
                              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                <button
                                  key={rate}
                                  className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlaybackRate(rate);
                                    setShowSpeedMenu(false);
                                  }}
                                >
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          className={`video-control-btn ${pipEnabled ? 'active' : ''}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!playerRef.current) return;
                            try {
                              const internalPlayer = playerRef.current.getInternalPlayer();
                              if (pipEnabled) {
                                if (document.pictureInPictureElement) {
                                  await document.exitPictureInPicture();
                                }
                                setPipEnabled(false);
                              } else {
                                if (internalPlayer && internalPlayer.requestPictureInPicture) {
                                  await internalPlayer.requestPictureInPicture();
                                  setPipEnabled(true);
                                }
                              }
                            } catch (err) {
                              console.error('PiP error:', err);
                            }
                          }}
                          title="Miniplayer (i)"
                        >
                          <FiMinimize2 size={20} />
                        </button>

                        <button
                          className="video-control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!videoContainerRef.current) return;
                            if (document.fullscreenElement) {
                              document.exitFullscreen();
                            } else {
                              videoContainerRef.current.requestFullscreen();
                            }
                          }}
                          title="Fullscreen (f)"
                        >
                          <FiMaximize2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
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
