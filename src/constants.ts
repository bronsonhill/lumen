import { LogType } from './types';

export const ACTION_COLORS: Record<LogType | 'DEFAULT', string> = {
    REASONING: '#22d3ee', // Cyan
    TOOL_CALL: '#fbbf24', // Amber
    TOOL_RESULT: '#34d399', // Emerald
    ERROR: '#fb7185', // Rose
    TRIGGER: '#a78bfa', // Violet
    RESPONSE: '#e879f9', // Fuchsia
    DEFAULT: '#94a3b8', // Slate
};

export const BUBBLE_OFFSETS = {
    BRAIN: 85,
    USER: 55,
    SATELLITE: 45
};
