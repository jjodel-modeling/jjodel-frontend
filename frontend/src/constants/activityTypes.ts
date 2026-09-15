/**
 * Activity Display Configuration
 * Maps activity types to visual display properties
 */

import { ActivityType, ActivityRecord } from '../types/activity';

export interface ActivityDisplayConfig {
    label: string;
    action: 'created' | 'modified' | 'deleted' | 'shared' | 'opened' | 'validated' | 'exported' | 'imported';
    getMessage: (activity: ActivityRecord) => string;
}

export const ACTIVITY_DISPLAY_CONFIG: Record<ActivityType, ActivityDisplayConfig> = {
    [ActivityType.PROJECT_CREATED]: {
        label: 'Created',
        action: 'created',
        getMessage: () => 'Project created',
    },

    [ActivityType.PROJECT_DELETED]: {
        label: 'Deleted',
        action: 'deleted',
        getMessage: () => 'Project deleted',
    },

    [ActivityType.PROJECT_RENAMED]: {
        label: 'Renamed',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.oldName
                ? `Project renamed from "${activity.metadata.oldName}"`
                : 'Project renamed',
    },

    [ActivityType.METAMODEL_CREATED]: {
        label: 'Created',
        action: 'created',
        getMessage: (activity) =>
            activity.entityName
                ? `Metamodel "${activity.entityName}" created`
                : 'Metamodel created',
    },

    [ActivityType.METAMODEL_DELETED]: {
        label: 'Deleted',
        action: 'deleted',
        getMessage: (activity) =>
            activity.entityName
                ? `Metamodel "${activity.entityName}" deleted`
                : 'Metamodel deleted',
    },

    [ActivityType.METAMODEL_EVOLVED]: {
        label: 'Evolved',
        action: 'modified',
        getMessage: (activity) =>
            activity.entityName
                ? `Metamodel "${activity.entityName}" evolved`
                : 'Metamodel evolved',
    },

    [ActivityType.METAMODEL_CLASS_ADDED]: {
        label: 'Class Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Class "${activity.metadata.elementName}" added`
                : 'Class added',
    },

    [ActivityType.METAMODEL_PACKAGE_ADDED]: {
        label: 'Package Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Package "${activity.metadata.elementName}" added`
                : 'Package added',
    },

    [ActivityType.METAMODEL_ENUM_ADDED]: {
        label: 'Enum Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Enumeration "${activity.metadata.elementName}" added`
                : 'Enumeration added',
    },

    [ActivityType.METAMODEL_ATTRIBUTE_ADDED]: {
        label: 'Attribute Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Attribute "${activity.metadata.elementName}" added`
                : 'Attribute added',
    },

    [ActivityType.METAMODEL_REFERENCE_ADDED]: {
        label: 'Reference Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Reference "${activity.metadata.elementName}" added`
                : 'Reference added',
    },

    [ActivityType.METAMODEL_OPERATION_ADDED]: {
        label: 'Operation Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Operation "${activity.metadata.elementName}" added`
                : 'Operation added',
    },

    [ActivityType.METAMODEL_LITERAL_ADDED]: {
        label: 'Literal Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Literal "${activity.metadata.elementName}" added`
                : 'Literal added',
    },

    [ActivityType.METAMODEL_PARAMETER_ADDED]: {
        label: 'Parameter Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Parameter "${activity.metadata.elementName}" added`
                : 'Parameter added',
    },

    [ActivityType.METAMODEL_EXCEPTION_ADDED]: {
        label: 'Exception Added',
        action: 'modified',
        getMessage: (activity) =>
            activity.metadata?.elementName
                ? `Exception "${activity.metadata.elementName}" added`
                : 'Exception added',
    },

    [ActivityType.MODEL_CREATED]: {
        label: 'Created',
        action: 'created',
        getMessage: (activity) =>
            activity.entityName
                ? `Model "${activity.entityName}" created`
                : 'Model created',
    },

    [ActivityType.MODEL_DELETED]: {
        label: 'Deleted',
        action: 'deleted',
        getMessage: (activity) =>
            activity.entityName
                ? `Model "${activity.entityName}" deleted`
                : 'Model deleted',
    },

    [ActivityType.VIEWPOINT_CHANGED]: {
        label: 'Changed',
        action: 'modified',
        getMessage: (activity) =>
            activity.entityName
                ? `Viewpoint changed to "${activity.entityName}"`
                : 'Viewpoint changed',
    },

    [ActivityType.VALIDATION_RUN]: {
        label: 'Validated',
        action: 'validated',
        getMessage: (activity) => {
            const success = activity.metadata?.success;
            const errorCount = activity.metadata?.errorCount || 0;
            if (success) {
                return activity.entityName
                    ? `"${activity.entityName}" validation passed`
                    : 'Validation passed';
            }
            return activity.entityName
                ? `"${activity.entityName}" has ${errorCount} error${errorCount !== 1 ? 's' : ''}`
                : `Validation found ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
        },
    },
};

export const getActivityDisplayConfig = (type: ActivityType): ActivityDisplayConfig => {
    return ACTIVITY_DISPLAY_CONFIG[type] || {
        label: 'Activity',
        action: 'modified' as const,
        getMessage: () => 'Activity',
    };
};

/**
 * Get display name for an activity (project name + optional entity context)
 */
export const getActivityDisplayName = (activity: ActivityRecord): string => {
    // For entity-level activities, show entity name; otherwise show project name
    if (activity.entityName) {
        return activity.entityName;
    }
    return activity.projectName;
};
