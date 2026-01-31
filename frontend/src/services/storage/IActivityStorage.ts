/**
 * Activity Storage Interface
 * Defines the contract for activity storage implementations
 *
 * Note: Methods return either sync values or Promises to support
 * both local storage (sync) and backend API (async) implementations.
 */

import { ActivityRecord, ActivityInput } from '../../types/activity';

export interface IActivityStorage {
    /**
     * Log a new activity
     */
    log(activity: ActivityInput): ActivityRecord | Promise<ActivityRecord>;

    /**
     * Get recent activities across all projects
     */
    getRecent(limit?: number): ActivityRecord[] | Promise<ActivityRecord[]>;

    /**
     * Get activities for a specific project
     */
    getByProject(projectId: string, limit?: number): ActivityRecord[] | Promise<ActivityRecord[]>;

    /**
     * Clear all activities
     */
    clear(): void | Promise<void>;

    /**
     * Clear activities for a specific project
     */
    clearProject?(projectId: string): void | Promise<void>;
}

export default IActivityStorage;
