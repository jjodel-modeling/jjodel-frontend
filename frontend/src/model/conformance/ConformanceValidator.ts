import type { LModel } from '../logicWrapper/LModelElement';
import type { LClass } from '../logicWrapper/LModelElement';
import type { LObject } from '../logicWrapper/LModelElement';
import type { LValue } from '../logicWrapper/LModelElement';
import type { LAttribute } from '../logicWrapper/LModelElement';
import type { LReference } from '../logicWrapper/LModelElement';
import type { LStructuralFeature } from '../logicWrapper/LModelElement';
import type {
    ConformanceResult,
    ConformanceViolation,
    ConformanceStatus,
} from './ConformanceTypes';

/**
 * Pure function: validates whether a model conforms to its metamodel.
 * Read-only — no side effects, no state mutations.
 */
export function validateConformance(
    model: LModel,
    metamodel: LModel
): ConformanceResult {
    const modelId = model.id;
    const violations: ConformanceViolation[] = [];

    try {
        const objects: LObject[] = model.objects || [];
        const mmClasses: LClass[] = metamodel.classes || [];

        // Build a map of metamodel class names for quick lookup
        const mmClassByName = new Map<string, LClass>();
        const mmClassById = new Map<string, LClass>();
        for (const cls of mmClasses) {
            if (cls?.name) mmClassByName.set(cls.name, cls);
            if (cls?.id) mmClassById.set(cls.id, cls);
        }

        // Build set of all object IDs in the model for dangling reference check
        const objectIds = new Set<string>();
        for (const obj of objects) {
            if (obj?.id) objectIds.add(obj.id);
        }

        for (const obj of objects) {
            if (!obj) continue;

            const objId = obj.id;
            const objName = obj.name;
            const metaClass: LClass | undefined = obj.instanceof as LClass | undefined;

            // CHECK 1: orphan_object — object has no metaclass or metaclass not found in metamodel
            if (!metaClass) {
                violations.push({
                    objectId: objId,
                    objectName: objName,
                    violationType: 'orphan_object',
                    severity: 'error',
                    message: `Object "${objName || objId}" has no metaclass`,
                });
                continue; // Can't do further checks without a metaclass
            }

            // Verify metaclass exists in the metamodel
            const classInMM = mmClassById.get(metaClass.id) || mmClassByName.get(metaClass.name);
            if (!classInMM) {
                violations.push({
                    objectId: objId,
                    objectName: objName,
                    violationType: 'orphan_object',
                    severity: 'error',
                    message: `Object "${objName || objId}" is instance of "${metaClass.name}" which does not exist in metamodel "${metamodel.name}"`,
                    metamodelElementName: metaClass.name,
                });
                continue;
            }

            // Get all features (attributes + references) from the metaclass (including inherited)
            const allAttrs: LAttribute[] = classInMM.allAttributes || [];
            const allRefs: LReference[] = classInMM.allReferences || [];

            // Get object's features (LValue instances)
            const features: LValue[] = obj.features || [];

            // Build a map from feature instanceof ID to LValue[]
            const featuresByMetaId = new Map<string, LValue[]>();
            for (const feat of features) {
                if (!feat) continue;
                const metaFeat = feat.instanceof as LStructuralFeature | undefined;
                if (metaFeat?.id) {
                    const existing = featuresByMetaId.get(metaFeat.id) || [];
                    existing.push(feat);
                    featuresByMetaId.set(metaFeat.id, existing);
                }
            }

            // CHECK 2: missing_required_attr — attributes with lowerBound > 0 must have a value
            for (const attr of allAttrs) {
                if (!attr) continue;
                const lb = attr.lowerBound ?? 0;
                if (lb <= 0) continue;

                const feats = featuresByMetaId.get(attr.id) || [];
                const hasValue = feats.some(f => {
                    const val = f.value;
                    return val !== null && val !== undefined && val !== '';
                });

                if (!hasValue) {
                    violations.push({
                        objectId: objId,
                        objectName: objName,
                        violationType: 'missing_required_attr',
                        severity: 'error',
                        message: `Object "${objName || objId}" is missing required attribute "${attr.name}"`,
                        metamodelElementName: attr.name,
                    });
                }
            }

            // CHECK 3: wrong_attr_type — type compatibility
            for (const attr of allAttrs) {
                if (!attr) continue;
                const feats = featuresByMetaId.get(attr.id) || [];
                for (const feat of feats) {
                    const val = feat.value;
                    if (val === null || val === undefined || val === '') continue;

                    const typeName = attr.type?.name?.toLowerCase() || '';
                    if (!typeName) continue;

                    let typeOk = true;
                    if (typeName === 'eint' || typeName === 'int' || typeName === 'integer') {
                        typeOk = typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '');
                    } else if (typeName === 'eboolean' || typeName === 'boolean' || typeName === 'bool') {
                        typeOk = typeof val === 'boolean' || val === 'true' || val === 'false';
                    } else if (typeName === 'efloat' || typeName === 'edouble' || typeName === 'float' || typeName === 'double') {
                        typeOk = typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
                    }
                    // EString is always compatible

                    if (!typeOk) {
                        violations.push({
                            objectId: objId,
                            objectName: objName,
                            violationType: 'type_mismatch',
                            severity: 'warning',
                            message: `Object "${objName || objId}": attribute "${attr.name}" expects ${typeName} but got "${typeof val}"`,
                            metamodelElementName: attr.name,
                        });
                    }
                }
            }

            // CHECK 4 & 5: multiplicity for references
            for (const ref of allRefs) {
                if (!ref) continue;
                const feats = featuresByMetaId.get(ref.id) || [];

                // Count actual values across all feature instances for this reference
                let valueCount = 0;
                const referencedIds: string[] = [];

                for (const feat of feats) {
                    const vals = feat.values;
                    if (Array.isArray(vals)) {
                        valueCount += vals.length;
                        for (const v of vals) {
                            if (v && typeof v === 'object' && 'id' in v) {
                                referencedIds.push((v as LObject).id);
                            }
                        }
                    } else if (feat.value !== null && feat.value !== undefined) {
                        valueCount++;
                        if (feat.value && typeof feat.value === 'object' && 'id' in (feat.value as object)) {
                            referencedIds.push((feat.value as LObject).id);
                        }
                    }
                }

                const lb = ref.lowerBound ?? 0;
                const ub = ref.upperBound ?? 1; // -1 or 'N' means unlimited

                // multiplicity_exceeded: upperBound check (ub > 0 means bounded; -1 = unlimited)
                if (ub > 0 && valueCount > ub) {
                    violations.push({
                        objectId: objId,
                        objectName: objName,
                        violationType: 'multiplicity_upper_exceeded',
                        severity: 'error',
                        message: `Object "${objName || objId}": reference "${ref.name}" has ${valueCount} links but max is ${ub}`,
                        metamodelElementName: ref.name,
                    });
                }

                // multiplicity_below_min: lowerBound check
                if (lb > 0 && valueCount < lb) {
                    violations.push({
                        objectId: objId,
                        objectName: objName,
                        violationType: 'multiplicity_below_min',
                        severity: 'warning',
                        message: `Object "${objName || objId}": reference "${ref.name}" has ${valueCount} links but min is ${lb}`,
                        metamodelElementName: ref.name,
                    });
                }

                // CHECK 6: dangling_reference — referenced objects must exist in the model
                for (const refId of referencedIds) {
                    if (!objectIds.has(refId)) {
                        violations.push({
                            objectId: objId,
                            objectName: objName,
                            violationType: 'dangling_reference',
                            severity: 'error',
                            message: `Object "${objName || objId}": reference "${ref.name}" points to non-existent object "${refId}"`,
                            metamodelElementName: ref.name,
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.warn('[ConformanceValidator] Error during validation:', err);
        return {
            modelId,
            status: 'unknown',
            violations: [],
            checkedAt: Date.now(),
        };
    }

    // Determine status
    let status: ConformanceStatus;
    const hasErrors = violations.some(v => v.severity === 'error');
    const hasWarnings = violations.some(v => v.severity === 'warning');

    if (hasErrors) status = 'errors';
    else if (hasWarnings) status = 'warnings';
    else status = 'conformant';

    return {
        modelId,
        status,
        violations,
        checkedAt: Date.now(),
    };
}
