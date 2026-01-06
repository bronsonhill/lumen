import React from 'react';
import { Composition } from 'remotion';
import { AgentSystem } from './components/AgentSystem';
import logsData from './logs.json';

export const RemotionRoot: React.FC = () => {
    const framesPerLog = 120;
    const durationInFrames = logsData.length * framesPerLog;

    return (
        <>
            <Composition
                id="AgentVisualization"
                component={AgentSystem}
                durationInFrames={durationInFrames}
                fps={30}
                width={2560}
                height={1440}
            />
        </>
    );
};
