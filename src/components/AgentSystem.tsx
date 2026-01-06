import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { LogEntry } from '../types';
import logsData from '../logs.json';
import { CentralBrain } from './CentralBrain';
import { Satellite } from './Satellite';
import { LogBubble } from './LogBubble';
import { DataPacket } from './DataPacket';
import { UserNode } from './UserNode';
import { ACTION_COLORS } from '../constants';
import { CONFIG } from '../config';
import { useBubbleSegments } from '../hooks/useBubbleSegments';
import { useNodePositions } from '../hooks/useNodePositions';
import { useAgentAnimation } from '../hooks/useAgentAnimation';

const logs = logsData as LogEntry[];

export const AgentSystem: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Effective frame for log logic (starts after delay)
    // If negative, we are in the intro/idle phase
    const effectiveFrame = frame - CONFIG.START_DELAY;

    // Identify all unique tools from logs
    const tools = useMemo(() =>
        Array.from(new Set(logs.map(l => l.tool).filter(Boolean) as string[])),
        []
    );

    // 1. Calculate Agent Positions
    // We pass null for currentLog initially to get base positions, or we could pass the active log
    // Ideally we want positions to update based on activity if needed, but for now they are static + noise
    const {
        brainX,
        brainY,
        satellitePositions,
        getStableNodeCoords
    } = useNodePositions(frame, tools, null); // We'll update interactions later or pass currentLog if needed for scale?
    // Actually useNodePositions *does* use currentLog for isActive. So we need to fetch currentLog first or do a 2-pass.
    // However, the circular dependency is minor:
    // Animation depends on Frame.
    // Positions depend on Frame (noise).
    // Active State depends on Log (Frame).
    // Let's get the animation state first? No, we need segments for animation state.
    // Segments use stable coords.

    // 1. Get Segments (Static based on Logs and Tools)
    const bubbleSegments = useBubbleSegments(logs, tools, getStableNodeCoords);

    // 2. Determine Logic for Active States and Packet Coordinates
    const {
        currentLog,
        activeSegment,
        packetProgress,
        hasArrived,
        isToolCall,
        isToolResult,
        isTrigger
    } = useAgentAnimation(effectiveFrame, logs, bubbleSegments);

    // 3. Re-calculate Positions with Active State (Correct Way)
    // We call useNodePositions again? No, that's wasteful and might double noise calc (though deterministic).
    // Better: Split position calculation.
    // Let's just use the one hook and pass the currentLog we just found.
    // BUT currentLog depends on effectiveFrame.
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

        const brainEdgeX = finalBrainX + unitX * CONFIG.LAYOUT.BRAIN_RADIUS;
        const brainEdgeY = finalBrainY + unitY * CONFIG.LAYOUT.BRAIN_RADIUS;
        const satEdgeX = activeSatellite.x - unitX * CONFIG.LAYOUT.SATELLITE_RADIUS;
        const satEdgeY = activeSatellite.y - unitY * CONFIG.LAYOUT.SATELLITE_RADIUS;

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
        const dx = finalBrainX - CONFIG.LAYOUT.USER_NODE_X;
        const dy = finalBrainY - CONFIG.LAYOUT.USER_NODE_Y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;

        const userEdgeX = CONFIG.LAYOUT.USER_NODE_X + unitX * CONFIG.LAYOUT.USER_RADIUS;
        const userEdgeY = CONFIG.LAYOUT.USER_NODE_Y + unitY * CONFIG.LAYOUT.USER_RADIUS;
        const brainEdgeX = finalBrainX - unitX * CONFIG.LAYOUT.BRAIN_RADIUS;
        const brainEdgeY = finalBrainY - unitY * CONFIG.LAYOUT.BRAIN_RADIUS;

        packetStartX = userEdgeX;
        packetStartY = userEdgeY;
        packetEndX = brainEdgeX;
        packetEndY = brainEdgeY;
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
                                        true
                        }
                    />
                </div>

                {/* User Node */}
                <UserNode
                    isActive={isTrigger}
                    x={CONFIG.LAYOUT.USER_NODE_X}
                    y={CONFIG.LAYOUT.USER_NODE_Y}
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
                    />
                ))}

                {/* Log Bubble (In-Place) */}
                {activeSegment && activeSegment.content && (
                    <LogBubble
                        key={activeSegment.coalescedStart} // Keyed by Group Start (persists across merges)
                        startFrame={activeSegment.coalescedStart + CONFIG.START_DELAY} // Offset Pop-in time by Delay
                        textStartFrame={activeSegment.logIndex * CONFIG.FRAMES_PER_LOG + CONFIG.START_DELAY} // Offset Text Start
                        content={activeSegment.content}
                        type={activeSegment.type}
                        x={
                            // Anchoring Logic:
                            // If in transit AND (TOOL_CALL or TOOL_RESULT or TRIGGER), use packet coordinates.
                            // Else use Node coordinates.

                            ((isToolCall || isToolResult || isTrigger) && !hasArrived) ? (
                                // Packet X Calculation
                                packetStartX + (packetEndX - packetStartX) * packetProgress
                            ) : (
                                // Standard Node Anchoring
                                activeSegment.node === 'BRAIN' ? finalBrainX :
                                    activeSegment.node === 'USER' ? CONFIG.LAYOUT.USER_NODE_X :
                                        (finalSatellitePositions.find(s => `SAT-${s.tool}` === activeSegment.node)?.x || finalBrainX)
                            )
                        }
                        y={
                            ((isToolCall || isToolResult || isTrigger) && !hasArrived) ? (
                                // Packet Y Calculation - offset slightly above the packet
                                (packetStartY + (packetEndY - packetStartY) * packetProgress) - 45
                            ) : (
                                // Standard Node Anchoring
                                activeSegment.node === 'BRAIN' ? finalBrainY - 85 :
                                    activeSegment.node === 'USER' ? CONFIG.LAYOUT.USER_NODE_Y - 55 :
                                        (finalSatellitePositions.find(s => `SAT-${s.tool}` === activeSegment.node)?.y || finalBrainY) - 45
                            )
                        }
                    />
                )}
            </div>
        </div>
    );
};

