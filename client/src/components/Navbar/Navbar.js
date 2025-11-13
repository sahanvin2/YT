import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiVideo, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setSearchQuery('');
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
          <FiVideo size={32} color="#ff0000" />
          <span>Movia</span>
        </Link>
      </div>

      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">
          <FiSearch size={20} />
        </button>
      </form>

      <div className="navbar-right">
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
                  <Link
                    to={`/channel/${user.id}`}
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiUser /> Your Channel
                  </Link>
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
