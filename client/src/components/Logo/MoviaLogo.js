import React from 'react';

const MoviaLogo = ({ size = 24, showText = true }) => {
    return (
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon" style={{
                width: `${size}px`,
                height: `${size}px`,
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
                fontWeight: 800,
                fontSize: `${size * 0.7}px`,
                color: '#FFFFFF'
            }}>
                M
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
