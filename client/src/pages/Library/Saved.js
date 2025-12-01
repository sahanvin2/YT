import React, { useEffect, useState } from 'react';
import { getSavedVideos } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Library.css';

const Saved = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for auth to load before making request
    if (authLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Please sign in to view your saved videos');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getSavedVideos();
        const videosData = res.data?.data || res.data || [];
        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (e) {
        console.error('Error loading saved videos:', e);
        // Check if it's an authentication error
        if (e.response?.status === 401) {
          setError('Please sign in to view your saved videos');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load saved videos. Please try refreshing the page.');
        }
        setVideos([]);
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
      <h2>Saved Videos</h2>
      <div className="videos-grid">
        {videos.length === 0 ? (
          <div className="no-content"><p>No saved videos yet</p></div>
        ) : (
          videos.map(v => <VideoCard key={v._id} video={v} />)
        )}
      </div>
    </div>
  );
};

export default Saved;

