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
import { usePacketCoordinates } from '../hooks/usePacketCoordinates';
import { useLogBubblePosition } from '../hooks/useLogBubblePosition';
import { getStableNodeCoords } from '../helpers/layoutHelpers';

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

    // 1. Get Segments (Static based on Logs and Tools)
    // Pass layout explicitly or wrap getStableNodeCoords? 
    // useBubbleSegments needs a function (nodeName, tools) => {x,y}
    // We can create a bound function here since 'layout' is stable for this frame
    const boundGetStableCoords = (node: string, t: string[]) => getStableNodeCoords(node, t, layout);

    // Pass the bound function
    const bubbleSegments = useBubbleSegments(logs, tools, boundGetStableCoords);

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
    // 4. Calculate Packet Coordinates
    const {
        packetStartX,
        packetStartY,
        packetEndX,
        packetEndY,
        activeSatellite
    } = usePacketCoordinates({
        currentLog,
        finalSatellitePositions,
        brainX: finalBrainX,
        brainY: finalBrainY,
        layout,
        isToolCall,
        isToolResult,
        isTrigger,
        isResponse
    });

    // 5. Determine Packet Visualization State
    let packetColor = '';
    let shouldShowPacket = false;

    if (!hasArrived) {
        if (isToolCall && activeSatellite) {
            packetColor = ACTION_COLORS.TOOL_CALL;
            shouldShowPacket = true;
        } else if (isToolResult && activeSatellite) {
            packetColor = ACTION_COLORS.TOOL_RESULT;
            shouldShowPacket = true;
        } else if (isTrigger) {
            packetColor = ACTION_COLORS.TRIGGER;
            shouldShowPacket = true;
        } else if (isResponse) {
            packetColor = ACTION_COLORS.RESPONSE;
            shouldShowPacket = true;
        }
    }

    const bubblePos = useLogBubblePosition({
        activeSegment,
        brainX: finalBrainX,
        brainY: finalBrainY,
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
    });

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
                {shouldShowPacket && (
                    <DataPacket
                        startX={packetStartX}
                        startY={packetStartY}
                        endX={packetEndX}
                        endY={packetEndY}
                        progress={packetProgress}
                        color={packetColor}
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
                        x={bubblePos.x}
                        y={bubblePos.y}
                    />
                )}
            </div>
        </div>
    );
};


