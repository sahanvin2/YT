import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUpload } from 'react-icons/fi';
import { uploadVideo, presignPut, createVideoFromUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Upload.css';

const Upload = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    tags: '',
    visibility: 'public'
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usePresigned, setUsePresigned] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const { title, description, category, tags, visibility } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 500000000) {
      setError('Video file must be less than 500MB');
      return;
    }
    setVideoFile(file);
  };

  const onThumbnailChange = (e) => {
    setThumbnailFile(e.target.files[0]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    const data = new FormData();
    data.append('title', title);
    data.append('description', description);
    data.append('category', category);
    data.append('tags', tags);
    data.append('visibility', visibility);
    data.append('video', videoFile);
    if (thumbnailFile) {
      data.append('thumbnail', thumbnailFile);
    }

    try {
      setLoading(true);
      if (!usePresigned) {
        const res = await uploadVideo(data);
        navigate(`/watch/${res.data.data._id}`);
        return;
      }
      const presignRes = await presignPut(videoFile.name, videoFile.type || 'application/octet-stream');
      if (!presignRes.data?.url) {
        throw new Error('Presign did not return a URL');
      }
      const putUrl = presignRes.data.url;
      const publicUrl = presignRes.data.publicUrl;
      // Use axios to PUT raw file to presigned URL for better error handling
      await axios.put(putUrl, videoFile, {
        headers: { 'Content-Type': videoFile.type || 'application/octet-stream' }
      });
      const createRes = await createVideoFromUrl({
        title,
        description,
        category,
        tags,
        visibility,
        videoUrl: publicUrl
      });
      navigate(`/watch/${createRes.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>Upload Video</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={onSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="video">Video File *</label>
            <div className="file-input">
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={onVideoChange}
                required
              />
              <div className="file-input-label">
                <FiUpload size={24} />
                <span>{videoFile ? videoFile.name : 'Choose video file'}</span>
                <small>Max size: 500MB</small>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail (Optional)</label>
            <div className="file-input">
              <input
                type="file"
                id="thumbnail"
                accept="image/*"
                onChange={onThumbnailChange}
              />
              <div className="file-input-label">
                <FiUpload size={24} />
                <span>{thumbnailFile ? thumbnailFile.name : 'Choose thumbnail image'}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={onChange}
              required
              maxLength="100"
              placeholder="Enter video title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={onChange}
              required
              rows="6"
              maxLength="5000"
              placeholder="Tell viewers about your video"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={onChange}
              >
                <option value="Other">Other</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="News">News</option>
                <option value="Sports">Sports</option>
                <option value="Technology">Technology</option>
                <option value="Vlogs">Vlogs</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="visibility">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                value={visibility}
                onChange={onChange}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={tags}
              onChange={onChange}
              placeholder="e.g. tutorial, music, gaming"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={usePresigned}
                onChange={(e) => setUsePresigned(e.target.checked)}
              />{' '}
              Use direct browser upload (presigned) for large files
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
