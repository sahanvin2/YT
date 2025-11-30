import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiCheck } from 'react-icons/fi';
import { formatFileSize } from '../../utils/helpers';
import AdBanner from '../Ad/AdBanner';
import './DownloadModal.css';

const DownloadModal = ({ video, onClose }) => {
    const [selectedQuality, setSelectedQuality] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [canDownload, setCanDownload] = useState(false);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanDownload(true);
        }
    }, [countdown]);

    useEffect(() => {
        // Set default quality to the highest available or original
        const sources = video.sources || video.variants || [];
        if (sources.length > 0) {
            const sortedSources = [...sources].sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
            setSelectedQuality(sortedSources[0].quality);
        } else {
            setSelectedQuality('orig');
        }
    }, [video]);

    const getQualityOptions = () => {
        if (!video) return [];

        const options = [];
        const sources = video.variants || video.sources || [];

        // Define standard qualities for sorting/labeling
        const standardQualities = [1080, 720, 480, 360];

        // Create a map of available qualities
        const availableQualities = new Map();
        if (sources.length > 0) {
            sources.forEach(s => {
                // Ensure we handle both string and number formats
                const q = parseInt(s.quality);
                if (!isNaN(q)) {
                    availableQualities.set(q, s);
                }
            });
        }

        // Generate options ONLY for available qualities
        standardQualities.forEach((quality) => {
            if (availableQualities.has(quality)) {
                options.push({
                    quality: quality,
                    label: `${quality}p`,
                    description: 'HD Quality',
                    recommended: quality === 1080 || quality === 720
                });
            }
        });

        // Always add Original as an option
        options.push({
            quality: 'orig',
            label: 'Original',
            description: 'Full Quality',
            recommended: options.length === 0
        });

        return options;
    };

    const handleDownload = () => {
        // Find the URL for the selected quality
        let downloadUrl = video.videoUrl; // Default to original

        if (selectedQuality !== 'orig') {
            const sources = video.variants || video.sources || [];
            // Use loose comparison (==) to handle string/number differences
            const selectedVariant = sources.find(v => v.quality == selectedQuality);

            if (selectedVariant && selectedVariant.url) {
                downloadUrl = selectedVariant.url;
            }
        }

        // Open the direct URL in a new tab
        window.open(downloadUrl, '_blank');

        // Start countdown for modal close
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const qualityOptions = getQualityOptions();

    return (
        <div className="download-modal-overlay" onClick={onClose}>
            <div className="download-modal" onClick={(e) => e.stopPropagation()}>
                <div className="download-modal-header">
                    <h2>Download Video</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="download-modal-content">
                    <div className="ad-download-modal-top">
                        <AdBanner location="download-modal-top" />
                    </div>

                    <div className="download-layout">
                        <div className="download-main-content">
                            <div className="download-video-info">
                                <img src={video.thumbnailUrl} alt={video.title} className="download-thumbnail" />
                                <div className="download-details">
                                    <h3>{video.title}</h3>
                                    <p>{video.user?.channelName || video.user?.username}</p>
                                </div>
                            </div>

                            <div className="quality-selection">
                                <h3>Select Quality</h3>
                                <p className="quality-description">Choose your preferred video quality</p>

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
                                                <span className="quality-size">{option.description}</span>
                                            </div>
                                            {selectedQuality === option.quality && (
                                                <FiCheck size={20} className="check-icon" />
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
                                    disabled={!canDownload || downloading || !selectedQuality}
                                >
                                    <FiDownload size={20} />
                                    {downloading ? 'Downloading...' : canDownload ? 'Download Now' : `Wait ${countdown}s`}
                                </button>

                                <p className="download-notice">
                                    By downloading, you agree to our terms of service.
                                </p>
                            </div>
                        </div>

                        <div className="download-sidebar">
                            <AdBanner location="download-modal-sidebar" />
                        </div>
                    </div>

                    <div className="ad-download-modal-bottom">
                        <AdBanner location="download-modal-bottom" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadModal;
