/**
 * Time Grouping Utility
 * Groups items by temporal periods (Today, Yesterday, This Week, etc.)
 */

import { ActivityRecord, TimelineActivity } from '../types/activity';

export interface TimelineGroup<T> {
    label: string;
    items: T[];
}

/**
 * Get the time group label for a given timestamp
 */
export const getTimeGroup = (timestamp: Date | number): string => {
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // Reset to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    if (date >= today) return 'Today';
    if (date >= yesterday) return 'Yesterday';
    if (date >= weekAgo) return 'This Week';
    if (date >= twoWeeksAgo) return 'Last Week';
    return 'Older';
};

/**
 * Group activities by time period
 */
export const groupActivitiesByTime = (activities: ActivityRecord[]): TimelineGroup<ActivityRecord>[] => {
    const groups: Record<string, ActivityRecord[]> = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Last Week': [],
        'Older': []
    };

    activities.forEach(activity => {
        const group = getTimeGroup(activity.timestamp);
        groups[group].push(activity);
    });

    // Return only non-empty groups in order
    return ['Today', 'Yesterday', 'This Week', 'Last Week', 'Older']
        .filter(label => groups[label].length > 0)
        .map(label => ({ label, items: groups[label] }));
};

/**
 * Generic grouping function for any timestamped items
 */
export const groupByTime = <T extends { timestamp: Date | number }>(
    items: T[],
    getTimestamp: (item: T) => Date | number = (item) => item.timestamp
): TimelineGroup<T>[] => {
    const groups: Record<string, T[]> = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Last Week': [],
        'Older': []
    };

    items.forEach(item => {
        const timestamp = getTimestamp(item);
        const group = getTimeGroup(timestamp);
        groups[group].push(item);
    });

    return ['Today', 'Yesterday', 'This Week', 'Last Week', 'Older']
        .filter(label => groups[label].length > 0)
        .map(label => ({ label, items: groups[label] }));
};

/**
 * Group timeline activities (including grouped activities) by time period
 */
export const groupTimelineActivitiesByTime = (activities: TimelineActivity[]): TimelineGroup<TimelineActivity>[] => {
    const groups: Record<string, TimelineActivity[]> = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Last Week': [],
        'Older': []
    };

    activities.forEach(activity => {
        const group = getTimeGroup(activity.timestamp);
        groups[group].push(activity);
    });

    // Return only non-empty groups in order
    return ['Today', 'Yesterday', 'This Week', 'Last Week', 'Older']
        .filter(label => groups[label].length > 0)
        .map(label => ({ label, items: groups[label] }));
};

export default groupActivitiesByTime;
