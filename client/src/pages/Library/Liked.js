import React, { useEffect, useState } from 'react';
import { getLikedVideos } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import './Library.css';

const Liked = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getLikedVideos();
        const videosData = res.data?.data || res.data || [];
        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (e) {
        console.error('Error loading liked videos:', e);
        setError('Failed to load liked videos');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="library-page">
      <h2>Liked Videos</h2>
      <div className="videos-grid">
        {videos.length === 0 ? (
          <div className="no-content"><p>No liked videos yet</p></div>
        ) : (
          videos.map(v => <VideoCard key={v._id} video={v} />)
        )}
      </div>
    </div>
  );
};

export default Liked;
