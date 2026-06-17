/**
 * JjScript M1 Instance Command Handlers
 *
 * Handles operations on DObject instances inside an M1 model:
 *   create instance <ClassName> ["<instanceName>"]
 *   delete <InstanceName>          (in M1 context)
 *   rename <InstanceName> to <newName>   (in M1 context)
 *   set <InstanceName>.<attrName> = <value>   (in M1 context, attribute or reference)
 *
 * Pattern source (canvasToJjom.ts):
 *   - DObject.new(metaclassId, modelId, DModel, name, true)   — NOT inside TRANSACTION
 *   - (lObject as any)['$' + featureName].value = newValue    — inside TRANSACTION (single value)
 *   - refProxy.values = [...meaningful, targetObject.id]      — inside TRANSACTION (multi-value / reference)
 *
 * Reference (link) semantics:
 *   In M1, `set X.refName = Y` where refName is a metaclass reference appends Y's id
 *   to the reference values array (mirroring syncCreateReferenceLink).
 *   Setting to null clears the reference (unlink).
 */

import {
    CreateArgs,
    DeleteArgs,
    RenameArgs,
    SetArgs,
    ExecutionResult,
    ExecutionContext,
    LiteralValue,
    QualifiedName,
} from '../../types';
import { qualifiedNameToString, literalValueToString } from '../../parser/grammar';

import {
    DObject,
    DModel,
    DeleteElementAction,
    SetFieldAction,
    TRANSACTION,
    LPointerTargetable,
    LModel,
    LProject,
    LClass,
} from '../../../joiner';

// ============================================
// SHARED HELPERS
// ============================================

/**
 * Resolve the M1 target model from the execution context.
 * Returns null with an error message if the context is not properly set up.
 */
function resolveTargetModel(context: ExecutionContext, project: LProject): LModel | null {
    if (!context.modelId) return null;
    const models = (project as any).models || [];
    const model = models.find((m: LModel) => m.id === context.modelId && !m.isMetamodel);
    return model ?? null;
}

/**
 * Resolve the metamodel of conformity for the active M1 model.
 */
function resolveMetamodel(context: ExecutionContext, project: LProject): LModel | null {
    if (!context.targetMetamodelId) return null;
    const metamodels = (project as any).metamodels || [];
    return metamodels.find((m: LModel) => m.id === context.targetMetamodelId) ?? null;
}

/**
 * Find a metaclass by name across the metamodel (model-level + packages, recursively).
 * Mirrors useEditorMode.ts' class collection: classes can sit at the model level OR
 * inside packages/subpackages.
 */
function findMetaclassByName(metamodel: LModel, className: string): LClass | null {
    const visited = new Set<string>();
    const stack: any[] = [metamodel];

    while (stack.length > 0) {
        const container = stack.pop();
        if (!container || visited.has(container.id)) continue;
        visited.add(container.id);

        const classes = container.classes ?? [];
        for (const c of classes) {
            if (c?.name === className) return c as LClass;
        }

        const subpackages = container.subpackages ?? container.subPackages ?? [];
        for (const sp of subpackages) stack.push(sp);

        const packages = container.packages ?? [];
        for (const p of packages) stack.push(p);
    }

    return null;
}

/**
 * Find an instance by name in the target M1 model.
 */
function findInstanceByName(model: LModel, instanceName: string): any | null {
    const objects = (model as any).objects ?? [];
    return objects.find((o: any) => o?.name === instanceName) ?? null;
}

/**
 * Generate a unique default name for a new instance.
 * Strategy: <ClassName>, <ClassName>2, <ClassName>3, ... — same as the visual editor.
 */
function generateInstanceName(className: string, model: LModel): string {
    const objects = (model as any).objects ?? [];
    const taken = new Set<string>(
        objects.map((o: any) => o?.name).filter((n: any) => typeof n === 'string')
    );
    if (!taken.has(className)) return className;
    let i = 2;
    while (taken.has(`${className}${i}`)) i++;
    return `${className}${i}`;
}

/**
 * Determine if a metaclass property name is an attribute, a reference, or unknown.
 * Walks the inheritance chain via allAttributes/allReferences (proxy getters).
 */
type PropertyKind = 'attribute' | 'reference' | 'unknown';

function classifyMetaclassProperty(metaclass: LClass, propName: string): PropertyKind {
    const attrs: any[] = (metaclass as any).allAttributes ?? (metaclass as any).attributes ?? [];
    if (attrs.some((a) => a?.name === propName)) return 'attribute';

    const refs: any[] = (metaclass as any).allReferences ?? (metaclass as any).references ?? [];
    if (refs.some((r) => r?.name === propName)) return 'reference';

    return 'unknown';
}

