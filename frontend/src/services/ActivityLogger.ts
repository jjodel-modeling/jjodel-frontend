/**
 * ActivityLogger Service
 * Unified API for logging and retrieving user activity records
 *
 * Storage backend can be configured via USE_BACKEND flag.
 * Currently uses LocalStorage; set USE_BACKEND = true when backend API is ready.
 *
 * Note: When switching to backend, the service methods should be made async.
 */

import { ActivityRecord, ActivityInput } from '../types/activity';
import { LocalStorageActivityStorage } from './storage/LocalStorageActivityStorage';

// Configuration flag - change this when migrating to backend
const USE_BACKEND = false;

// Custom event name for activity updates
export const ACTIVITY_LOGGED_EVENT = 'jjodel:activity-logged';

class ActivityLoggerService {
    // Using concrete type for sync operations; change to IActivityStorage when backend is added
    private storage: LocalStorageActivityStorage;

    constructor() {
        // Choose storage implementation based on configuration
        if (USE_BACKEND) {
            // When migrating to backend:
            // 1. Change storage type to IActivityStorage
            // 2. Make log/getRecent/getByProject methods async
            // 3. Update useRecentActivities hook to handle async
            throw new Error('Backend storage not yet implemented. Set USE_BACKEND = false.');
        } else {
            this.storage = new LocalStorageActivityStorage();
        }
    }

    /**
     * Log a new activity
     */
    log(activity: ActivityInput): ActivityRecord {
        const newActivity = this.storage.log(activity);

        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent(ACTIVITY_LOGGED_EVENT, {
            detail: newActivity,
        }));

        return newActivity;
    }

    /**
     * Get recent activities across all projects
     */
    getRecent(limit: number = 20): ActivityRecord[] {
        return this.storage.getRecent(limit);
    }

    /**
     * Get activities for a specific project
     */
    getByProject(projectId: string, limit: number = 10): ActivityRecord[] {
        return this.storage.getByProject(projectId, limit);
    }

    /**
     * Clear all activities (for testing/cleanup)
     */
    clear(): void {
        this.storage.clear();
        window.dispatchEvent(new CustomEvent(ACTIVITY_LOGGED_EVENT, {
            detail: null,
        }));
    }

    /**
     * Clear activities for a specific project
     */
    clearProject(projectId: string): void {
        this.storage.clearProject(projectId);
        window.dispatchEvent(new CustomEvent(ACTIVITY_LOGGED_EVENT, {
            detail: null,
        }));
    }

    /**
     * Check if storage is available
     */
    isAvailable(): boolean {
        return this.storage.isAvailable();
    }
}

// Export singleton instance
const ActivityLogger = new ActivityLoggerService();
export default ActivityLogger;
