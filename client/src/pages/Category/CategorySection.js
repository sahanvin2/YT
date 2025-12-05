import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay } from 'react-icons/fi';
import { getVideos } from '../../utils/api';
import './CategorySection.css';

const CategorySection = ({ category, limit = 10 }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryVideos = async () => {
            try {
                const res = await getVideos({ category: category.label, limit: limit });
                setVideos(res.data.data || []);
            } catch (err) {
                console.error(`Error fetching videos for ${category.label}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryVideos();
    }, [category.label, limit]);

    if (loading || videos.length === 0) return null;

    return (
        <div className="category-section">
            <div className="section-header">
                <Link to={category.path} className="section-title">
                    {category.label}
                </Link>
            </div>
            <div className="category-videos-grid">
                {videos.map((video) => (
                    <Link 
                        key={video._id} 
                        to={`/watch/${video._id}`}
                        className="trending-video-item"
                    >
                        <div className="trending-video-thumbnail">
                            <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                loading="lazy"
                            />
                            <div className="trending-video-overlay">
                                <FiPlay size={24} fill="currentColor" />
                            </div>
                        </div>
                        <h4 className="trending-video-title">{video.title}</h4>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CategorySection;
