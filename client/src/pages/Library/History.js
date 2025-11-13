import React, { useEffect, useState } from 'react';
import { getWatchHistory } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import './Library.css';

const History = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getWatchHistory();
        setItems(res.data.data || []);
      } catch (e) {
        setError('Failed to load history');
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
      <h2>Watch History</h2>
      <div className="videos-grid">
        {items.length === 0 ? (
          <div className="no-content"><p>No history yet</p></div>
        ) : (
          items.map(item => item.video && <VideoCard key={item.video._id} video={item.video} />)
        )}
      </div>
    </div>
  );
};

export default History;
