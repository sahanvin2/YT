import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiVideo, FiUser, FiLogOut, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getSearchSuggestions } from '../../utils/api';
import MoviaLogo from '../Logo/MoviaLogo';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();
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
          <MoviaLogo size={28} showText={true} />
        </Link>
      </div>

      <div className="navbar-search-wrapper" ref={searchRef}>
        <form className={`navbar-search ${mobileSearchOpen ? 'open' : ''}`} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            autoComplete="off"
          />
          <button type="submit" className="search-btn">
            <FiSearch size={20} />
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
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          aria-label="Open search"
        >
          <FiSearch size={20} />
        </button>
        {isAuthenticated ? (
          <>
            <Link to="/upload" className="upload-btn btn btn-primary">
              <FiVideo size={18} />
              <span>Upload</span>
            </Link>
            <div className="user-menu-container">
              <button
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img src={user.avatar} alt={user.username} />
              </button>
              {showUserMenu && (
                <div className="user-menu">
                  {user?.id && (
                    <Link
                      to={`/channel/${user.id}`}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiUser /> Your Channel
                    </Link>
                  )}
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
    </nav>
  );
};

export default Navbar;
