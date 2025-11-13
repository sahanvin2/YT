import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FiThumbsUp, FiThumbsDown, FiShare2 } from 'react-icons/fi';
import { getVideo, likeVideo, dislikeVideo, addView, addToHistory } from '../../utils/api';
import { formatViews, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/CommentSection/CommentSection';
import SubscribeButton from '../../components/SubscribeButton/SubscribeButton';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);

  useEffect(() => {
    const loadVideo = async () => {
      await fetchVideo();
      await incrementView();
      if (isAuthenticated) {
        await addVideoToHistory();
      }
    };
    loadVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await getVideo(id);
      setVideo(res.data.data);
      setLikesCount(res.data.data.likes.length);
      setDislikesCount(res.data.data.dislikes.length);
      setError('');
    } catch (err) {
      setError('Failed to load video');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      await addView(id);
    } catch (err) {
      console.error(err);
    }
  };

  const addVideoToHistory = async () => {
    try {
      await addToHistory(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await likeVideo(id);
      setIsLiked(res.data.data.isLiked);
      setIsDisliked(false);
      setLikesCount(res.data.data.likes);
      setDislikesCount(res.data.data.dislikes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await dislikeVideo(id);
      setIsDisliked(res.data.data.isDisliked);
      setIsLiked(false);
      setLikesCount(res.data.data.likes);
      setDislikesCount(res.data.data.dislikes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="error-container">
        <p className="error-message">{error || 'Video not found'}</p>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <div className="watch-content">
        <div className="video-player-section">
          <div className="video-player">
            <ReactPlayer
              url={video.videoUrl}
              controls
              width="100%"
              height="100%"
              playing
            />
          </div>

          <div className="video-info-section">
            <h1 className="video-title">{video.title}</h1>

            <div className="video-stats">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>

            <div className="video-actions">
              <button
                className={`action-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <FiThumbsUp size={20} />
                <span>{formatViews(likesCount)}</span>
              </button>

              <button
                className={`action-btn ${isDisliked ? 'active' : ''}`}
                onClick={handleDislike}
              >
                <FiThumbsDown size={20} />
                <span>{formatViews(dislikesCount)}</span>
              </button>

              <button className="action-btn" onClick={handleShare}>
                <FiShare2 size={20} />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="channel-info">
            <div className="channel-details">
              <Link to={`/channel/${video.user._id}`} className="channel-avatar">
                <img src={video.user.avatar} alt={video.user.username} />
              </Link>

              <div className="channel-meta">
                <Link to={`/channel/${video.user._id}`} className="channel-name">
                  {video.user.channelName || video.user.username}
                </Link>
                <span className="subscriber-count">
                  {formatViews(video.user.subscribers?.length || 0)} subscribers
                </span>
              </div>
            </div>

            <SubscribeButton channelId={video.user._id} />
          </div>

          <div className="video-description">
            <p className={showFullDescription ? 'expanded' : ''}>
              {video.description}
            </p>
            {video.description.length > 200 && (
              <button
                className="show-more-btn"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          <CommentSection videoId={id} comments={video.comments} />
        </div>

        <div className="suggested-videos">
          <h3>Suggested Videos</h3>
          {/* This would be populated with related videos in a real app */}
          <p className="no-videos">No suggested videos yet</p>
        </div>
      </div>
    </div>
  );
};

export default Watch;
