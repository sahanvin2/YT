import React, { useState, useEffect } from 'react';
import './Maintenance.css';

const Maintenance = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="maintenance-page">
      {/* Animated Background */}
      <div className="maintenance-bg">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-gradient-3"></div>
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`shape shape-${i + 1}`}></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="maintenance-content">
        {/* Animated Logo */}
        <div className="maintenance-logo-container">
          <div className="logo-glow"></div>
          <div className="logo-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
          <div className="logo-core">
            <svg viewBox="0 0 60 60" fill="none" className="m-logo-svg">
              <defs>
                <linearGradient id="maintenanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B35">
                    <animate attributeName="stop-color" values="#FF6B35;#8B5CF6;#06B6D4;#FF6B35" dur="4s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="50%" stopColor="#8B5CF6">
                    <animate attributeName="stop-color" values="#8B5CF6;#06B6D4;#FF6B35;#8B5CF6" dur="4s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="100%" stopColor="#06B6D4">
                    <animate attributeName="stop-color" values="#06B6D4;#FF6B35;#8B5CF6;#06B6D4" dur="4s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>
              </defs>
              <path
                d="M12 48V18L22 34L30 22L38 34L48 18V48"
                stroke="url(#maintenanceGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="m-path-animated"
              />
            </svg>
          </div>
          <div className="orbiting-particles">
            <div className="orbit-particle p1"></div>
            <div className="orbit-particle p2"></div>
            <div className="orbit-particle p3"></div>
            <div className="orbit-particle p4"></div>
          </div>
        </div>

        {/* Brand Name */}
        <div className="brand-name">
          <span className="letter" style={{ animationDelay: '0s' }}>M</span>
          <span className="letter" style={{ animationDelay: '0.1s' }}>O</span>
          <span className="letter" style={{ animationDelay: '0.2s' }}>V</span>
          <span className="letter" style={{ animationDelay: '0.3s' }}>I</span>
          <span className="letter" style={{ animationDelay: '0.4s' }}>A</span>
        </div>

        {/* Maintenance Message */}
        <div className="maintenance-message">
          <h1 className="maintenance-title">
            <span className="title-icon">🔧</span>
            Under Maintenance
          </h1>
          <p className="maintenance-description">
            We're upgrading our systems to bring you an even better streaming experience.
            Please check back soon!
          </p>
        </div>

        {/* Status Indicator */}
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-text">Working on improvements{dots}</span>
        </div>

        {/* Progress Animation */}
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill"></div>
            <div className="progress-shine"></div>
          </div>
          <span className="progress-text">Optimizing your experience</span>
        </div>

        {/* Expected Features */}
        <div className="features-preview">
          <h3>Coming Soon</h3>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Faster streaming</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>New features</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎬</span>
              <span>Better quality</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="contact-section">
          <p>Questions? Contact us at</p>
          <a href="mailto:support@movia.club" className="contact-email">
            support@movia.club
          </a>
        </div>
      </div>

      {/* Animated Waves */}
      <div className="waves-container">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>
    </div>
  );
};

export default Maintenance;

