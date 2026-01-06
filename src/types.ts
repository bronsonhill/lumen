export type LogType = 'REASONING' | 'TOOL_CALL' | 'TOOL_RESULT' | 'ERROR' | 'TRIGGER' | 'RESPONSE';

export interface LogEntry {
    timestamp: number;
    type: LogType;
    content?: string;
    tool?: string;
    status?: 'active' | 'success' | 'failure';
}

export interface SatellitePosition {
    tool: string;
    x: number;
    y: number;
    isActive: boolean;
}
