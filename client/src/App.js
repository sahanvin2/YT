import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdProvider } from './context/AdContext';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Home from './pages/Home/Home';
import Watch from './pages/Watch/Watch';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Upload from './pages/Upload/Upload';
import CategoryPage from './pages/Category/CategoryPage';
import Channel from './pages/Channel/Channel';
import VideoManager from './pages/VideoManager/VideoManager';
import Profile from './pages/Profile/Profile';
import History from './pages/Library/History';
import Liked from './pages/Library/Liked';
import Saved from './pages/Library/Saved';
import Clips from './pages/Library/Clips';
import Subscriptions from './pages/Library/Subscriptions';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Detect mobile device and auto-minimize sidebar
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-minimize sidebar on mobile when clicking anywhere in main content
  useEffect(() => {
    const handleMobileClick = (e) => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && sidebarOpen) {
        // Don't close if clicking on sidebar or navbar
        const target = e.target;
        const isSidebarClick = target.closest('.sidebar');
        const isNavbarClick = target.closest('.navbar');
        const isModalClick = target.closest('.modal') || target.closest('[role="dialog"]');
        
        if (!isSidebarClick && !isNavbarClick && !isModalClick) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleMobileClick);
    return () => document.removeEventListener('click', handleMobileClick);
  }, [sidebarOpen]);

  // Listen for sidebar collapse event from Watch component, Upload page, and Sidebar links
  useEffect(() => {
    const handleCollapseSidebar = () => {
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('collapseSidebar', handleCollapseSidebar);
    return () => {
      window.removeEventListener('collapseSidebar', handleCollapseSidebar);
    };
  }, [sidebarOpen]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AdProvider>
          <Router>
            <div className="app">
              <div className="hero-mesh"></div>
              <Navbar toggleSidebar={toggleSidebar} />
              <div className="app-content">
                <Sidebar isOpen={sidebarOpen} />
                <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/watch/:id" element={<Watch />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/video-manager" element={<VideoManager />} />
                    <Route path="/channel/:id" element={<Channel />} />
                    <Route path="/trending" element={<Home mode="trending" />} />
                    <Route path="/category/:category" element={<Home mode="category" />} />
                    <Route path="/categories" element={<CategoryPage />} />
                    <Route path="/search" element={<Home mode="search" />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/liked" element={<Liked />} />
                    <Route path="/saved" element={<Saved />} />
                    <Route path="/clips" element={<Clips />} />
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </main>
              </div>
            </div>
          </Router>
        </AdProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
