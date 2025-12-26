import React, { useState, useEffect, useRef } from 'react';
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
  FiSearch,
  FiShield
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { MAIN_CATEGORIES, GENRES } from '../../utils/categories';
import { getSearchSuggestions } from '../../utils/api';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, isUploadAdmin, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    try {
      setIsLoadingSuggestions(true);
      const res = await getSearchSuggestions(query, 5);
      setSuggestions(res.data.data || res.data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
      // Don't auto-close sidebar on mobile after search - let user see results
      // They can close it manually if needed
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/search?q=${suggestion.title}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
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

  const adminLinks = [
    { path: '/admin', icon: FiShield, label: 'Admin Panel' }
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

  const categoryPathsSeen = new Set();
  const uniqueCategories = categories.filter((category) => {
    if (categoryPathsSeen.has(category.path)) return false;
    categoryPathsSeen.add(category.path);
    return true;
  });

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        {/* Search Section */}
        <div className="sidebar-section sidebar-search-section">
          <form onSubmit={handleSearch} className="sidebar-search-form">
            <div className="sidebar-search-input-wrapper" ref={searchRef}>
              <FiSearch className="sidebar-search-icon" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="sidebar-search-input"
              />
            </div>
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && (
              <div className="sidebar-search-suggestions" ref={suggestionsRef}>
                {isLoadingSuggestions ? (
                  <div className="sidebar-search-loading">Loading...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion._id}
                      className="sidebar-search-suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="sidebar-suggestion-thumbnail">
                        <img 
                          src={suggestion.thumbnailUrl || suggestion.thumbnail} 
                          alt={suggestion.title}
                          loading="lazy"
                        />
                      </div>
                      <div className="sidebar-suggestion-info">
                        <div className="sidebar-suggestion-title">{suggestion.title}</div>
                        <div className="sidebar-suggestion-meta">
                          {suggestion.user?.username || suggestion.user?.name}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sidebar-search-no-results">No videos found</div>
                )}
              </div>
            )}
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
        {isAuthenticated && user && isUploadAdmin && (
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

        {/* Admin Panel Section */}
        {isAuthenticated && user && isAdmin && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-title">Administration</div>
              {adminLinks.map((link) => (
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
          {uniqueCategories.map((category) => (
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
