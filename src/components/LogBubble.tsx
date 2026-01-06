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
    textStartFrame?: number; // Optional, defaults to startFrame if not provided
}

export const LogBubble: React.FC<LogBubbleProps & { scale?: number }> = ({ content, type, x, y, startFrame = 0, textStartFrame, scale: globalScale = 1 }) => {
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

    // Typewriter Effect Logic
    const actualTextStart = textStartFrame ?? startFrame;
    const textFrame = Math.max(0, frame - actualTextStart);

    let visibleLimit = content.length;

    // Only apply typewriter effect to specific types
    if (type === 'REASONING' || type === 'TOOL_CALL' || type === 'TRIGGER') {
        const charsPerFrame = 1; // Adjust speed here
        const numChars = Math.floor(textFrame * charsPerFrame);
        visibleLimit = Math.min(numChars, content.length);
    }

    // Split content into lines if it's too long (simple wrap approximation)
    // For now, let CSS handle wrapping with max-width

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -100%) scale(${scale})`, // Centered horizontally, positioned above the point
                maxWidth: 400 * globalScale,
                background: 'rgba(20, 20, 20, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `${1 * globalScale}px solid ${color}80`, // Slight transparency on border
                borderRadius: 16 * globalScale,
                padding: `${16 * globalScale}px ${24 * globalScale}px`,
                color: '#e2e8f0', // Slate 200
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontSize: 15 * globalScale,
                lineHeight: 1.5,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${color}40`,
                zIndex: 50,
                pointerEvents: 'none',
            }}
        >
            <div style={{
                color: color,
                fontSize: 12 * globalScale,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 6 * globalScale,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`
                }} />
                {type}
            </div>
            <div style={{
                lineHeight: '1.4',
                wordWrap: 'break-word',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}>
                <span>{content.slice(0, visibleLimit)}</span>
                <span style={{ opacity: 0 }}>{content.slice(visibleLimit)}</span>
            </div>

            {/* Little triangle pointing down */}
            <div style={{
                position: 'absolute',
                bottom: -8 * globalScale,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: `${8 * globalScale}px solid transparent`,
                borderRight: `${8 * globalScale}px solid transparent`,
                borderTop: `${8 * globalScale}px solid ${color}`,
            }} />
        </div>
    );
};
