import React from 'react';
import './MiniLoader.css';

const MiniLoader = ({ size = 'medium', message = '' }) => {
  return (
    <div className={`mini-loader mini-loader-${size}`}>
      <div className="mini-loader-spinner">
        <div className="spinner-ring ring-1"></div>
        <div className="spinner-ring ring-2"></div>
        <div className="spinner-ring ring-3"></div>
        <div className="spinner-core"></div>
      </div>
      {message && <p className="mini-loader-text">{message}</p>}
    </div>
  );
};

export default MiniLoader;

