import { interpolate } from 'remotion';
import { getTransitDuration } from '../config';
import { BUBBLE_OFFSETS } from '../constants';
import { LogEntry, SatellitePosition } from '../types';

interface UseLogBubblePositionProps {
    activeSegment: any; // Using any for BubbleSegment as it might be complex or defined locally
    brainX: number;
    brainY: number;
    layout: any;
    finalSatellitePositions: SatellitePosition[];
    packetStartX: number;
    packetStartY: number;
    packetEndX: number;
    packetEndY: number;
    packetProgress: number;
    isToolCall: boolean;
    isToolResult: boolean;
    isTrigger: boolean;
    isResponse: boolean;
    hasArrived: boolean;
    currentLog: LogEntry | null;
    framesSinceLogStart: number;
    framesSinceArrival: number;
    fps: number;
    width: number;
}

export const useLogBubblePosition = ({
    activeSegment,
    brainX,
    brainY,
    layout,
    finalSatellitePositions,
    packetStartX,
    packetStartY,
    packetEndX,
    packetEndY,
    packetProgress,
    isToolCall,
    isToolResult,
    isTrigger,
    isResponse,
    hasArrived,
    currentLog,
    framesSinceLogStart,
    framesSinceArrival,
    fps,
    width
}: UseLogBubblePositionProps) => {

    const getNodeAnchor = (nodeName: string) => {
        if (nodeName === 'BRAIN') return { x: brainX, y: brainY - (BUBBLE_OFFSETS.BRAIN * layout.SCALE_FACTOR) };
        if (nodeName === 'USER') return { x: layout.USER_NODE_X, y: layout.USER_NODE_Y - (BUBBLE_OFFSETS.USER * layout.SCALE_FACTOR) };
        const sat = finalSatellitePositions.find(s => `SAT-${s.tool}` === nodeName);
        return { x: sat?.x || brainX, y: (sat?.y || brainY) - (BUBBLE_OFFSETS.SATELLITE * layout.SCALE_FACTOR) };
    };

    const calculatePosition = () => {
        if (!activeSegment) return { x: 0, y: 0 };

        const packetX = packetStartX + (packetEndX - packetStartX) * packetProgress;
        const packetY = (packetStartY + (packetEndY - packetStartY) * packetProgress) - (BUBBLE_OFFSETS.SATELLITE * layout.SCALE_FACTOR);

        const targetNodeAnchor = getNodeAnchor(activeSegment.node);

        // Default Position (Anchored)
        let newX = targetNodeAnchor.x;
        let newY = targetNodeAnchor.y;


        // DEPARTURE PHASE (Moving from Source Node to Packet)
        if ((isToolCall || isToolResult || isTrigger || isResponse) && !hasArrived) {
            // Determine Source Node for Departure
            let sourceNodeName = 'BRAIN';
            if (isToolResult) sourceNodeName = `SAT-${currentLog?.tool}`;
            else if (isTrigger) sourceNodeName = 'USER';
            else if (isResponse) sourceNodeName = 'BRAIN';

            const sourceAnchor = getNodeAnchor(sourceNodeName === 'BRAIN' ? 'BRAIN' : sourceNodeName);

            // Calculate distance from Source Anchor to Packet Start Position (approximate travel distance for the "catch up")
            // Packet Start Anchor:
            const packetStartAnchorX = packetStartX;
            const packetStartAnchorY = packetStartY - (BUBBLE_OFFSETS.SATELLITE * layout.SCALE_FACTOR);

            const dist = Math.sqrt(Math.pow(packetStartAnchorX - sourceAnchor.x, 2) + Math.pow(packetStartAnchorY - sourceAnchor.y, 2));
            const duration = getTransitDuration(dist, fps, width);

            const progress = interpolate(framesSinceLogStart, [0, duration], [0, 1], { extrapolateRight: 'clamp' });

            // Interpolate X and Y
            newX = sourceAnchor.x + (packetX - sourceAnchor.x) * progress;
            newY = sourceAnchor.y + (packetY - sourceAnchor.y) * progress;

            return { x: newX, y: newY };
        }

        // ARRIVAL PHASE (Moving from Packet to Dest Node)
        if ((isToolCall || isToolResult || isTrigger || isResponse) && hasArrived) {
            // Packet End Anchor
            const packetEndAnchorX = packetEndX;
            const packetEndAnchorY = packetEndY - (BUBBLE_OFFSETS.SATELLITE * layout.SCALE_FACTOR);

            const dist = Math.sqrt(Math.pow(targetNodeAnchor.x - packetEndAnchorX, 2) + Math.pow(targetNodeAnchor.y - packetEndAnchorY, 2));
            const duration = getTransitDuration(dist, fps, width);

            const progress = interpolate(framesSinceArrival, [0, duration], [0, 1], { extrapolateRight: 'clamp' });

            newX = packetEndX + (targetNodeAnchor.x - packetEndX) * progress;
            newY = packetEndAnchorY + (targetNodeAnchor.y - packetEndAnchorY) * progress;

            return { x: newX, y: newY };
        }

        return { x: newX, y: newY };
    };

    return calculatePosition();
};
