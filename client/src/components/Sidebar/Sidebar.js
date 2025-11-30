import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiTrendingUp,
  FiClock,
  FiThumbsUp,
  FiUsers,
  FiFilm,
  FiUser,
  FiMusic,
  FiMonitor,
  FiBook,
  FiSmile,
  FiRadio,
  FiTarget,
  FiPenTool,
  FiCamera,
  FiFileText,
  FiZap,
  FiShoppingBag,
  FiCoffee,
  FiMic,
  FiMessageCircle,
  FiMessageSquare,
  FiMapPin,
  FiMoon,
  FiActivity,
  FiCpu,
  FiDroplet,
  FiGrid
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const mainLinks = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/trending', icon: FiTrendingUp, label: 'Trending' },
    { path: '/categories', icon: FiGrid, label: 'Categories' }
  ];

  const userLinks = [
    { path: '/history', icon: FiClock, label: 'History' },
    { path: '/liked', icon: FiThumbsUp, label: 'Liked Videos' },
    { path: '/subscriptions', icon: FiUsers, label: 'Subscriptions' }
  ];

  const categories = [
    { path: '/category/Animation', icon: FiFilm, label: 'Animation' },
    { path: '/category/Art and Design', icon: FiPenTool, label: 'Art & Design' },
    { path: '/category/Cameras and Drones', icon: FiCamera, label: 'Cameras & Drones' },
    { path: '/category/Comedy', icon: FiSmile, label: 'Comedy' },
    { path: '/category/Documentary', icon: FiFileText, label: 'Documentary' },
    { path: '/category/Experimental', icon: FiZap, label: 'Experimental' },
    { path: '/category/Fashion', icon: FiShoppingBag, label: 'Fashion' },
    { path: '/category/Food', icon: FiCoffee, label: 'Food' },
    { path: '/category/Instructional', icon: FiBook, label: 'Instructional' },
    { path: '/category/Reporting and Journalism', icon: FiMic, label: 'Reporting' },
    { path: '/category/Music', icon: FiMusic, label: 'Music' },
    { path: '/category/Narrative', icon: FiMessageCircle, label: 'Narrative' },
    { path: '/category/Sports', icon: FiTarget, label: 'Sports' },
    { path: '/category/Talks', icon: FiMessageSquare, label: 'Talks' },
    { path: '/category/Travel and Vlog', icon: FiMapPin, label: 'Travel & Vlog' },
    { path: '/category/Astrology and Astronomy', icon: FiMoon, label: 'Astrology' },
    { path: '/category/Biology', icon: FiActivity, label: 'Biology' },
    { path: '/category/Physics', icon: FiCpu, label: 'Physics' },
    { path: '/category/Chemistry', icon: FiDroplet, label: 'Chemistry' }
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
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {isAuthenticated && (
          <div className="sidebar-section">
            <div className="sidebar-title">Library</div>
            {userLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`sidebar-link ${isActive(link.path)}`}
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-title">Categories</div>
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className={`sidebar-link ${isActive(category.path)}`}
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
