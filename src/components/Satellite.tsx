import React from 'react';

import { ACTION_COLORS } from '../constants';

interface SatelliteProps {
    toolName: string;
    isActive: boolean;
    x: number;
    y: number;
}

export const Satellite: React.FC<SatelliteProps> = ({
    toolName,
    isActive,
    x,
    y,
}) => {
    // Active State Animation
    // Static size increase when active
    const scale = isActive ? 1.05 : 1.0;
    const activeColor = ACTION_COLORS.TOOL_CALL;
    const color = isActive ? activeColor : '#555';
    const glow = isActive ? `0 0 20px ${activeColor}` : 'none';

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 0,
                height: 0,
                overflow: 'visible',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
            }}
        >
            {/* Circle Icon */}
            <div
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#1a1a1a',
                    border: `3px solid ${color}`,
                    boxShadow: glow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transition: 'border-color 0.5s ease-out, box-shadow 0.5s ease-out',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            >
                {toolName.charAt(0)}
            </div>

            {/* Label */}
            <div
                style={{
                    position: 'absolute',
                    top: 40, // Below the circle (radius 30 + gap 10)
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    fontSize: 16,
                    fontFamily: 'sans-serif',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                }}
            >
                {toolName}
            </div>
        </div>
    );
};
