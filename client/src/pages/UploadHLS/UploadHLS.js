import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUpload, FiFolder, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import './UploadHLS.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UploadHLS = () => {
  const { user, isUploadAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    hlsFolderPath: '',
    title: '',
    description: '',
    mainCategory: 'movies',
    primaryGenre: 'action',
    secondaryGenres: [],
    tags: '',
    visibility: 'public',
    duration: 0,
    thumbnailPath: ''
  });
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProgress('');
    setUploading(true);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.hlsFolderPath || !formData.title) {
        throw new Error('HLS folder path and title are required');
      }

      setProgress('Uploading HLS folder to server...');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/videos/upload-hls-folder`,
        {
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 600000 // 10 minutes
        }
      );

      setSuccess(true);
      setUploadedVideo(response.data.data);
      setProgress(`✅ Upload complete! ${response.data.uploadStats.filesUploaded} files uploaded.`);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          hlsFolderPath: '',
          title: '',
          description: '',
          mainCategory: 'movies',
          primaryGenre: 'action',
          secondaryGenres: [],
          tags: '',
          visibility: 'public',
          duration: 0,
          thumbnailPath: ''
        });
        setSuccess(false);
        setUploadedVideo(null);
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-hls-page">
      <div className="upload-hls-container">
        <div className="upload-hls-header">
          <FiFolder size={48} />
          <h1>Upload Pre-Processed HLS Video</h1>
          <p>Upload videos that have already been encoded to HLS format with multiple quality levels</p>
        </div>

        <div className="hls-requirements">
          <h3>📁 Required Folder Structure:</h3>
          <pre>{`your-video-folder/
├── master.m3u8          (Required!)
├── hls_144p/
│   ├── playlist.m3u8
│   └── *.ts files
├── hls_240p/
├── hls_360p/
├── hls_480p/
└── hls_720p/ (or higher)`}</pre>
        </div>

        <form onSubmit={handleSubmit} className="upload-hls-form">
          <div className="form-group">
            <label>HLS Folder Path *</label>
            <input
              type="text"
              name="hlsFolderPath"
              value={formData.hlsFolderPath}
              onChange={handleChange}
              placeholder="D:\Videos\my-video-hls"
              required
              disabled={uploading}
            />
            <small>Full path to the folder containing master.m3u8</small>
          </div>

          <div className="form-group">
            <label>Video Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter video title"
              required
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
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
              <label>Category</label>
              <select
                name="mainCategory"
                value={formData.mainCategory}
                onChange={handleChange}
                disabled={uploading}
              >
                <option value="movies">Movies</option>
                <option value="series">TV Series</option>
                <option value="documentaries">Documentaries</option>
                <option value="animation">Animation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Genre</label>
              <select
                name="primaryGenre"
                value={formData.primaryGenre}
                onChange={handleChange}
                disabled={uploading}
              >
                <option value="action">Action</option>
                <option value="comedy">Comedy</option>
                <option value="drama">Drama</option>
                <option value="horror">Horror</option>
                <option value="thriller">Thriller</option>
                <option value="romance">Romance</option>
                <option value="scifi">Sci-Fi</option>
                <option value="fantasy">Fantasy</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (seconds)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="7200"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label>Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                disabled={uploading}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="action, thriller, suspense"
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label>Thumbnail Path (optional)</label>
            <input
              type="text"
              name="thumbnailPath"
              value={formData.thumbnailPath}
              onChange={handleChange}
              placeholder="D:\Videos\thumbnail.jpg"
              disabled={uploading}
            />
          </div>

          {error && (
            <div className="upload-error">
              <FiX size={20} />
              <span>{error}</span>
            </div>
          )}

          {progress && (
            <div className={`upload-progress ${success ? 'success' : ''}`}>
              {success ? <FiCheck size={20} /> : <FiUpload size={20} />}
              <span>{progress}</span>
            </div>
          )}

          {uploadedVideo && (
            <div className="upload-success">
              <h3>✅ Video Uploaded Successfully!</h3>
              <p><strong>Video ID:</strong> {uploadedVideo._id}</p>
              <p><strong>Status:</strong> Ready to watch</p>
              <button 
                type="button"
                onClick={() => navigate(`/watch/${uploadedVideo._id}`)}
                className="view-video-btn"
              >
                View Video
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="upload-btn"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <FiUpload className="spinning" size={20} />
                Uploading...
              </>
            ) : (
              <>
                <FiUpload size={20} />
                Upload HLS Video
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadHLS;
