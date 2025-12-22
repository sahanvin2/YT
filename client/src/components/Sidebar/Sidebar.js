import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiTrendingUp,
  FiClock,
  FiThumbsUp,
  FiUsers,
  FiBookmark,
  FiVideo,
  FiUser,
  FiZap,
  FiCompass,
  FiTv,
  FiMessageSquare,
  FiHeart,
  FiStar,
  FiFilm,
  FiSmile,
  FiSearch
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { MAIN_CATEGORIES, GENRES } from '../../utils/categories';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      // Don't auto-close sidebar on mobile after search - let user see results
      // They can close it manually if needed
    }
  };

  // Auto-minimize sidebar on mobile when clicking a link (but not search)
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      // Dispatch event to close sidebar
      window.dispatchEvent(new CustomEvent('collapseSidebar'));
    }
  };

  const mainLinks = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/trending', icon: FiTrendingUp, label: 'Trending' },
    { path: '/categories', icon: FiCompass, label: 'Explore' }
  ];

  const followingLinks = [
    { path: '/subscriptions', icon: FiUsers, label: 'Creators' },
    { path: '/subscriptions', icon: FiTv, label: 'Channels' },
    { path: '/subscriptions', icon: FiMessageSquare, label: 'Communities' }
  ];

  const userLinks = [
    { path: '/history', icon: FiClock, label: 'Watch History' },
    { path: '/liked', icon: FiThumbsUp, label: 'Voted Videos' },
    { path: '/saved', icon: FiBookmark, label: 'Saved Videos' },
    { path: '/saved', icon: FiClock, label: 'Watch Later' }
  ];

  const channelLinks = [
    { path: `/channel/${user?._id || ''}`, icon: FiUser, label: 'Your Channel' },
    { path: '/video-manager', icon: FiVideo, label: 'Video Manager' }
  ];

  const categories = [
    ...MAIN_CATEGORIES.map(cat => ({
      path: `/category/${cat.id}`,
      icon: cat.id === 'movies' ? FiFilm : cat.id === 'series' ? FiTv : cat.id === 'documentaries' ? FiVideo : FiSmile,
      label: cat.name
    })),
    { path: '/category/action', icon: FiZap, label: 'Action' },
    { path: '/category/comedy', icon: FiSmile, label: 'Comedy' },
    { path: '/category/drama', icon: FiHeart, label: 'Drama' },
    { path: '/category/horror', icon: FiStar, label: 'Horror' },
    { path: '/category/thriller', icon: FiZap, label: 'Thriller' },
    { path: '/category/romance', icon: FiHeart, label: 'Romance' },
    { path: '/category/science-fiction', icon: FiZap, label: 'Sci-Fi' },
    { path: '/category/fantasy', icon: FiStar, label: 'Fantasy' },
    { path: '/category/crime', icon: FiZap, label: 'Crime' },
    { path: '/category/mystery', icon: FiCompass, label: 'Mystery' },
    { path: '/category/animation', icon: FiSmile, label: 'Animation' },
    { path: '/category/adventure', icon: FiCompass, label: 'Adventure' }
  ];

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        {/* Search Section */}
        <div className="sidebar-section sidebar-search-section">
          <form onSubmit={handleSearch} className="sidebar-search-form">
            <div className="sidebar-search-input-wrapper">
              <FiSearch className="sidebar-search-icon" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
            </div>
          </form>
        </div>
        <div className="sidebar-divider"></div>

        {/* Section 1: Main Links */}
        <div className="sidebar-section">{mainLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${isActive(link.path)}`}
              onClick={handleLinkClick}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
        <div className="sidebar-divider"></div>

        {/* Section 2: Following */}
        {isAuthenticated && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-title">Following</div>
              {followingLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`sidebar-link ${isActive(link.path)}`}
                  onClick={handleLinkClick}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="sidebar-divider"></div>
          </>
        )}

        {/* Section 3: You */}
        {isAuthenticated && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-title">You</div>
              {userLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`sidebar-link ${isActive(link.path)}`}
                  onClick={handleLinkClick}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="sidebar-divider"></div>
          </>
        )}

        {/* Section 4: Channel */}
        {isAuthenticated && user && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-title">Channel</div>
              {channelLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`sidebar-link ${isActive(link.path)}`}
                  onClick={handleLinkClick}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="sidebar-divider"></div>
          </>
        )}

        {/* Section 5: Categories */}
        <div className="sidebar-section">
          <div className="sidebar-title">Categories</div>
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className={`sidebar-link ${isActive(category.path)}`}
              onClick={handleLinkClick}
            >
              <category.icon size={20} />
              <span>{category.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <p>&copy; 2025 Xclub Inc.</p>
        <p>The Future of Stream.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
