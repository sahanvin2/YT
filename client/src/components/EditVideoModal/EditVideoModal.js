import React, { useState, useRef, useEffect } from 'react';
import { updateVideo } from '../../utils/api';
import { FiUpload, FiX, FiImage, FiScissors } from 'react-icons/fi';
import { MAIN_CATEGORIES, GENRES, SUB_CATEGORIES } from '../../utils/categories';
import './EditVideoModal.css';

const EditVideoModal = ({ video, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('information');
    const [formData, setFormData] = useState({
        title: video?.title || '',
        description: video?.description || '',
        mainCategory: video?.mainCategory || 'movies',
        primaryGenre: video?.primaryGenre || 'action',
        secondaryGenres: video?.secondaryGenres || [],
        subCategory: video?.subCategory || '',
        tags: video?.tags?.join(', ') || '',
        visibility: video?.visibility || 'public'
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(video?.thumbnailUrl || '');
    const [cutStart, setCutStart] = useState(0);
    const [cutEnd, setCutEnd] = useState(video?.duration || 0);
    const [videoDuration, setVideoDuration] = useState(video?.duration || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef(null);

    useEffect(() => {
        if (video) {
            setFormData({
                title: video.title || '',
                description: video.description || '',
                mainCategory: video.mainCategory || 'movies',
                primaryGenre: video.primaryGenre || 'action',
                secondaryGenres: video.secondaryGenres || [],
                subCategory: video.subCategory || '',
                tags: video.tags?.join(', ') || '',
                visibility: video.visibility || 'public'
            });
            setThumbnailPreview(video.thumbnailUrl || '');
            setVideoDuration(video.duration || 0);
            setCutStart(video.cutStart || 0);
            setCutEnd(video.cutEnd || video.duration || 0);
        }
    }, [video]);

    const handleSecondaryGenreToggle = (genreId) => {
        const currentSecondary = [...formData.secondaryGenres];
        const index = currentSecondary.indexOf(genreId);
        
        if (index > -1) {
            currentSecondary.splice(index, 1);
        } else {
            if (currentSecondary.length < 2) {
                currentSecondary.push(genreId);
            } else {
                setError('Maximum 2 secondary genres allowed');
                setTimeout(() => setError(''), 3000);
                return;
            }
        }
        
        setFormData(prev => ({ ...prev, secondaryGenres: currentSecondary }));
    };

    const availableSubCategories = SUB_CATEGORIES[formData.primaryGenre] || [];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Reset subCategory if primaryGenre changes
        if (name === 'primaryGenre') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                subCategory: '' // Reset sub-category when genre changes
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCutChange = (type, value) => {
        const numValue = parseFloat(value) || 0;
        if (type === 'start') {
            if (numValue >= 0 && numValue < cutEnd) {
                setCutStart(numValue);
            }
        } else {
            if (numValue > cutStart && numValue <= videoDuration) {
                setCutEnd(numValue);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            const formDataToSend = new FormData();
            
            // Add title
            formDataToSend.append('title', formData.title);
            
            // Add description
            formDataToSend.append('description', formData.description);
            
            // Add new category structure
            formDataToSend.append('mainCategory', formData.mainCategory);
            formDataToSend.append('primaryGenre', formData.primaryGenre);
            formDataToSend.append('secondaryGenres', JSON.stringify(formData.secondaryGenres));
            if (formData.subCategory) {
                formDataToSend.append('subCategory', formData.subCategory);
            }
            
            // Add tags (convert comma-separated string to array)
            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
            formDataToSend.append('tags', JSON.stringify(tagsArray));
            
            // Add visibility
            formDataToSend.append('visibility', formData.visibility);
            
            // Add thumbnail if selected
            if (thumbnailFile) {
                formDataToSend.append('thumbnail', thumbnailFile);
            }

            // Add cut duration if changed
            if (cutStart > 0 || cutEnd < videoDuration) {
                formDataToSend.append('cutStart', cutStart);
                formDataToSend.append('cutEnd', cutEnd);
            }

            const res = await updateVideo(video._id, formDataToSend);
            onUpdate(res.data.data || res.data.video);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update video');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <div className="edit-modal-title">
                        <h2>Edit Video</h2>
                        <p className="video-title-display">{video?.title}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="edit-modal-tabs">
                    <button
                        className={`edit-tab ${activeTab === 'information' ? 'active' : ''}`}
                        onClick={() => setActiveTab('information')}
                    >
                        Information
                    </button>
                    <button
                        className={`edit-tab ${activeTab === 'additional' ? 'active' : ''}`}
                        onClick={() => setActiveTab('additional')}
                    >
                        Additional
                    </button>
                    <button
                        className={`edit-tab ${activeTab === 'publication' ? 'active' : ''}`}
                        onClick={() => setActiveTab('publication')}
                    >
                        Publication
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    {activeTab === 'information' && (
                        <>
                            <div className="form-section">
                                <h3 className="section-title">General</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="title">Video Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        placeholder="Enter video title"
                                        required
                                        className="form-input"
                                    />
                                    <small className="char-count">
                                        {formData.title.length} / 100 characters
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="6"
                                        maxLength={2000}
                                        placeholder="What's your video about?"
                                        className="form-textarea"
                                    />
                                    <small className="char-count">
                                        {formData.description.length} / 2000 characters
                                    </small>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="section-title">Cover</h3>
                                {thumbnailPreview && (
                                    <div className="thumbnail-preview-container">
                                        <img 
                                            src={thumbnailPreview} 
                                            alt="Thumbnail preview" 
                                            className="thumbnail-preview" 
                                        />
                                    </div>
                                )}
                                <div className="file-input">
                                    <input
                                        type="file"
                                        id="thumbnail"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="thumbnail" className="file-input-label">
                                        <FiImage size={20} />
                                        <span>{thumbnailFile ? thumbnailFile.name : 'Choose new thumbnail (optional)'}</span>
                                    </label>
                                </div>
                                <small className="form-hint">Leave empty to keep current thumbnail</small>
                            </div>
                        </>
                    )}

                    {activeTab === 'additional' && (
                        <>
                            <div className="form-section">
                                <h3 className="section-title">Video Classification</h3>
                                
                                {/* Main Category */}
                                <div className="form-group">
                                    <label htmlFor="mainCategory">Main Category</label>
                                    <select
                                        id="mainCategory"
                                        name="mainCategory"
                                        value={formData.mainCategory}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        {MAIN_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="form-hint">Choose the main type of content</small>
                                </div>

                                {/* Primary Genre */}
                                <div className="form-group">
                                    <label htmlFor="primaryGenre">Primary Genre</label>
                                    <select
                                        id="primaryGenre"
                                        name="primaryGenre"
                                        value={formData.primaryGenre}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        {GENRES.map(genre => (
                                            <option key={genre.id} value={genre.id}>
                                                {genre.name}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="form-hint">{GENRES.find(g => g.id === formData.primaryGenre)?.description}</small>
                                </div>

                                {/* Secondary Genres */}
                                <div className="form-group">
                                    <label>Secondary Genres (Optional - Max 2)</label>
                                    <div className="genres-grid">
                                        {GENRES.filter(g => g.id !== formData.primaryGenre).map(genre => (
                                            <div 
                                                key={genre.id}
                                                className={`genre-chip ${formData.secondaryGenres.includes(genre.id) ? 'selected' : ''}`}
                                                onClick={() => handleSecondaryGenreToggle(genre.id)}
                                            >
                                                {genre.name}
                                            </div>
                                        ))}
                                    </div>
                                    <small className="form-hint">
                                        Selected: {formData.secondaryGenres.length > 0 
                                            ? formData.secondaryGenres.map(id => GENRES.find(g => g.id === id)?.name).join(', ')
                                            : 'None'}
                                    </small>
                                </div>

                                {/* Sub-category (if available) */}
                                {availableSubCategories.length > 0 && (
                                    <div className="form-group">
                                        <label htmlFor="subCategory">Sub-category (Optional)</label>
                                        <select
                                            id="subCategory"
                                            name="subCategory"
                                            value={formData.subCategory}
                                            onChange={handleInputChange}
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

                                {/* Tags */}
                                <div className="form-group">
                                    <label htmlFor="tags">Tags</label>
                                    <input
                                        type="text"
                                        id="tags"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleInputChange}
                                        placeholder="tag1, tag2, tag3..."
                                        className="form-input"
                                    />
                                    <small className="form-hint">Separate tags with commas</small>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="section-title">
                                    <FiScissors size={18} />
                                    Cut Video Duration
                                </h3>
                                <div className="cut-controls">
                                    <div className="cut-info">
                                        <p>Original Duration: <strong>{formatTime(videoDuration)}</strong></p>
                                        <p>New Duration: <strong>{formatTime(cutEnd - cutStart)}</strong></p>
                                    </div>
                                    <div className="cut-input-group">
                                        <label>Start Time (seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={videoDuration}
                                            step="0.1"
                                            value={cutStart}
                                            onChange={(e) => handleCutChange('start', e.target.value)}
                                            className="form-input"
                                        />
                                        <span className="time-display">{formatTime(cutStart)}</span>
                                    </div>
                                    <div className="cut-input-group">
                                        <label>End Time (seconds)</label>
                                        <input
                                            type="number"
                                            min={cutStart}
                                            max={videoDuration}
                                            step="0.1"
                                            value={cutEnd}
                                            onChange={(e) => handleCutChange('end', e.target.value)}
                                            className="form-input"
                                        />
                                        <span className="time-display">{formatTime(cutEnd)}</span>
                                    </div>
                                    <div className="cut-duration-display">
                                        <strong>Cut Duration: {formatTime(cutEnd - cutStart)}</strong>
                                    </div>
                                    <small className="form-hint">
                                        Set start and end times to trim your video. Leave at 0 and {formatTime(videoDuration)} to keep full video.
                                    </small>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'publication' && (
                        <div className="form-section">
                            <h3 className="section-title">Visibility</h3>
                            
                            <div className="form-group">
                                <label htmlFor="visibility">Who can watch this video?</label>
                                <select
                                    id="visibility"
                                    name="visibility"
                                    value={formData.visibility}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="public">Public - Anyone can watch</option>
                                    <option value="private">Private - Only you can watch</option>
                                    <option value="unlisted">Unlisted - Only people with the link can watch</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="edit-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVideoModal;
