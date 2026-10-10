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
    parentId?: string;      // Parent feature ID for nested features
}

// Top-level features
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
    },
    /*{
        id: '*',
        name: 'Global',
        icon: '*',
        description: '',
        dragType: 'FEATURE_PACKAGE',
        defaultData: {
            name: '*',
            elements: []
        }
    },*/
    {
        id: 'annotation',
        name: 'Annotation',
        icon: 'code', // other candidates: puzzle, hexagon, diamond
        description: 'Add annotation',
        dragType: 'ANNOTATION',
        parentId: '*',
        defaultData: {
            name: 'newAnnotation',
            returnType: 'void',
        }
    }
];

// Sub-features that appear when a parent is selected
export const subFeatureDefinitions: FeatureDefinition[] = [
    // Class sub-features
    {
        id: 'attribute',
        name: 'Attribute',
        icon: 'tag',
        description: 'Add an attribute to a class',
        dragType: 'FEATURE_ATTRIBUTE',
        parentId: 'class',
        defaultData: {
            name: 'newAttribute',
            type: 'String'
        }
    },
    {
        id: 'reference',
        name: 'Reference',
        icon: 'link-45deg',
        description: 'Add a reference to another class',
        dragType: 'FEATURE_REFERENCE',
        parentId: 'class',
        defaultData: {
            name: 'newReference',
            type: null,
            containment: false
        }
    },
    {
        id: 'operation',
        name: 'Operation',
        icon: 'gear',
        description: 'Add an operation to a class',
        dragType: 'FEATURE_OPERATION',
        parentId: 'class',
        defaultData: {
            name: 'newOperation',
            returnType: 'void',
            parameters: []
        }
    },
    {
        id: 'type',
        name: 'Generic type',
        icon: 'code', // other candidates: puzzle, hexagon, diamond
        description: 'Add generic type declaration',
        dragType: 'FEATURE_GENERICS',
        parentId: 'class',
        defaultData: {
            name: 'newGenericType',
            returnType: 'void',
        }
    },
    // Enumerator sub-features
    {
        id: 'literal',
        name: 'Literal',
        icon: 'hash',
        description: 'Add a literal value to an enumeration',
        dragType: 'FEATURE_LITERAL',
        parentId: 'enumerator',
        defaultData: {
            name: 'NEW_LITERAL',
            value: null
        }
    },
    {
        id: 'parameter',
        name: 'Parameter',
        icon: 'box-arrow-in-right',
        description: 'Add an argument to this operation',
        dragType: 'PARAMETER',
        parentId: 'class',
        defaultData: {
            name: 'newParameter',
            returnType: 'void',
            parameters: []
        }
    },
    /*{
        id: 'type',
        name: 'Generic type',
        icon: 'code', // other candidates: puzzle, hexagon, diamond
        description: 'Add generic type declaration',
        dragType: 'FEATURE_GENERICS',
        parentId: 'operation',
        defaultData: {
            name: 'newGenericType',
            returnType: 'void',
            parameters: []
        }
    },
    {
        id: 'annotation',
        name: 'Annotation',
        icon: 'code', // other candidates: puzzle, hexagon, diamond
        description: 'Add annotation',
        dragType: 'ANNOTATION',
        parentId: '*',
        defaultData: {
            name: 'newAnnotation',
            returnType: 'void',
            parameters: []
        }
    },*/
];

/**
 * Get a feature definition by its ID
 */
export function getFeatureById(id: string): FeatureDefinition | undefined {
    return [...featureDefinitions, ...subFeatureDefinitions].find(f => f.id === id);
}

/**
 * Get a feature definition by its drag type
 */
export function getFeatureByDragType(dragType: string): FeatureDefinition | undefined {
    return [...featureDefinitions, ...subFeatureDefinitions].find(f => f.dragType === dragType);
}

/**
 * Get sub-features for a given parent feature ID
 */
export function getSubFeatures(parentId: string): FeatureDefinition[] {
    return subFeatureDefinitions.filter(f => f.parentId === parentId);
}

/**
 * Check if a feature has sub-features
export function hasSubFeatures(featureId: string): boolean {
    return subFeatureDefinitions.some(f => f.parentId === featureId);
}

*/