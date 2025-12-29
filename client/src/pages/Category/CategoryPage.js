import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MAIN_CATEGORIES, GENRES } from '../../utils/categories';
import { getCategoryImage } from '../../utils/categoryImages';
import './CategoryPage.css';

const CategoryPage = () => {
    // Main Categories
    const mainCategoriesDisplay = MAIN_CATEGORIES.map(cat => ({
        path: `/category/${cat.id}`,
        id: cat.id,
        label: cat.name
    }));

    // All Genres
    const displayCategories = GENRES.map(genre => ({
        path: `/category/${genre.id}`,
        id: genre.id,
        label: genre.name
    }));

    return (
        <div className="category-page">
            <h1 className="category-page-title">Explore Categories</h1>
            
            {/* Main Categories Section */}
            <div className="category-section">
                <h2 className="section-title">Main Categories</h2>
                <div className="category-grid">
                    {mainCategoriesDisplay.map((category) => {
                        const categoryImg = getCategoryImage(category.id);
                        const IconComponent = categoryImg.icon;
                        return (
                            <Link to={category.path} key={category.id} className="category-card main-category">
                                <div
                                    className="category-bg"
                                    style={{ background: categoryImg.gradient }}
                                ></div>
                                <div className="category-overlay"></div>
                                <div className="category-content">
                                    <IconComponent className="category-icon" />
                                    <span className="category-name">{category.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* All Genres Section */}
            <div className="category-section">
                <h2 className="section-title">All Genres</h2>
                <div className="category-grid">
                    {displayCategories.map((category) => {
                        const categoryImg = getCategoryImage(category.id);
                        const IconComponent = categoryImg.icon;
                        return (
                            <Link to={category.path} key={category.id} className="category-card">
                                <div
                                    className="category-bg"
                                    style={{ background: categoryImg.gradient }}
                                ></div>
                                <div className="category-overlay"></div>
                                <div className="category-content">
                                    <IconComponent className="category-icon" />
                                    <span className="category-name">{category.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CategoryPage;
