import React, { useEffect, useState } from 'react';
import { getVideos } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import './Library.css';

const Clips = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getVideos({ clips: 'true', limit: 50 });
        const videosData = res.data?.data || res.data || [];
        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (e) {
        console.error('Error loading clips:', e);
        setError('Failed to load clips');
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
      <h2>Clips</h2>
      <div className="videos-grid">
        {videos.length === 0 ? (
          <div className="no-content"><p>No clips available yet</p></div>
        ) : (
          videos.map(v => <VideoCard key={v._id} video={v} />)
        )}
      </div>
    </div>
  );
};

export default Clips;

