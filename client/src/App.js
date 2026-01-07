import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdProvider } from './context/AdContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import LoadingAnimation from './components/LoadingAnimation/LoadingAnimation';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import './App.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home/Home'));
const Watch = lazy(() => import('./pages/Watch/Watch'));
const AuthCallback = lazy(() => import('./pages/AuthCallback/AuthCallback'));
const Upload = lazy(() => import('./pages/Upload/Upload'));
const UploadHLS = lazy(() => import('./pages/UploadHLS/UploadHLS'));
const CategoryPage = lazy(() => import('./pages/Category/CategoryPage'));
const Channel = lazy(() => import('./pages/Channel/Channel'));
const VideoManager = lazy(() => import('./pages/VideoManager/VideoManager'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const ProfileEdit = lazy(() => import('./pages/Profile/ProfileEdit'));
const History = lazy(() => import('./pages/Library/History'));
const Liked = lazy(() => import('./pages/Library/Liked'));
const Saved = lazy(() => import('./pages/Library/Saved'));
const Clips = lazy(() => import('./pages/Library/Clips'));
const Subscriptions = lazy(() => import('./pages/Library/Subscriptions'));
const AdminPanel = lazy(() => import('./pages/AdminPanel/AdminPanel'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const Maintenance = lazy(() => import('./pages/Maintenance/Maintenance'));

// Loading component for Suspense
const PageLoader = () => <LoadingAnimation message="Loading amazing content" />;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load popunder ad once when app starts
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://pl28286630.effectivegatecpm.com/d1/48/b5/d148b54051a7b565d24645ac34f56899.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
        <SocketProvider>
          <AdProvider>
            <Router>
              <div className="app">
                <div className="hero-mesh"></div>
                <Navbar toggleSidebar={toggleSidebar} />
                <div className="app-content">
                  <Sidebar isOpen={sidebarOpen} />
                  <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                  <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/watch/:id" element={<Watch />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/upload-hls" element={<UploadHLS />} />
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
                    <Route path="/profile/edit" element={<ProfileEdit />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                  </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          </Router>
        </AdProvider>
      </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
