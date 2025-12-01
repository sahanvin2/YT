import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiPenTool, FiCamera, FiSmile, FiFileText, FiZap,
    FiShoppingBag, FiCoffee, FiBook, FiMic, FiMusic, FiMessageCircle,
    FiTarget, FiMessageSquare, FiMapPin, FiMoon, FiActivity, FiCpu
} from 'react-icons/fi';
import CategorySection from './CategorySection';
import './CategoryPage.css';

const CategoryPage = () => {
    // Only show these specific categories with top 5 videos each
    const displayCategories = [
        { path: '/category/Art and Design', icon: FiPenTool, label: 'Art & Design', bg: 'linear-gradient(45deg, #8E2DE2, #4A00E0)' },
        { path: '/category/Cameras and Drones', icon: FiCamera, label: 'Cameras & Drones', bg: 'linear-gradient(45deg, #3a7bd5, #3a6073)' },
        { path: '/category/Comedy', icon: FiSmile, label: 'Comedy', bg: 'linear-gradient(45deg, #FDC830, #F37335)' },
        { path: '/category/Documentary', icon: FiFileText, label: 'Documentary', bg: 'linear-gradient(45deg, #00b09b, #96c93d)' },
        { path: '/category/Experimental', icon: FiZap, label: 'Experimental', bg: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' },
        { path: '/category/Fashion', icon: FiShoppingBag, label: 'Fashion', bg: 'linear-gradient(45deg, #DA4453, #89216B)' },
        { path: '/category/Food', icon: FiCoffee, label: 'Food', bg: 'linear-gradient(45deg, #FF8008, #FFC837)' },
        { path: '/category/Instructional', icon: FiBook, label: 'Instructional', bg: 'linear-gradient(45deg, #11998e, #38ef7d)' },
        { path: '/category/Reporting and Journalism', icon: FiMic, label: 'Reporting', bg: 'linear-gradient(45deg, #3E5151, #DECBA4)' },
        { path: '/category/Music', icon: FiMusic, label: 'Music', bg: 'linear-gradient(45deg, #40E0D0, #FF8C00, #FF0080)' },
        { path: '/category/Narrative', icon: FiMessageCircle, label: 'Narrative', bg: 'linear-gradient(45deg, #1f4037, #99f2c8)' },
        { path: '/category/Sports', icon: FiTarget, label: 'Sports', bg: 'linear-gradient(45deg, #e1eec3, #f05053)' },
        { path: '/category/Talks', icon: FiMessageSquare, label: 'Talks', bg: 'linear-gradient(45deg, #7F7FD5, #86A8E7, #91EAE4)' },
        { path: '/category/Travel and Vlog', icon: FiMapPin, label: 'Travel & Vlog', bg: 'linear-gradient(45deg, #2980B9, #6DD5FA, #FFFFFF)' },
        { path: '/category/Astrology and Astronomy', icon: FiMoon, label: 'Astrology', bg: 'linear-gradient(45deg, #000046, #1CB5E0)' },
        { path: '/category/Biology', icon: FiActivity, label: 'Biology', bg: 'linear-gradient(45deg, #56ab2f, #a8e063)' },
        { path: '/category/Physics', icon: FiCpu, label: 'Physics', bg: 'linear-gradient(45deg, #2C3E50, #4CA1AF)' }
    ];

    return (
        <div className="category-page">
            <h1>All Categories</h1>
            <div className="category-grid">
                {displayCategories.map((category) => (
                    <Link to={category.path} key={category.label} className="category-card">
                        <div
                            className="category-bg"
                            style={{ background: category.bg }}
                        ></div>
                        <div className="category-overlay"></div>
                        <div className="category-content">
                            <category.icon className="category-icon" />
                            <span className="category-name">{category.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="category-rows">
                {displayCategories.map((category) => (
                    <CategorySection key={category.label} category={category} limit={5} />
                ))}
            </div>
        </div>
    );
};

export default CategoryPage;
