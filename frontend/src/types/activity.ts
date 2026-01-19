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

// Map ActivityType to the action string used in ActivityItem component
export const activityTypeToAction: Record<ActivityType, string> = {
    [ActivityType.PROJECT_CREATED]: 'created',
    [ActivityType.PROJECT_DELETED]: 'deleted',
    [ActivityType.PROJECT_RENAMED]: 'modified',
    [ActivityType.METAMODEL_CREATED]: 'created',
    [ActivityType.METAMODEL_DELETED]: 'deleted',
    [ActivityType.METAMODEL_EVOLVED]: 'modified',
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
