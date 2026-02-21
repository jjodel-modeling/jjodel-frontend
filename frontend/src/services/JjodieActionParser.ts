/**
 * Jjodie Action Parser
 * Parses AI responses to extract structured actions
 */

import type {
    JjodieAction,
    JjodieResponse,
    ActionValidationResult,
    JjodieActionType,
} from '../types/jjodieActions';

const VALID_ACTION_TYPES: JjodieActionType[] = [
    'CREATE_METACLASS',
    'DELETE_METACLASS',
    'ADD_ATTRIBUTE',
    'REMOVE_ATTRIBUTE',
    'ADD_REFERENCE',
    'REMOVE_REFERENCE',
    'ADD_CONSTRAINT',
    'MODIFY_ATTRIBUTE',
    'MODIFY_REFERENCE',
    'SET_SUPERCLASS',
    'REMOVE_INHERITANCE',
];

export class JjodieActionParser {
    /**
     * Parse AI response and extract structured actions
     * Supports both single "action" and multiple "actions" formats
     * Strips manual instructions if AI adds them after JSON
     */
    static parse(response: string): JjodieResponse {
        // Try to extract JSON from markdown code block first
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (this.isValidResponse(parsed)) {
                    return this.normalizeResponse(parsed);
                }
            } catch (error) {
                console.warn('Failed to parse JSON block:', error);
            }
        }

        // Try to extract JSON from jjodie-action code block
        const actionMatch = response.match(/```jjodie-action\s*([\s\S]*?)\s*```/);

        if (actionMatch) {
            try {
                const parsed = JSON.parse(actionMatch[1]);
                if (this.isValidAction(parsed)) {
                    // For direct action blocks, use confirmation message as the message
                    return {
                        message: parsed.confirmationMessage || 'I can help you with that.',
                        action: parsed,
                        actions: [parsed],
                        confirmationMessage: parsed.confirmationMessage,
                    };
                }
            } catch (error) {
                console.warn('Failed to parse action block:', error);
            }
        }

        // Try parsing entire response as JSON (for direct JSON responses)
        try {
            const parsed = JSON.parse(response);
            if (this.isValidResponse(parsed)) {
                return this.normalizeResponse(parsed);
            }
        } catch {
            // Not JSON, treat as plain text
        }

        // Plain text response (no action)
        // Strip any manual instructions that follow common patterns
        const cleanMessage = this.stripManualInstructions(response);
        return { message: cleanMessage };
    }

    /**
     * Normalize response to always populate both action and actions fields
     * This ensures backward compatibility while supporting multi-action
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static normalizeResponse(parsed: any): JjodieResponse {
        const message = parsed.message as string;

        // Case 1: Has actions array (new format)
        if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
            const actions = parsed.actions as JjodieAction[];
            const validActions = actions.filter(a => this.isValidAction(a));

            if (validActions.length > 0) {
                return {
                    message,
                    action: validActions[0], // First action for backward compatibility
                    actions: validActions,   // All actions
                    confirmationMessage: (parsed.confirmationMessage as string) ||
                        `Execute ${validActions.length} action${validActions.length > 1 ? 's' : ''}`,
                };
            }
        }

        // Case 2: Has single action (old format)
        if (parsed.action && this.isValidAction(parsed.action)) {
            const action = parsed.action as JjodieAction;
            return {
                message,
                action,
                actions: [action], // Normalize to array
                confirmationMessage: action.confirmationMessage,
            };
        }

        // Case 3: No actions
        return { message };
    }

    /**
     * Strip manual instructions from plain text responses
     * Removes "How to do it manually" type sections
     */
    private static stripManualInstructions(text: string): string {
        // Patterns that indicate manual instructions to strip
        const patterns = [
            /###?\s*(How to|Steps to|To apply|Apply in Jjodel|Manual steps|Here's how)/gi,
            /\n\d+\.\s+(Navigate to|Select|Click|Go to|Open)/gi,
        ];

        for (const pattern of patterns) {
            const match = text.search(pattern);
            if (match > 0) {
                return text.substring(0, match).trim();
            }
        }

        return text;
    }

    /**
     * Check if parsed object is a valid JjodieResponse
     * Supports both single "action" and multiple "actions" formats
     */
    private static isValidResponse(obj: unknown): obj is JjodieResponse {
        if (!obj || typeof obj !== 'object') return false;

        const response = obj as Record<string, unknown>;

        // Must have a message
        if (typeof response.message !== 'string') return false;

        // Check for actions array (new format)
        if (Array.isArray(response.actions)) {
            // At least one action must be valid
            const hasValidAction = response.actions.some(a => this.isValidAction(a));
            if (hasValidAction) return true;
        }

        // Check for single action (old format)
        if (response.action !== undefined) {
            return this.isValidAction(response.action);
        }

        // No actions is also valid (plain message)
        return true;
    }

    /**
     * Check if object is a valid JjodieAction
     */
    private static isValidAction(obj: unknown): obj is JjodieAction {
        if (!obj || typeof obj !== 'object') return false;

        const action = obj as Record<string, unknown>;

        // Must have valid type
        if (!VALID_ACTION_TYPES.includes(action.type as JjodieActionType)) {
            return false;
        }

        // Must have data object
        if (!action.data || typeof action.data !== 'object') {
            return false;
        }

        // Must have confirmation message
        if (typeof action.confirmationMessage !== 'string') {
            return false;
        }

        // Type-specific validation
        return this.validateActionData(action as unknown as JjodieAction);
    }

    /**
     * Validate action data based on type
     */
    private static validateActionData(action: JjodieAction): boolean {
        switch (action.type) {
            case 'CREATE_METACLASS':
                return typeof action.data.name === 'string' && action.data.name.length > 0;

            case 'DELETE_METACLASS':
                return typeof action.data.name === 'string' && action.data.name.length > 0;

            case 'ADD_ATTRIBUTE':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    action.data.attribute &&
                    typeof action.data.attribute.name === 'string' &&
                    typeof action.data.attribute.type === 'string'
                );

            case 'REMOVE_ATTRIBUTE':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    typeof action.data.attributeName === 'string'
                );

            case 'ADD_REFERENCE':
                return (
                    typeof action.data.sourceMetaclass === 'string' &&
                    action.data.reference &&
                    typeof action.data.reference.name === 'string' &&
                    typeof action.data.reference.targetMetaclass === 'string'
                );

            case 'REMOVE_REFERENCE':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    typeof action.data.referenceName === 'string'
                );

            case 'ADD_CONSTRAINT':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    action.data.constraint &&
                    typeof action.data.constraint.name === 'string' &&
                    typeof action.data.constraint.expression === 'string'
                );

            case 'MODIFY_ATTRIBUTE':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    typeof action.data.attributeName === 'string' &&
                    action.data.changes &&
                    typeof action.data.changes === 'object'
                );

            case 'MODIFY_REFERENCE':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    typeof action.data.referenceName === 'string' &&
                    action.data.changes &&
                    typeof action.data.changes === 'object'
                );

            case 'SET_SUPERCLASS':
                return (
                    typeof action.data.metaclassName === 'string' &&
                    typeof action.data.superclassName === 'string'
                );

            case 'REMOVE_INHERITANCE':
                return typeof action.data.metaclassName === 'string';

            default:
                return false;
        }
    }

    /**
     * Validate action against current metamodel state
     */
    static validateAgainstMetamodel(
        action: JjodieAction,
        existingClasses: string[],
        existingAttributes: Map<string, string[]>,
        existingReferences: Map<string, string[]>
    ): ActionValidationResult {
        const warnings: string[] = [];

        switch (action.type) {
            case 'CREATE_METACLASS': {
                // Check for duplicate name
                if (existingClasses.includes(action.data.name)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.name}" already exists`,
                    };
                }
                // Check if superclass exists
                if (action.data.superclass && !existingClasses.includes(action.data.superclass)) {
                    return {
                        valid: false,
                        error: `Superclass "${action.data.superclass}" does not exist`,
                    };
                }
                break;
            }

            case 'DELETE_METACLASS': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.name)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.name}" does not exist`,
                    };
                }
                // Warn about references
                warnings.push('Deleting this metaclass will also remove all its attributes and references');
                break;
            }

            case 'ADD_ATTRIBUTE': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.metaclassName}" does not exist`,
                    };
                }
                // Check for duplicate attribute
                const classAttrs = existingAttributes.get(action.data.metaclassName) || [];
                if (classAttrs.includes(action.data.attribute.name)) {
                    return {
                        valid: false,
                        error: `Attribute "${action.data.attribute.name}" already exists in "${action.data.metaclassName}"`,
                    };
                }
                break;
            }

            case 'REMOVE_ATTRIBUTE': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.metaclassName}" does not exist`,
                    };
                }
                // Check if attribute exists
                const attrs = existingAttributes.get(action.data.metaclassName) || [];
                if (!attrs.includes(action.data.attributeName)) {
                    return {
                        valid: false,
                        error: `Attribute "${action.data.attributeName}" does not exist in "${action.data.metaclassName}"`,
                    };
                }
                break;
            }

            case 'ADD_REFERENCE': {
                // Check if source metaclass exists
                if (!existingClasses.includes(action.data.sourceMetaclass)) {
                    return {
                        valid: false,
                        error: `Source metaclass "${action.data.sourceMetaclass}" does not exist`,
                    };
                }
                // Check if target metaclass exists
                if (!existingClasses.includes(action.data.reference.targetMetaclass)) {
                    return {
                        valid: false,
                        error: `Target metaclass "${action.data.reference.targetMetaclass}" does not exist`,
                    };
                }
                // Check for duplicate reference
                const classRefs = existingReferences.get(action.data.sourceMetaclass) || [];
                if (classRefs.includes(action.data.reference.name)) {
                    return {
                        valid: false,
                        error: `Reference "${action.data.reference.name}" already exists in "${action.data.sourceMetaclass}"`,
                    };
                }
                break;
            }

            case 'REMOVE_REFERENCE': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.metaclassName}" does not exist`,
                    };
                }
                // Check if reference exists
                const refs = existingReferences.get(action.data.metaclassName) || [];
                if (!refs.includes(action.data.referenceName)) {
                    return {
                        valid: false,
                        error: `Reference "${action.data.referenceName}" does not exist in "${action.data.metaclassName}"`,
                    };
                }
                break;
            }

            case 'ADD_CONSTRAINT': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.metaclassName}" does not exist`,
                    };
                }
                break;
            }

            case 'MODIFY_ATTRIBUTE':
            case 'MODIFY_REFERENCE': {
                // Check if metaclass exists
                const metaclassName = action.data.metaclassName;
                if (!existingClasses.includes(metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${metaclassName}" does not exist`,
                    };
                }
                break;
            }

            case 'SET_SUPERCLASS': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.metaclassName}" does not exist`,
                    };
                }
                // Check if superclass exists
                if (!existingClasses.includes(action.data.superclassName)) {
                    return {
                        valid: false,
                        error: `Superclass "${action.data.superclassName}" does not exist`,
                    };
                }
                // Check for self-reference
                if (action.data.metaclassName === action.data.superclassName) {
                    return {
                        valid: false,
                        error: 'A metaclass cannot extend itself',
                    };
                }
                warnings.push('Changing inheritance may affect existing models');
                break;
            }

            case 'REMOVE_INHERITANCE': {
                // Check if metaclass exists
                if (!existingClasses.includes(action.data.metaclassName)) {
                    return {
                        valid: false,
                        error: `Metaclass "${action.data.metaclassName}" does not exist`,
                    };
                }
                warnings.push('Removing inheritance may affect inherited attributes/references');
                break;
            }
        }

        return {
            valid: true,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    /**
     * Format action for display in confirmation UI
     */
    static formatActionDetails(action: JjodieAction): string[] {
        const details: string[] = [];

        switch (action.type) {
            case 'CREATE_METACLASS':
                details.push(`Name: ${action.data.name}`);
                if (action.data.isAbstract) details.push('Abstract: Yes');
                if (action.data.superclass) details.push(`Extends: ${action.data.superclass}`);
                if (action.data.attributes && action.data.attributes.length > 0) {
                    details.push('Attributes:');
                    action.data.attributes.forEach(attr => {
                        details.push(`  - ${attr.name}: ${attr.type}${attr.multiplicity ? ` [${attr.multiplicity}]` : ''}`);
                    });
                }
                break;

            case 'DELETE_METACLASS':
                details.push(`Metaclass: ${action.data.name}`);
                break;

            case 'ADD_ATTRIBUTE':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Attribute: ${action.data.attribute.name}`);
                details.push(`Type: ${action.data.attribute.type}`);
                if (action.data.attribute.multiplicity) {
                    details.push(`Multiplicity: ${action.data.attribute.multiplicity}`);
                }
                break;

            case 'REMOVE_ATTRIBUTE':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Attribute: ${action.data.attributeName}`);
                break;

            case 'ADD_REFERENCE':
                details.push(`From: ${action.data.sourceMetaclass}`);
                details.push(`To: ${action.data.reference.targetMetaclass}`);
                details.push(`Name: ${action.data.reference.name}`);
                if (action.data.reference.multiplicity) {
                    details.push(`Multiplicity: ${action.data.reference.multiplicity}`);
                }
                if (action.data.reference.containment) {
                    details.push('Containment: Yes');
                }
                break;

            case 'REMOVE_REFERENCE':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Reference: ${action.data.referenceName}`);
                break;

            case 'ADD_CONSTRAINT':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Constraint: ${action.data.constraint.name}`);
                details.push(`Expression: ${action.data.constraint.expression}`);
                break;

            case 'MODIFY_ATTRIBUTE':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Attribute: ${action.data.attributeName}`);
                details.push('Changes:');
                Object.entries(action.data.changes).forEach(([key, value]) => {
                    if (value !== undefined) {
                        details.push(`  - ${key}: ${value}`);
                    }
                });
                break;

            case 'MODIFY_REFERENCE':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Reference: ${action.data.referenceName}`);
                details.push('Changes:');
                Object.entries(action.data.changes).forEach(([key, value]) => {
                    if (value !== undefined) {
                        details.push(`  - ${key}: ${value}`);
                    }
                });
                break;

            case 'SET_SUPERCLASS':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                details.push(`Extends: ${action.data.superclassName}`);
                break;

            case 'REMOVE_INHERITANCE':
                details.push(`Metaclass: ${action.data.metaclassName}`);
                break;
        }

        return details;
    }
}

export default JjodieActionParser;
