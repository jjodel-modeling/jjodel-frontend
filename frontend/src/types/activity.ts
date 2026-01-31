/**
 * Activity Logging System Types
 * Tracks significant user actions in Jjodel
 */

export enum ActivityType {
    // Projects
    PROJECT_CREATED = 'project_created',
    PROJECT_DELETED = 'project_deleted',
    PROJECT_RENAMED = 'project_renamed',

    // Metamodels
    METAMODEL_CREATED = 'metamodel_created',
    METAMODEL_DELETED = 'metamodel_deleted',
    METAMODEL_EVOLVED = 'metamodel_evolved',

    // Metamodel structural changes
    METAMODEL_CLASS_ADDED = 'metamodel_class_added',
    METAMODEL_PACKAGE_ADDED = 'metamodel_package_added',
    METAMODEL_ENUM_ADDED = 'metamodel_enum_added',
    METAMODEL_ATTRIBUTE_ADDED = 'metamodel_attribute_added',
    METAMODEL_REFERENCE_ADDED = 'metamodel_reference_added',
    METAMODEL_OPERATION_ADDED = 'metamodel_operation_added',
    METAMODEL_LITERAL_ADDED = 'metamodel_literal_added',
    METAMODEL_PARAMETER_ADDED = 'metamodel_parameter_added',
    METAMODEL_EXCEPTION_ADDED = 'metamodel_exception_added',

    // Models
    MODEL_CREATED = 'model_created',
    MODEL_DELETED = 'model_deleted',

    // Viewpoints
    VIEWPOINT_CHANGED = 'viewpoint_changed',

    // Validation
    VALIDATION_RUN = 'validation_run',
}

export interface ActivityRecord {
    id: string;
    timestamp: Date;
    type: ActivityType;
    projectId: string;
    projectName: string;
    entityId?: string;
    entityName?: string;
    metadata?: Record<string, any>;
}

export type ActivityInput = Omit<ActivityRecord, 'id' | 'timestamp'>;

// Grouped activity for consecutive modifications
export interface GroupedActivity extends ActivityRecord {
    count: number;                    // Number of activities in group
    items: ActivityRecord[];          // All activities in the group
    latestTimestamp: number;          // Most recent timestamp (as number for comparison)
    isGroup: true;                    // Flag to identify grouped activities
}

export type TimelineActivity = ActivityRecord | GroupedActivity;

// Type guard for grouped activities
export function isGroupedActivity(activity: TimelineActivity): activity is GroupedActivity {
    return 'isGroup' in activity && activity.isGroup === true;
}

// Map ActivityType to the action string used in ActivityItem component
export const activityTypeToAction: Record<ActivityType, string> = {
    [ActivityType.PROJECT_CREATED]: 'created',
    [ActivityType.PROJECT_DELETED]: 'deleted',
    [ActivityType.PROJECT_RENAMED]: 'modified',
    [ActivityType.METAMODEL_CREATED]: 'created',
    [ActivityType.METAMODEL_DELETED]: 'deleted',
    [ActivityType.METAMODEL_EVOLVED]: 'modified',
    [ActivityType.METAMODEL_CLASS_ADDED]: 'modified',
    [ActivityType.METAMODEL_PACKAGE_ADDED]: 'modified',
    [ActivityType.METAMODEL_ENUM_ADDED]: 'modified',
    [ActivityType.METAMODEL_ATTRIBUTE_ADDED]: 'modified',
    [ActivityType.METAMODEL_REFERENCE_ADDED]: 'modified',
    [ActivityType.METAMODEL_OPERATION_ADDED]: 'modified',
    [ActivityType.METAMODEL_LITERAL_ADDED]: 'modified',
    [ActivityType.METAMODEL_PARAMETER_ADDED]: 'modified',
    [ActivityType.METAMODEL_EXCEPTION_ADDED]: 'modified',
    [ActivityType.MODEL_CREATED]: 'created',
    [ActivityType.MODEL_DELETED]: 'deleted',
    [ActivityType.VIEWPOINT_CHANGED]: 'modified',
    [ActivityType.VALIDATION_RUN]: 'validated',
};

// Helper to generate activity ID
export const generateActivityId = (): string => {
    return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Helper to format relative time
export const formatRelativeTime = (timestamp: number | Date): string => {
    const ts = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
    const now = Date.now();
    const diff = now - ts;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
};
