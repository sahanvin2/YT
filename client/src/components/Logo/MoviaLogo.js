import React from 'react';
import { FiVideo } from 'react-icons/fi';

const MoviaLogo = ({ size = 24, showText = true }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiVideo size={size} color="#FF0000" />
            {showText && (
                <span style={{
                    fontWeight: 'bold',
                    fontSize: `${size}px`,
                    color: '#ffffff',
                    letterSpacing: '-0.5px'
                }}>
                    Movia
                </span>
            )}
        </div>
    );
};

export default MoviaLogo;
