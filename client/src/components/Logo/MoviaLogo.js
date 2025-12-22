import React from 'react';
import { FiX } from 'react-icons/fi';

const XclubLogo = ({ size = 24, showText = true }) => {
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
                boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)'
            }}>
                <FiX size={size * 0.625} color="#FFFFFF" style={{ strokeWidth: 3 }} />
            </div>
            {showText && (
                <span style={{
                    fontWeight: 700,
                    fontSize: `${size}px`,
                    color: '#ffffff',
                    letterSpacing: '-0.5px',
                    fontFamily: "'Space Grotesk', sans-serif"
                }}>
                    XCLUB
                </span>
            )}
        </div>
    );
};

export default XclubLogo;
