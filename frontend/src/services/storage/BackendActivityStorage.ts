/**
 * Backend Activity Storage
 * Stores activities via REST API to backend server
 *
 * Good for: Multi-device sync, server-side analytics, larger storage
 * Limitations: Requires backend implementation, network dependent
 *
 * NOTE: This is a stub for future implementation.
 * When ready, implement the API endpoints:
 *   POST   /api/activities       - Log new activity
 *   GET    /api/activities       - Get recent activities (with ?limit=N)
 *   GET    /api/activities/:pid  - Get activities for project
 *   DELETE /api/activities       - Clear all activities
 *   DELETE /api/activities/:pid  - Clear project activities
 */

import { ActivityRecord, ActivityInput, generateActivityId } from '../../types/activity';
import type { IActivityStorage } from './IActivityStorage';
import Api from '../../api/api';

export class BackendActivityStorage implements IActivityStorage {
    private readonly endpoint = `${process.env['JODEL_PERSISTANCE']}/activities`;

    /**
     * Log a new activity
     */
    async log(activity: ActivityInput): Promise<ActivityRecord> {
        const newActivity: ActivityRecord = {
            ...activity,
            id: generateActivityId(),
            timestamp: new Date(),
        };

        try {
            const response = await Api.post(this.endpoint, newActivity);
            if (response.code !== 200) {
                console.error('[BackendActivityStorage] Failed to log activity:', response);
                // Fall through and return the local activity anyway
            }
        } catch (error) {
            console.error('[BackendActivityStorage] Error logging activity:', error);
        }

        return newActivity;
    }

    /**
     * Get recent activities
     */
    async getRecent(limit: number = 20): Promise<ActivityRecord[]> {
        try {
            const response = await Api.get(`${this.endpoint}?limit=${limit}&sort=desc`);
            if (response.code === 200 && Array.isArray(response.data)) {
                return response.data.map((a: any) => ({
                    ...a,
                    timestamp: new Date(a.timestamp),
                }));
            }
        } catch (error) {
            console.error('[BackendActivityStorage] Error fetching activities:', error);
        }
        return [];
    }

    /**
     * Get activities for a specific project
     */
    async getByProject(projectId: string, limit: number = 10): Promise<ActivityRecord[]> {
        try {
            const response = await Api.get(`${this.endpoint}/${projectId}?limit=${limit}`);
            if (response.code === 200 && Array.isArray(response.data)) {
                return response.data.map((a: any) => ({
                    ...a,
                    timestamp: new Date(a.timestamp),
                }));
            }
        } catch (error) {
            console.error('[BackendActivityStorage] Error fetching project activities:', error);
        }
        return [];
    }

    /**
     * Clear all activities
     */
    async clear(): Promise<void> {
        try {
            await Api.delete(this.endpoint);
        } catch (error) {
            console.error('[BackendActivityStorage] Error clearing activities:', error);
        }
    }

    /**
     * Clear activities for a specific project
     */
    async clearProject(projectId: string): Promise<void> {
        try {
            await Api.delete(`${this.endpoint}/${projectId}`);
        } catch (error) {
            console.error('[BackendActivityStorage] Error clearing project activities:', error);
        }
    }
}

export default BackendActivityStorage;
