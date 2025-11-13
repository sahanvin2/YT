import React from 'react';
import { Link } from 'react-router-dom';
import { formatViews, formatDate, formatDuration } from '../../utils/helpers';
import './VideoCard.css';

const VideoCard = ({ video, layout = 'grid' }) => {
  return (
    <div className={`video-card ${layout}`}>
      <Link to={`/watch/${video._id}`} className="video-thumbnail">
        <img src={video.thumbnailUrl} alt={video.title} />
        {video.duration > 0 && (
          <span className="video-duration">{formatDuration(video.duration)}</span>
        )}
      </Link>

      <div className="video-info">
        <Link to={`/channel/${video.user._id}`} className="video-avatar">
          <img src={video.user.avatar} alt={video.user.username} />
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
      </div>
    </div>
  );
};

export default VideoCard;
