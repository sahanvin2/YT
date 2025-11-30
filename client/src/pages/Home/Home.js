import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import VideoCard from '../../components/VideoCard/VideoCard';
import NativeAd from '../../components/Ads/NativeAd';
import { getVideos, getTrendingVideos, searchVideos } from '../../utils/api';
import './Home.css';

const Home = ({ mode }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const location = useLocation();
  const { category } = useParams();

  useEffect(() => {
    // Reset when mode or params change
    setVideos([]);
    setPage(1);
    setHasMore(true);
    fetchVideos(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, category, location.search]);

  const fetchVideos = async (pageToLoad = page, replace = false) => {
    try {
      setLoading(true);
      let res;
      if (mode === 'trending') {
        res = await getTrendingVideos();
      } else if (mode === 'category') {
        res = await getVideos({ page: pageToLoad, limit: 12, category });
      } else if (mode === 'search') {
        const q = new URLSearchParams(location.search).get('q') || '';
        res = await searchVideos(q, { page: pageToLoad, limit: 12 });
      } else {
        res = await getVideos({ page: pageToLoad, limit: 12 });
      }
      const nextVideos = res.data.data || res.data; // trending returns data only
      setVideos(replace ? nextVideos : [...videos, ...nextVideos]);
      if (res.data?.currentPage && res.data?.totalPages) {
        setHasMore(res.data.currentPage < res.data.totalPages);
      } else {
        setHasMore(false);
      }
      setError('');
    } catch (err) {
      setError('Failed to load videos');
      console.error(err);
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
      <div className="videos-grid">
        {videos.map((video, index) => (
          <React.Fragment key={video._id}>
            <VideoCard video={video} />
            <NativeAd position="video-list" index={index} />
          </React.Fragment>
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
  );
};

export default Home;
