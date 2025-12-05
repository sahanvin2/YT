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
  FiUser,
  FiZap,
  FiCompass,
  FiTv,
  FiMessageSquare,
  FiMail,
  FiHeart,
  FiInfo
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

  const projectLinks = [
    { path: '#', icon: FiMail, label: 'Contact Us' },
    { path: '#', icon: FiHeart, label: 'Support Us' },
    { path: '#', icon: FiSmile, label: 'Team' },
    { path: '#', icon: FiInfo, label: 'About Movia' }
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
        {/* Section 1: Main Links */}
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

        {/* Section 4: Categories */}
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
        <div className="sidebar-divider"></div>

        {/* Section 5: Project */}
        <div className="sidebar-section">
          <div className="sidebar-title">Project</div>
          {projectLinks.map((link) => (
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
      </div>

      <div className="sidebar-footer">
        <p>&copy; 2025 Movia Inc.</p>
        <p>The Future of Stream.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
