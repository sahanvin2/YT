import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Force dark mode only - no theme switching
  const [theme] = useState('dark');

  useEffect(() => {
    // Always apply dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    
    // Update favicon
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = '/favicon.svg';
    }
  }, []);

  // No toggle function - dark mode only
  const toggleTheme = () => {
    // Disabled - dark mode only
  };

  const value = {
    theme: 'dark',
    toggleTheme,
    isDark: true,
    isLight: false
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

