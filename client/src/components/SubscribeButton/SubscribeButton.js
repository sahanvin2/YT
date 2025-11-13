import React, { useState } from 'react';
import { toggleSubscribe } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './SubscribeButton.css';

const SubscribeButton = ({ channelId, initialSubscribed = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);

  // Don't show subscribe button if it's the user's own channel
  if (user && user.id === channelId) {
    return null;
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      alert('Please login to subscribe');
      return;
    }

    try {
      setLoading(true);
      const res = await toggleSubscribe(channelId);
      setIsSubscribed(res.data.data.isSubscribed);
    } catch (err) {
      console.error(err);
      alert('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? 'Loading...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
};

export default SubscribeButton;
