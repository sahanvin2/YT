import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiHeart, FiZap, FiSmile, FiFilm, FiVideo, FiTv, FiCompass,
    FiStar, FiGlobe, FiTarget, FiShield, FiActivity, FiAward,
    FiFeather, FiWind, FiCrosshair, FiBook, FiMusic, FiCoffee
} from 'react-icons/fi';
import { MAIN_CATEGORIES, GENRES } from '../../utils/categories';
import CategorySection from './CategorySection';
import './CategoryPage.css';

const CategoryPage = () => {
    // Main Categories with icons and backgrounds
    const mainCategoriesDisplay = [
        { path: '/category/movies', icon: FiFilm, label: 'Movies', bg: 'linear-gradient(45deg, #FF6B35, #F7931E)' },
        { path: '/category/series', icon: FiTv, label: 'Series', bg: 'linear-gradient(45deg, #E94057, #F27121)' },
        { path: '/category/documentaries', icon: FiVideo, label: 'Documentaries', bg: 'linear-gradient(45deg, #8E2DE2, #4A00E0)' },
        { path: '/category/animation', icon: FiSmile, label: 'Animation', bg: 'linear-gradient(45deg, #ff0844, #ffb199)' }
    ];

    // Genre Categories
    const displayCategories = [
        { path: '/category/action', icon: FiZap, label: 'Action', bg: 'linear-gradient(45deg, #fc6767, #ec008c)' },
        { path: '/category/adventure', icon: FiCompass, label: 'Adventure', bg: 'linear-gradient(45deg, #fdbb2d, #22c1c3)' },
        { path: '/category/comedy', icon: FiSmile, label: 'Comedy', bg: 'linear-gradient(45deg, #ff9a9e, #fecfef)' },
        { path: '/category/drama', icon: FiHeart, label: 'Drama', bg: 'linear-gradient(45deg, #fa8bff, #2bff88)' },
        { path: '/category/horror', icon: FiTarget, label: 'Horror', bg: 'linear-gradient(45deg, #434343, #000000)' },
        { path: '/category/thriller', icon: FiActivity, label: 'Thriller', bg: 'linear-gradient(45deg, #DA4453, #89216B)' },
        { path: '/category/romance', icon: FiHeart, label: 'Romance', bg: 'linear-gradient(45deg, #f093fb, #f5576c)' },
        { path: '/category/science-fiction', icon: FiGlobe, label: 'Science Fiction', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/fantasy', icon: FiFeather, label: 'Fantasy', bg: 'linear-gradient(45deg, #fa709a, #fee140)' },
        { path: '/category/mystery', icon: FiCrosshair, label: 'Mystery', bg: 'linear-gradient(45deg, #30cfd0, #330867)' },
        { path: '/category/crime', icon: FiShield, label: 'Crime', bg: 'linear-gradient(45deg, #ff6e7f, #bfe9ff)' },
        { path: '/category/animation-genre', icon: FiSmile, label: 'Animation', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/family', icon: FiHeart, label: 'Family', bg: 'linear-gradient(45deg, #736efe, #b695f8)' },
        { path: '/category/documentary', icon: FiBook, label: 'Documentary', bg: 'linear-gradient(45deg, #f72585, #b5179e)' },
        { path: '/category/biography', icon: FiAward, label: 'Biography', bg: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
        { path: '/category/war', icon: FiTarget, label: 'War', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/western', icon: FiCompass, label: 'Western', bg: 'linear-gradient(45deg, #f83600, #fe8c00)' },
        { path: '/category/musical', icon: FiMusic, label: 'Musical', bg: 'linear-gradient(45deg, #4facfe, #00f2fe)' },
        { path: '/category/sports', icon: FiActivity, label: 'Sports', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/historical', icon: FiBook, label: 'Historical', bg: 'linear-gradient(45deg, #654ea3, #eaafc8)' },
        { path: '/category/superhero', icon: FiZap, label: 'Superhero', bg: 'linear-gradient(45deg, #e43a15, #e65245)' },
        { path: '/category/psychological', icon: FiCrosshair, label: 'Psychological', bg: 'linear-gradient(45deg, #ff0099, #493240)' },
        { path: '/category/survival', icon: FiWind, label: 'Survival', bg: 'linear-gradient(45deg, #ff6a00, #ee0979)' },
        { path: '/category/disaster', icon: FiTarget, label: 'Disaster', bg: 'linear-gradient(45deg, #dd5e89, #f7bb97)' },
        { path: '/category/spy-espionage', icon: FiShield, label: 'Spy / Espionage', bg: 'linear-gradient(45deg, #3a7bd5, #3a6073)' },
        { path: '/category/heist', icon: FiCrosshair, label: 'Heist', bg: 'linear-gradient(45deg, #7F00FF, #E100FF)' },
        { path: '/category/political', icon: FiGlobe, label: 'Political', bg: 'linear-gradient(45deg, #00c6ff, #0072ff)' },
        { path: '/category/martial-arts', icon: FiActivity, label: 'Martial Arts', bg: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' },
        { path: '/category/anime', icon: FiSmile, label: 'Anime', bg: 'linear-gradient(45deg, #d53369, #daae51)' },
        { path: '/category/mythology', icon: FiFeather, label: 'Mythology', bg: 'linear-gradient(45deg, #f857a6, #ff5858)' }
    ];

    return (
        <div className="category-page">
            <h1 className="category-page-title">Explore Categories</h1>
            
            {/* Main Categories Section */}
            <div className="category-section">
                <h2 className="section-title">Main Categories</h2>
                <div className="category-grid">
                    {mainCategoriesDisplay.map((category) => (
                        <Link to={category.path} key={category.label} className="category-card main-category">
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
            </div>

            {/* All Genres Section */}
            <div className="category-section">
                <h2 className="section-title">All Genres</h2>
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
            </div>
        </div>
    );
};

export default CategoryPage;
