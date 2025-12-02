import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserVideos, updateVideo, deleteVideo } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiEdit, FiTrash2, FiLock, FiUnlock } from 'react-icons/fi';
import VideoCard from '../../components/VideoCard/VideoCard';
import EditVideoModal from '../../components/EditVideoModal/EditVideoModal';
import './VideoManager.css';

const VideoManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      // Fetch ALL videos (no limit) for the owner - includes public and private
      const res = await getUserVideos(user.id || user._id, { limit: 1000, page: 1 });
      const videosData = res.data?.data || res.data || [];
      setVideos(Array.isArray(videosData) ? videosData : []);
      setError('');
    } catch (err) {
      setError('Failed to load videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setSelectedVideo(video);
    setShowEditModal(true);
  };

  const handleEditUpdate = (updatedVideo) => {
    setVideos(prevVideos => prevVideos.map(v =>
      v._id === updatedVideo._id ? updatedVideo : v
    ));
    setShowEditModal(false);
    setSelectedVideo(null);
  };


  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }
    try {
      await deleteVideo(videoId);
      setVideos(videos.filter(v => v._id !== videoId));
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  const handleToggleVisibility = async (video) => {
    try {
      const newVisibility = video.visibility === 'public' ? 'private' : 'public';
      await updateVideo(video._id, { visibility: newVisibility });
      setVideos(videos.map(v => 
        v._id === video._id ? { ...v, visibility: newVisibility } : v
      ));
    } catch (err) {
      console.error('Error updating visibility:', err);
      alert('Failed to update video visibility');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="video-manager-page">
      <div className="video-manager-header">
        <h1>Video Manager</h1>
        <p className="manager-subtitle">Manage and edit your videos</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="videos-manager-grid">
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video._id} className="video-manager-item">
              <VideoCard video={video} />
              <div className="video-manager-actions">
                <div className="video-info-row">
                  <span className={`visibility-badge ${video.visibility}`}>
                    {video.visibility === 'public' ? (
                      <>
                        <FiUnlock size={14} />
                        Public
                      </>
                    ) : (
                      <>
                        <FiLock size={14} />
                        Private
                      </>
                    )}
                  </span>
                  <span className="video-duration">{formatTime(video.duration || 0)}</span>
                </div>
                <div className="action-buttons">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(video)}
                    title="Edit video"
                  >
                    <FiEdit size={16} />
                    Edit
                  </button>
                  <button
                    className="action-btn visibility-btn"
                    onClick={() => handleToggleVisibility(video)}
                    title={`Make ${video.visibility === 'public' ? 'private' : 'public'}`}
                  >
                    {video.visibility === 'public' ? (
                      <>
                        <FiLock size={16} />
                        Make Private
                      </>
                    ) : (
                      <>
                        <FiUnlock size={16} />
                        Make Public
                      </>
                    )}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(video._id)}
                    title="Delete video"
                  >
                    <FiTrash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-content">
            <p>No videos found. Upload your first video!</p>
            <button
              className="upload-btn"
              onClick={() => navigate('/upload')}
            >
              Upload Video
            </button>
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      {showEditModal && selectedVideo && (
        <EditVideoModal
          video={selectedVideo}
          onClose={() => {
            setShowEditModal(false);
            setSelectedVideo(null);
          }}
          onUpdate={handleEditUpdate}
        />
      )}
    </div>
  );
};

export default VideoManager;

