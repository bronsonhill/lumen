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

    // Helper to get coordinates for a node (Stable)
    const getStableNodeCoords = (nodeName: string, activeTools: string[]) => {
        if (nodeName === 'BRAIN') return { x: centerX, y: centerY };
        if (nodeName === 'USER') return { x: layout.USER_NODE_X, y: layout.USER_NODE_Y };
        if (nodeName.startsWith('SAT-')) {
            const toolName = nodeName.replace('SAT-', '');
            const index = activeTools.indexOf(toolName);
            if (index === -1) return { x: centerX, y: centerY };
            const angle = (2 * Math.PI * index) / activeTools.length;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        }
        return { x: centerX, y: centerY };
    };

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
        satellitePositions,
        getStableNodeCoords
    };
};
