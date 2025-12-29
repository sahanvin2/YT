import React from 'react';
import './TuskiLogo.css';

const TuskiLogo = ({ size = 32, showText = true }) => {
  return (
    <div className="tuski-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="tuski-logo-svg"
      >
        {/* Tusk shape - stylized elephant tusk */}
        <path
          d="M20 30 Q30 20, 40 25 Q50 30, 55 40 Q60 50, 65 60 Q70 70, 75 80 Q80 85, 85 80 Q90 75, 85 70 Q80 65, 75 60 Q70 55, 65 50 Q60 45, 55 40 Q50 35, 45 30 Q40 25, 35 25 Q30 25, 25 30 Q20 35, 20 30 Z"
          fill="url(#tuskiGradient)"
          stroke="#9b59b6"
          strokeWidth="2"
        />
        {/* Inner highlight */}
        <path
          d="M30 35 Q40 30, 50 35 Q55 40, 60 50 Q65 60, 70 70 Q75 75, 80 70 Q75 65, 70 60 Q65 55, 60 50 Q55 45, 50 40 Q45 35, 40 35 Q35 35, 30 35 Z"
          fill="rgba(255, 255, 255, 0.2)"
        />
        <defs>
          <linearGradient id="tuskiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9b59b6" />
            <stop offset="50%" stopColor="#8e44ad" />
            <stop offset="100%" stopColor="#7d3c98" />
          </linearGradient>
        </defs>
      </svg>
      {showText && <span className="tuski-logo-text">Tuski</span>}
    </div>
  );
};

export default TuskiLogo;






















