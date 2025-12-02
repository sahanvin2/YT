import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiCheck } from 'react-icons/fi';
import { formatFileSize } from '../../utils/helpers';
import { useSmartlinkAd } from '../Ads/SmartlinkAd';
import { useAds } from '../../context/AdContext';
import { getDownloadUrl } from '../../utils/api';
import './DownloadModal.css';

const DownloadModal = ({ video, onClose }) => {
    const [selectedQuality, setSelectedQuality] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [canDownload, setCanDownload] = useState(false);
    const [smartlinkShown, setSmartlinkShown] = useState(false);
    const { openSmartlink } = useSmartlinkAd();
    const { adConfig } = useAds();

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

    const handleDownload = async () => {
        // Show smartlink ad before download if enabled and not shown yet
        if (!smartlinkShown && adConfig.smartlinkEnabled && adConfig.smartlinkUrl) {
            setSmartlinkShown(true);
            setDownloading(true);
            
            // Open smartlink ad
            openSmartlink(async () => {
                // Ad closed/completed - proceed with download
                setDownloading(false);
                await triggerDownload();
            });
        } else {
            // No smartlink or already shown - proceed with download directly
            setDownloading(true);
            await triggerDownload();
        }
    };

    const triggerDownload = async () => {
        try {
            // Get download URL from backend using getDownloadUrl API
            const qualityParam = selectedQuality === 'orig' ? 'orig' : selectedQuality;
            const response = await getDownloadUrl(video._id, qualityParam);
            
            if (!response.data.success) {
                throw new Error('Failed to get download URL');
            }

            const downloadUrl = response.data.data.downloadUrl;
            const filename = response.data.data.filename || `${video.title}_${selectedQuality === 'orig' ? 'original' : selectedQuality + 'p'}.mp4`;
            
            console.log('📥 Starting download:', { downloadUrl, filename });
            
            // Create a link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename; // This tells browser to download instead of navigate
            link.target = '_blank'; // Open in new tab as fallback for browsers that don't support download attribute
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Clean up after a short delay
            setTimeout(() => {
                document.body.removeChild(link);
                setDownloading(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Download error:', error);
            alert('ダウンロードに失敗しました。もう一度お試しください。');
            setDownloading(false);
        }
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
                    <div className="download-layout">
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
                </div>
            </div>
        </div>
    );
};

export default DownloadModal;
