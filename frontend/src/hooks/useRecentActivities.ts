/**
 * useRecentActivities Hook
 * React hook for accessing recent activity data with pagination support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ActivityLogger, { ACTIVITY_LOGGED_EVENT } from '../services/ActivityLogger';
import { ActivityRecord, TimelineActivity } from '../types/activity';
import { groupConsecutiveModifications } from '../utils/activityGrouping';

const ITEMS_PER_PAGE = 15;
const MAX_ACTIVITIES = 200; // Maximum activities to load for grouping

export interface UseRecentActivitiesOptions {
    limit?: number;
    projectId?: string;
    enableGrouping?: boolean;
}

export const useRecentActivities = (options: UseRecentActivitiesOptions = {}) => {
    const { limit = ITEMS_PER_PAGE, projectId, enableGrouping = true } = options;
    const [allActivities, setAllActivities] = useState<ActivityRecord[]>([]);
    const [displayedCount, setDisplayedCount] = useState(limit);
    const [isLoading, setIsLoading] = useState(true);
    const timelineRef = useRef<HTMLDivElement>(null);

    // Load all activities
    const loadActivities = useCallback(() => {
        if (projectId) {
            setAllActivities(ActivityLogger.getByProject(projectId, MAX_ACTIVITIES));
        } else {
            setAllActivities(ActivityLogger.getRecent(MAX_ACTIVITIES));
        }
        setIsLoading(false);
    }, [projectId]);

    useEffect(() => {
        // Load initial activities
        loadActivities();

        // Listen for new activities
        const handleNewActivity = () => {
            loadActivities();
            // Reset to first page when new activity arrives
            setDisplayedCount(limit);
        };

        window.addEventListener(ACTIVITY_LOGGED_EVENT, handleNewActivity);

        return () => {
            window.removeEventListener(ACTIVITY_LOGGED_EVENT, handleNewActivity);
        };
    }, [loadActivities, limit]);

    // Get activities to display (with pagination)
    const displayedActivities = allActivities.slice(0, displayedCount);

    // Apply grouping if enabled
    const processedActivities: TimelineActivity[] = enableGrouping
        ? groupConsecutiveModifications(displayedActivities)
        : displayedActivities;

    // Pagination helpers
    const hasMore = displayedCount < allActivities.length;
    const remainingCount = allActivities.length - displayedCount;

    const loadMore = useCallback(() => {
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, allActivities.length));
    }, [allActivities.length]);

    const scrollToTop = useCallback(() => {
        if (timelineRef.current) {
            timelineRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    const refresh = useCallback(() => {
        loadActivities();
        setDisplayedCount(limit);
    }, [loadActivities, limit]);

    const clear = useCallback(() => {
        ActivityLogger.clear();
        setAllActivities([]);
        setDisplayedCount(limit);
    }, [limit]);

    return {
        activities: processedActivities,
        rawActivities: displayedActivities,
        isLoading,
        refresh,
        clear,
        isEmpty: allActivities.length === 0,
        // Pagination
        hasMore,
        remainingCount,
        loadMore,
        scrollToTop,
        totalCount: allActivities.length,
        timelineRef,
    };
};

export default useRecentActivities;