/**
 * Convert a JjScript literal/qualified-name value into a primitive for an attribute set.
 */
function literalToPrimitive(value: LiteralValue): string | number | boolean | null {
    switch (value.kind) {
        case 'null':    return null;
        case 'boolean': return value.value;
        case 'number':  return value.value;
        case 'string':  return value.value;
        default:        return null;
    }
}

// ============================================
// CREATE INSTANCE
// ============================================

export async function executeCreateInstance(
    args: CreateArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'create',
            message: 'create instance requires an M1 model editor',
            errors: [{
                code: 'WRONG_LEVEL',
                message: 'This command creates instances. Open a model editor (M1) to use it.'
            }]
        };
    }

    const className = args.name;  // grammar: create instance <ClassName> ["<name>"]
    const explicitInstanceName =
        args.options?.defaultValue?.kind === 'string'
            ? args.options.defaultValue.value
            : undefined;

    const metamodel = resolveMetamodel(context, project);
    if (!metamodel) {
        return {
            success: false,
            command: 'create',
            message: 'No metamodel of conformity in context',
            errors: [{ code: 'NO_METAMODEL', message: 'Cannot resolve metamodel for the active M1 model' }]
        };
    }

    const metaclass = findMetaclassByName(metamodel, className);
    if (!metaclass) {
        return {
            success: false,
            command: 'create',
            message: `Class '${className}' not found in metamodel`,
            errors: [{
                code: 'CLASS_NOT_FOUND',
                message: `Metaclass '${className}' does not exist in metamodel '${metamodel.name}'`
            }]
        };
    }

    if ((metaclass as any).abstract) {
        return {
            success: false,
            command: 'create',
            message: `Cannot instantiate abstract class '${className}'`,
            errors: [{
                code: 'ABSTRACT_CLASS',
                message: `'${className}' is abstract — pick a concrete subclass`
            }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'create',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot create instance — no active M1 model' }]
        };
    }

    const instanceName = explicitInstanceName ?? generateInstanceName(className, targetModel);

    try {
        // DObject.new(instanceof, father, fatherType, name, persist)
        // Pattern source: canvasToJjom.ts:1097 — do NOT wrap in outer TRANSACTION.
        const dObject = (DObject as any).new(
            metaclass.id,
            targetModel.id,
            DModel,
            instanceName,
            true
        );

        // Apply the explicit instance name to initialName as well. DObject.new always
        // stamps initialName with the auto default (<Class>_<N>), and the M1 identity-slot
        // value getter (LModelElement.tsx ~7280) surfaces initialName BEFORE data.name for an
        // empty name:EString slot — so without this the quoted name is shadowed (displayed as
        // <Class>_<N> and not addressable by findInstanceByName). Direct assignment mirrors
        // DObject.new's own `ret.initialName = ...` write (no TRANSACTION — see §3.3).
        // See docs/discovery/2026-06-12_create_instance_name_regression.md.
        if (explicitInstanceName && dObject) {
            (dObject as any).initialName = explicitInstanceName;
        }

        if (!dObject?.id) {
            return {
                success: false,
                command: 'create',
                message: `Failed to create instance '${instanceName}'`,
                errors: [{ code: 'CREATE_INSTANCE_ERROR', message: 'DObject.new returned null' }]
            };
        }

        return {
            success: true,
            command: 'create',
            message: `Created instance '${instanceName}' of ${className}`,
            data: {
                id: dObject.id,
                name: instanceName,
                type: 'instance',
                className: className
            },
            affectedElements: [dObject.id],
            undoable: true
        };
    } catch (error) {
        return {
            success: false,
            command: 'create',
            message: `Failed to create instance: ${(error as Error).message}`,
            errors: [{ code: 'CREATE_INSTANCE_ERROR', message: (error as Error).message }]
        };
    }
}

// ============================================
// DELETE INSTANCE
// ============================================

