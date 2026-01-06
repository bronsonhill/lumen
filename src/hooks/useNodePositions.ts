import { useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { getConfig } from '../config';
import { LogEntry } from '../types';

export const useNodePositions = (frame: number, tools: string[], currentLog: LogEntry | null) => {
    const { width, height, fps } = useVideoConfig();
    const config = getConfig(width, height, fps);
    const layout = config.LAYOUT;

    const centerX = layout.CENTER_X;
    const centerY = layout.CENTER_Y;
    const radius = layout.RADIUS;



    // Apply noise to Brain Position
    const brainNoiseX = noise2D('brain-x', frame * 0.003, 0) * 30; // 30 could also be scaled? Let's leave for now.
    const brainNoiseY = noise2D('brain-y', frame * 0.003, 0) * 30;
    const brainX = centerX + brainNoiseX;
    const brainY = centerY + brainNoiseY;

    // Pre-calculate satellite positions with noise
    const satellitePositions = tools.map((tool, index) => {
        const angle = (2 * Math.PI * index) / tools.length;
        const noiseX = noise2D(tool + 'x', frame * 0.002, 0) * 20;
        const noiseY = noise2D(tool + 'y', frame * 0.002, 0) * 20;

        return {
            tool,
            x: centerX + radius * Math.cos(angle) + noiseX,
            y: centerY + radius * Math.sin(angle) + noiseY,
            isActive: currentLog ? ((currentLog.type === 'TOOL_CALL' || currentLog.type === 'TOOL_RESULT') && currentLog.tool === tool) : false
        };
    });

    return {
        centerX,
        centerY,
        brainX,
        brainY,
        satellitePositions
    };
};
