import React from 'react';
import { ACTION_COLORS } from '../constants';

interface DataPacketProps {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    progress: number;
    color?: string;
}

export const DataPacket: React.FC<DataPacketProps> = ({
    startX,
    startY,
    endX,
    endY,
    progress,
    color,
}) => {
    if (progress < 0 || progress > 1) return null;

    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;

    // Calculate rotation angle
    const angle = Math.atan2(endY - startY, endX - startX);

    return (
        <div
            style={{
                position: 'absolute',
                left: currentX,
                top: currentY,
                transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                width: 24,
                height: 8,
                backgroundColor: color || '#00e5ff',
                borderRadius: 4,
                boxShadow: `0 0 10px ${color || '#00e5ff'}, 0 0 20px ${color || '#00e5ff'}`,
                zIndex: 15,
            }}
        />
    );
};
