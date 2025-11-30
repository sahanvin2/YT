import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoCard from '../../components/VideoCard/VideoCard';
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
            <div className="video-row-container">
                <div className="video-row">
                    {videos.map((video) => (
                        <div key={video._id} className="video-item">
                            <VideoCard video={video} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategorySection;
