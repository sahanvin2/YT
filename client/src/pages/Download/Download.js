import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiDownload, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { getVideo, getDownloadUrl } from '../../utils/api';
import { formatFileSize } from '../../utils/helpers';
import './Download.css';

const Download = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState(null);
    const [countdown, setCountdown] = useState(5);
    const [canDownload, setCanDownload] = useState(false);

    useEffect(() => {
        fetchVideo();
    }, [id]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanDownload(true);
        }
    }, [countdown]);

    const fetchVideo = async () => {
        try {
            setLoading(true);
            const data = await getVideo(id);
            setVideo(data);
            // Set default quality to the highest available
            if (data.sources && data.sources.length > 0) {
                const sortedSources = [...data.sources].sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
                setSelectedQuality(sortedSources[0].quality);
            }
        } catch (error) {
            console.error('Error fetching video:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQualityOptions = () => {
        if (!video || !video.sources) return [];

        const options = [];
        const sources = [...video.sources];
        sources.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

        sources.forEach((source, index) => {
            options.push({
                quality: source.quality,
                label: `${source.quality}p`,
                description: source.size ? formatFileSize(source.size) : 'HD Quality',
                recommended: index === 0 // Mark highest quality as recommended
            });
        });

        return options;
    };

    const handleDownload = async () => {
        if (!selectedQuality || !canDownload) return;

        try {
            setDownloading(true);
            const downloadUrl = await getDownloadUrl(id, selectedQuality);

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${video.title}_${selectedQuality}p.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading video:', error);
            alert('Failed to download video. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="download-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading download options...</p>
                </div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="download-page">
                <div className="error-container">
                    <p>Video not found</p>
                    <button onClick={() => navigate(-1)} className="btn btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const qualityOptions = getQualityOptions();

    return (
        <div className="download-page">
            {/* Main Content */}
            <div className="download-container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={20} />
                    Back to Video
                </button>

                <div className="download-card">
                    <div className="download-header">
                        <img src={video.thumbnailUrl} alt={video.title} className="download-thumbnail" />
                        <div className="download-info">
                            <h1>{video.title}</h1>
                            <p className="download-meta">
                                {video.user?.channelName || video.user?.username} • {video.views || 0} views
                            </p>
                        </div>
                    </div>

                    <div className="download-content">
                        <h2>Select Quality</h2>
                        <p className="download-description">
                            Choose your preferred video quality and click download
                        </p>

                        <div className="quality-options">
                            {qualityOptions.map((option) => (
                                <button
                                    key={option.quality}
                                    className={`quality-option ${selectedQuality === option.quality ? 'selected' : ''}`}
                                    onClick={() => setSelectedQuality(option.quality)}
                                >
                                    <div className="quality-option-content">
                                        <div className="quality-info">
                                            <span className="quality-label">{option.label}</span>
                                            {option.recommended && <span className="recommended-badge">Recommended</span>}
                                        </div>
                                        <span className="quality-description">{option.description}</span>
                                    </div>
                                    {selectedQuality === option.quality && (
                                        <FiCheck size={24} className="check-icon" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {!canDownload && (
                            <div className="countdown-notice">
                                <p>Please wait {countdown} seconds before downloading...</p>
                                <div className="countdown-bar">
                                    <div
                                        className="countdown-progress"
                                        style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <button
                            className="download-btn"
                            onClick={handleDownload}
                            disabled={!canDownload || downloading}
                        >
                            <FiDownload size={20} />
                            {downloading ? 'Downloading...' : canDownload ? 'Download Now' : `Wait ${countdown}s`}
                        </button>

                        <p className="download-notice">
                            By downloading, you agree to our terms of service. The download will start automatically.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Download;
