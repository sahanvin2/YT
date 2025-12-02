import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiTrendingUp,
  FiClock,
  FiThumbsUp,
  FiUsers,
  FiMusic,
  FiMonitor,
  FiBook,
  FiSmile,
  FiRadio,
  FiTarget,
  FiScissors,
  FiBookmark,
  FiGrid,
  FiVideo,
  FiUser
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Auto-minimize sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      // Dispatch event to close sidebar
      window.dispatchEvent(new CustomEvent('collapseSidebar'));
    }
  };

  const mainLinks = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/trending', icon: FiTrendingUp, label: 'Trending' },
    { path: '/categories', icon: FiGrid, label: 'Categories' }
  ];

  // My Contents section (only for authenticated users)
  const myContentsLinks = isAuthenticated && user ? [
    { path: '/upload', icon: FiVideo, label: 'Upload Videos' },
    { path: '/clips', icon: FiScissors, label: 'Clips' },
    { path: `/channel/${user.id || user._id}`, icon: FiUser, label: 'Your Channel' }
  ] : [];

  const userLinks = [
    { path: '/history', icon: FiClock, label: 'History' },
    { path: '/liked', icon: FiThumbsUp, label: 'Liked Videos' },
    { path: '/saved', icon: FiBookmark, label: 'Saved Videos' },
    { path: '/subscriptions', icon: FiUsers, label: 'Subscriptions' }
  ];

  const categories = [
    { path: '/category/Music', icon: FiMusic, label: 'Music' },
    { path: '/category/Gaming', icon: FiMonitor, label: 'Gaming' },
    { path: '/category/Education', icon: FiBook, label: 'Education' },
    { path: '/category/Entertainment', icon: FiSmile, label: 'Entertainment' },
    { path: '/category/News', icon: FiRadio, label: 'News' },
    { path: '/category/Sports', icon: FiTarget, label: 'Sports' }
  ];

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <div className="sidebar-section">
          {mainLinks.map((link) => (
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

        {isAuthenticated && myContentsLinks.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-title">My Contents</div>
            {myContentsLinks.map((link) => (
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
        )}

        {isAuthenticated && (
          <div className="sidebar-section">
            <div className="sidebar-title">Library</div>
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
        )}

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
    </aside>
  );
};

export default Sidebar;
