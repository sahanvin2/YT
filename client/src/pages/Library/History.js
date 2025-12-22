import React, { useEffect, useState } from 'react';
import { getWatchHistory } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Library.css';

const History = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for auth to load before making request
    if (authLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Please sign in to view your watch history');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getWatchHistory();
        setItems(res.data.data || []);
      } catch (e) {
        console.error('Error loading history:', e);
        // Check if it's an authentication error
        if (e.response?.status === 401) {
          setError('Please sign in to view your watch history');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load history. Please try refreshing the page.');
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, authLoading, navigate]);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="library-page">
      <h2>Watch History</h2>
      {items.length === 0 ? (
        <div className="no-content"><p>No history yet</p></div>
      ) : (
        <div className="videos-grid">
          {items.map(item => item.video && <VideoCard key={item.video._id} video={item.video} />)}
        </div>
      )}
    </div>
  );
};

export default History;
