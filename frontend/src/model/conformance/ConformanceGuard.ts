import type { LModel } from '../logicWrapper/LModelElement';
import type { LClass } from '../logicWrapper/LModelElement';
import type { LObject } from '../logicWrapper/LModelElement';
import type { LValue } from '../logicWrapper/LModelElement';
import type { LReference } from '../logicWrapper/LModelElement';
import type { LStructuralFeature } from '../logicWrapper/LModelElement';
import type { GuardResult, GuardOptions } from './ConformanceTypes';
import { LPointerTargetable } from '../../joiner';
import { JjodelEvents } from '../../events/registry';

/**
 * Guard 1: Check if a new link can be added to a reference.
 * Validates upper-bound multiplicity before link creation.
 *
 * Pure function — no side effects.
 */
export function checkLinkCreation(
    sourceObjectId: string,
    associationName: string,
    model: LModel,
    metamodel: LModel,
    _options?: GuardOptions,
): GuardResult {

    try {
        const sourceObj = findObjectById(model, sourceObjectId);
        if (!sourceObj) return { allowed: true };

        const metaClass = sourceObj.instanceof as LClass | undefined;
        if (!metaClass) return { allowed: true };

        const allRefs = metaClass.allReferences || [];
        const ref = allRefs.find(r => r?.name === associationName);
        if (!ref) return { allowed: true };


        const ub = ref.upperBound ?? 1;
        if (ub < 0) return { allowed: true }; // -1 = unbounded

        // Count existing links for this reference
        const features: LValue[] = sourceObj.features || [];
        let currentCount = 0;
        for (const feat of features) {
            if (!feat) continue;
            const metaFeat = feat.instanceof as LStructuralFeature | undefined;
            if (metaFeat?.id !== ref.id) continue;
            const vals = feat.values;
            if (Array.isArray(vals)) {
                currentCount += vals.length;
            } else if (feat.value !== null && feat.value !== undefined) {
                currentCount++;
            }
        }

        if (currentCount >= ub) {
            return {
                allowed: false,
                violationType: 'multiplicity_upper_exceeded',
                message: `Cannot add link: '${associationName}' already has ${currentCount}/${ub} links on ${sourceObj.name || sourceObjectId}`,
                details: {
                    objectId: sourceObjectId,
                    objectName: sourceObj.name,
                    associationName,
                    currentCount,
                    maxAllowed: ub,
                },
            };
        }

        return { allowed: true };
    } catch (err) {
        console.warn('[ConformanceGuard] checkLinkCreation error:', err);
        return { allowed: true }; // fail open
    }
}

/**
 * Guard 2: Check if an object of a given class can be created.
 * Validates that the class exists in the metamodel.
 *
 * Pure function — no side effects.
 */
export function checkObjectCreation(
    className: string,
    metamodel: LModel,
    _options?: GuardOptions,
): GuardResult {
    try {
        const mmClasses: LClass[] = metamodel.classes || [];

        const found = mmClasses.some(cls => cls?.name === className);
        if (!found) {
            return {
                allowed: false,
                violationType: 'class_not_in_metamodel',
                message: `Cannot create object: class '${className}' does not exist in the metamodel`,
                details: {
                    className,
                },
            };
        }

        return { allowed: true };
    } catch (err) {
        console.warn('[ConformanceGuard] checkObjectCreation error:', err);
        return { allowed: true }; // fail open
    }
}

/**
 * Guard 3: Check if a value can be assigned to an attribute.
 * Validates type compatibility (EString, EInt, EFloat, EBoolean).
 *
 * Pure function — no side effects.
 */