export async function executeDeleteInstance(
    args: DeleteArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'delete',
            message: 'delete instance requires an M1 model editor',
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a model editor (M1) to delete instances' }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'delete',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot delete instance — no active M1 model' }]
        };
    }

    const instanceName = args.target.segments.join('::') || args.target.raw; // instance name from segments; raw may carry a dotted '.property' member (P0b)
    const lObject = findInstanceByName(targetModel, instanceName);
    if (!lObject) {
        return {
            success: false,
            command: 'delete',
            message: `Instance '${instanceName}' not found in active model`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${instanceName}' in '${targetModel.name}'`
            }]
        };
    }

    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Delete instance', () => {
                DeleteElementAction.new((lObject as any).__raw ?? lObject);
                resolve({
                    success: true,
                    command: 'delete',
                    message: `Deleted instance '${instanceName}'`,
                    data: { id: lObject.id, name: instanceName, type: 'instance' },
                    affectedElements: [lObject.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'delete',
                message: `Failed to delete instance: ${(error as Error).message}`,
                errors: [{ code: 'DELETE_INSTANCE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

// ============================================
// RENAME INSTANCE
// ============================================

export async function executeRenameInstance(
    args: RenameArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'rename',
            message: 'rename instance requires an M1 model editor',
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a model editor (M1) to rename instances' }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'rename',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot rename instance — no active M1 model' }]
        };
    }

    const instanceName = args.target.segments.join('::') || args.target.raw; // instance name from segments; raw may carry a dotted '.property' member (P0b)
    const lObject = findInstanceByName(targetModel, instanceName);
    if (!lObject) {
        return {
            success: false,
            command: 'rename',
            message: `Instance '${instanceName}' not found in active model`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${instanceName}' in '${targetModel.name}'`
            }]
        };
    }

    // Name conflict check
    const conflict = findInstanceByName(targetModel, args.newName);
    if (conflict && conflict.id !== lObject.id) {
        return {
            success: false,
            command: 'rename',
            message: `An instance named '${args.newName}' already exists`,
            errors: [{ code: 'NAME_CONFLICT', message: `Pick a different name` }]
        };
    }

    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Rename instance', () => {
                SetFieldAction.new(lObject, 'name', args.newName);
                // Mirror the create fix: keep initialName in sync so the identity-slot
                // fallback (initialName || data.name) does not shadow the new name when the
                // name:EString slot is empty. SetFieldAction (not the set_name proxy setter)
                // writes data.name only, so initialName must be updated explicitly.
                // See docs/discovery/2026-06-12_create_instance_name_regression.md.
                SetFieldAction.new(lObject, 'initialName', args.newName);
                resolve({
                    success: true,
                    command: 'rename',
                    message: `Renamed instance '${instanceName}' to '${args.newName}'`,
                    data: { id: lObject.id, oldName: instanceName, newName: args.newName, type: 'instance' },
                    affectedElements: [lObject.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'rename',
                message: `Failed to rename instance: ${(error as Error).message}`,
                errors: [{ code: 'RENAME_INSTANCE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

// ============================================
// SET INSTANCE PROPERTY (attribute or reference link)
// ============================================

export async function executeSetInstance(
    args: SetArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'set',
            message: 'set on instance requires an M1 model editor',
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a model editor (M1) to set instance values' }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'set',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot set property — no active M1 model' }]
        };
    }

    const instanceName = args.target.segments.join('::') || args.target.raw; // instance name from segments; raw may carry a dotted '.property' member (P0b)
    const lObject = findInstanceByName(targetModel, instanceName);
    if (!lObject) {
        return {
            success: false,
            command: 'set',
            message: `Instance '${instanceName}' not found`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${instanceName}' in '${targetModel.name}'`
            }]
        };
    }

    // Classify the property: attribute or reference?
    const metaclass = (lObject as any).instanceof as LClass | undefined;
    if (!metaclass) {
        return {
            success: false,
            command: 'set',
            message: `Cannot resolve metaclass for instance '${instanceName}'`,
            errors: [{ code: 'NO_METACLASS', message: 'Instance has no instanceof reference' }]
        };
    }

    const kind = classifyMetaclassProperty(metaclass, args.property);
    if (kind === 'unknown') {
        return {
            success: false,
            command: 'set',
            message: `Property '${args.property}' is not a feature of class '${(metaclass as any).name}'`,
            errors: [{
                code: 'UNKNOWN_PROPERTY',
                message: `'${args.property}' is neither an attribute nor a reference of '${(metaclass as any).name}'`
            }]
        };
    }

    // Attribute branch — write a primitive
    if (kind === 'attribute') {
        if (!isLiteralValue(args.value)) {
            return {
                success: false,
                command: 'set',
                message: `Attribute '${args.property}' expects a literal value`,
                errors: [{
                    code: 'TYPE_MISMATCH',
                    message: `Cannot assign a name '${qualifiedNameToString(args.value as QualifiedName)}' to an attribute`
                }]
            };
        }
        const primitive = literalToPrimitive(args.value as LiteralValue);

        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Set instance attribute', () => {
                    const featureProxy = (lObject as any)['$' + args.property];
                    if (!featureProxy) {
                        resolve({
                            success: false,
                            command: 'set',
                            message: `Feature proxy for '${args.property}' is not available on instance`,
                            errors: [{ code: 'NO_FEATURE_PROXY', message: 'Internal: $-proxy missing' }]
                        });
                        return;
                    }
                    featureProxy.value = primitive;
                    resolve({
                        success: true,
                        command: 'set',
                        message: `Set ${instanceName}.${args.property} = ${literalValueToString(args.value as LiteralValue)}`,
                        data: {
                            id: lObject.id,
                            instance: instanceName,
                            property: args.property,
                            newValue: primitive,
                            kind: 'attribute'
                        },
                        affectedElements: [lObject.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'set',
                    message: `Failed to set attribute: ${(error as Error).message}`,
                    errors: [{ code: 'SET_INSTANCE_ATTR_ERROR', message: (error as Error).message }]
                });
            }
        });
    }

    // Reference branch (kind === 'reference') — link semantics
    // Pattern source: canvasToJjom.ts:1197-1208 (syncCreateCompositionLink)
    // Setting to null clears the reference (unlink).
    const isUnlink = isLiteralValue(args.value) && (args.value as LiteralValue).kind === 'null';

    if (isUnlink) {
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Unlink reference', () => {
                    const refProxy = (lObject as any)['$' + args.property];
                    if (refProxy) {
                        refProxy.values = [];
                    }
                    resolve({
                        success: true,
                        command: 'set',
                        message: `Cleared reference ${instanceName}.${args.property}`,
                        data: { id: lObject.id, instance: instanceName, property: args.property, kind: 'reference', cleared: true },
                        affectedElements: [lObject.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'set',
                    message: `Failed to unlink: ${(error as Error).message}`,
                    errors: [{ code: 'UNLINK_ERROR', message: (error as Error).message }]
                });
            }
        });
    }

    // Link: value must be the name of another instance
    let targetInstanceName: string;
    if (isLiteralValue(args.value)) {
        const lit = args.value as LiteralValue;
        if (lit.kind !== 'string') {
            return {
                success: false,
                command: 'set',
                message: `Reference '${args.property}' expects an instance name`,
                errors: [{
                    code: 'TYPE_MISMATCH',
                    message: `A reference target must be an instance name, got ${lit.kind}`
                }]
            };
        }
        targetInstanceName = lit.value;
    } else {
        targetInstanceName = (args.value as QualifiedName).raw;
    }

    const targetInstance = findInstanceByName(targetModel, targetInstanceName);
    if (!targetInstance) {
        return {
            success: false,
            command: 'set',
            message: `Target instance '${targetInstanceName}' not found in active model`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${targetInstanceName}' to link to`
            }]
        };
    }

    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Link reference', () => {
                const refProxy = (lObject as any)['$' + args.property];
                if (!refProxy) {
                    resolve({
                        success: false,
                        command: 'set',
                        message: `Reference proxy for '${args.property}' is not available`,
                        errors: [{ code: 'NO_FEATURE_PROXY', message: 'Internal: $-proxy missing' }]
                    });
                    return;
                }
                const rawVals: any[] = refProxy.__raw?.values ?? [];
                const meaningful = rawVals.filter((v: any) => v != null && v !== '');
                refProxy.values = [...meaningful, targetInstance.id];
                resolve({
                    success: true,
                    command: 'set',
                    message: `Linked ${instanceName}.${args.property} → ${targetInstanceName}`,
                    data: {
                        id: lObject.id,
                        instance: instanceName,
                        property: args.property,
                        target: targetInstanceName,
                        kind: 'reference'
                    },
                    affectedElements: [lObject.id, targetInstance.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'set',
                message: `Failed to link: ${(error as Error).message}`,
                errors: [{ code: 'LINK_ERROR', message: (error as Error).message }]
            });
        }
    });
}

// ============================================
// LITERAL TYPE GUARD
// ============================================

function isLiteralValue(value: any): value is LiteralValue {
    return value && typeof value === 'object' && 'kind' in value &&
        ['string', 'number', 'boolean', 'null', 'array', 'enumLiteral'].includes(value.kind);
}
