export type LogType = 'REASONING' | 'TOOL_CALL' | 'TOOL_RESULT' | 'ERROR' | 'TRIGGER';

export interface LogEntry {
    timestamp: number;
    type: LogType;
    content?: string;
    tool?: string;
    status?: 'active' | 'success' | 'failure';
}
