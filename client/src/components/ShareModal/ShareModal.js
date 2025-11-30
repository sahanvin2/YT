import React, { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiFacebook, FiTwitter, FiMail } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaReddit, FaLinkedin } from 'react-icons/fa';
import './ShareModal.css';

const ShareModal = ({ video, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [startAt, setStartAt] = useState(false);
    const [startTime, setStartTime] = useState('0:00');

    const videoUrl = `${window.location.origin}/watch/${video._id}`;
    const embedCode = `<iframe width="560" height="315" src="${window.location.origin}/embed/${video._id}" frameborder="0" allowfullscreen></iframe>`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(videoUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyEmbed = () => {
        navigator.clipboard.writeText(embedCode);
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: 'Facebook',
            icon: FiFacebook,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
            color: '#1877F2'
        },
        {
            name: 'WhatsApp',
            icon: FaWhatsapp,
            url: `https://wa.me/?text=${encodeURIComponent(video.title + ' ' + videoUrl)}`,
            color: '#25D366'
        },
        {
            name: 'X',
            icon: FiTwitter,
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`,
            color: '#000000'
        },
        {
            name: 'Telegram',
            icon: FaTelegram,
            url: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`,
            color: '#0088cc'
        },
        {
            name: 'Email',
            icon: FiMail,
            url: `mailto:?subject=${encodeURIComponent(video.title)}&body=${encodeURIComponent(videoUrl)}`,
            color: '#EA4335'
        },
        {
            name: 'Reddit',
            icon: FaReddit,
            url: `https://reddit.com/submit?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(video.title)}`,
            color: '#FF4500'
        },
        {
            name: 'LinkedIn',
            icon: FaLinkedin,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`,
            color: '#0A66C2'
        }
    ];

    const handleShare = (url) => {
        window.open(url, '_blank', 'width=600,height=400');
    };

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <h2>Share</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="share-modal-content">
                    {/* Social Media Buttons */}
                    <div className="share-options">
                        {shareLinks.map((link) => (
                            <button
                                key={link.name}
                                className="share-option"
                                onClick={() => handleShare(link.url)}
                                style={{ '--hover-color': link.color }}
                            >
                                <div className="share-icon" style={{ backgroundColor: link.color }}>
                                    <link.icon size={24} />
                                </div>
                                <span>{link.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Copy Link */}
                    <div className="share-section">
                        <label>Link</label>
                        <div className="copy-container">
                            <input
                                type="text"
                                value={videoUrl}
                                readOnly
                                className="share-input"
                            />
                            <button className="copy-btn" onClick={handleCopyLink}>
                                {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Start at checkbox */}
                    <div className="share-checkbox">
                        <input
                            type="checkbox"
                            id="startAt"
                            checked={startAt}
                            onChange={(e) => setStartAt(e.target.checked)}
                        />
                        <label htmlFor="startAt">Start at {startTime}</label>
                    </div>

                    {/* Embed Code */}
                    <div className="share-section">
                        <label>Embed</label>
                        <div className="copy-container">
                            <input
                                type="text"
                                value={embedCode}
                                readOnly
                                className="share-input"
                            />
                            <button className="copy-btn" onClick={handleCopyEmbed}>
                                {embedCopied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                                {embedCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
