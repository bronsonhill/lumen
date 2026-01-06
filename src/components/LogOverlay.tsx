import React from 'react';

interface LogOverlayProps {
    content: string;
    type: string;
}

export const LogOverlay: React.FC<LogOverlayProps> = ({ content, type }) => {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: 50,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 20,
                borderRadius: 15,
                border: '1px solid #333',
                textAlign: 'center',
                fontFamily: 'monospace',
                zIndex: 100,
            }}
        >
            <div style={{ color: '#888', marginBottom: 5, fontSize: 14 }}>
                [{type}]
            </div>
            <div style={{ color: 'white', fontSize: 24 }}>
                {content}
            </div>
        </div>
    );
};
