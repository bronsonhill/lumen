import { LogEntry } from '../types';
import { CONFIG } from '../config';

export const useAgentAnimation = (
    effectiveFrame: number,
    logs: LogEntry[],
    bubbleSegments: any[]
) => {
    let currentLog: LogEntry | null = null;
    let activeSegment: any = undefined;
    let packetProgress = 0;
    let hasArrived = false;
    let isToolCall = false;
    let isToolResult = false;
    let isTrigger = false;

    if (effectiveFrame >= 0) {
        activeSegment = bubbleSegments.find((s: any) => effectiveFrame >= s.start && effectiveFrame < s.end);

        const activeLogIndex = Math.floor(effectiveFrame / CONFIG.FRAMES_PER_LOG);
        currentLog = logs[Math.min(activeLogIndex, logs.length - 1)];

        const currentTransitFrames = activeSegment ? activeSegment.transitDurationFrames : 0;
        const logStartFrame = activeLogIndex * CONFIG.FRAMES_PER_LOG;
        const progressInLogFrames = effectiveFrame - logStartFrame;

        packetProgress = currentTransitFrames > 0
            ? Math.min(progressInLogFrames / currentTransitFrames, 1)
            : 1;

        hasArrived = packetProgress >= 1;

        if (currentLog) {
            isToolCall = currentLog.type === 'TOOL_CALL';
            isToolResult = currentLog.type === 'TOOL_RESULT';
            isTrigger = currentLog.type === 'TRIGGER';
        }
    }

    return {
        currentLog,
        activeSegment,
        packetProgress,
        hasArrived,
        isToolCall,
        isToolResult,
        isTrigger
    };
};
