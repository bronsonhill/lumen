import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { LogEntry } from '../types';
import logsData from '../logs.json';
import { CentralBrain } from './CentralBrain';
import { Satellite } from './Satellite';
import { LogOverlay } from './LogOverlay';
import { DataPacket } from './DataPacket';
import { ACTION_COLORS } from '../constants';

const logs = logsData as LogEntry[];

export const AgentSystem: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const framesPerLog = 120;
    const activeLogIndex = Math.floor(frame / framesPerLog);
    const currentLog = logs[Math.min(activeLogIndex, logs.length - 1)];

    // Identify all unique tools from logs
    const tools = Array.from(new Set(logs.map(l => l.tool).filter(Boolean) as string[]));

    // Layout Constants
    const radius = 350;
    const centerX = width / 2;
    const centerY = height / 2;

    // Apply noise to Brain Position
    const brainNoiseX = noise2D('brain-x', frame * 0.003, 0) * 30;
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
            isActive: (currentLog.type === 'TOOL_CALL' || currentLog.type === 'TOOL_RESULT') && currentLog.tool === tool
        };
    });

    // Animation Timing Logic
    const progressInLog = (frame % framesPerLog) / framesPerLog;
    const transitDuration = 0.3; // 30% of time for travel

    // Normalized progress for the packet (0 to 1) during the transit phase
    // If progressInLog is 0..0.3, packetProgress goes 0..1
    const packetProgress = Math.min(progressInLog / transitDuration, 1);

    // Has the packet arrived?
    const hasArrived = progressInLog >= transitDuration;

    // Determine Logic for Active States and Packet Coordinates

    const isToolCall = currentLog.type === 'TOOL_CALL';
    const isToolResult = currentLog.type === 'TOOL_RESULT';

    // Find active satellite if any
    const activeSatellite = satellitePositions.find(s => s.tool === currentLog.tool);

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

        const brainRadius = 75; // 150/2
        const satelliteRadius = 30; // 60/2

        // Edge coordinates
        const brainEdgeX = brainX + unitX * brainRadius;
        const brainEdgeY = brainY + unitY * brainRadius;
        const satEdgeX = activeSatellite.x - unitX * satelliteRadius;
        const satEdgeY = activeSatellite.y - unitY * satelliteRadius;

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
    }

    return (
        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
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
                {satellitePositions.map((sat) => {
                    return (
                        <line
                            key={`line-${sat.tool}`}
                            x1={brainX}
                            y1={brainY}
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
                left: brainX - (width / 2),
                top: brainY - (height / 2),
                width: width,
                height: height,
                pointerEvents: 'none'
            }}>
                <CentralBrain
                    currentType={(isToolResult && !hasArrived) ? 'TOOL_CALL' : currentLog.type}
                    // Brain Active Logic:
                    // If TOOL_RESULT: Active only after arrival.
                    // If TOOL_CALL: Active immediately (sending).
                    // If REASONING/TRIGGER: Active.
                    // If ERROR: Not active (red pulsing? handled in component).
                    // Let's stick to user request: "Brain lights up... vice versa" implies reaction on receipt.
                    // But Brain is the sender for TOOL_CALL.
                    isActive={
                        currentLog.type === 'ERROR' ? false : true
                    }
                />
            </div>

            {/* Data Packet Animation */}
            {activeSatellite && isToolCall && packetProgress < 1 && (
                <DataPacket
                    startX={packetStartX}
                    startY={packetStartY}
                    endX={packetEndX}
                    endY={packetEndY}
                    progress={packetProgress}
                    color={ACTION_COLORS.TOOL_CALL}
                />
            )}

            {activeSatellite && isToolResult && packetProgress < 1 && (
                <DataPacket
                    startX={packetStartX}
                    startY={packetStartY}
                    endX={packetEndX}
                    endY={packetEndY}
                    progress={packetProgress}
                    color={ACTION_COLORS.TOOL_RESULT}
                />
            )}

            {satellitePositions.map((sat) => (
                <Satellite
                    key={sat.tool}
                    toolName={sat.tool}
                    // Satellite Active Logic:
                    // Only active if it's the target tool AND
                    // (If TOOL_CALL: Only active after packet arrives)
                    // (If TOOL_RESULT: Active while sending? Or inactive? 
                    // Usually "lights up once dot meets node" refers to receiving. Assuming it stays lit during processing or sending result?)
                    // Let's assume:
                    // TOOL_CALL: Lit after arrival.
                    // TOOL_RESULT: Lit during transit (sender)? Or Lit entire time? 
                    // Let's keep it simple: It lights up when it is involved.
                    // Refined: "Satellite node should light up once the dot meets the node"
                    // So for TOOL_CALL, light up IF hasArrived.
                    isActive={
                        sat.isActive && (
                            isToolCall ? hasArrived :
                                false // TOOL_RESULT: Inactive immediately upon sending
                        )
                    }
                    x={sat.x}
                    y={sat.y}
                />
            ))}

            <LogOverlay
                content={currentLog.content || ''}
                type={currentLog.type}
            />
        </div>
    );
};
