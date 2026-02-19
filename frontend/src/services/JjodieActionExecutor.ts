/**
 * Jjodie Action Executor
 * Executes validated actions on the metamodel
 */

import type {
    JjodieAction,
    ActionExecutionResult,
    CreateMetaclassAction,
    DeleteMetaclassAction,
    AddAttributeAction,
    RemoveAttributeAction,
    AddReferenceAction,
    RemoveReferenceAction,
    AddConstraintAction,
    ModifyAttributeAction,
    ModifyReferenceAction,
    SetSuperclassAction,
    RemoveInheritanceAction,
} from '../types/jjodieActions';
import type { LProject, LClass, LPackage, LAttribute, LReference } from '../joiner';
import { TRANSACTION } from '../redux/action/action';

export class JjodieActionExecutor {
    /**
     * Execute an action on the metamodel
     */
    static async execute(
        action: JjodieAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        try {
            switch (action.type) {
                case 'CREATE_METACLASS':
                    return await this.createMetaclass(action, project);
                case 'DELETE_METACLASS':
                    return await this.deleteMetaclass(action, project);
                case 'ADD_ATTRIBUTE':
                    return await this.addAttribute(action, project);
                case 'REMOVE_ATTRIBUTE':
                    return await this.removeAttribute(action, project);
                case 'ADD_REFERENCE':
                    return await this.addReference(action, project);
                case 'REMOVE_REFERENCE':
                    return await this.removeReference(action, project);
                case 'ADD_CONSTRAINT':
                    return await this.addConstraint(action, project);
                case 'MODIFY_ATTRIBUTE':
                    return await this.modifyAttribute(action, project);
                case 'MODIFY_REFERENCE':
                    return await this.modifyReference(action, project);
                case 'SET_SUPERCLASS':
                    return await this.setSuperclass(action, project);
                case 'REMOVE_INHERITANCE':
                    return await this.removeInheritance(action, project);
                default:
                    return { success: false, error: 'Unknown action type' };
            }
        } catch (error) {
            console.error('Action execution error:', error);
            return {
                success: false,
                error: (error as Error).message || 'Execution failed',
            };
        }
    }

