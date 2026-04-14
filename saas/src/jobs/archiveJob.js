import archiveService from '../services/archiveService.js';

/**
 * Nightly Archival Job
 * Moves data older than the retention threshold to cold storage.
 */
export const startArchivalJob = () => {
    // Run every day at 1:00 AM
    const scheduleNext = () => {
        const now = new Date();
        const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 1, 0, 0);
        const delay = nextRun.getTime() - now.getTime();

        setTimeout(async () => {
            try {
                await archiveService.runArchivalTask(90); // 90 days retention
            } catch (err) {
                console.error('[ArchivalJob] Failed to run nightly task:', err);
            }
            scheduleNext(); // Reschedule for next day
        }, delay);
    };

    console.log('[ArchivalJob] Initialized core archival scheduler.');
    scheduleNext();

    // Initial run on startup if database is fresh or after maintenance
    // archiveService.runArchivalTask(90).catch(() => {});
};
