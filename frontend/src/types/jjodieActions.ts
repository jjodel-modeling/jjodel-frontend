/**
 * Jjodie Action Types
 * Type definitions for AI-assisted metamodel modifications
 */

export type JjodieActionType =
    | 'CREATE_METACLASS'
    | 'DELETE_METACLASS'
    | 'ADD_ATTRIBUTE'
    | 'REMOVE_ATTRIBUTE'
    | 'ADD_REFERENCE'
    | 'REMOVE_REFERENCE'
    | 'ADD_CONSTRAINT'
    | 'MODIFY_ATTRIBUTE'
    | 'MODIFY_REFERENCE'
    | 'SET_SUPERCLASS'
    | 'REMOVE_INHERITANCE';

// Action: Create a new metaclass
export interface CreateMetaclassAction {
    type: 'CREATE_METACLASS';
    data: {
        name: string;
        isAbstract?: boolean;
        attributes?: Array<{
            name: string;
            type: string;
            multiplicity?: string;
        }>;
        superclass?: string;
        package?: string;
    };
    confirmationMessage: string;
}

// Action: Delete a metaclass
export interface DeleteMetaclassAction {
    type: 'DELETE_METACLASS';
    data: {
        name: string;
    };
    confirmationMessage: string;
}

// Action: Add an attribute to a metaclass
export interface AddAttributeAction {
    type: 'ADD_ATTRIBUTE';
    data: {
        metaclassName: string;
        attribute: {
            name: string;
            type: string;
            multiplicity?: string;
            defaultValue?: string;
        };
    };
    confirmationMessage: string;
}

// Action: Remove an attribute from a metaclass
export interface RemoveAttributeAction {
    type: 'REMOVE_ATTRIBUTE';
    data: {
        metaclassName: string;
        attributeName: string;
    };
    confirmationMessage: string;
}

// Action: Add a reference between metaclasses
export interface AddReferenceAction {
    type: 'ADD_REFERENCE';
    data: {
        sourceMetaclass: string;
        reference: {
            name: string;
            targetMetaclass: string;
            multiplicity?: string;
            containment?: boolean;
            opposite?: string;
        };
    };
    confirmationMessage: string;
}

// Action: Remove a reference from a metaclass
export interface RemoveReferenceAction {
    type: 'REMOVE_REFERENCE';
    data: {
        metaclassName: string;
        referenceName: string;
    };
    confirmationMessage: string;
}

// Action: Add a constraint to a metaclass
export interface AddConstraintAction {
    type: 'ADD_CONSTRAINT';
    data: {
        metaclassName: string;
        constraint: {
            name: string;
            expression: string;
            message?: string;
        };
    };
    confirmationMessage: string;
}

// Action: Modify an existing attribute
export interface ModifyAttributeAction {
    type: 'MODIFY_ATTRIBUTE';
    data: {
        metaclassName: string;
        attributeName: string;
        changes: {
            name?: string;
            type?: string;
            multiplicity?: string;
            defaultValue?: string;
        };
    };
    confirmationMessage: string;
}

// Action: Modify an existing reference
export interface ModifyReferenceAction {
    type: 'MODIFY_REFERENCE';
    data: {
        metaclassName: string;
        referenceName: string;
        changes: {
            name?: string;
            targetMetaclass?: string;
            multiplicity?: string;
            containment?: boolean;
            opposite?: string;
        };
    };
    confirmationMessage: string;
}

// Action: Set superclass for existing metaclass (inheritance)
export interface SetSuperclassAction {
    type: 'SET_SUPERCLASS';
    data: {
        metaclassName: string;
        superclassName: string;
    };
    confirmationMessage: string;
}

// Action: Remove inheritance from a metaclass
export interface RemoveInheritanceAction {
    type: 'REMOVE_INHERITANCE';
    data: {
        metaclassName: string;
    };
    confirmationMessage: string;
}

// Union type for all actions
export type JjodieAction =
    | CreateMetaclassAction
    | DeleteMetaclassAction
    | AddAttributeAction
    | RemoveAttributeAction
    | AddReferenceAction
    | RemoveReferenceAction
    | AddConstraintAction
    | ModifyAttributeAction
    | ModifyReferenceAction
    | SetSuperclassAction
    | RemoveInheritanceAction;

// Action Suggestion for multi-step workflows
export interface ActionSuggestion {
    id: string;
    title: string;
    description: string;
    icon?: string;
    actions: JjodieAction[];
}

// Response structure from AI
export interface JjodieResponse {
    message: string;
    action?: JjodieAction;           // Single action (backward compatible)
    actions?: JjodieAction[];        // Multiple actions (new format)
    confirmationMessage?: string;    // Overall confirmation for multi-action
    suggestions?: ActionSuggestion[];
}

// Validation result
export interface ActionValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

// Execution result
export interface ActionExecutionResult {
    success: boolean;
    error?: string;
    elementId?: string;
}

// Action category for UI styling
export type ActionCategory = 'create' | 'delete' | 'modify';

// Helper function to get action category
export function getActionCategory(actionType: JjodieActionType): ActionCategory {
    switch (actionType) {
        case 'CREATE_METACLASS':
        case 'ADD_ATTRIBUTE':
        case 'ADD_REFERENCE':
        case 'ADD_CONSTRAINT':
        case 'SET_SUPERCLASS':
            return 'create';
        case 'DELETE_METACLASS':
        case 'REMOVE_ATTRIBUTE':
        case 'REMOVE_REFERENCE':
        case 'REMOVE_INHERITANCE':
            return 'delete';
        case 'MODIFY_ATTRIBUTE':
        case 'MODIFY_REFERENCE':
            return 'modify';
        default:
            return 'modify';
    }
}

// Human-readable action names
export const ACTION_NAMES: Record<JjodieActionType, string> = {
    CREATE_METACLASS: 'Create Metaclass',
    DELETE_METACLASS: 'Delete Metaclass',
    ADD_ATTRIBUTE: 'Add Attribute',
    REMOVE_ATTRIBUTE: 'Remove Attribute',
    ADD_REFERENCE: 'Add Reference',
    REMOVE_REFERENCE: 'Remove Reference',
    ADD_CONSTRAINT: 'Add Constraint',
    MODIFY_ATTRIBUTE: 'Modify Attribute',
    MODIFY_REFERENCE: 'Modify Reference',
    SET_SUPERCLASS: 'Set Inheritance',
    REMOVE_INHERITANCE: 'Remove Inheritance',
};

// Action icons (Bootstrap Icons)
export const ACTION_ICONS: Record<JjodieActionType, string> = {
    CREATE_METACLASS: 'bi-plus-square',
    DELETE_METACLASS: 'bi-trash',
    ADD_ATTRIBUTE: 'bi-tag',
    REMOVE_ATTRIBUTE: 'bi-tag-fill',
    ADD_REFERENCE: 'bi-arrow-right',
    REMOVE_REFERENCE: 'bi-x-circle',
    ADD_CONSTRAINT: 'bi-shield-check',
    MODIFY_ATTRIBUTE: 'bi-pencil',
    MODIFY_REFERENCE: 'bi-pencil-square',
    SET_SUPERCLASS: 'bi-diagram-2',
    REMOVE_INHERITANCE: 'bi-diagram-2-fill',
};

export default JjodieAction;
