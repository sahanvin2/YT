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
import Profile from './pages/Profile/Profile';
import History from './pages/Library/History';
import Liked from './pages/Library/Liked';
import Saved from './pages/Library/Saved';
import Clips from './pages/Library/Clips';
import Subscriptions from './pages/Library/Subscriptions';
import Download from './pages/Download/Download';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Listen for sidebar collapse event from Watch component
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
                    <Route path="/download/:id" element={<Download />} />
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
