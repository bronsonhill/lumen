import { LogType } from './types';

export const ACTION_COLORS: Record<LogType | 'DEFAULT', string> = {
    REASONING: '#ffffffff', // Blue
    TOOL_CALL: '#007bff', // Yellow/Orange
    TOOL_RESULT: '#007bff', // Green
    ERROR: '#dc3545', // Red
    TRIGGER: '#e83e8c', // Pink
    RESPONSE: '#e83e8c', // Pink (Same as trigger)
    DEFAULT: '#6c757d', // Grey
};
