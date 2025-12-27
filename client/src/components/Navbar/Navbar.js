import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiVideo, FiUser, FiLogOut, FiX, FiSun, FiMoon, FiPlus, FiBell, FiMic } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getSearchSuggestions } from '../../utils/api';
import XclubLogo from '../Logo/MoviaLogo';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import NotificationBell from '../NotificationBell/NotificationBell';
import axios from 'axios';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const { user, isAuthenticated, logout, isUploadAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Debounce function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

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

  // Fetch unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_URL || '';
      const response = await axios.get(
        `${apiBase}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

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
      navigate(`/search?q=${searchQuery.trim()}`);
      setSearchQuery('');
      setShowSuggestions(false);
      // Close mobile search on mobile devices
      if (window.innerWidth <= 480) {
        setMobileSearchOpen(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/search?q=${suggestion.title}`);
    setSearchQuery('');
    setShowSuggestions(false);
    // Close mobile search on mobile devices
    if (window.innerWidth <= 480) {
      setMobileSearchOpen(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <FiMenu size={24} />
        </button>
        <Link to="/" className="logo">
          <XclubLogo size={28} showText={true} />
        </Link>
      </div>

      <div className="navbar-search-wrapper" ref={searchRef}>
        <form className={`navbar-search ${mobileSearchOpen ? 'open' : ''}`} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search creators, vibes, or hashtags..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            autoComplete="off"
          />
          <button type="button" className="search-mic-btn" title="Voice search">
            <FiMic size={16} />
          </button>
          <button type="submit" className="search-btn">
            <FiSearch size={16} />
          </button>
          <button
            type="button"
            className="search-close"
            onClick={() => {
              setMobileSearchOpen(false);
              setShowSuggestions(false);
            }}
            aria-label="Close search"
          >
            <FiX size={18} />
          </button>
        </form>

        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
          <div className="search-suggestions" ref={suggestionsRef}>
            {isLoadingSuggestions ? (
              <div className="suggestion-item loading">Loading suggestions...</div>
            ) : (
              suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id || index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <FiSearch size={16} className="suggestion-icon" />
                  <span className="suggestion-text">{suggestion.title}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {isAuthenticated && isUploadAdmin && (
          <Link to="/upload" className="create-btn">
            <FiPlus size={16} />
            <span>Create</span>
          </Link>
        )}
        {isAuthenticated && (
          <NotificationBell />
        )}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
        <button
          className="search-toggle"
          onClick={() => {
            setMobileSearchOpen(!mobileSearchOpen);
            if (!mobileSearchOpen) {
              // Focus search input when opening on mobile
              setTimeout(() => {
                const input = document.querySelector('.navbar-search input');
                if (input) input.focus();
              }, 100);
            }
          }}
          aria-label="Open search"
        >
          <FiSearch size={20} />
        </button>
        {isAuthenticated ? (
          <>
            <div className="user-menu-container">
              <button
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img 
                  src={user.avatar} 
                  alt={user.username}
                  loading="lazy"
                  decoding="async"
                />
              </button>
              {showUserMenu && (
                <div className="user-menu">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiUser /> Profile Settings
                  </Link>
                  <button onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="btn btn-outline">
            <FiUser size={18} />
            Sign In
          </Link>
        )}
      </div>

      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
      />
    </nav>
  );
};

export default Navbar;
