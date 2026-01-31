/**
 * LocalStorage Activity Storage
 * Stores activities in browser localStorage
 * Good for: Simple, immediate, works offline
 * Limitations: Browser-only, 5MB limit, doesn't travel with export/import
 */

import { ActivityRecord, ActivityInput, generateActivityId } from '../../types/activity';
import type { IActivityStorage } from './IActivityStorage';

const STORAGE_KEY = 'jjodel_activities';
const MAX_ACTIVITIES = 50;

export class LocalStorageActivityStorage implements IActivityStorage {
    /**
     * Get all stored activities, sorted by timestamp (newest first)
     */
    private getActivities(): ActivityRecord[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            return parsed.map((a: any) => ({
                ...a,
                timestamp: new Date(a.timestamp),
            }));
        } catch (error) {
            console.warn('[LocalStorageActivityStorage] Failed to parse stored activities:', error);
            return [];
        }
    }

    /**
     * Save activities to localStorage, keeping only the most recent
     */
    private saveActivities(activities: ActivityRecord[]): void {
        try {
            const trimmed = activities.slice(0, MAX_ACTIVITIES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (error) {
            console.warn('[LocalStorageActivityStorage] Failed to save activities:', error);
        }
    }

    /**
     * Log a new activity
     */
    log(activity: ActivityInput): ActivityRecord {
        const newActivity: ActivityRecord = {
            ...activity,
            id: generateActivityId(),
            timestamp: new Date(),
        };

        const activities = this.getActivities();
        activities.unshift(newActivity);
        this.saveActivities(activities);

        return newActivity;
    }

    /**
     * Get recent activities
     */
    getRecent(limit: number = 20): ActivityRecord[] {
        return this.getActivities().slice(0, limit);
    }

    /**
     * Get activities for a specific project
     */
    getByProject(projectId: string, limit: number = 10): ActivityRecord[] {
        return this.getActivities()
            .filter(a => a.projectId === projectId)
            .slice(0, limit);
    }

    /**
     * Clear all activities
     */
    clear(): void {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Clear activities for a specific project
     */
    clearProject(projectId: string): void {
        const activities = this.getActivities()
            .filter(a => a.projectId !== projectId);
        this.saveActivities(activities);
    }

    /**
     * Check if localStorage is available
     */
    isAvailable(): boolean {
        try {
            const test = '__activity_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }
}

export default LocalStorageActivityStorage;
