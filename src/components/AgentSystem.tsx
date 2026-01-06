import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { LogEntry } from '../types';
import logsData from '../logs.json';
import { CentralBrain } from './CentralBrain';
import { Satellite } from './Satellite';
import { LogBubble } from './LogBubble';
import { DataPacket } from './DataPacket';
import { UserNode } from './UserNode';
import { ACTION_COLORS } from '../constants';
import { getConfig, getTransitDuration } from '../config';
import { useBubbleSegments } from '../hooks/useBubbleSegments';
import { useNodePositions } from '../hooks/useNodePositions';
import { useAgentAnimation } from '../hooks/useAgentAnimation';

const logs = logsData as LogEntry[];

export const AgentSystem: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();

    // Get Dynamic Configuration
    const config = getConfig(width, height, fps);
    const { START_DELAY_FRAMES, FRAMES_PER_LOG } = config.TIMING;
    const layout = config.LAYOUT;

    // Effective frame for log logic (starts after delay)
    // If negative, we are in the intro/idle phase
    const effectiveFrame = frame - START_DELAY_FRAMES;

    // Identify all unique tools from logs
    const tools = useMemo(() =>
        Array.from(new Set(logs.map(l => l.tool).filter(Boolean) as string[])),
        []
    );

    // 1. Calculate Agent Positions
    // We pass null for currentLog initially to get base positions
    const {
        brainX,
        brainY,
        satellitePositions,
        getStableNodeCoords
    } = useNodePositions(frame, tools, null);

    // 1. Get Segments (Static based on Logs and Tools)
    const bubbleSegments = useBubbleSegments(logs, tools, getStableNodeCoords);

    // 2. Determine Logic for Active States and Packet Coordinates
    const {
        currentLog,
        activeSegment,
        packetProgress,
        hasArrived,
        framesSinceArrival,
        framesSinceLogStart,
        isToolCall,
        isToolResult,
        isTrigger,
        isResponse
    } = useAgentAnimation(effectiveFrame, logs, bubbleSegments);

    // 3. Re-calculate Positions with Active State (Correct Way)
    const {
        brainX: finalBrainX,
        brainY: finalBrainY,
        satellitePositions: finalSatellitePositions
    } = useNodePositions(frame, tools, currentLog);

    // 4. Calculate Packet Coordinates
    const activeSatellite = currentLog ? finalSatellitePositions.find(s => s.tool === currentLog?.tool) : undefined;
    let packetStartX = 0;
    let packetStartY = 0;
    let packetEndX = 0;
    let packetEndY = 0;

    if (activeSatellite) {
        const dx = activeSatellite.x - finalBrainX;
        const dy = activeSatellite.y - finalBrainY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const brainEdgeX = finalBrainX + unitX * layout.BRAIN_RADIUS;
        const brainEdgeY = finalBrainY + unitY * layout.BRAIN_RADIUS;
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
        const dx = finalBrainX - layout.USER_NODE_X;
        const dy = finalBrainY - layout.USER_NODE_Y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const userEdgeX = layout.USER_NODE_X + unitX * layout.USER_RADIUS;
        const userEdgeY = layout.USER_NODE_Y + unitY * layout.USER_RADIUS;
        const brainEdgeX = finalBrainX - unitX * layout.BRAIN_RADIUS;
        const brainEdgeY = finalBrainY - unitY * layout.BRAIN_RADIUS;

        packetStartX = userEdgeX;
        packetStartY = userEdgeY;
        packetEndX = brainEdgeX;
        packetEndY = brainEdgeY;
    } else if (isResponse) {
        // Brain -> User
        const dx = layout.USER_NODE_X - finalBrainX;
        const dy = layout.USER_NODE_Y - finalBrainY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const brainEdgeX = finalBrainX + unitX * layout.BRAIN_RADIUS;
        const brainEdgeY = finalBrainY + unitY * layout.BRAIN_RADIUS;
        const userEdgeX = layout.USER_NODE_X - unitX * layout.USER_RADIUS;
        const userEdgeY = layout.USER_NODE_Y - unitY * layout.USER_RADIUS;

        packetStartX = brainEdgeX;
        packetStartY = brainEdgeY;
        packetEndX = userEdgeX;
        packetEndY = userEdgeY;
    }

    return (
        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
            <div style={{
                width: '100%',
                height: '100%',
                transform: 'scale(1.2)',
                transformOrigin: 'center center',
            }}>
                {/* Background Stars */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
                    zIndex: 0
                }} />

                {/* Connecting Lines (Rendered first to be behind) */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                    {finalSatellitePositions.map((sat) => {
                        return (
                            <line
                                key={`line-${sat.tool}`}
                                x1={finalBrainX}
                                y1={finalBrainY}
                                x2={sat.x}
                                y2={sat.y}
                                stroke="#555"
                                strokeWidth={2}
                                strokeOpacity={0.6}
                                strokeDasharray="5,5"
                            />
                        );
                    })}
                </svg>

                <div style={{
                    zIndex: 2,
                    position: 'absolute',
                    left: finalBrainX - (width / 2),
                    top: finalBrainY - (height / 2),
                    width: width,
                    height: height,
                    pointerEvents: 'none'
                }}>
                    <CentralBrain
                        currentType={(currentLog && isToolResult && !hasArrived) ? 'TOOL_CALL' : (currentLog?.type || 'IDLE' as any)}
                        isActive={
                            !currentLog ? false : // IDLE
                                currentLog.type === 'ERROR' ? false :
                                    (isTrigger && !hasArrived) ? false :
                                        (isResponse && !hasArrived) ? true : // Active while sending response
                                            true
                        }
                        radius={layout.BRAIN_RADIUS}
                    />
                </div>

                {/* User Node */}
                <UserNode
                    isActive={isTrigger || (isResponse && hasArrived)}
                    x={layout.USER_NODE_X}
                    y={layout.USER_NODE_Y}
                    radius={layout.USER_RADIUS}
                />

                {/* Data Packet Animation */}
                {activeSatellite && isToolCall && !hasArrived && (
                    <DataPacket
                        startX={packetStartX}
                        startY={packetStartY}
                        endX={packetEndX}
                        endY={packetEndY}
                        progress={packetProgress}
                        color={ACTION_COLORS.TOOL_CALL}
                        width={layout.PACKET_WIDTH}
                        height={layout.PACKET_HEIGHT}
                    />
                )}

                {activeSatellite && isToolResult && !hasArrived && (
                    <DataPacket
                        startX={packetStartX}
                        startY={packetStartY}
                        endX={packetEndX}
                        endY={packetEndY}
                        progress={packetProgress}
                        color={ACTION_COLORS.TOOL_RESULT}
                        width={layout.PACKET_WIDTH}
                        height={layout.PACKET_HEIGHT}
                    />
                )}

                {isTrigger && !hasArrived && (
                    <DataPacket
                        startX={packetStartX}
                        startY={packetStartY}
                        endX={packetEndX}
                        endY={packetEndY}
                        progress={packetProgress}
                        color={ACTION_COLORS.TRIGGER}
                        width={layout.PACKET_WIDTH}
                        height={layout.PACKET_HEIGHT}
                    />
                )}

                {isResponse && !hasArrived && (
                    <DataPacket
                        startX={packetStartX}
                        startY={packetStartY}
                        endX={packetEndX}
                        endY={packetEndY}
                        progress={packetProgress}
                        color={ACTION_COLORS.RESPONSE}
                        width={layout.PACKET_WIDTH}
                        height={layout.PACKET_HEIGHT}
                    />
                )}

                {finalSatellitePositions.map((sat) => (
                    <Satellite
                        key={sat.tool}
                        toolName={sat.tool}
                        isActive={
                            sat.isActive && (
                                isToolCall ? hasArrived :
                                    false
                            )
                        }
                        x={sat.x}
                        y={sat.y}
                        radius={layout.SATELLITE_RADIUS}
                    />
                ))}

                {/* Log Bubble (In-Place) */}
                {activeSegment && activeSegment.content && (
                    <LogBubble
                        key={activeSegment.coalescedStart} // Keyed by Group Start (persists across merges)
                        startFrame={activeSegment.coalescedStart + START_DELAY_FRAMES} // Offset Pop-in time by Delay
                        textStartFrame={activeSegment.logIndex * FRAMES_PER_LOG + START_DELAY_FRAMES} // Offset Text Start
                        content={activeSegment.content}
                        type={activeSegment.type}
                        scale={layout.SCALE_FACTOR}
                        x={
                            (() => {
                                // Helper to get Node Anchor
                                const getNodeAnchor = (nodeName: string) => {
                                    if (nodeName === 'BRAIN') return { x: finalBrainX, y: finalBrainY - (85 * layout.SCALE_FACTOR) };
                                    if (nodeName === 'USER') return { x: layout.USER_NODE_X, y: layout.USER_NODE_Y - (55 * layout.SCALE_FACTOR) };
                                    const sat = finalSatellitePositions.find(s => `SAT-${s.tool}` === nodeName);
                                    return { x: sat?.x || finalBrainX, y: (sat?.y || finalBrainY) - (45 * layout.SCALE_FACTOR) };
                                };

                                const packetX = packetStartX + (packetEndX - packetStartX) * packetProgress;
                                const packetY = (packetStartY + (packetEndY - packetStartY) * packetProgress) - (45 * layout.SCALE_FACTOR);

                                const targetNodeAnchor = getNodeAnchor(activeSegment.node);

                                // DEPARTURE PHASE (Moving from Source Node to Packet)
                                if ((isToolCall || isToolResult || isTrigger || isResponse) && !hasArrived) {
                                    // Determine Source Node for Departure
                                    let sourceNodeName = 'BRAIN';
                                    if (isToolResult) sourceNodeName = `SAT-${currentLog?.tool}`;
                                    else if (isTrigger) sourceNodeName = 'USER';
                                    else if (isResponse) sourceNodeName = 'BRAIN';

                                    const sourceAnchor = getNodeAnchor(sourceNodeName === 'BRAIN' ? 'BRAIN' : sourceNodeName); // Helper handles 'BRAIN' vs 'SAT-...'

                                    // Calculate distance from Source Anchor to Packet Start Position (approximate travel distance for the "catch up")
                                    // Packet Start Anchor:
                                    const packetStartAnchorX = packetStartX;
                                    const packetStartAnchorY = packetStartY - (45 * layout.SCALE_FACTOR);

                                    const dist = Math.sqrt(Math.pow(packetStartAnchorX - sourceAnchor.x, 2) + Math.pow(packetStartAnchorY - sourceAnchor.y, 2));
                                    const duration = getTransitDuration(dist, fps, width);

                                    const progress = interpolate(framesSinceLogStart, [0, duration], [0, 1], { extrapolateRight: 'clamp' });

                                    // Interpolate X and Y
                                    const currentX = sourceAnchor.x + (packetX - sourceAnchor.x) * progress;
                                    return currentX;
                                }

                                // ARRIVAL PHASE (Moving from Packet to Dest Node)
                                if ((isToolCall || isToolResult || isTrigger || isResponse) && hasArrived) {
                                    // Packet End Anchor
                                    const packetEndAnchorX = packetEndX;
                                    // const packetEndAnchorY = packetEndY - (45 * layout.SCALE_FACTOR);

                                    const dist = Math.sqrt(Math.pow(targetNodeAnchor.x - packetEndAnchorX, 2) + Math.pow(targetNodeAnchor.y - (packetEndY - (45 * layout.SCALE_FACTOR)), 2));
                                    const duration = getTransitDuration(dist, fps, width);

                                    const progress = interpolate(framesSinceArrival, [0, duration], [0, 1], { extrapolateRight: 'clamp' });

                                    return packetEndX + (targetNodeAnchor.x - packetEndX) * progress;
                                }

                                return targetNodeAnchor.x;
                            })()
                        }
                        y={
                            (() => {
                                // Helper to get Node Anchor (Duplicated for Y prop scope)
                                const getNodeAnchor = (nodeName: string) => {
                                    if (nodeName === 'BRAIN') return { x: finalBrainX, y: finalBrainY - (85 * layout.SCALE_FACTOR) };
                                    if (nodeName === 'USER') return { x: layout.USER_NODE_X, y: layout.USER_NODE_Y - (55 * layout.SCALE_FACTOR) };
                                    const sat = finalSatellitePositions.find(s => `SAT-${s.tool}` === nodeName);
                                    return { x: sat?.x || finalBrainX, y: (sat?.y || finalBrainY) - (45 * layout.SCALE_FACTOR) };
                                };

                                const packetY = (packetStartY + (packetEndY - packetStartY) * packetProgress) - (45 * layout.SCALE_FACTOR);
                                const targetNodeAnchor = getNodeAnchor(activeSegment.node);

                                // DEPARTURE PHASE
                                if ((isToolCall || isToolResult || isTrigger || isResponse) && !hasArrived) {
                                    let sourceNodeName = 'BRAIN';
                                    if (isToolResult) sourceNodeName = `SAT-${currentLog?.tool}`;
                                    else if (isTrigger) sourceNodeName = 'USER';
                                    else if (isResponse) sourceNodeName = 'BRAIN';

                                    const sourceAnchor = getNodeAnchor(sourceNodeName === 'BRAIN' ? 'BRAIN' : sourceNodeName);

                                    const packetStartAnchorX = packetStartX;
                                    const packetStartAnchorY = packetStartY - (45 * layout.SCALE_FACTOR);

                                    // Same distance calc
                                    const dist = Math.sqrt(Math.pow(packetStartAnchorX - sourceAnchor.x, 2) + Math.pow(packetStartAnchorY - sourceAnchor.y, 2));
                                    const duration = getTransitDuration(dist, fps, width);

                                    const progress = interpolate(framesSinceLogStart, [0, duration], [0, 1], { extrapolateRight: 'clamp' });

                                    return sourceAnchor.y + (packetY - sourceAnchor.y) * progress;
                                }

                                // ARRIVAL PHASE
                                if ((isToolCall || isToolResult || isTrigger || isResponse) && hasArrived) {
                                    const packetEndAnchorX = packetEndX;
                                    const packetEndAnchorY = packetEndY - (45 * layout.SCALE_FACTOR);

                                    // Same distance calc
                                    const dist = Math.sqrt(Math.pow(targetNodeAnchor.x - packetEndAnchorX, 2) + Math.pow(targetNodeAnchor.y - packetEndAnchorY, 2));
                                    const duration = getTransitDuration(dist, fps, width);

                                    const progress = interpolate(framesSinceArrival, [0, duration], [0, 1], { extrapolateRight: 'clamp' });

                                    return packetEndAnchorY + (targetNodeAnchor.y - packetEndAnchorY) * progress;
                                }

                                return targetNodeAnchor.y;
                            })()
                        }
                    />
                )}
            </div>
        </div>
    );
};