    /**
     * Create a new metaclass
     */
    private static async createMetaclass(
        action: CreateMetaclassAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Create metaclass ${action.data.name}`, () => {
                try {
                    // Get the first package or create one
                    let pkg: LPackage | undefined = project.packages?.[0];
                    if (!pkg) {
                        // Try to get from metamodels
                        const metamodel = project.metamodels?.[0];
                        if (metamodel) {
                            pkg = metamodel.packages?.[0];
                            if (!pkg) {
                                pkg = metamodel.addPackage('default');
                            }
                        }
                    }

                    if (!pkg) {
                        resolve({ success: false, error: 'No package found to create metaclass in' });
                        return;
                    }

                    // Create the metaclass
                    const newClass: LClass = pkg.addClass(
                        action.data.name,
                        false, // isInterface
                        action.data.isAbstract || false,
                        false, // isPrimitive
                        false, // isPartial
                        undefined // partialDefaultName
                    );

                    // Add attributes if specified
                    if (action.data.attributes && action.data.attributes.length > 0) {
                        action.data.attributes.forEach(attr => {
                            newClass.addAttribute(attr.name, attr.type);
                        });
                    }

                    // Set superclass if specified
                    if (action.data.superclass) {
                        const superClass = this.findClassByName(project, action.data.superclass);
                        if (superClass) {
                            (newClass as any).extends = [superClass.id];
                        }
                    }

                    // Dispatch event to notify UI
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: newClass.id }
                    }));

                    resolve({ success: true, elementId: newClass.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Delete a metaclass
     */
    private static async deleteMetaclass(
        action: DeleteMetaclassAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Delete metaclass ${action.data.name}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.name);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.name}" not found` });
                        return;
                    }

                    // Delete the metaclass
                    targetClass.delete();

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action }
                    }));

                    resolve({ success: true });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Add an attribute to a metaclass
     */
    private static async addAttribute(
        action: AddAttributeAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Add attribute ${action.data.attribute.name}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    // Add the attribute
                    const newAttr: LAttribute = targetClass.addAttribute(
                        action.data.attribute.name,
                        action.data.attribute.type
                    );

                    // Set multiplicity if specified
                    if (action.data.attribute.multiplicity) {
                        const bounds = this.parseMultiplicity(action.data.attribute.multiplicity);
                        if (bounds) {
                            (newAttr as any).lowerBound = bounds.lower;
                            (newAttr as any).upperBound = bounds.upper;
                        }
                    }

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: newAttr.id }
                    }));

                    resolve({ success: true, elementId: newAttr.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Remove an attribute from a metaclass
     */
    private static async removeAttribute(
        action: RemoveAttributeAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Remove attribute ${action.data.attributeName}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    // Find and delete the attribute
                    const attr = targetClass.attributes?.find(
                        (a: LAttribute) => a.name === action.data.attributeName
                    );

                    if (!attr) {
                        resolve({ success: false, error: `Attribute "${action.data.attributeName}" not found` });
                        return;
                    }

                    attr.delete();

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action }
                    }));

                    resolve({ success: true });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Add a reference between metaclasses
     */
    private static async addReference(
        action: AddReferenceAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Add reference ${action.data.reference.name}`, () => {
                try {
                    const sourceClass = this.findClassByName(project, action.data.sourceMetaclass);
                    const targetClass = this.findClassByName(project, action.data.reference.targetMetaclass);

                    if (!sourceClass) {
                        resolve({ success: false, error: `Source metaclass "${action.data.sourceMetaclass}" not found` });
                        return;
                    }

                    if (!targetClass) {
                        resolve({ success: false, error: `Target metaclass "${action.data.reference.targetMetaclass}" not found` });
                        return;
                    }

                    // Add the reference
                    const newRef: LReference = sourceClass.addReference(
                        action.data.reference.name,
                        targetClass.id
                    );

                    // Set containment if specified
                    if (action.data.reference.containment) {
                        (newRef as any).containment = true;
                    }

                    // Set multiplicity if specified
                    if (action.data.reference.multiplicity) {
                        const bounds = this.parseMultiplicity(action.data.reference.multiplicity);
                        if (bounds) {
                            (newRef as any).lowerBound = bounds.lower;
                            (newRef as any).upperBound = bounds.upper;
                        }
                    }

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: newRef.id }
                    }));

                    resolve({ success: true, elementId: newRef.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Remove a reference from a metaclass
     */
    private static async removeReference(
        action: RemoveReferenceAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Remove reference ${action.data.referenceName}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    // Find and delete the reference
                    const ref = targetClass.references?.find(
                        (r: LReference) => r.name === action.data.referenceName
                    );

                    if (!ref) {
                        resolve({ success: false, error: `Reference "${action.data.referenceName}" not found` });
                        return;
                    }

                    ref.delete();

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action }
                    }));

                    resolve({ success: true });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Add a constraint to a metaclass
     */
    private static async addConstraint(
        action: AddConstraintAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Add constraint ${action.data.constraint.name}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    // Add constraint - this depends on the specific implementation
                    // For now, store in annotations or a constraints field if available
                    console.log('Adding constraint:', action.data.constraint);

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action }
                    }));

                    resolve({ success: true });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Modify an existing attribute
     */
    private static async modifyAttribute(
        action: ModifyAttributeAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Modify attribute ${action.data.attributeName}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    const attr = targetClass.attributes?.find(
                        (a: LAttribute) => a.name === action.data.attributeName
                    );

                    if (!attr) {
                        resolve({ success: false, error: `Attribute "${action.data.attributeName}" not found` });
                        return;
                    }

                    // Apply changes
                    const changes = action.data.changes;
                    if (changes.name !== undefined) {
                        (attr as any).name = changes.name;
                    }
                    if (changes.type !== undefined) {
                        (attr as any).type = changes.type;
                    }
                    if (changes.multiplicity !== undefined) {
                        const bounds = this.parseMultiplicity(changes.multiplicity);
                        if (bounds) {
                            (attr as any).lowerBound = bounds.lower;
                            (attr as any).upperBound = bounds.upper;
                        }
                    }

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: attr.id }
                    }));

                    resolve({ success: true, elementId: attr.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Modify an existing reference
     */
    private static async modifyReference(
        action: ModifyReferenceAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Modify reference ${action.data.referenceName}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    const ref = targetClass.references?.find(
                        (r: LReference) => r.name === action.data.referenceName
                    );

                    if (!ref) {
                        resolve({ success: false, error: `Reference "${action.data.referenceName}" not found` });
                        return;
                    }

                    // Apply changes
                    const changes = action.data.changes;
                    if (changes.name !== undefined) {
                        (ref as any).name = changes.name;
                    }
                    if (changes.targetMetaclass !== undefined) {
                        const newTarget = this.findClassByName(project, changes.targetMetaclass);
                        if (newTarget) {
                            (ref as any).type = newTarget.id;
                        }
                    }
                    if (changes.multiplicity !== undefined) {
                        const bounds = this.parseMultiplicity(changes.multiplicity);
                        if (bounds) {
                            (ref as any).lowerBound = bounds.lower;
                            (ref as any).upperBound = bounds.upper;
                        }
                    }
                    if (changes.containment !== undefined) {
                        (ref as any).containment = changes.containment;
                    }

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: ref.id }
                    }));

                    resolve({ success: true, elementId: ref.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Set superclass for an existing metaclass (inheritance)
     */
    private static async setSuperclass(
        action: SetSuperclassAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Set ${action.data.metaclassName} extends ${action.data.superclassName}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);
                    const superClass = this.findClassByName(project, action.data.superclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    if (!superClass) {
                        resolve({ success: false, error: `Superclass "${action.data.superclassName}" not found` });
                        return;
                    }

                    // Check for circular inheritance
                    if (this.wouldCreateCircularInheritance(project, targetClass, superClass)) {
                        resolve({ success: false, error: 'Cannot create circular inheritance' });
                        return;
                    }

                    // Set the superclass (extends)
                    (targetClass as any).extends = [superClass.id];

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: targetClass.id }
                    }));

                    resolve({ success: true, elementId: targetClass.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Remove inheritance from a metaclass
     */
    private static async removeInheritance(
        action: RemoveInheritanceAction,
        project: LProject
    ): Promise<ActionExecutionResult> {
        return new Promise((resolve) => {
            TRANSACTION(`Jjodie: Remove inheritance from ${action.data.metaclassName}`, () => {
                try {
                    const targetClass = this.findClassByName(project, action.data.metaclassName);

                    if (!targetClass) {
                        resolve({ success: false, error: `Metaclass "${action.data.metaclassName}" not found` });
                        return;
                    }

                    // Clear the extends field
                    (targetClass as any).extends = [];

                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('jjodie:metamodel-updated', {
                        detail: { projectId: project.id, action, elementId: targetClass.id }
                    }));

                    resolve({ success: true, elementId: targetClass.id });
                } catch (err) {
                    resolve({ success: false, error: (err as Error).message });
                }
            });
        });
    }

    /**
     * Helper: Check if setting a superclass would create circular inheritance
     */
    private static wouldCreateCircularInheritance(
        project: LProject,
        targetClass: LClass,
        potentialSuperclass: LClass
    ): boolean {
        // Check if potentialSuperclass inherits from targetClass (directly or indirectly)
        const visited = new Set<string>();
        const checkAncestors = (cls: LClass): boolean => {
            if (visited.has(cls.id)) return false;
            visited.add(cls.id);

            const extendsIds = (cls as any).extends;
            if (!extendsIds || extendsIds.length === 0) return false;

            for (const parentId of extendsIds) {
                if (parentId === targetClass.id) return true;
                const parentClass = project.classes?.find((c: LClass) => c.id === parentId);
                if (parentClass && checkAncestors(parentClass)) return true;
            }
            return false;
        };

        return checkAncestors(potentialSuperclass);
    }

    /**
     * Helper: Find a class by name in the project
     */
    private static findClassByName(project: LProject, name: string): LClass | undefined {
        if (!project.classes) return undefined;
        return project.classes.find((c: LClass) => c.name === name);
    }

    /**
     * Helper: Parse multiplicity string to bounds
     */
    private static parseMultiplicity(mult: string): { lower: number; upper: number } | null {
        const trimmed = mult.trim();

        // Handle common patterns
        if (trimmed === '1' || trimmed === '[1]') return { lower: 1, upper: 1 };
        if (trimmed === '*' || trimmed === '0..*' || trimmed === '[0..*]') return { lower: 0, upper: -1 };
        if (trimmed === '1..*' || trimmed === '[1..*]') return { lower: 1, upper: -1 };
        if (trimmed === '0..1' || trimmed === '[0..1]' || trimmed === '?') return { lower: 0, upper: 1 };

        // Parse n..m pattern
        const match = trimmed.match(/^\[?(\d+)\.\.(\d+|\*)\]?$/);
        if (match) {
            return {
                lower: parseInt(match[1], 10),
                upper: match[2] === '*' ? -1 : parseInt(match[2], 10),
            };
        }

        // Parse single number
        const singleMatch = trimmed.match(/^\[?(\d+)\]?$/);
        if (singleMatch) {
            const n = parseInt(singleMatch[1], 10);
            return { lower: n, upper: n };
        }

        return null;
    }

    /**
     * Get a success message for an action
     */
    static getSuccessMessage(action: JjodieAction): string {
        switch (action.type) {
            case 'CREATE_METACLASS':
                return `Created metaclass "${action.data.name}"`;
            case 'DELETE_METACLASS':
                return `Deleted metaclass "${action.data.name}"`;
            case 'ADD_ATTRIBUTE':
                return `Added attribute "${action.data.attribute.name}" to "${action.data.metaclassName}"`;
            case 'REMOVE_ATTRIBUTE':
                return `Removed attribute "${action.data.attributeName}" from "${action.data.metaclassName}"`;
            case 'ADD_REFERENCE':
                return `Added reference "${action.data.reference.name}" from "${action.data.sourceMetaclass}" to "${action.data.reference.targetMetaclass}"`;
            case 'REMOVE_REFERENCE':
                return `Removed reference "${action.data.referenceName}" from "${action.data.metaclassName}"`;
            case 'ADD_CONSTRAINT':
                return `Added constraint "${action.data.constraint.name}" to "${action.data.metaclassName}"`;
            case 'MODIFY_ATTRIBUTE':
                return `Modified attribute "${action.data.attributeName}" in "${action.data.metaclassName}"`;
            case 'MODIFY_REFERENCE':
                return `Modified reference "${action.data.referenceName}" in "${action.data.metaclassName}"`;
            case 'SET_SUPERCLASS':
                return `Set "${action.data.metaclassName}" to extend "${action.data.superclassName}"`;
            case 'REMOVE_INHERITANCE':
                return `Removed inheritance from "${action.data.metaclassName}"`;
            default:
                return 'Action completed successfully';
        }
    }
}

export default JjodieActionExecutor;
