import React from 'react';
import { ACTION_COLORS } from '../constants';

interface UserNodeProps {
    isActive: boolean;
    x: number;
    y: number;
}

export const UserNode: React.FC<UserNodeProps & { radius: number }> = ({ isActive, x, y, radius }) => {
    // Active State Animation
    // Static size increase when active
    const scale = isActive ? 1.1 : 1.0;
    const activeColor = ACTION_COLORS.TRIGGER;
    const color = isActive ? activeColor : '#4b5563'; // Slate 600
    const glow = isActive
        ? `0 0 25px ${activeColor}, inset 0 0 15px ${activeColor}40`
        : '0 0 5px rgba(0,0,0,0.5)';

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
                // Hexagon/Square Icon for distinction
            <div
                style={{
                    width: radius * 2,
                    height: radius * 2,
                    borderRadius: '16px', // Rounded square
                    background: `radial-gradient(circle at 30% 30%, #3e3e3e, #1a1a1a)`,
                    border: `2px solid ${color}`,
                    boxShadow: glow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 16 * (radius / 40),
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transition: 'border-color 0.5s ease-out, box-shadow 0.5s ease-out',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            >
                <div>
                    User
                </div>
            </div>
        </div>
    );
};
