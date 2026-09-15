/**
 * Activity Grouping Utility
 * Groups consecutive modifications on the same project to reduce timeline clutter
 */

import { ActivityRecord, GroupedActivity, TimelineActivity, ActivityType } from '../types/activity';

// Activity types that can be grouped together (metamodel structural changes)
const GROUPABLE_TYPES: ActivityType[] = [
    ActivityType.METAMODEL_CLASS_ADDED,
    ActivityType.METAMODEL_PACKAGE_ADDED,
    ActivityType.METAMODEL_ENUM_ADDED,
    ActivityType.METAMODEL_ATTRIBUTE_ADDED,
    ActivityType.METAMODEL_REFERENCE_ADDED,
    ActivityType.METAMODEL_OPERATION_ADDED,
    ActivityType.METAMODEL_LITERAL_ADDED,
    ActivityType.METAMODEL_PARAMETER_ADDED,
    ActivityType.METAMODEL_EXCEPTION_ADDED,
];

// Time threshold for grouping activities (5 minutes)
const TIME_THRESHOLD = 5 * 60 * 1000;

/**
 * Get timestamp as number from ActivityRecord
 */
function getTimestampMs(activity: ActivityRecord): number {
    return activity.timestamp instanceof Date
        ? activity.timestamp.getTime()
        : activity.timestamp;
}

/**
 * Check if an activity type is groupable
 */
function isGroupableType(type: ActivityType): boolean {
    return GROUPABLE_TYPES.includes(type);
}

/**
 * Group consecutive modifications on the same project
 * Activities within TIME_THRESHOLD of each other on the same project are grouped
 */
export function groupConsecutiveModifications(
    activities: ActivityRecord[]
): TimelineActivity[] {
    if (activities.length === 0) return [];

    const result: TimelineActivity[] = [];

    for (let i = 0; i < activities.length; i++) {
        const current = activities[i];
        const currentTs = getTimestampMs(current);
        const lastItem = result[result.length - 1];

        // Check if we can add to an existing group
        if (lastItem && 'isGroup' in lastItem && lastItem.isGroup) {
            const group = lastItem as GroupedActivity;
            const timeDiff = Math.abs(group.latestTimestamp - currentTs);

            // Add to existing group if same project, groupable type, and within time threshold
            if (
                group.projectId === current.projectId &&
                group.entityId === current.entityId &&
                isGroupableType(current.type) &&
                timeDiff < TIME_THRESHOLD
            ) {
                group.count++;
                group.items.push(current);
                // Update latest timestamp to be the most recent
                if (currentTs > group.latestTimestamp) {
                    group.latestTimestamp = currentTs;
                    group.timestamp = current.timestamp;
                }
                continue;
            }
        }

        // Check if this should start a new group
        // Look ahead to see if next activity can be grouped with this one
        const nextActivity = activities[i + 1];
        const shouldStartGroup = nextActivity &&
            nextActivity.projectId === current.projectId &&
            nextActivity.entityId === current.entityId &&
            isGroupableType(current.type) &&
            isGroupableType(nextActivity.type) &&
            Math.abs(currentTs - getTimestampMs(nextActivity)) < TIME_THRESHOLD;

        if (shouldStartGroup) {
            // Start a new group
            const group: GroupedActivity = {
                ...current,
                count: 1,
                items: [current],
                latestTimestamp: currentTs,
                isGroup: true,
            };
            result.push(group);
        } else {
            // Keep as individual activity
            result.push(current);
        }
    }

    return result;
}

/**
 * Get summary label for a group of activities
 */
export function getGroupSummaryLabel(group: GroupedActivity): string {
    const types = new Set(group.items.map(item => item.type));

    if (types.size === 1) {
        // All same type
        const type = group.items[0].type;
        const typeLabels: Record<string, string> = {
            [ActivityType.METAMODEL_CLASS_ADDED]: 'classes',
            [ActivityType.METAMODEL_PACKAGE_ADDED]: 'packages',
            [ActivityType.METAMODEL_ENUM_ADDED]: 'enums',
            [ActivityType.METAMODEL_ATTRIBUTE_ADDED]: 'attributes',
            [ActivityType.METAMODEL_REFERENCE_ADDED]: 'references',
            [ActivityType.METAMODEL_OPERATION_ADDED]: 'operations',
            [ActivityType.METAMODEL_LITERAL_ADDED]: 'literals',
            [ActivityType.METAMODEL_PARAMETER_ADDED]: 'parameters',
            [ActivityType.METAMODEL_EXCEPTION_ADDED]: 'exceptions',
        };
        return `${group.count} ${typeLabels[type] || 'elements'} added`;
    }

    // Mixed types
    return `${group.count} elements added`;
}

export default groupConsecutiveModifications;
