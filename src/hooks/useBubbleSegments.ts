import { useMemo } from 'react';
import { LogEntry, LogType } from '../types';
import { CONFIG } from '../config';

interface RawSegment {
    start: number;
    end: number;
    node: string;
    content: string;
    type: LogType;
    logIndex: number;
    transitDurationFrames: number;
    coalescedStart?: number;
}

export const useBubbleSegments = (
    logs: LogEntry[],
    tools: string[],
    getStableNodeCoords: (nodeName: string, tools: string[]) => { x: number; y: number }
) => {
    return useMemo(() => {
        const segments: RawSegment[] = [];

        logs.forEach((log, index) => {
            const logStart = index * CONFIG.FRAMES_PER_LOG;
            const logEnd = (index + 1) * CONFIG.FRAMES_PER_LOG;

            // Calculate Distance & Transit Time
            let startNode = '';
            let endNode = '';

            if (log.type === 'TOOL_CALL') { startNode = 'BRAIN'; endNode = `SAT-${log.tool}`; }
            else if (log.type === 'TOOL_RESULT') { startNode = `SAT-${log.tool}`; endNode = 'BRAIN'; }
            else if (log.type === 'TRIGGER') { startNode = 'USER'; endNode = 'BRAIN'; }
            else { startNode = 'BRAIN'; endNode = 'BRAIN'; }

            const p1 = getStableNodeCoords(startNode, tools);
            const p2 = getStableNodeCoords(endNode, tools);
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

            const transitFrames = Math.max(15, Math.ceil(dist / CONFIG.PACKET_SPEED));

            if (log.type === 'TOOL_CALL') {
                segments.push({
                    start: logStart,
                    end: logStart + transitFrames,
                    node: 'BRAIN',
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: transitFrames
                });
                segments.push({
                    start: logStart + transitFrames,
                    end: logEnd,
                    node: `SAT-${log.tool}`,
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: transitFrames
                });
            } else if (log.type === 'TOOL_RESULT') {
                segments.push({
                    start: logStart,
                    end: logStart + transitFrames,
                    node: `SAT-${log.tool}`,
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: transitFrames
                });
                segments.push({
                    start: logStart + transitFrames,
                    end: logEnd,
                    node: 'BRAIN',
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: transitFrames
                });
            } else if (log.type === 'TRIGGER') {
                segments.push({
                    start: logStart,
                    end: logStart + transitFrames,
                    node: 'USER',
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: transitFrames
                });
                segments.push({
                    start: logStart + transitFrames,
                    end: logEnd,
                    node: 'BRAIN',
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: transitFrames
                });
            } else {
                segments.push({
                    start: logStart,
                    end: logEnd,
                    node: 'BRAIN',
                    content: log.content || '',
                    type: log.type,
                    logIndex: index,
                    transitDurationFrames: 0
                });
            }
        });

        // Coalesce segments
        const coalesced: RawSegment[] = [];
        let lastLogIndex = -1;
        let currentGroupStart = -1;
        let lastNode = '';

        segments.forEach(seg => {
            if (seg.logIndex !== lastLogIndex && seg.node !== lastNode) {
                currentGroupStart = seg.start;
            } else if (currentGroupStart === -1) {
                currentGroupStart = seg.start;
            }
            lastLogIndex = seg.logIndex;
            lastNode = seg.node;
            coalesced.push({ ...seg, coalescedStart: currentGroupStart });
        });

        return coalesced;
    }, [logs, tools, getStableNodeCoords]);
};