export function checkValueAssignment(
    objectId: string,
    attributeName: string,
    value: unknown,
    model: LModel,
    metamodel: LModel,
    _options?: GuardOptions,
): GuardResult {
    try {
        if (value === null || value === undefined || value === '') return { allowed: true };

        const obj = findObjectById(model, objectId);
        if (!obj) return { allowed: true }; // fail open

        const metaClass: LClass | undefined = obj.instanceof as LClass | undefined;
        if (!metaClass) return { allowed: true }; // shapeless

        // Find the attribute in the metaclass (including inherited)
        const allAttrs = metaClass.allAttributes || [];
        const attr = allAttrs.find(a => a?.name === attributeName);
        if (!attr) return { allowed: true }; // attribute not in metamodel, fail open

        const typeName = attr.type?.name?.toLowerCase() || '';
        if (!typeName) return { allowed: true }; // unknown type, fail open

        // Check type compatibility
        const typeCheck = checkTypeCompatibility(typeName, value);
        if (!typeCheck.compatible) {
            return {
                allowed: false,
                violationType: 'type_mismatch',
                message: `Cannot assign value: attribute '${attributeName}' expects ${typeCheck.expectedType}, received '${String(value)}'`,
                details: {
                    objectId,
                    objectName: obj.name,
                    associationName: attributeName,
                    expectedType: typeCheck.expectedType,
                    receivedValue: value,
                },
            };
        }

        return { allowed: true };
    } catch (err) {
        console.warn('[ConformanceGuard] checkValueAssignment error:', err);
        return { allowed: true }; // fail open
    }
}

// ============================================
// Helpers
// ============================================

function findObjectById2(model: LModel, objectId: string): LObject | undefined {
    try {
        const lObj = LPointerTargetable.fromPointer(objectId);
        if (lObj && (lObj as LObject).model?.id === model.id) return lObj as LObject;
    } catch { /* ignore */ }
    // Fallback: linear scan
    const objects: LObject[] = model.objects || [];
    return objects.find(o => o?.id === objectId);
}
function findObjectById(model: LModel, objectId: string): LObject | undefined {
    try {
        const lObj = LPointerTargetable.fromPointer(objectId);
        // Removed model.id check — it was too strict and caused false negatives
        if (lObj) return lObj as LObject;
    } catch { /* ignore */ }
    // Fallback: linear scan
    const objects: LObject[] = model.objects || [];
    return objects.find(o => o?.id === objectId);
}

interface TypeCheckResult {
    compatible: boolean;
    expectedType: string;
}

const INT_TYPES = new Set(['eint', 'int', 'integer', 'elong', 'long', 'eshort', 'short', 'ebyte', 'byte']);
const FLOAT_TYPES = new Set(['efloat', 'float', 'edouble', 'double', 'ebigdecimal']);
const BOOL_TYPES = new Set(['eboolean', 'boolean', 'bool']);
const STRING_TYPES = new Set(['estring', 'string', 'echar', 'char']);

function checkTypeCompatibility(typeName: string, value: unknown): TypeCheckResult {
    if (STRING_TYPES.has(typeName)) {
        return { compatible: true, expectedType: 'EString' }; // strings accept everything
    }

    if (INT_TYPES.has(typeName)) {
        const expectedType = 'EInt';
        if (typeof value === 'number') return { compatible: Number.isInteger(value), expectedType };
        if (typeof value === 'string') {
            const n = Number(value);
            return { compatible: !isNaN(n) && Number.isInteger(n) && value.trim() !== '', expectedType };
        }
        return { compatible: false, expectedType };
    }

    if (FLOAT_TYPES.has(typeName)) {
        const expectedType = 'EFloat';
        if (typeof value === 'number') return { compatible: true, expectedType };
        if (typeof value === 'string') return { compatible: !isNaN(parseFloat(value)) && value.trim() !== '', expectedType };
        return { compatible: false, expectedType };
    }

    if (BOOL_TYPES.has(typeName)) {
        const expectedType = 'EBoolean';
        if (typeof value === 'boolean') return { compatible: true, expectedType };
        if (value === 'true' || value === 'false') return { compatible: true, expectedType };
        return { compatible: false, expectedType };
    }

    // Unknown type — allow (fail open)
    return { compatible: true, expectedType: typeName };
}

// ============================================
// Event-based notification for guard violations
// ============================================

export function emitGuardViolation(error: GuardResult): void {
    if (error.allowed) return;
    window.dispatchEvent(new CustomEvent(JjodelEvents.GUARD_VIOLATION, { detail: error }));
}
