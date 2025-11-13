import React, { useState, useEffect } from 'react';
import VideoCard from '../../components/VideoCard/VideoCard';
import { getVideos } from '../../utils/api';
import './Home.css';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await getVideos({ page, limit: 12 });
      setVideos(res.data.data);
      setHasMore(res.data.currentPage < res.data.totalPages);
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
      const res = await getVideos({ page: nextPage, limit: 12 });
      setVideos([...videos, ...res.data.data]);
      setPage(nextPage);
      setHasMore(res.data.currentPage < res.data.totalPages);
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
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
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
