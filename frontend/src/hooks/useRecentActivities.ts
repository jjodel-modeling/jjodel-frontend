/**
 * useRecentActivities Hook
 * React hook for accessing recent activity data
 */

import { useState, useEffect, useCallback } from 'react';
import ActivityLogger, { ACTIVITY_LOGGED_EVENT } from '../services/ActivityLogger';
import { ActivityRecord } from '../types/activity';

export interface UseRecentActivitiesOptions {
    limit?: number;
    projectId?: string;
}

export const useRecentActivities = (options: UseRecentActivitiesOptions = {}) => {
    const { limit = 20, projectId } = options;
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadActivities = useCallback(() => {
        if (projectId) {
            setActivities(ActivityLogger.getByProject(projectId, limit));
        } else {
            setActivities(ActivityLogger.getRecent(limit));
        }
        setIsLoading(false);
    }, [limit, projectId]);

    useEffect(() => {
        // Load initial activities
        loadActivities();

        // Listen for new activities
        const handleNewActivity = () => {
            loadActivities();
        };

        window.addEventListener(ACTIVITY_LOGGED_EVENT, handleNewActivity);

        return () => {
            window.removeEventListener(ACTIVITY_LOGGED_EVENT, handleNewActivity);
        };
    }, [loadActivities]);

    const refresh = useCallback(() => {
        loadActivities();
    }, [loadActivities]);

    const clear = useCallback(() => {
        ActivityLogger.clear();
        setActivities([]);
    }, []);

    return {
        activities,
        isLoading,
        refresh,
        clear,
        isEmpty: activities.length === 0,
    };
};

export default useRecentActivities;
