import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ message = 'Loading amazing content...' }) => {
  return (
    <div className="cosmic-loader">
      <div className="cosmic-loader-content">
        {/* Animated Logo/Icon */}
        <div className="loader-logo-container">
          <div className="loader-logo">
            <div className="logo-ring ring-1"></div>
            <div className="logo-ring ring-2"></div>
            <div className="logo-ring ring-3"></div>
            <div className="logo-core">
              {/* Animated M Logo */}
              <div className="m-logo-wrapper">
                <svg viewBox="0 0 40 40" fill="none" className="m-logo-svg">
                  <defs>
                    <linearGradient id="mGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF6B35">
                        <animate attributeName="stop-color" values="#FF6B35;#8B5CF6;#06B6D4;#FF6B35" dur="3s" repeatCount="indefinite"/>
                      </stop>
                      <stop offset="100%" stopColor="#8B5CF6">
                        <animate attributeName="stop-color" values="#8B5CF6;#06B6D4;#FF6B35;#8B5CF6" dur="3s" repeatCount="indefinite"/>
                      </stop>
                    </linearGradient>
                  </defs>
                  {/* M Letter with animation */}
                  <path
                    d="M8 32V12L15 24L20 16L25 24L32 12V32"
                    stroke="url(#mGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="m-path"
                  />
                </svg>
                <div className="m-glow"></div>
              </div>
            </div>
          </div>
          {/* Orbiting dots */}
          <div className="orbit-container">
            <div className="orbit-dot orbit-1"></div>
            <div className="orbit-dot orbit-2"></div>
            <div className="orbit-dot orbit-3"></div>
          </div>
        </div>

        {/* Animated Particles */}
        <div className="loader-particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>

        {/* Brand Name Animation */}
        <div className="brand-name-container">
          <span className="brand-letter" style={{ animationDelay: '0s' }}>M</span>
          <span className="brand-letter" style={{ animationDelay: '0.1s' }}>O</span>
          <span className="brand-letter" style={{ animationDelay: '0.2s' }}>V</span>
          <span className="brand-letter" style={{ animationDelay: '0.3s' }}>I</span>
          <span className="brand-letter" style={{ animationDelay: '0.4s' }}>A</span>
        </div>

        {/* Progress Bar */}
        <div className="loader-progress-container">
          <div className="loader-progress-bar">
            <div className="loader-progress-fill"></div>
            <div className="loader-progress-glow"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="loader-text">
          <span className="loader-message">{message}</span>
          <div className="loader-dots">
            <span className="dot dot-1">.</span>
            <span className="dot dot-2">.</span>
            <span className="dot dot-3">.</span>
          </div>
        </div>

        {/* Animated Waves */}
        <div className="loader-waves">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
        </div>
      </div>

      {/* Background Gradient Animation */}
      <div className="loader-bg-gradient"></div>
    </div>
  );
};

export default LoadingAnimation;
