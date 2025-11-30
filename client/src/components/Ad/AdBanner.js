import React from 'react';
import './AdBanner.css';

const AdBanner = ({ location }) => {
    return (
        <div className={`ad-banner ad-${location}`}>
            <div className="ad-content">
                <span className="ad-label">Advertisement</span>
                <h3>Space for your Ad</h3>
                <p>Contact us to place your ad here.</p>
            </div>
        </div>
    );
};

export default AdBanner;
