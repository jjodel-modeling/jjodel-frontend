/**
 * Feature definitions for the metamodel editor palette
 * Each feature represents a draggable element that can be added to the canvas
 */

export interface FeatureDefinition {
    id: string;
    name: string;
    icon: string;           // Bootstrap Icon class (without 'bi-' prefix)
    description: string;
    dragType: string;       // Type used for drag & drop identification
    defaultData?: Record<string, any>;  // Default values when dropped
}

export const featureDefinitions: FeatureDefinition[] = [
    {
        id: 'package',
        name: 'Package',
        icon: 'folder',
        description: 'Container for organizing model elements',
        dragType: 'FEATURE_PACKAGE',
        defaultData: {
            name: 'NewPackage',
            elements: []
        }
    },
    {
        id: 'class',
        name: 'Class',
        icon: 'diagram-3',
        description: 'Define a class with attributes and operations',
        dragType: 'FEATURE_CLASS',
        defaultData: {
            name: 'NewClass',
            attributes: [],
            operations: [],
            abstract: false
        }
    },
    {
        id: 'enumerator',
        name: 'Enumerator',
        icon: 'list-ul',
        description: 'Define an enumeration type with literals',
        dragType: 'FEATURE_ENUMERATOR',
        defaultData: {
            name: 'NewEnum',
            literals: []
        }
    }
];

/**
 * Get a feature definition by its ID
 */
export function getFeatureById(id: string): FeatureDefinition | undefined {
    return featureDefinitions.find(f => f.id === id);
}

/**
 * Get a feature definition by its drag type
 */
export function getFeatureByDragType(dragType: string): FeatureDefinition | undefined {
    return featureDefinitions.find(f => f.dragType === dragType);
}
