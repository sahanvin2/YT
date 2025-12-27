import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUpload, FiFolder, FiImage, FiVideo, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import './UploadHLS.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const UploadHLS = () => {
  const { token, isUploadAdmin } = useAuth();
  const navigate = useNavigate();
  const folderInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mainCategory: 'movies',
    primaryGenre: 'action',
    tags: '',
    duration: ''
  });

  const [hlsFiles, setHlsFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadStage, setUploadStage] = useState('');
  const [folderName, setFolderName] = useState('');

  if (!isUploadAdmin) {
    return (
      <div className="upload-hls-page">
        <div className="access-denied">
          <FiAlertCircle size={64} />
          <h2>Access Restricted</h2>
          <p>Only administrators can upload videos.</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
      setError('Please select a folder containing HLS files');
      return;
    }

    // Check for master.m3u8
    const hasMasterPlaylist = files.some(file => file.name === 'master.m3u8');
    if (!hasMasterPlaylist) {
      setError('⚠️ Selected folder must contain master.m3u8 file!');
      setHlsFiles([]);
      setFolderName('');
      return;
    }

    // Get folder name from first file's path
    const firstFile = files[0];
    const pathParts = firstFile.webkitRelativePath.split('/');
    const folder = pathParts[0];
    
    setHlsFiles(files);
    setFolderName(folder);
    setError('');
    
    // Auto-fill title if empty
    if (!formData.title) {
      setFormData({
        ...formData,
        title: folder.replace(/-|_/g, ' ').replace(/\.\w+$/, '')
      });
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail image must be less than 5MB');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const removeHlsFolder = () => {
    setHlsFiles([]);
    setFolderName('');
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('You must be logged in to upload videos');
      return;
    }

    if (hlsFiles.length === 0) {
      setError('Please select an HLS folder');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (!thumbnailFile) {
      setError('Please select a thumbnail image');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      const formDataToSend = new FormData();
      
      // Add all HLS files
      setUploadStage('📦 Preparing HLS files...');
      hlsFiles.forEach((file) => {
        formDataToSend.append('hlsFiles', file, file.webkitRelativePath);
      });

      // Add thumbnail
      setUploadStage('🖼️ Adding thumbnail...');
      formDataToSend.append('thumbnail', thumbnailFile);

      // Add metadata
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('mainCategory', formData.mainCategory);
      formDataToSend.append('primaryGenre', formData.primaryGenre);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('duration', formData.duration || '0');

      setUploadStage('⬆️ Uploading files to server...');
      
      const response = await axios.post(
        `${API_URL}/api/videos/upload-hls-complete`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 1200000, // 20 minutes
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );

      setUploadStage('✅ Processing complete!');
      setSuccess('🎉 Video uploaded successfully! Redirecting to your videos...');
      setProgress(100);
      
      setTimeout(() => {
        navigate('/my-videos');
      }, 2500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload video. Please try again.');
      setProgress(0);
      setUploadStage('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-hls-page">
      <div className="upload-hls-container">
        <div className="upload-hls-header">
          <FiVideo className="header-icon" />
          <h1>Upload Video</h1>
          <p>Upload your HLS video files and thumbnail</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FiCheck /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-hls-form">
          {/* HLS Folder Upload */}
          <div className="upload-section">
            <h3><FiFolder /> Step 1: Select HLS Video Folder</h3>
            <p className="section-hint">Choose the folder containing your HLS video files (must have master.m3u8)</p>
            <div 
              className={`upload-box ${hlsFiles.length > 0 ? 'has-file' : ''}`}
              onClick={() => !uploading && folderInputRef.current?.click()}
            >
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {hlsFiles.length > 0 ? (
                <div className="file-selected">
                  <FiCheck className="check-icon" />
                  <div className="file-info">
                    <p className="folder-name"><strong>{folderName}</strong></p>
                    <p className="file-count">{hlsFiles.length} files selected</p>
                  </div>
                  {!uploading && (
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={(e) => { e.stopPropagation(); removeHlsFolder(); }}
                    >
                      <FiX /> Change
                    </button>
                  )}
                </div>
              ) : (
                <div className="upload-prompt">
                  <FiFolder className="upload-icon" />
                  <h4>Click to Select Folder</h4>
                  <p>Select your HLS folder (must contain master.m3u8)</p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="upload-section">
            <h3><FiImage /> Step 2: Select Thumbnail Image</h3>
            <p className="section-hint">Choose a thumbnail image for your video (JPG, PNG, etc. - Max 5MB)</p>
            <div 
              className={`upload-box thumbnail-box ${thumbnailPreview ? 'has-file' : ''}`}
              onClick={() => !uploading && thumbnailInputRef.current?.click()}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {thumbnailPreview ? (
                <div className="thumbnail-selected">
                  <img src={thumbnailPreview} alt="Thumbnail preview" />
                  {!uploading && (
                    <button 
                      type="button" 
                      className="remove-btn overlay"
                      onClick={(e) => { e.stopPropagation(); removeThumbnail(); }}
                    >
                      <FiX /> Change Image
                    </button>
                  )}
                </div>
              ) : (
                <div className="upload-prompt">
                  <FiImage className="upload-icon" />
                  <h4>Click to Select Image</h4>
                  <p>JPG, PNG, or any image format - Max 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Video Details */}
          <div className="form-section">
            <h3>Step 3: Video Details</h3>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter video title"
                required
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter video description"
                rows="4"
                disabled={uploading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mainCategory">Category</label>
                <select
                  id="mainCategory"
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleChange}
                  disabled={uploading}
                >
                  <option value="movies">Movies</option>
                  <option value="series">Series</option>
                  <option value="documentaries">Documentaries</option>
                  <option value="animation">Animation</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="primaryGenre">Genre</label>
                <select
                  id="primaryGenre"
                  name="primaryGenre"
                  value={formData.primaryGenre}
                  onChange={handleChange}
                  disabled={uploading}
                >
                  <option value="action">Action</option>
                  <option value="comedy">Comedy</option>
                  <option value="drama">Drama</option>
                  <option value="horror">Horror</option>
                  <option value="romance">Romance</option>
                  <option value="scifi">Sci-Fi</option>
                  <option value="thriller">Thriller</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="animation">Animation</option>
                  <option value="documentary">Documentary</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="action, thriller, 2024"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (seconds) - Optional</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 7200 for 2 hours"
                disabled={uploading}
              />
              <small className="form-hint">Leave empty to auto-detect from video</small>
            </div>
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-info">
                <FiUpload className="upload-icon-anim" />
                <p className="stage-text">{uploadStage}</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{progress}% Complete</p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-upload"
              disabled={uploading || hlsFiles.length === 0 || !thumbnailFile}
            >
              <FiUpload />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="help-section">
          <h4>📋 Upload Requirements:</h4>
          <ul>
            <li>✅ HLS folder must contain <code>master.m3u8</code> file</li>
            <li>✅ Include quality folders: hls_144p, hls_240p, hls_360p, etc.</li>
            <li>✅ Thumbnail image (JPG, PNG) - Max 5MB</li>
            <li>✅ Maximum folder size: 12GB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadHLS;
