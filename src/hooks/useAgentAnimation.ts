import { LogEntry } from '../types';
import { useVideoConfig } from 'remotion';
import { getConfig } from '../config';

export const useAgentAnimation = (
    effectiveFrame: number,
    logs: LogEntry[],
    bubbleSegments: any[]
) => {
    const { width, height, fps } = useVideoConfig(); // We need config to get FRAMES_PER_LOG
    const config = getConfig(width, height, fps);
    const { FRAMES_PER_LOG } = config.TIMING;

    let currentLog: LogEntry | null = null;
    let activeSegment: any = undefined;
    let packetProgress = 0;
    let hasArrived = false;
    let isToolCall = false;
    let isToolResult = false;
    let isTrigger = false;
    let framesSinceLogStart = 0;

    if (effectiveFrame >= 0) {
        activeSegment = bubbleSegments.find((s: any) => effectiveFrame >= s.start && effectiveFrame < s.end);

        const activeLogIndex = Math.floor(effectiveFrame / FRAMES_PER_LOG);
        currentLog = logs[Math.min(activeLogIndex, logs.length - 1)];

        const currentTransitFrames = activeSegment ? activeSegment.transitDurationFrames : 0;
        const logStartFrame = activeLogIndex * FRAMES_PER_LOG;
        const progressInLogFrames = effectiveFrame - logStartFrame;
        framesSinceLogStart = Math.max(0, progressInLogFrames);

        packetProgress = currentTransitFrames > 0
            ? Math.min(progressInLogFrames / currentTransitFrames, 1)
            : 1;

        hasArrived = packetProgress >= 1;

        if (currentLog) {
            isToolCall = currentLog.type === 'TOOL_CALL';
            isToolResult = currentLog.type === 'TOOL_RESULT';
            isTrigger = currentLog.type === 'TRIGGER';
            // isResponse is handled implicitly by not being others? No we need distinct flag.
        }
    }

    const isResponse = currentLog?.type === 'RESPONSE';

    const framesSinceArrival = (activeSegment && hasArrived)
        ? Math.max(0, effectiveFrame - ((activeSegment.logIndex * FRAMES_PER_LOG) + activeSegment.transitDurationFrames))
        : 0;

    return {
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
    };
};
