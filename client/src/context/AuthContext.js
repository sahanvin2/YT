import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const raw = res.data.data;
      if (raw) {
        const normalized = { ...raw, id: raw.id || raw._id };
        setUser(normalized);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser({ ...res.data.user, id: res.data.user.id || res.data.user._id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const login = async (credentials) => {
    // If credentials is a string, treat it as a token (for OAuth)
    if (typeof credentials === 'string') {
      return loginWithToken(credentials);
    }
    
    try {
      const res = await api.post('/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser({ ...res.data.user, id: res.data.user.id || res.data.user._id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        needsVerification: error.response?.data?.needsVerification || false
      };
    }
  };
  
  // Login with OAuth token
  const loginWithToken = async (oauthToken) => {
    try {
      localStorage.setItem('token', oauthToken);
      setToken(oauthToken);
      
      // Load user data with the new token
      const res = await api.get('/auth/me');
      const raw = res.data.data;
      if (raw) {
        const normalized = { ...raw, id: raw.id || raw._id };
        setUser(normalized);
        return { success: true };
      }
      
      return { success: false, message: 'Failed to load user data' };
    } catch (error) {
      console.error('OAuth login error:', error);
      localStorage.removeItem('token');
      setToken(null);
      return {
        success: false,
        message: error.response?.data?.message || 'OAuth login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    register,
    login,
    loginWithToken,
    logout,
    isAuthenticated: !!user,
    isUploadAdmin: user?.isUploadAdmin || false,
    isAdmin: user?.role === 'admin',
    refreshUser: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
