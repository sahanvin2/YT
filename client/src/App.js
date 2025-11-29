import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Home from './pages/Home/Home';
import Watch from './pages/Watch/Watch';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Upload from './pages/Upload/Upload';
import Channel from './pages/Channel/Channel';
import Profile from './pages/Profile/Profile';
import History from './pages/Library/History';
import Liked from './pages/Library/Liked';
import Subscriptions from './pages/Library/Subscriptions';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
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
                <Route path="/search" element={<Home mode="search" />} />
                <Route path="/history" element={<History />} />
                <Route path="/liked" element={<Liked />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
