import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { ACTION_COLORS } from '../constants';
import { LogType } from '../types';

interface LogBubbleProps {
    content: string;
    type: LogType;
    x: number;
    y: number;
    startFrame?: number; // Optional, defaults to 0 (or component mount time if we used pure React state, but here we use Remotion frame)
}

export const LogBubble: React.FC<LogBubbleProps> = ({ content, type, x, y, startFrame = 0 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scale animation (pop-in)
    // We want the animation to start at startFrame.
    const animationFrame = Math.max(0, frame - startFrame);

    const scale = spring({
        frame: animationFrame,
        fps,
        config: {
            damping: 20,
            stiffness: 200,
        },
    });

    // Determine color based on type
    const color = ACTION_COLORS[type] || ACTION_COLORS.DEFAULT;

    // Split content into lines if it's too long (simple wrap approximation)
    // For now, let CSS handle wrapping with max-width

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -100%) scale(${scale})`, // Centered horizontally, positioned above the point
                maxWidth: 400,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                border: `2px solid ${color}`,
                borderRadius: 25,
                padding: '20px 30px',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: 17,
                boxShadow: `0 0 15px ${color}40`, // 40 is hex opacity
                zIndex: 50,
                pointerEvents: 'none',
            }}
        >
            <div style={{
                color: color,
                fontSize: 15,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: 4
            }}>
                {type}
            </div>
            <div style={{
                lineHeight: '1.4',
                wordWrap: 'break-word',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}>
                {content}
            </div>

            {/* Little triangle pointing down */}
            <div style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `8px solid ${color}`,
            }} />
        </div>
    );
};
