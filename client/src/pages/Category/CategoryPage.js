import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiHeart, FiUsers, FiStar, FiZap, FiEye, FiDroplet,
    FiSmile, FiTrendingUp, FiGlobe, FiSun, FiMoon, FiCircle,
    FiSquare, FiTriangle, FiHexagon, FiOctagon, FiVideo,
    FiAperture, FiActivity, FiAward, FiDisc, FiFilm, FiCamera,
    FiCoffee, FiFeather, FiRadio, FiTarget, FiUnlock, FiUserCheck,
    FiWind, FiShield, FiBold, FiMaximize, FiMinimize, FiBox,
    FiCrosshair, FiCommand, FiCast, FiCloud, FiCompass, FiCrop,
    FiLayers, FiMusic, FiNavigation, FiPaperclip, FiPower
} from 'react-icons/fi';
import CategorySection from './CategorySection';
import './CategoryPage.css';

const CategoryPage = () => {
    // Adult content categories
    const displayCategories = [
        { path: '/category/Indian', icon: FiGlobe, label: 'Indian', bg: 'linear-gradient(45deg, #FF6B35, #F7931E)' },
        { path: '/category/Milfs', icon: FiHeart, label: 'Milfs', bg: 'linear-gradient(45deg, #E94057, #F27121)' },
        { path: '/category/Big Cock', icon: FiZap, label: 'Big Cock', bg: 'linear-gradient(45deg, #8E2DE2, #4A00E0)' },
        { path: '/category/Step Mom', icon: FiUsers, label: 'Step Mom', bg: 'linear-gradient(45deg, #DA4453, #89216B)' },
        { path: '/category/Granny', icon: FiStar, label: 'Granny', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/Cumshot', icon: FiDroplet, label: 'Cumshot', bg: 'linear-gradient(45deg, #f093fb, #f5576c)' },
        { path: '/category/Blonde', icon: FiSun, label: 'Blonde', bg: 'linear-gradient(45deg, #FDC830, #F37335)' },
        { path: '/category/Big Tits', icon: FiCircle, label: 'Big Tits', bg: 'linear-gradient(45deg, #fa709a, #fee140)' },
        { path: '/category/Doggy Style', icon: FiSquare, label: 'Doggy Style', bg: 'linear-gradient(45deg, #30cfd0, #330867)' },
        { path: '/category/Group Sex', icon: FiUsers, label: 'Group Sex', bg: 'linear-gradient(45deg, #a8edea, #fed6e3)' },
        { path: '/category/Anal', icon: FiTriangle, label: 'Anal', bg: 'linear-gradient(45deg, #ff9a9e, #fecfef)' },
        { path: '/category/Creampie', icon: FiDroplet, label: 'Creampie', bg: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
        { path: '/category/Hardcore', icon: FiZap, label: 'Hardcore', bg: 'linear-gradient(45deg, #ff6e7f, #bfe9ff)' },
        { path: '/category/Ebony', icon: FiMoon, label: 'Ebony', bg: 'linear-gradient(45deg, #434343, #000000)' },
        { path: '/category/Asia', icon: FiGlobe, label: 'Asia', bg: 'linear-gradient(45deg, #f83600, #f9d423)' },
        { path: '/category/Wife Swap', icon: FiUsers, label: 'Wife Swap', bg: 'linear-gradient(45deg, #4facfe, #00f2fe)' },
        { path: '/category/Massage', icon: FiSmile, label: 'Massage', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/Public', icon: FiEye, label: 'Public', bg: 'linear-gradient(45deg, #fa8bff, #2bd2ff, #2bff88)' },
        { path: '/category/Mature', icon: FiStar, label: 'Mature', bg: 'linear-gradient(45deg, #736efe, #b695f8)' },
        { path: '/category/Big Ass', icon: FiHexagon, label: 'Big Ass', bg: 'linear-gradient(45deg, #f72585, #b5179e)' },
        { path: '/category/Teen', icon: FiHeart, label: 'Teen', bg: 'linear-gradient(45deg, #ff0844, #ffb199)' },
        { path: '/category/Lesbian', icon: FiUsers, label: 'Lesbian', bg: 'linear-gradient(45deg, #fc6767, #ec008c)' },
        { path: '/category/Latina', icon: FiGlobe, label: 'Latina', bg: 'linear-gradient(45deg, #fdbb2d, #22c1c3)' },
        { path: '/category/Blowjobs', icon: FiCircle, label: 'Blowjobs', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/Hot Babes', icon: FiStar, label: 'Hot Babes', bg: 'linear-gradient(45deg, #ff9a56, #ff6a88)' },
        { path: '/category/Brunette', icon: FiMoon, label: 'Brunette', bg: 'linear-gradient(45deg, #654ea3, #eaafc8)' },
        { path: '/category/Double Penetration', icon: FiTriangle, label: 'Double Penetration', bg: 'linear-gradient(45deg, #e43a15, #e65245)' },
        { path: '/category/Step Sister', icon: FiUsers, label: 'Step Sister', bg: 'linear-gradient(45deg, #ff0099, #493240)' },
        { path: '/category/Porn Star', icon: FiStar, label: 'Porn Star', bg: 'linear-gradient(45deg, #ff6a00, #ee0979)' },
        { path: '/category/Japanese', icon: FiGlobe, label: 'Japanese', bg: 'linear-gradient(45deg, #dd5e89, #f7bb97)' },
        { path: '/category/Office', icon: FiSquare, label: 'Office', bg: 'linear-gradient(45deg, #3a7bd5, #3a6073)' },
        { path: '/category/Handjob', icon: FiCircle, label: 'Handjob', bg: 'linear-gradient(45deg, #7F00FF, #E100FF)' },
        { path: '/category/Solo', icon: FiHeart, label: 'Solo', bg: 'linear-gradient(45deg, #00c6ff, #0072ff)' },
        { path: '/category/Party', icon: FiSmile, label: 'Party', bg: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' },
        { path: '/category/Anal Creampie', icon: FiDroplet, label: 'Anal Creampie', bg: 'linear-gradient(45deg, #d53369, #daae51)' },
        { path: '/category/Reverse Cowgirl', icon: FiOctagon, label: 'Reverse Cowgirl', bg: 'linear-gradient(45deg, #f857a6, #ff5858)' },
        { path: '/category/BBC', icon: FiZap, label: 'BBC', bg: 'linear-gradient(45deg, #000000, #434343)' },
        { path: '/category/Chubby', icon: FiCircle, label: 'Chubby', bg: 'linear-gradient(45deg, #ff9a9e, #fad0c4)' },
        { path: '/category/Facial', icon: FiDroplet, label: 'Facial', bg: 'linear-gradient(45deg, #a1c4fd, #c2e9fb)' },
        { path: '/category/Rough Sex', icon: FiZap, label: 'Rough Sex', bg: 'linear-gradient(45deg, #ff0000, #8b0000)' },
        { path: '/category/Pregnant', icon: FiHeart, label: 'Pregnant', bg: 'linear-gradient(45deg, #ffa8a8, #fcff00)' },
        { path: '/category/Strap On', icon: FiTriangle, label: 'Strap On', bg: 'linear-gradient(45deg, #f83600, #fe8c00)' },
        { path: '/category/Squirting', icon: FiDroplet, label: 'Squirting', bg: 'linear-gradient(45deg, #4facfe, #00f2fe)' },
        { path: '/category/Huge Tits', icon: FiCircle, label: 'Huge Tits', bg: 'linear-gradient(45deg, #fa709a, #fee140)' },
        { path: '/category/Teacher', icon: FiSquare, label: 'Teacher', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/Interracial', icon: FiUsers, label: 'Interracial', bg: 'linear-gradient(45deg, #30cfd0, #330867)' },
        { path: '/category/Gangbang', icon: FiUsers, label: 'Gangbang', bg: 'linear-gradient(45deg, #ff0844, #ffb199)' },
        { path: '/category/BBW', icon: FiCircle, label: 'BBW', bg: 'linear-gradient(45deg, #ff6e7f, #bfe9ff)' },
        { path: '/category/Pussy', icon: FiHeart, label: 'Pussy', bg: 'linear-gradient(45deg, #fc6767, #ec008c)' },
        { path: '/category/Pussy Licking', icon: FiCircle, label: 'Pussy Licking', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/Cuckold', icon: FiUsers, label: 'Cuckold', bg: 'linear-gradient(45deg, #434343, #000000)' },
        { path: '/category/Threesome', icon: FiUsers, label: 'Threesome', bg: 'linear-gradient(45deg, #fa8bff, #2bd2ff, #2bff88)' },
        { path: '/category/Step Daughter', icon: FiUsers, label: 'Step Daughter', bg: 'linear-gradient(45deg, #DA4453, #89216B)' },
        { path: '/category/Outdoor', icon: FiSun, label: 'Outdoor', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/Arab', icon: FiGlobe, label: 'Arab', bg: 'linear-gradient(45deg, #f83600, #f9d423)' },
        { path: '/category/Pissing', icon: FiDroplet, label: 'Pissing', bg: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
        { path: '/category/Massive', icon: FiZap, label: 'Massive', bg: 'linear-gradient(45deg, #8E2DE2, #4A00E0)' },
        { path: '/category/Missionary', icon: FiSquare, label: 'Missionary', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/Panties', icon: FiTriangle, label: 'Panties', bg: 'linear-gradient(45deg, #fa709a, #fee140)' },
        { path: '/category/Dildo', icon: FiCircle, label: 'Dildo', bg: 'linear-gradient(45deg, #7F00FF, #E100FF)' },
        { path: '/category/Cum in Mouth', icon: FiDroplet, label: 'Cum in Mouth', bg: 'linear-gradient(45deg, #a1c4fd, #c2e9fb)' },
        { path: '/category/Car', icon: FiSquare, label: 'Car', bg: 'linear-gradient(45deg, #3a7bd5, #3a6073)' },
        { path: '/category/Gagging', icon: FiCircle, label: 'Gagging', bg: 'linear-gradient(45deg, #ff0000, #8b0000)' },
        { path: '/category/Wife', icon: FiHeart, label: 'Wife', bg: 'linear-gradient(45deg, #E94057, #F27121)' },
        { path: '/category/Amateur', icon: FiVideo, label: 'Amateur', bg: 'linear-gradient(45deg, #00c6ff, #0072ff)' },
        { path: '/category/Ass', icon: FiHexagon, label: 'Ass', bg: 'linear-gradient(45deg, #f72585, #b5179e)' },
        { path: '/category/Deep Throat', icon: FiCircle, label: 'Deep Throat', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/Hairy', icon: FiSquare, label: 'Hairy', bg: 'linear-gradient(45deg, #654ea3, #eaafc8)' },
        { path: '/category/Stockings', icon: FiTriangle, label: 'Stockings', bg: 'linear-gradient(45deg, #000000, #434343)' },
        { path: '/category/Reality', icon: FiEye, label: 'Reality', bg: 'linear-gradient(45deg, #fdbb2d, #22c1c3)' },
        { path: '/category/Small Tits', icon: FiCircle, label: 'Small Tits', bg: 'linear-gradient(45deg, #ffa8a8, #fcff00)' },
        { path: '/category/Lingerie', icon: FiHeart, label: 'Lingerie', bg: 'linear-gradient(45deg, #fc6767, #ec008c)' },
        { path: '/category/Kitchen', icon: FiSquare, label: 'Kitchen', bg: 'linear-gradient(45deg, #FF8008, #FFC837)' },
        { path: '/category/HD Porn', icon: FiVideo, label: 'HD Porn', bg: 'linear-gradient(45deg, #4facfe, #00f2fe)' },
        { path: '/category/First Time', icon: FiStar, label: 'First Time', bg: 'linear-gradient(45deg, #ff9a56, #ff6a88)' },
        { path: '/category/School', icon: FiSquare, label: 'School', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/POV', icon: FiEye, label: 'POV', bg: 'linear-gradient(45deg, #fa8bff, #2bd2ff, #2bff88)' },
        { path: '/category/Maid', icon: FiUsers, label: 'Maid', bg: 'linear-gradient(45deg, #DA4453, #89216B)' },
        { path: '/category/Ass Licking', icon: FiCircle, label: 'Ass Licking', bg: 'linear-gradient(45deg, #f72585, #b5179e)' },
        { path: '/category/Skinny', icon: FiSquare, label: 'Skinny', bg: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
        { path: '/category/High Heels', icon: FiTriangle, label: 'High Heels', bg: 'linear-gradient(45deg, #fc6767, #ec008c)' },
        { path: '/category/Parody', icon: FiSmile, label: 'Parody', bg: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' },
        { path: '/category/Russian', icon: FiGlobe, label: 'Russian', bg: 'linear-gradient(45deg, #dd5e89, #f7bb97)' },
        { path: '/category/Fingering', icon: FiCircle, label: 'Fingering', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/Petite', icon: FiSquare, label: 'Petite', bg: 'linear-gradient(45deg, #ff0099, #493240)' },
        { path: '/category/Bondage', icon: FiHexagon, label: 'Bondage', bg: 'linear-gradient(45deg, #000000, #434343)' },
        { path: '/category/BDSM', icon: FiZap, label: 'BDSM', bg: 'linear-gradient(45deg, #8b0000, #ff0000)' },
        { path: '/category/Thick', icon: FiCircle, label: 'Thick', bg: 'linear-gradient(45deg, #ff9a9e, #fad0c4)' },
        { path: '/category/Fat', icon: FiCircle, label: 'Fat', bg: 'linear-gradient(45deg, #ff6e7f, #bfe9ff)' },
        { path: '/category/Swingers', icon: FiUsers, label: 'Swingers', bg: 'linear-gradient(45deg, #4facfe, #00f2fe)' },
        { path: '/category/Latex', icon: FiTriangle, label: 'Latex', bg: 'linear-gradient(45deg, #000000, #434343)' },
        { path: '/category/CFNM', icon: FiUsers, label: 'CFNM', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/Gym', icon: FiSquare, label: 'Gym', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/Uniform', icon: FiSquare, label: 'Uniform', bg: 'linear-gradient(45deg, #3a7bd5, #3a6073)' },
        { path: '/category/Casting', icon: FiVideo, label: 'Casting', bg: 'linear-gradient(45deg, #f83600, #fe8c00)' },
        { path: '/category/Bedroom', icon: FiSquare, label: 'Bedroom', bg: 'linear-gradient(45deg, #736efe, #b695f8)' },
        { path: '/category/Face Sitting', icon: FiCircle, label: 'Face Sitting', bg: 'linear-gradient(45deg, #fa709a, #fee140)' },
        { path: '/category/British', icon: FiGlobe, label: 'British', bg: 'linear-gradient(45deg, #000046, #1CB5E0)' },
        { path: '/category/Glory Hole', icon: FiCircle, label: 'Glory Hole', bg: 'linear-gradient(45deg, #434343, #000000)' },
        { path: '/category/FFM', icon: FiUsers, label: 'FFM', bg: 'linear-gradient(45deg, #fc6767, #ec008c)' },
        { path: '/category/Black Hair', icon: FiMoon, label: 'Black Hair', bg: 'linear-gradient(45deg, #000000, #434343)' },
        { path: '/category/Muscle', icon: FiZap, label: 'Muscle', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/Old Young', icon: FiUsers, label: 'Old Young', bg: 'linear-gradient(45deg, #667eea, #764ba2)' },
        { path: '/category/Hotel Room', icon: FiSquare, label: 'Hotel Room', bg: 'linear-gradient(45deg, #736efe, #b695f8)' },
        { path: '/category/Spanish', icon: FiGlobe, label: 'Spanish', bg: 'linear-gradient(45deg, #fdbb2d, #22c1c3)' },
        { path: '/category/Tall', icon: FiSquare, label: 'Tall', bg: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
        { path: '/category/Rimming', icon: FiCircle, label: 'Rimming', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/Nude Stockings', icon: FiTriangle, label: 'Nude Stockings', bg: 'linear-gradient(45deg, #ffa8a8, #fcff00)' },
        { path: '/category/Trimmed', icon: FiSquare, label: 'Trimmed', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/Piercing', icon: FiCircle, label: 'Piercing', bg: 'linear-gradient(45deg, #7F00FF, #E100FF)' },
        { path: '/category/Long Hair', icon: FiSquare, label: 'Long Hair', bg: 'linear-gradient(45deg, #654ea3, #eaafc8)' },
        { path: '/category/Workout', icon: FiZap, label: 'Workout', bg: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
        { path: '/category/Short Girls', icon: FiSquare, label: 'Short Girls', bg: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
        { path: '/category/Big Butt', icon: FiHexagon, label: 'Big Butt', bg: 'linear-gradient(45deg, #f72585, #b5179e)' },
        { path: '/category/Licking', icon: FiCircle, label: 'Licking', bg: 'linear-gradient(45deg, #ee9ca7, #ffdde1)' },
        { path: '/category/Feet', icon: FiSquare, label: 'Feet', bg: 'linear-gradient(45deg, #ffa8a8, #fcff00)' },
        { path: '/category/Orgy', icon: FiUsers, label: 'Orgy', bg: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' }
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
