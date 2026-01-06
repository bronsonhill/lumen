export const getConfig = (width: number, height: number, fps: number) => {
    // Base resolution for relative calculations. Keep this at 1920 (1080p) so that higher resolutions scale up.
    // If you set this to 2560, then 2560 output will have a scale factor of 1 (same size as 1080p), making elements look small.
    const BASE_WIDTH = 1920;
    const scaleFactor = width / BASE_WIDTH;

    return {
        TIMING: {
            PACKET_SPEED: 8 * scaleFactor, // Pixels per frame (scales with res) - Wait, speed should be time based.
            // Better: Speed = Distance / Duration.
            // Let's keep pixel speed for now but scaled, to maintain "feel".
            // Actually, if we change FPS, pixel/frame changes.
            // Let's define speed in % of screen width per second?
            // For now, let's just make it relative to resolution.

            // Re-thinking: If we want strictly FPS independent, we define durations in seconds.
            // TRANSIT_DURATION_SEC = distance_px / speed_px_per_sec

            START_DELAY_FRAMES: Math.round(2 * fps), // 2 seconds
            FRAMES_PER_LOG: Math.round(4 * fps), // 4 seconds per log
        },
        LAYOUT: {
            SCALE_FACTOR: scaleFactor,
            RADIUS: height * 0.35, // 350/1080 is roughly 0.32, let's go with proportional to height usually
            USER_NODE_X: width * 0.15, // 300/1920
            USER_NODE_Y: height * 0.25, // 250/1080 roughly

            BRAIN_RADIUS: 75 * scaleFactor,
            SATELLITE_RADIUS: 30 * scaleFactor,
            USER_RADIUS: 40 * scaleFactor,

            // Data Packet Scaled Dimensions
            PACKET_WIDTH: 24 * scaleFactor,
            PACKET_HEIGHT: 8 * scaleFactor,

            CENTER_X: width / 2,
            CENTER_Y: height / 2,
        }
    };
};

export type LayoutConfig = ReturnType<typeof getConfig>['LAYOUT'];

// Helper for packet speed calculation to ensure consistent travel time regardless of Res/FPS
export const getTransitDuration = (distance: number, fps: number, width: number) => {
    // Desired speed: Traverse 50% of screen width in 1.5 seconds? 
    // Old: 8px/frame @ 30fps = 240px/sec. Screen ~1920. So ~1/8 width per sec.

    // Let's define speed as: Screen Widths per Second.
    const SPEED_SCREEN_WIDTHS_PER_SEC = 0.15; // 15% of width per second

    const pixelsPerSecond = width * SPEED_SCREEN_WIDTHS_PER_SEC;
    const durationSeconds = distance / pixelsPerSecond;

    // Min duration 0.5s
    const safeDuration = Math.max(0.5, durationSeconds);

    return Math.ceil(safeDuration * fps);
};
