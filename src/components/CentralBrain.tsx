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
    const glowRadius = isWaiting ? '15px' : '40px';
    const glow = isActive
        ? `0 0 ${glowRadius} ${baseColor}, inset 0 0 20px ${baseColor}40`
        : '0 0 10px rgba(0,0,0,0.5)';

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
                background: `radial-gradient(circle at 30% 30%, #3e3e3e, #1a1a1a)`,
                border: `2px solid ${baseColor}`,
                boxShadow: glow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                transition: 'border-color 0.5s ease-out, box-shadow 0.5s ease-out',
            }}
        >
            <div style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 18 * (radius / 75),
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textAlign: 'center'
            }}>
                LEAD<br />AGENT
            </div>
        </div>
    );
};
