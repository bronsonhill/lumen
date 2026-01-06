import { LogType } from './types';

export const ACTION_COLORS: Record<LogType | 'DEFAULT', string> = {
    REASONING: 'rgba(247, 246, 240, 1)', // Blue
    TOOL_CALL: 'rgba(100, 134, 189, 1)', // Yellow/Orange 
    TOOL_RESULT: 'rgba(100, 134, 189, 1)', // Green
    ERROR: '#dc3545', // Red 
    TRIGGER: 'rgba(240, 103, 132, 1)', // Pink
    RESPONSE: 'rgba(240, 103, 132, 1)', // Pink (Same as trigger)
    DEFAULT: '#6c757d', // Grey
};

export const BUBBLE_OFFSETS = {
    BRAIN: 85,
    USER: 55,
    SATELLITE: 45
};
