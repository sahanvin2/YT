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
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Animated Particles */}
        <div className="loader-particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
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

