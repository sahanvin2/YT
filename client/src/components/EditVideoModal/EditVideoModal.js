import React, { useState } from 'react';
import { updateVideo } from '../../utils/api';
import { FiUpload, FiX } from 'react-icons/fi';
import './EditVideoModal.css';

const EditVideoModal = ({ video, onClose, onUpdate }) => {
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setThumbnailFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!thumbnailFile) {
            setError('Please select a new thumbnail');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('thumbnail', thumbnailFile);

            const res = await updateVideo(video._id, formData);
            onUpdate(res.data.data || res.data.video);
            onClose();
        } catch (err) {
            setError('Failed to update thumbnail');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal">
                <div className="modal-header">
                    <h2>Update Thumbnail</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Thumbnail</label>
                        {video.thumbnailUrl && (
                            <img src={video.thumbnailUrl} alt="Current" className="current-thumbnail" />
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="thumbnail">New Thumbnail</label>
                        <div className="file-input">
                            <input
                                type="file"
                                id="thumbnail"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                            />
                            <div className="file-input-label">
                                <FiUpload size={24} />
                                <span>{thumbnailFile ? thumbnailFile.name : 'Choose new thumbnail'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="edit-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVideoModal;
