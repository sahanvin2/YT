import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { FiPlay, FiPlus, FiZap, FiTarget, FiSmile, FiTv, FiCompass, FiFilm, FiVideo } from 'react-icons/fi';
import { getVideos, getTrendingVideos, searchVideos, getTopCreators, getBannerVideo } from '../../utils/api';
import { formatDuration } from '../../utils/helpers';
import { getCategoryImagePath } from '../../utils/categoryImages';
import './Home.css';

const Home = ({ mode }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [topCreators, setTopCreators] = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [allTrendingVideos, setAllTrendingVideos] = useState([]);
  const [displayedVideosCount, setDisplayedVideosCount] = useState(8);
  const location = useLocation();
  const { category } = useParams();
  const navigate = useNavigate();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const shouldRetryNetworkError = (err) => {
    // axios browser network errors often have no response
    if (!err) return false;
    if (!err.response) return true;
    const status = err.response?.status;
    return status === 502 || status === 503 || status === 504;
  };

  const withRetry = async (fn, retries = 4) => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt >= retries || !shouldRetryNetworkError(err)) throw err;
        await sleep(250 * (attempt + 1));
      }
    }
    throw lastErr;
  };

  const topCategories = [
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'Series' },
    { id: 'documentaries', label: 'Documentaries' },
    { id: 'animation', label: 'Animation' },
    { id: 'action', label: 'Action' },
    { id: 'comedy', label: 'Comedy' },
    { id: 'drama', label: 'Drama' },
    { id: 'horror', label: 'Horror' }
  ];

  useEffect(() => {
    // Reset when mode or params change
    setVideos([]);
    setPage(1);
    setHasMore(true);
    fetchVideos(1, true);
    if (mode !== 'trending' && mode !== 'search' && mode !== 'category') {
      fetchFeaturedVideo();
      fetchFeaturedVideos();
      fetchTopCreators();
      fetchAllTrendingVideos();
    } else if (mode === 'category') {
      fetchTopCreatorsForCategory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, category, location.search]);

  const fetchFeaturedVideos = async () => {
    try {
      const res = await withRetry(() => getTrendingVideos());
      const trending = res.data.data || res.data;
      if (trending && trending.length > 0) {
        setFeaturedVideos(trending.slice(0, 8));
      }
    } catch (err) {
      console.error('Error fetching featured videos:', err);
    }
  };

  const fetchTopCreators = async () => {
    try {
      const res = await withRetry(() => getTopCreators({ limit: 200 }));
      const creators = res.data.data || res.data;
      setTopCreators(Array.isArray(creators) ? creators : []);
    } catch (err) {
      console.error('Error fetching top creators:', err);
    }
  };

  const fetchTopCreatorsForCategory = async () => {
    try {
      const res = await withRetry(() => getTopCreators({ limit: 200, category }));
      const creators = res.data.data || res.data;
      setTopCreators(Array.isArray(creators) ? creators : []);
    } catch (err) {
      console.error('Error fetching top creators for category:', err);
    }
  };

  const fetchAllTrendingVideos = async () => {
    try {
      const res = await withRetry(() => getTrendingVideos());
      const trending = res.data.data || res.data;
      if (trending && trending.length > 0) {
        setAllTrendingVideos(trending);
      }
    } catch (err) {
      console.error('Error fetching all trending videos:', err);
    }
  };

  const fetchFeaturedVideo = async () => {
    try {
      // First try to get admin-selected banner video
      const res = await withRetry(() => getBannerVideo());
      const bannerVideo = res.data.data;
      if (bannerVideo) {
        setFeaturedVideo(bannerVideo);
        return;
      }
      
      // Fallback to trending videos
      const trendingRes = await withRetry(() => getTrendingVideos());
      const trending = trendingRes.data.data || trendingRes.data;
      if (trending && trending.length > 0) {
        setFeaturedVideo(trending[0]);
      }
    } catch (err) {
      console.error('Error fetching featured video:', err);
      // Fallback to trending if banner API fails
      try {
        const trendingRes = await withRetry(() => getTrendingVideos());
        const trending = trendingRes.data.data || trendingRes.data;
        if (trending && trending.length > 0) {
          setFeaturedVideo(trending[0]);
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  };

  const fetchVideos = async (pageToLoad = page, replace = false) => {
    try {
      setLoading(true);
      let res;
      if (mode === 'trending') {
        res = await withRetry(() => getTrendingVideos());
      } else if (mode === 'category') {
        res = await withRetry(() => getVideos({ page: pageToLoad, limit: 12, category }));
      } else if (mode === 'search') {
        const q = new URLSearchParams(location.search).get('q') || '';
        res = await withRetry(() => searchVideos(q, { page: pageToLoad, limit: 12 }));
      } else {
        res = await withRetry(() => getVideos({ page: pageToLoad, limit: 12 }));
      }
      const nextVideos = res.data.data || res.data; // trending returns data only
      // For trending section, limit to 8 videos
      const limitedVideos = mode !== 'trending' && mode !== 'search' && mode !== 'category' 
        ? (replace ? nextVideos.slice(0, 8) : [...videos, ...nextVideos].slice(0, 8))
        : (replace ? nextVideos : [...videos, ...nextVideos]);
      setVideos(limitedVideos);
      if (res.data?.currentPage && res.data?.totalPages) {
        setHasMore(res.data.currentPage < res.data.totalPages);
      } else {
        setHasMore(false);
      }
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load videos';
      setError(errorMsg);
      console.error('❌ Failed to load videos:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      await fetchVideos(nextPage);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && videos.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Banner */}
      {mode !== 'trending' && mode !== 'search' && mode !== 'category' && featuredVideo && (
        <div className="hero-banner" onClick={() => navigate(`/watch/${featuredVideo._id}`)}>
          <div className="hero-banner-image">
            <img 
              src={featuredVideo.thumbnail || featuredVideo.thumbnailUrl} 
              alt={featuredVideo.title}
              loading="lazy"
            />
            <div className="hero-banner-overlay"></div>
          </div>
          <div className="hero-banner-content">
            <div className="hero-banner-badges">
              <span className="hero-badge featured">Featured</span>
              <span className="hero-badge live">
                <span className="live-dot"></span>
                Live Premiere
              </span>
            </div>
            <h2 className="hero-banner-title">{featuredVideo.title}</h2>
            <div className="hero-banner-actions">
              <button 
                className="hero-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/watch/${featuredVideo._id}`);
                }}
              >
                <FiPlay size={16} fill="currentColor" />
                Play Now
              </button>
              <button className="hero-list-btn">
                <FiPlus size={16} />
                My List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Categories - Circles */}
      {mode !== 'trending' && mode !== 'search' && mode !== 'category' && (
        <div className="top-categories-section">
          <div className="top-categories-container">
            {topCategories.map((category) => {
              const imagePath = getCategoryImagePath(category.id);
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="category-circle"
                >
                  <div className="category-circle-icon">
                    <img 
                      src={imagePath} 
                      alt={category.label}
                      className="category-image"
                      loading="lazy"
                    />
                    <div className="category-overlay-gradient"></div>
                  </div>
                  <span className="category-label">{category.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Section */}
      {mode !== 'trending' && mode !== 'search' && mode !== 'category' && featuredVideos.length > 0 && (
        <div className="featured-section">
          <h3 className="section-title">
            Featured
          </h3>
          <div className="featured-videos-row">
            {featuredVideos.map((video) => (
              <div key={video._id} className="featured-video-item" onClick={() => navigate(`/watch/${video._id}`)}>
                <div className="featured-video-thumbnail">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    loading="lazy"
                  />
                  {video.duration > 0 && (
                    <span className="featured-video-duration">{formatDuration(video.duration)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Creators - Circles */}
      {mode !== 'trending' && mode !== 'search' && mode !== 'category' && topCreators.length > 0 && (
        <div className="top-creators-section">
          <h3 className="section-title">Top Creators</h3>
          <div className="top-creators-container">
            {topCreators.map((creator) => (
              <Link
                key={creator._id || creator.id}
                to={`/channel/${creator._id || creator.id}`}
                className="creator-circle"
              >
                <img 
                  src={creator.avatar} 
                  alt={creator.channelName || creator.username}
                  className="creator-avatar"
                />
                <span className="creator-name">{creator.channelName || creator.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Videos Section - Simplified */}
      {mode !== 'trending' && mode !== 'search' && mode !== 'category' && (
        <div className="trending-videos-section">
          <h3 className="section-title">
            <FiZap size={24} />
            Trending in Videos
          </h3>
          <div className="trending-videos-grid">
            {allTrendingVideos.slice(0, displayedVideosCount).map((video) => (
              <Link 
                key={video._id} 
                to={`/watch/${video._id}`}
                className="trending-video-item"
              >
                <div className="trending-video-thumbnail">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    loading="lazy"
                  />
                  <div className="trending-video-overlay">
                    <FiPlay size={24} fill="currentColor" />
                  </div>
                </div>
                <h4 className="trending-video-title">{video.title}</h4>
              </Link>
            ))}
          </div>
          {allTrendingVideos.length > displayedVideosCount && (
            <div className="load-more-container">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setDisplayedVideosCount(prev => Math.min(prev + 8, allTrendingVideos.length));
                  // Scroll to bottom after a short delay
                  setTimeout(() => {
                    window.scrollTo({
                      top: document.documentElement.scrollHeight,
                      behavior: 'smooth'
                    });
                  }, 100);
                }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* Videos Grid - For category mode with simplified style */}
      {mode === 'category' && (
        <>
          {/* Top Creators for Category */}
          {topCreators.length > 0 && (
            <div className="top-creators-section">
              <h3 className="section-title">Top Creators</h3>
              <div className="top-creators-container">
                {topCreators.map((creator) => (
                  <Link
                    key={creator._id || creator.id}
                    to={`/channel/${creator._id || creator.id}`}
                    className="creator-circle"
                  >
                    <img 
                      src={creator.avatar} 
                      alt={creator.channelName || creator.username}
                      className="creator-avatar"
                    />
                    <span className="creator-name">{creator.channelName || creator.username}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trending Videos Section - Simplified for Category */}
          <div className="trending-videos-section">
            <h3 className="section-title">
              <FiZap size={24} />
              {category}
            </h3>
            <div className="trending-videos-grid">
              {videos.map((video) => (
                <Link 
                  key={video._id} 
                  to={`/watch/${video._id}`}
                  className="trending-video-item"
                >
                  <div className="trending-video-thumbnail">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      loading="lazy"
                    />
                    <div className="trending-video-overlay">
                      <FiPlay size={24} fill="currentColor" />
                    </div>
                  </div>
                  <h4 className="trending-video-title">{video.title}</h4>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="load-more-container">
                <button className="btn btn-secondary" onClick={loadMore}>
                  Load More
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Videos Grid - For trending and search modes with simplified style */}
      {(mode === 'trending' || mode === 'search') && (
        <div className="trending-videos-section">
          <h3 className="section-title">
            <FiZap size={24} />
            {mode === 'trending' ? 'Trending in the Void' : 'Search Results'}
          </h3>
          <div className="trending-videos-grid">
            {videos.map((video) => (
              <Link 
                key={video._id} 
                to={`/watch/${video._id}`}
                className="trending-video-item"
              >
                <div className="trending-video-thumbnail">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    loading="lazy"
                  />
                  <div className="trending-video-overlay">
                    <FiPlay size={24} fill="currentColor" />
                  </div>
                </div>
                <h4 className="trending-video-title">{video.title}</h4>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button className="btn btn-secondary" onClick={loadMore}>
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
