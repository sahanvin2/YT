import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiUpload, FiX, FiImage, FiFile, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { uploadVideo, presignPut, createVideoFromUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize } from '../../utils/helpers';
import './Upload.css';

const Upload = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('information');
  const [formData, setFormData] = useState({
    title: '',
    description: ' ',
    category: 'Indian',
    tags: '',
    visibility: 'public',
    playlist: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, completed, error
  const [loading, setLoading] = useState(false);
  const [usePresigned, setUsePresigned] = useState(false);
  const [error, setError] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // Collapse sidebar when component mounts or when upload starts
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('collapseSidebar'));
  }, []);

  useEffect(() => {
    if (uploadStatus === 'uploading') {
      window.dispatchEvent(new CustomEvent('collapseSidebar'));
    }
  }, [uploadStatus]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const { title, description, category, tags, visibility, playlist } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2147483648) { // 2GB
      setError('Video file must be less than 2GB');
      return;
    }

    setVideoFile(file);
    setError('');

    // Create preview
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);

    // Reset upload status
    setUploadProgress(0);
    setProcessingProgress(0);
    setUploadStatus('idle');
    setVideoLink('');
  };

  const onThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setThumbnailFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

    // Collapse sidebar when upload starts
    window.dispatchEvent(new CustomEvent('collapseSidebar'));

    try {
      setLoading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      if (!usePresigned) {
        // Standard upload with progress tracking
    const data = new FormData();
    data.append('title', title);
    data.append('description', description || ' ');
    data.append('category', category);
    data.append('tags', tags);
    data.append('visibility', visibility);
    data.append('video', videoFile);
    if (thumbnailFile) {
      data.append('thumbnail', thumbnailFile);
    }

        const res = await uploadVideo(data, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        });

        setUploadProgress(100);
        setUploadStatus('processing');
        setProcessingProgress(50);

        // Simulate processing progress
        const processingInterval = setInterval(() => {
          setProcessingProgress(prev => {
            if (prev >= 90) {
              clearInterval(processingInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        // Wait a bit for processing
        setTimeout(() => {
          clearInterval(processingInterval);
          setProcessingProgress(100);
          setUploadStatus('completed');
          setVideoLink(`/watch/${res.data.data._id}`);
          
          // Navigate after 2 seconds
          setTimeout(() => {
        navigate(`/watch/${res.data.data._id}`);
          }, 2000);
        }, 3000);
      } else {
        // Presigned upload
        setUploadStatus('uploading');
      const presignRes = await presignPut(videoFile.name, videoFile.type || 'application/octet-stream');
      if (!presignRes.data?.url) {
        throw new Error('Presign did not return a URL');
      }
      const putUrl = presignRes.data.url;
      const publicUrl = presignRes.data.publicUrl;

        // Upload with progress
      await axios.put(putUrl, videoFile, {
          headers: { 'Content-Type': videoFile.type || 'application/octet-stream' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
      });

        setUploadProgress(100);
        setUploadStatus('processing');
        setProcessingProgress(50);

      const createRes = await createVideoFromUrl({
        title,
        description,
        category,
        tags,
        visibility,
        videoUrl: publicUrl
      });

        setProcessingProgress(100);
        setUploadStatus('completed');
        setVideoLink(`/watch/${createRes.data.data._id}`);
        
        setTimeout(() => {
      navigate(`/watch/${createRes.data.data._id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload video');
      setUploadStatus('error');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
      if (window.confirm('Upload in progress. Are you sure you want to cancel?')) {
        setUploadStatus('idle');
        setUploadProgress(0);
        setProcessingProgress(0);
        setLoading(false);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="upload-page">
      {/* Header with channel info */}
      <div className="upload-header">
        <div className="upload-breadcrumb">
          <Link to={`/channel/${user?.id || user?._id}`} className="channel-link">
            {user?.channelName || user?.username || 'Your Channel'}
          </Link>
          <span className="breadcrumb-separator">›</span>
          <span>Videos</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Add video</span>
              </div>
        <button className="upload-another-btn">
          Upload another video
        </button>
            </div>

      {/* Upload progress bar */}
      {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
        <div className="upload-progress-bar">
          <div className="progress-info">
            <span className="progress-icon">☁️</span>
            <span className="progress-text">
              {uploadStatus === 'uploading' 
                ? `${uploadProgress}% uploaded` 
                : `${processingProgress}% processed`}
            </span>
            <button 
              className="progress-cancel" 
              onClick={handleCancel}
              title="Cancel upload"
            >
              <FiX size={16} />
            </button>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${uploadStatus === 'uploading' ? uploadProgress : processingProgress}%` 
              }}
            />
          </div>
              </div>
      )}

      <div className="upload-container">
        <div className="upload-layout">
          {/* Left Column - Information */}
          <div className="upload-left">
            <div className="upload-tabs">
              <button
                className={`upload-tab ${activeTab === 'information' ? 'active' : ''}`}
                onClick={() => setActiveTab('information')}
              >
                Information
              </button>
              <button
                className={`upload-tab ${activeTab === 'additional' ? 'active' : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                Additional
              </button>
              <button
                className={`upload-tab ${activeTab === 'publication' ? 'active' : ''}`}
                onClick={() => setActiveTab('publication')}
              >
                Publication
              </button>
            </div>

            <form onSubmit={onSubmit} className="upload-form">
              {activeTab === 'information' && (
                <>
                  <div className="form-section">
                    <h3 className="section-title">General</h3>

          <div className="form-group">
                      <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={onChange}
              required
              maxLength="100"
              placeholder="Enter video title"
                        className="form-input"
            />
          </div>

          <div className="form-group">
                      <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={onChange}
                        rows="4"
              maxLength="5000"
                        placeholder="What's your video about?"
                        className="form-textarea"
            />
          </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Cover</h3>
                    <div className="cover-upload">
                      {thumbnailPreview ? (
                        <div className="cover-preview">
                          <img src={thumbnailPreview} alt="Thumbnail preview" />
                          <button
                            type="button"
                            className="cover-change-btn"
                            onClick={() => {
                              setThumbnailPreview(null);
                              setThumbnailFile(null);
                              if (thumbnailInputRef.current) {
                                thumbnailInputRef.current.value = '';
                              }
                            }}
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="cover-placeholder">
                          <input
                            ref={thumbnailInputRef}
                            type="file"
                            id="thumbnail"
                            accept="image/*"
                            onChange={onThumbnailChange}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="thumbnail" className="cover-upload-label">
                            <FiImage size={32} />
                            <span>Upload cover</span>
                          </label>
                          <p className="cover-hint">
                            You can select a thumbnail after the video has been processed
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Playlist</h3>
                    <div className="form-group">
                      <select
                        id="playlist"
                        name="playlist"
                        value={playlist}
                        onChange={onChange}
                        className="form-select"
                      >
                        <option value="">Select a playlist</option>
                        {/* Playlists would be loaded here */}
                      </select>
                    </div>
                  </div>

                </>
              )}

              {activeTab === 'additional' && (
                <>
                  <div className="form-section">
                    <h3 className="section-title">Category</h3>
            <div className="form-group">
              <select
                id="category"
                name="category"
                value={category}
                onChange={onChange}
                        className="form-select"
              >
                <option value="Indian">Indian</option>
                <option value="Milfs">Milfs</option>
                <option value="Big Cock">Big Cock</option>
                <option value="Step Mom">Step Mom</option>
                <option value="Teen">Teen</option>
                <option value="Lesbian">Lesbian</option>
                <option value="Latina">Latina</option>
                <option value="Blowjobs">Blowjobs</option>
                <option value="Anal">Anal</option>
                <option value="Big Tits">Big Tits</option>
                <option value="Big Ass">Big Ass</option>
                <option value="Hardcore">Hardcore</option>
                <option value="POV">POV</option>
                <option value="Amateur">Amateur</option>
                <option value="Ebony">Ebony</option>
                <option value="Asian">Asian</option>
                <option value="Mature">Mature</option>
                <option value="Creampie">Creampie</option>
                <option value="Cumshot">Cumshot</option>
                <option value="Blonde">Blonde</option>
                <option value="Brunette">Brunette</option>
                <option value="Threesome">Threesome</option>
                <option value="Gangbang">Gangbang</option>
                <option value="Interracial">Interracial</option>
                <option value="HD Porn">HD Porn</option>
                <option value="Other">Other</option>
              </select>
            </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Tags</h3>
                    <div className="form-group">
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={tags}
                        onChange={onChange}
                        placeholder="e.g. tutorial, music, gaming"
                        className="form-input"
                      />
                      <small className="form-hint">Separate tags with commas</small>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'publication' && (
                <>
                  <div className="form-section">
                    <h3 className="section-title">Visibility</h3>
            <div className="form-group">
              <select
                id="visibility"
                name="visibility"
                value={visibility}
                onChange={onChange}
                        className="form-select"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

                  <div className="form-section">
                    <h3 className="section-title">Upload Method</h3>
          <div className="form-group">
                      <label className="checkbox-label">
              <input
                type="checkbox"
                checked={usePresigned}
                onChange={(e) => setUsePresigned(e.target.checked)}
                        />
                        <span>Use direct browser upload (presigned) for large files</span>
            </label>
          </div>
                  </div>
                </>
              )}

              {error && (
                <div className="error-message">
                  <FiAlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
                  {uploadStatus === 'uploading' || uploadStatus === 'processing' ? 'Cancel' : 'Delete video'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
                  disabled={loading || !videoFile || !title.trim() || uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
                  {uploadStatus === 'completed' ? (
                    <>
                      <FiCheck size={18} />
                      <span>Completed</span>
                    </>
                  ) : uploadStatus === 'uploading' ? (
                    'Uploading...'
                  ) : uploadStatus === 'processing' ? (
                    'Processing...'
                  ) : (
                    'Next'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Video Preview */}
          <div className="upload-right">
            <button className="close-upload-btn" onClick={() => navigate(-1)}>
              <FiX size={24} />
            </button>

            {videoFile ? (
              <div className="video-preview-container">
                {uploadStatus === 'idle' && (
                  <>
                    <div className="video-preview">
                      <video src={videoPreview} controls />
                    </div>
                    <div className="video-info">
                      <div className="video-info-item">
                        <FiFile size={18} />
                        <div className="video-info-content">
                          <span className="video-info-label">File name</span>
                          <span className="video-info-value">{videoFile.name}</span>
                        </div>
                      </div>
                      <div className="video-info-item">
                        <FiFile size={18} />
                        <div className="video-info-content">
                          <span className="video-info-label">File size</span>
                          <span className="video-info-value">{formatFileSize(videoFile.size)}</span>
                        </div>
                      </div>
                      {videoLink && (
                        <div className="video-info-item">
                          <div className="video-info-content">
                            <span className="video-info-label">Link to video</span>
                            <div className="video-link-container">
                              <a href={videoLink} className="video-link">
                                {window.location.origin}{videoLink}
                              </a>
                              <button
                                type="button"
                                className="copy-link-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}${videoLink}`);
                                }}
                              >
                                <FiFile size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                  <div className="upload-status-container">
                    <div className="upload-status-icon">
                      {uploadStatus === 'uploading' ? '📤' : '⚙️'}
                    </div>
                    <h3 className="upload-status-title">
                      {uploadStatus === 'uploading' ? 'Uploading video...' : 'Processing video...'}
                    </h3>
                    <div className="upload-status-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${uploadStatus === 'uploading' ? uploadProgress : processingProgress}%` 
                          }}
                        />
                      </div>
                      <span className="progress-percent">
                        {uploadStatus === 'uploading' ? uploadProgress : processingProgress}%
                      </span>
                    </div>
                    <div className="upload-status-info">
                      <div className="status-info-item">
                        <span className="status-label">File name</span>
                        <span className="status-value">{videoFile.name}</span>
                      </div>
                      <div className="status-info-item">
                        <span className="status-label">File size</span>
                        <span className="status-value">{formatFileSize(videoFile.size)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {uploadStatus === 'completed' && (
                  <div className="upload-completed">
                    <div className="completed-icon">
                      <FiCheck size={48} />
                    </div>
                    <h3 className="completed-title">Upload completed!</h3>
                    <p className="completed-message">Redirecting to your video...</p>
                    {videoLink && (
                      <Link to={videoLink} className="view-video-btn">
                        View Video
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="video-upload-placeholder">
                <div className="upload-placeholder-content">
                  <FiUpload size={48} />
                  <h3>Select video to upload</h3>
                  <p>Choose a video file from your device</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="video"
                    accept="video/*"
                    onChange={onVideoChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="video" className="upload-file-btn">
                    <FiUpload size={18} />
                    <span>Select Video</span>
                  </label>
                  <small className="upload-hint">Max file size: 2GB</small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
