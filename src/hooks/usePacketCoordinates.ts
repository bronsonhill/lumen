import { LogEntry, SatellitePosition } from '../types';

interface UsePacketCoordinatesProps {
    currentLog: LogEntry | null;
    finalSatellitePositions: SatellitePosition[];
    brainX: number;
    brainY: number;
    layout: any;
    isToolCall: boolean;
    isToolResult: boolean;
    isTrigger: boolean;
    isResponse: boolean;
}

export const usePacketCoordinates = ({
    currentLog,
    finalSatellitePositions,
    brainX,
    brainY,
    layout,
    isToolCall,
    isToolResult,
    isTrigger,
    isResponse,
}: UsePacketCoordinatesProps) => {

    const activeSatellite = currentLog ? finalSatellitePositions.find(s => s.tool === currentLog?.tool) : undefined;

    let packetStartX = 0;
    let packetStartY = 0;
    let packetEndX = 0;
    let packetEndY = 0;

    if (activeSatellite) {
        const dx = activeSatellite.x - brainX;
        const dy = activeSatellite.y - brainY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const brainEdgeX = brainX + unitX * layout.BRAIN_RADIUS;
        const brainEdgeY = brainY + unitY * layout.BRAIN_RADIUS;
        const satEdgeX = activeSatellite.x - unitX * layout.SATELLITE_RADIUS;
        const satEdgeY = activeSatellite.y - unitY * layout.SATELLITE_RADIUS;

        if (isToolCall) {
            packetStartX = brainEdgeX;
            packetStartY = brainEdgeY;
            packetEndX = satEdgeX;
            packetEndY = satEdgeY;
        } else if (isToolResult) {
            packetStartX = satEdgeX;
            packetStartY = satEdgeY;
            packetEndX = brainEdgeX;
            packetEndY = brainEdgeY;
        }
    } else if (isTrigger) {
        // User -> Brain
        const dx = brainX - layout.USER_NODE_X;
        const dy = brainY - layout.USER_NODE_Y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const userEdgeX = layout.USER_NODE_X + unitX * layout.USER_RADIUS;
        const userEdgeY = layout.USER_NODE_Y + unitY * layout.USER_RADIUS;
        const brainEdgeX = brainX - unitX * layout.BRAIN_RADIUS;
        const brainEdgeY = brainY - unitY * layout.BRAIN_RADIUS;

        packetStartX = userEdgeX;
        packetStartY = userEdgeY;
        packetEndX = brainEdgeX;
        packetEndY = brainEdgeY;
    } else if (isResponse) {
        // Brain -> User
        const dx = layout.USER_NODE_X - brainX;
        const dy = layout.USER_NODE_Y - brainY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const brainEdgeX = brainX + unitX * layout.BRAIN_RADIUS;
        const brainEdgeY = brainY + unitY * layout.BRAIN_RADIUS;
        const userEdgeX = layout.USER_NODE_X - unitX * layout.USER_RADIUS;
        const userEdgeY = layout.USER_NODE_Y - unitY * layout.USER_RADIUS;

        packetStartX = brainEdgeX;
        packetStartY = brainEdgeY;
        packetEndX = userEdgeX;
        packetEndY = userEdgeY;
    }

    return {
        packetStartX,
        packetStartY,
        packetEndX,
        packetEndY,
        activeSatellite
    };
};
