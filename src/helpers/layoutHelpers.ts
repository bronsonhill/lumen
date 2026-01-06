import { LayoutConfig } from '../config';

export const getStableNodeCoords = (
    nodeName: string,
    activeTools: string[],
    layout: LayoutConfig
) => {
    const { CENTER_X: centerX, CENTER_Y: centerY, RADIUS: radius } = layout;

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
