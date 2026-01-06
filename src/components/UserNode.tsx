import React from 'react';
import { ACTION_COLORS } from '../constants';

interface UserNodeProps {
    isActive: boolean;
    x: number;
    y: number;
}

export const UserNode: React.FC<UserNodeProps> = ({ isActive, x, y }) => {
    // Active State Animation
    // Static size increase when active
    const scale = isActive ? 1.1 : 1.0;
    const activeColor = ACTION_COLORS.TRIGGER;
    const color = isActive ? activeColor : '#888';
    const glow = isActive ? `0 0 25px ${activeColor}` : 'none';

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
            {/* Hexagon/Square Icon for distinction */}
            <div
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: '15%', // Rounded square for Mission Control
                    backgroundColor: '#1a1a1a',
                    border: `3px solid ${color}`,
                    boxShadow: glow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
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
