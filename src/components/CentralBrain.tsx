import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { LogType } from '../types';
import { ACTION_COLORS } from '../constants';

interface CentralBrainProps {
    currentType: LogType;
    isActive: boolean;
}

export const CentralBrain: React.FC<CentralBrainProps & { radius: number }> = ({ currentType, isActive, radius }) => {
    const frame = useCurrentFrame();

    const isWaiting = currentType === 'TOOL_CALL' || currentType === 'TRIGGER';
    const baseColor = isWaiting ? ACTION_COLORS.DEFAULT : (ACTION_COLORS[currentType] || ACTION_COLORS.DEFAULT);



    // Pulse animation using sine wave
    const pulse = Math.sin(frame * 0.05) * 0.02 + 1; // 0.9 to 1.1 scale
    const scale = isActive ? pulse : 1;

    // Dim glow if waiting (Grey) to avoid "active" look
    const glowRadius = isWaiting ? '15px' : '50px';
    const glow = isActive ? `0 0 ${glowRadius} ${baseColor}` : 'none';

    return (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${scale})`,
                width: radius * 2,
                height: radius * 2,
                borderRadius: '50%',
                backgroundColor: '#222',
                border: `5px solid ${baseColor}`,
                boxShadow: glow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                transition: 'border-color 0.5s ease-out, box-shadow 0.5s ease-out',
            }}
        >
            <div style={{ color: 'white', fontSize: 18 * (radius / 75), fontFamily: 'monospace', textAlign: 'center' }}>
                LEAD<br />AGENT
            </div>
        </div>
    );
};
