import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiUpload, FiX, FiImage, FiFile, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { uploadVideo, presignPut, createVideoFromUrl, getPlaylists } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize } from '../../utils/helpers';
import { MAIN_CATEGORIES, GENRES, SUB_CATEGORIES, validateGenreSelection } from '../../utils/categories';
import './Upload.css';

const Upload = () => {
  const { isAuthenticated, user, isUploadAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('information');
  const [formData, setFormData] = useState({
    title: '',
    description: ' ',
    mainCategory: 'movies',
    primaryGenre: 'action',
    secondaryGenres: [],
    subCategory: '',
    tags: '',
    visibility: 'public',
    playlist: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [subtitleFiles, setSubtitleFiles] = useState([]); // Array of {file, language, label}
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
  const subtitleInputRef = useRef(null);
  
  // Multi-upload state
  const [uploadQueue, setUploadQueue] = useState([]); // Array of upload jobs
  const [isMultiUpload, setIsMultiUpload] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistError, setPlaylistError] = useState(false);

  // Fetch user playlists on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await getPlaylists();
        setPlaylists(res.data.data || []);
        setPlaylistError(false);
      } catch (err) {
        console.error('Failed to fetch playlists:', err);
        setPlaylistError(true);
        // Don't show error to user - playlists are optional
      }
    };

    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);

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

  if (!isUploadAdmin) {
    return (
      <div className="upload-page">
        <div className="upload-container">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <FiAlertCircle size={64} style={{ color: '#ff4444', marginBottom: '20px' }} />
            <h2>Access Restricted</h2>
            <p style={{ color: '#aaa', marginTop: '10px' }}>
              Only administrators can upload videos. If you believe this is an error, please contact the site administrator.
            </p>
            <button 
              onClick={() => navigate('/')} 
              style={{ marginTop: '20px', padding: '10px 20px', background: '#3ea6ff', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { title, description, mainCategory, primaryGenre, secondaryGenres, subCategory, tags, visibility, playlist } = formData;

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Reset sub-category when primary genre changes
    if (name === 'primaryGenre') {
      setFormData({ ...formData, [name]: value, subCategory: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSecondaryGenreToggle = (genreId) => {
    const currentSecondary = [...secondaryGenres];
    const index = currentSecondary.indexOf(genreId);
    
    if (index > -1) {
      // Remove genre
      currentSecondary.splice(index, 1);
    } else {
      // Add genre (max 2)
      if (currentSecondary.length < 2) {
        currentSecondary.push(genreId);
      } else {
        setError('Maximum 2 secondary genres allowed');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }
    
    setFormData({ ...formData, secondaryGenres: currentSecondary });
  };

  const availableSubCategories = SUB_CATEGORIES[primaryGenre] || [];

  const onVideoChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if multiple files selected
    if (files.length > 1) {
      setIsMultiUpload(true);
      const newQueue = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 5368709120) { // 5GB
          alert(`${file.name} is too large (max 5GB). Skipping...`);
          continue;
        }
        
        newQueue.push({
          id: Date.now() + i,
          file: file,
          title: file.name.replace(/\.[^/.]+$/, ''), // filename without extension
          status: 'pending', // pending, uploading, completed, error
          progress: 0,
          error: null,
          videoId: null
        });
      }
      
      setUploadQueue(newQueue);
      setError('');
      return;
    }

    // Single file upload - DISABLED (HLS folders only)
    setError('Direct video upload is disabled. Please use the HLS folder upload script. See documentation for details.');
    return;
    
    /* OLD CODE - DISABLED
    const file = files[0];
    if (file.size > 5368709120) { // 5GB
      setError('Video file must be less than 5GB');
      return;
    }

    setVideoFile(file);
    setError('');
    setIsMultiUpload(false);

    // Create preview
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);

    // Reset upload status
    setUploadProgress(0);
    setProcessingProgress(0);
    setUploadStatus('idle');
    setVideoLink('');
    */
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

  const onSubtitleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newSubtitles = files.map((file, index) => ({
      file,
      language: 'en', // Default to English
      label: file.name.replace(/\.(vtt|srt)$/i, '') // Use filename as label
    }));

    setSubtitleFiles(prev => [...prev, ...newSubtitles]);
  };

  const removeSubtitle = (index) => {
    setSubtitleFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubtitleMeta = (index, field, value) => {
    setSubtitleFiles(prev => prev.map((sub, i) => 
      i === index ? { ...sub, [field]: value } : sub
    ));
  };

  // Multi-upload handler
  const handleMultiUpload = async () => {
    if (uploadQueue.length === 0) return;
    
    // Upload all videos in parallel (max 3 at a time)
    const maxConcurrent = 3;
    let activeUploads = 0;
    let currentIndex = 0;

    const uploadNext = async () => {
      if (currentIndex >= uploadQueue.length) return;
      
      const jobIndex = currentIndex;
      currentIndex++;
      activeUploads++;
      
      const job = uploadQueue[jobIndex];
      
      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === jobIndex ? { ...item, status: 'uploading', progress: 0 } : item
        ));

        const data = new FormData();
        data.append('title', job.title);
        data.append('description', ' ');
        data.append('mainCategory', mainCategory);
        data.append('primaryGenre', primaryGenre);
        data.append('secondaryGenres', JSON.stringify(secondaryGenres));
        if (subCategory) data.append('subCategory', subCategory);
        data.append('tags', tags);
        data.append('visibility', visibility);
        data.append('video', job.file);

        const res = await uploadVideo(data, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadQueue(prev => prev.map((item, idx) => 
                idx === jobIndex ? { ...item, progress: percentCompleted } : item
              ));
            }
          }
        });

        // Mark as completed
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === jobIndex ? { 
            ...item, 
            status: 'completed', 
            progress: 100,
            videoId: res.data.data._id 
          } : item
        ));

      } catch (err) {
        // Mark as error
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === jobIndex ? { 
            ...item, 
            status: 'error', 
            error: err.response?.data?.message || err.message || 'Upload failed'
          } : item
        ));
      } finally {
        activeUploads--;
        
        // Start next upload if available
        if (currentIndex < uploadQueue.length) {
          uploadNext();
        } else if (activeUploads === 0) {
          // All uploads complete
          const completedCount = uploadQueue.filter(j => j.status === 'completed').length;
          alert(`✅ Upload complete!\\n${completedCount}/${uploadQueue.length} videos uploaded successfully.`);
        }
      }
    };

    // Start initial batch of uploads
    for (let i = 0; i < Math.min(maxConcurrent, uploadQueue.length); i++) {
      uploadNext();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if multi-upload mode
    if (isMultiUpload && uploadQueue.length > 0) {
      handleMultiUpload();
      return;
    }

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

    // Validate genre selection
    const allGenres = [primaryGenre, ...secondaryGenres];
    const validation = validateGenreSelection(allGenres);
    if (!validation.valid) {
      setError(validation.message);
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
    data.append('mainCategory', mainCategory);
    data.append('primaryGenre', primaryGenre);
    data.append('secondaryGenres', JSON.stringify(secondaryGenres));
    if (subCategory) data.append('subCategory', subCategory);
    data.append('tags', tags);
    data.append('visibility', visibility);
    data.append('video', videoFile);
    if (thumbnailFile) {
      data.append('thumbnail', thumbnailFile);
    }
    
    // Add subtitles
    if (subtitleFiles.length > 0) {
      subtitleFiles.forEach((subtitle, index) => {
        data.append(`subtitles`, subtitle.file);
        data.append(`subtitleLanguages`, subtitle.language);
        data.append(`subtitleLabels`, subtitle.label);
      });
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
          const uploadedVideoId = res.data.data._id;
          setVideoLink(`/watch/${uploadedVideoId}`);
          
          // Show success message and reset form for next upload
          setTimeout(() => {
            // Reset form for next upload
            setUploadStatus('idle');
            setUploadProgress(0);
            setProcessingProgress(0);
            setVideoFile(null);
            setThumbnailFile(null);
            setVideoPreview(null);
            setThumbnailPreview(null);
            setFormData({
              title: '',
              description: ' ',
              mainCategory: 'movies',
              primaryGenre: 'action',
              secondaryGenres: [],
              subCategory: '',
              tags: '',
              visibility: 'public',
              playlist: ''
            });
            setActiveTab('information');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
            
            // Success - video is processing in background
            console.log('✅ Video uploaded successfully:', uploadedVideoId);
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
        mainCategory,
        primaryGenre,
        secondaryGenres,
        subCategory,
        tags,
        visibility,
        videoUrl: publicUrl
      });

        setProcessingProgress(100);
        setUploadStatus('completed');
        const uploadedVideoId = createRes.data.data._id;
        setVideoLink(`/watch/${uploadedVideoId}`);
        
        setTimeout(() => {
          // Reset form for next upload
          setUploadStatus('idle');
          setUploadProgress(0);
          setProcessingProgress(0);
          setVideoFile(null);
          setThumbnailFile(null);
          setVideoPreview(null);
          setThumbnailPreview(null);
          setFormData({
            title: '',
            description: ' ',
            mainCategory: 'movies',
            primaryGenre: 'action',
            secondaryGenres: [],
            subCategory: '',
            tags: '',
            visibility: 'public',
            playlist: ''
          });
          setActiveTab('information');
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
          
          // Success - video is processing in background
          console.log('✅ Video uploaded successfully:', uploadedVideoId);
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
        <button 
          className="upload-another-btn"
          onClick={() => {
            if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
              alert('Please wait for current upload to finish');
              return;
            }
            // Reset form
            setUploadStatus('idle');
            setUploadProgress(0);
            setProcessingProgress(0);
            setVideoFile(null);
            setThumbnailFile(null);
            setVideoPreview(null);
            setThumbnailPreview(null);
            setFormData({
              title: '',
              description: ' ',
              mainCategory: 'movies',
              primaryGenre: 'action',
              secondaryGenres: [],
              subCategory: '',
              tags: '',
              visibility: 'public',
              playlist: ''
            });
            setActiveTab('information');
            setError('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
          }}
        >
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
                            <span>Upload Custom Thumbnail</span>
                          </label>
                          <p className="cover-hint">
                            Choose your own thumbnail from your device. Recommended: 1280x720px (16:9) or 1080x1920px (9:16)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Subtitles (Optional)</h3>
                    <div className="subtitle-upload-section">
                      <input
                        ref={subtitleInputRef}
                        type="file"
                        id="subtitles"
                        accept=".vtt,.srt"
                        multiple
                        onChange={onSubtitleChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="subtitles" className="subtitle-upload-btn">
                        <FiFile size={20} />
                        <span>Add Subtitle Files (.vtt, .srt)</span>
                      </label>
                      
                      {subtitleFiles.length > 0 && (
                        <div className="subtitle-list">
                          {subtitleFiles.map((subtitle, index) => (
                            <div key={index} className="subtitle-item">
                              <div className="subtitle-info">
                                <FiFile size={16} />
                                <span className="subtitle-filename">{subtitle.file.name}</span>
                              </div>
                              <div className="subtitle-meta">
                                <input
                                  type="text"
                                  placeholder="Label (e.g., English)"
                                  value={subtitle.label}
                                  onChange={(e) => updateSubtitleMeta(index, 'label', e.target.value)}
                                  className="subtitle-input"
                                />
                                <select
                                  value={subtitle.language}
                                  onChange={(e) => updateSubtitleMeta(index, 'language', e.target.value)}
                                  className="subtitle-select"
                                >
                                  <option value="en">English</option>
                                  <option value="es">Spanish</option>
                                  <option value="fr">French</option>
                                  <option value="de">German</option>
                                  <option value="it">Italian</option>
                                  <option value="pt">Portuguese</option>
                                  <option value="ru">Russian</option>
                                  <option value="ja">Japanese</option>
                                  <option value="ko">Korean</option>
                                  <option value="zh">Chinese</option>
                                  <option value="ar">Arabic</option>
                                  <option value="hi">Hindi</option>
                                </select>
                                <button
                                  type="button"
                                  className="subtitle-remove-btn"
                                  onClick={() => removeSubtitle(index)}
                                  title="Remove subtitle"
                                >
                                  <FiX size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="subtitle-hint">
                        Upload subtitle files in WebVTT (.vtt) or SRT (.srt) format. You can add multiple languages.
                      </p>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Playlist (Optional)</h3>
                    <div className="form-group">
                      <select
                        id="playlist"
                        name="playlist"
                        value={playlist}
                        onChange={onChange}
                        className="form-select"
                        disabled={playlistError}
                      >
                        <option value="">
                          {playlistError ? 'Playlists unavailable' : 'Select a playlist'}
                        </option>
                        {playlists.map(pl => (
                          <option key={pl._id} value={pl._id}>
                            {pl.name} ({pl.videos?.length || 0} videos)
                          </option>
                        ))}
                      </select>
                      {playlists.length === 0 && !playlistError && (
                        <small style={{ color: '#888', marginTop: '5px', display: 'block' }}>
                          No playlists yet. Create one from your channel page.
                        </small>
                      )}
                    </div>
                  </div>

                </>
              )}

              {activeTab === 'additional' && (
                <>
                  <div className="form-section">
                    <h3 className="section-title">Category System</h3>
                    
                    {/* Level 1: Main Category */}
                    <div className="form-group">
                      <label htmlFor="mainCategory" className="form-label">
                        Main Category <span className="required">*</span>
                      </label>
                      <select
                        id="mainCategory"
                        name="mainCategory"
                        value={mainCategory}
                        onChange={onChange}
                        className="form-select"
                        required
                      >
                        {MAIN_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level 2: Primary Genre */}
                    <div className="form-group">
                      <label htmlFor="primaryGenre" className="form-label">
                        Primary Genre <span className="required">*</span>
                      </label>
                      <select
                        id="primaryGenre"
                        name="primaryGenre"
                        value={primaryGenre}
                        onChange={onChange}
                        className="form-select"
                        required
                      >
                        {GENRES.map(genre => (
                          <option key={genre.id} value={genre.id}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level 2: Secondary Genres (optional, max 2) */}
                    <div className="form-group">
                      <label className="form-label">
                        Secondary Genres (Optional - Max 2)
                      </label>
                      <div className="genre-chips">
                        {GENRES.filter(g => g.id !== primaryGenre).map(genre => (
                          <button
                            key={genre.id}
                            type="button"
                            className={`genre-chip ${secondaryGenres.includes(genre.id) ? 'selected' : ''}`}
                            onClick={() => handleSecondaryGenreToggle(genre.id)}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                      <small className="form-hint">
                        Selected: {secondaryGenres.length}/2
                      </small>
                    </div>

                    {/* Level 3: Sub-category (optional, based on primary genre) */}
                    {availableSubCategories.length > 0 && (
                      <div className="form-group">
                        <label htmlFor="subCategory" className="form-label">
                          Sub-Category (Optional)
                        </label>
                        <select
                          id="subCategory"
                          name="subCategory"
                          value={subCategory}
                          onChange={onChange}
                          className="form-select"
                        >
                          <option value="">None</option>
                          {availableSubCategories.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
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
                  disabled={loading || (!videoFile && uploadQueue.length === 0) || (!isMultiUpload && !title.trim()) || uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
                  {isMultiUpload ? (
                    <>
                      <FiUpload size={18} />
                      <span>Upload {uploadQueue.length} Videos</span>
                    </>
                  ) : uploadStatus === 'completed' ? (
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

            {/* Multi-upload queue display */}
            {isMultiUpload && uploadQueue.length > 0 && (
              <div className="multi-upload-queue">
                <h3>Upload Queue ({uploadQueue.length} videos)</h3>
                <div className="queue-list">
                  {uploadQueue.map((job, index) => (
                    <div key={job.id} className={`queue-item queue-${job.status}`}>
                      <div className="queue-item-header">
                        <span className="queue-number">#{index + 1}</span>
                        <span className="queue-title">{job.title}</span>
                        <span className={`queue-status status-${job.status}`}>
                          {job.status === 'pending' && '⏳ Pending'}
                          {job.status === 'uploading' && '📤 Uploading'}
                          {job.status === 'completed' && '✅ Done'}
                          {job.status === 'error' && '❌ Error'}
                        </span>
                      </div>
                      {job.status === 'uploading' && (
                        <div className="queue-progress">
                          <div className="queue-progress-bar">
                            <div 
                              className="queue-progress-fill" 
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="queue-progress-text">{job.progress}%</span>
                        </div>
                      )}
                      {job.status === 'error' && job.error && (
                        <div className="queue-error">{job.error}</div>
                      )}
                      {job.status === 'completed' && job.videoId && (
                        <Link to={`/watch/${job.videoId}`} className="queue-view-link">
                          View Video →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videoFile && !isMultiUpload ? (
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
                    multiple
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="video" className="upload-file-btn">
                    <FiUpload size={18} />
                    <span>Select Videos (Multiple)</span>
                  </label>
                  <small className="upload-hint">Select one or multiple videos - Max 5GB each</small>
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
