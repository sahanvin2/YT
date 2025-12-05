import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiMoreVertical } from 'react-icons/fi';
import { formatViews, formatDate, formatDuration } from '../../utils/helpers';
import './VideoCard.css';

const VideoCard = ({ video, layout = 'grid', simplified = false }) => {
  return (
    <div className={`video-card ${layout} ${simplified ? 'simplified' : ''}`}>
      <Link to={`/watch/${video._id}`} className="video-thumbnail">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          loading="lazy"
          decoding="async"
        />
        {video.duration > 0 && (
          <span className="video-duration">{formatDuration(video.duration)}</span>
        )}
        <div className="video-play-overlay">
          <div className="video-play-button">
            <FiPlay size={20} fill="#050308" color="#050308" />
          </div>
        </div>
      </Link>

      {!simplified ? (
        <div className="video-info">
          <Link to={`/channel/${video.user._id}`} className="video-avatar">
            <img 
              src={video.user.avatar} 
              alt={video.user.username}
              loading="lazy"
              decoding="async"
            />
          </Link>

          <div className="video-details">
            <Link to={`/watch/${video._id}`} className="video-title">
              {video.title}
            </Link>

            <Link to={`/channel/${video.user._id}`} className="video-channel">
              {video.user.channelName || video.user.username}
            </Link>

            <div className="video-meta">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>

          <button className="video-more-btn" onClick={(e) => e.preventDefault()}>
            <FiMoreVertical size={16} />
          </button>
        </div>
      ) : (
        <div className="video-info-simplified">
          <Link to={`/watch/${video._id}`} className="video-title-simplified">
            {video.title}
          </Link>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
