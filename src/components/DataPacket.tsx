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

export const DataPacket: React.FC<DataPacketProps & { width: number, height: number }> = ({
    startX,
    startY,
    endX,
    endY,
    progress,
    color,
    width,
    height,
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
                width: width,
                height: height,
                backgroundColor: color || '#00e5ff',
                borderRadius: height / 2,
                boxShadow: `0 0 10px ${color || '#00e5ff'}, 0 0 20px ${color || '#00e5ff'}`,
                zIndex: 15,
            }}
        />
    );
};
