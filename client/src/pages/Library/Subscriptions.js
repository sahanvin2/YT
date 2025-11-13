import React, { useEffect, useState } from 'react';
import { getSubscriptions, getSubscriptionVideos } from '../../utils/api';
import VideoCard from '../../components/VideoCard/VideoCard';
import { Link } from 'react-router-dom';
import './Library.css';

const Subscriptions = () => {
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [channelsRes, videosRes] = await Promise.all([
          getSubscriptions(),
          getSubscriptionVideos({ page: 1, limit: 24 })
        ]);
        setChannels(channelsRes.data.data || []);
        setVideos(videosRes.data.data || []);
      } catch (e) {
        setError('Failed to load subscriptions');
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
      <h2>Subscriptions</h2>
      <div className="channels-grid">
        {channels.length === 0 ? (
          <div className="no-content"><p>No subscriptions yet</p></div>
        ) : (
          channels.map(ch => (
            <Link to={`/channel/${ch._id}`} key={ch._id} className="channel-card">
              <img src={ch.avatar} alt={ch.username} />
              <div className="channel-info">
                <strong>{ch.channelName || ch.username}</strong>
                <span>@{ch.username}</span>
              </div>
            </Link>
          ))
        )}
      </div>
      {videos.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Latest from your channels</h3>
          <div className="videos-grid">
            {videos.map(v => <VideoCard key={v._id} video={v} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
