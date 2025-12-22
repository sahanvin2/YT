import React, { useEffect, useState } from 'react';
import { getLikedVideos } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Library.css';

const Liked = () => {
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
      setError('Please sign in to view your liked videos');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getLikedVideos();
        const videosData = res.data?.data || res.data || [];
        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (e) {
        console.error('Error loading liked videos:', e);
        // Check if it's an authentication error
        if (e.response?.status === 401) {
          setError('Please sign in to view your liked videos');
          // Optionally redirect to login after a delay
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load liked videos. Please try refreshing the page.');
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
      <h2>Liked Videos</h2>
      {videos.length === 0 ? (
        <div className="no-content"><p>No liked videos yet</p></div>
      ) : (
        <div className="videos-grid">
          {videos.map(v => <VideoCard key={v._id} video={v} />)}
        </div>
      )}
    </div>
  );
};

export default Liked;
