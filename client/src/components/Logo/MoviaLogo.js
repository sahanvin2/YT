import React from 'react';
import { FiPlay } from 'react-icons/fi';

const MoviaLogo = ({ size = 24, showText = true }) => {
    return (
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon" style={{
                width: `${size}px`,
                height: `${size}px`,
                background: '#CCFF00',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(204, 255, 0, 0.15)'
            }}>
                <FiPlay size={size * 0.625} color="#050308" style={{ marginLeft: '2px' }} fill="#050308" />
            </div>
            {showText && (
                <span style={{
                    fontWeight: 700,
                    fontSize: `${size}px`,
                    color: '#ffffff',
                    letterSpacing: '-0.5px',
                    fontFamily: "'Space Grotesk', sans-serif"
                }}>
                    MOVIA
                </span>
            )}
        </div>
    );
};

export default MoviaLogo;
