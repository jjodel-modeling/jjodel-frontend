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
        // and an id -> object map for reference target-type resolution (CHECK 8)
        const objectIds = new Set<string>();
        const objectById = new Map<string, LObject>();
        for (const obj of objects) {
            if (obj?.id) { objectIds.add(obj.id); objectById.set(obj.id, obj); }
        }

        // CHECK 11 accumulators: isID attribute id -> (value -> instances that carry it),
        // plus the attribute's display name. Grouping by attr.id scopes uniqueness to the
        // declaring class + every subclass that inherits the slot.
        const idValueGroups = new Map<string, Map<string, Array<{ objId: string; objName?: string }>>>();
        const idAttrNames = new Map<string, string>();

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

            // CHECK 7: abstract_instantiation — the resolved metaclass must not be abstract
            try {
                if (classInMM.abstract === true) {
                    violations.push({
                        objectId: objId,
                        objectName: objName,
                        violationType: 'abstract_instantiation',
                        severity: 'error',
                        message: `Object "${objName || objId}" is an instance of abstract class "${classInMM.name}"`,
                        metamodelElementName: classInMM.name,
                    });
                }
            } catch (e) {
                console.warn('[ConformanceValidator] CHECK 7 (abstract) failed:', e);
                violations.push({
                    objectId: objId,
                    objectName: objName,
                    violationType: 'check_failed',
                    severity: 'warning',
                    message: `CHECK 7 (abstract_instantiation) could not be evaluated for object "${objName || objId}": ${e instanceof Error ? e.message : String(e)}`,
                });
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

            // CHECK 9 / 9b / 10 + CHECK 11 accumulation — attribute-level structural checks
            for (const attr of allAttrs) {
                if (!attr) continue;
                try {
                    const feats = featuresByMetaId.get(attr.id) || [];

                    // Count non-empty scalar values across this attribute's feature instances.
                    // Read from the UNTRUNCATED, UNMAPPED raw slot: the L-proxy `feat.values`
                    // caps the array to upperBound (which silently no-ops CHECK 9) and maps enum
                    // values to LEnumLiteral objects (which breaks CHECK 10). Mirror the guard's
                    // raw read (ConformanceGuard.ts:52-68): prefer `feat.__raw.values`, else fall
                    // back to `feat.values` / `feat.value` (keeps the flat-fixture tests working).
                    // Non-empty counting keeps valueCount === 0 exactly when CHECK 2 fires,
                    // so the lower-bound branch below never double-reports the missing case.
                    let valueCount = 0;
                    const scalarValues: any[] = [];
                    for (const feat of feats) {
                        const rawVals = (feat as any).__raw?.values;
                        const vals = Array.isArray(rawVals)
                            ? rawVals
                            : (Array.isArray(feat.values)
                                ? feat.values
                                : (feat.value !== null && feat.value !== undefined ? [feat.value] : []));
                        for (const v of vals) {
                            if (v !== null && v !== undefined && v !== '') { valueCount++; scalarValues.push(v); }
                        }
                    }

                    // CHECK 9: attr_multiplicity_upper_exceeded — same convention as references (ub ?? 1, -1 = unlimited)
                    const aub = attr.upperBound ?? 1;
                    if (aub > 0 && valueCount > aub) {
                        violations.push({
                            objectId: objId,
                            objectName: objName,
                            violationType: 'attr_multiplicity_upper_exceeded',
                            severity: 'error',
                            message: `Object "${objName || objId}": attribute "${attr.name}" has ${valueCount} values but max is ${aub}`,
                            metamodelElementName: attr.name,
                        });
                    }

                    // CHECK 9b: attr_multiplicity_below_min — only when at least one value is present
                    // (valueCount === 0 with lowerBound > 0 is already CHECK 2's missing_required_attr)
                    const alb = attr.lowerBound ?? 0;
                    if (alb > 0 && valueCount > 0 && valueCount < alb) {
                        violations.push({
                            objectId: objId,
                            objectName: objName,
                            violationType: 'attr_multiplicity_below_min',
                            severity: 'warning',
                            message: `Object "${objName || objId}": attribute "${attr.name}" has ${valueCount} values but min is ${alb}`,
                            metamodelElementName: attr.name,
                        });
                    }

                    // CHECK 10: invalid_enum_literal — enum-typed value must be a current literal of the enum
                    const attrType: any = attr.type;
                    if (attrType && attrType.isEnum) {
                        const literalNames = new Set<string>(
                            (Array.isArray(attrType.literals) ? attrType.literals : [])
                                .map((l: any) => l?.name)
                                .filter((n: any) => n !== null && n !== undefined)
                        );
                        for (const v of scalarValues) {
                            // A value may arrive as a raw literal-name string or as a resolved
                            // LEnumLiteral object; compare on the literal name in both cases.
                            const vName = (v && typeof v === 'object' && 'name' in (v as object)) ? (v as any).name : v;
                            if (!literalNames.has(vName as string)) {
                                violations.push({
                                    objectId: objId,
                                    objectName: objName,
                                    violationType: 'invalid_enum_literal',
                                    severity: 'warning',
                                    message: `Object "${objName || objId}": attribute "${attr.name}" has value "${vName}" which is not a literal of enum "${attrType.name}"`,
                                    metamodelElementName: attr.name,
                                });
                            }
                        }
                    }

                    // CHECK 11 accumulation: record non-empty values of isID attributes for the post-pass
                    if (attr.isID === true) {
                        idAttrNames.set(attr.id, attr.name);
                        let byValue = idValueGroups.get(attr.id);
                        if (!byValue) { byValue = new Map(); idValueGroups.set(attr.id, byValue); }
                        for (const v of scalarValues) {
                            const key = String(v);
                            const arr = byValue.get(key) || [];
                            arr.push({ objId, objName });
                            byValue.set(key, arr);
                        }
                    }
                } catch (e) {
                    console.warn('[ConformanceValidator] CHECK 9/10/11-accumulate failed for attribute:', e);
                    violations.push({
                        objectId: objId,
                        objectName: objName,
                        violationType: 'check_failed',
                        severity: 'warning',
                        message: `CHECK 9/9b/10/11 (attribute structural checks) could not be evaluated for object "${objName || objId}", attribute "${attr.name}": ${e instanceof Error ? e.message : String(e)}`,
                        metamodelElementName: attr.name,
                    });
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

                // CHECK 8: reference_target_type_mismatch — target must be kind-of the declared type
                try {
                    const declaredType: any = ref.type;
                    if (declaredType) {
                        for (const refId of referencedIds) {
                            const target = objectById.get(refId);
                            if (!target) continue;              // missing target → dangling (CHECK 6)
                            const targetMeta: any = target.instanceof;
                            if (!targetMeta) continue;          // target is orphan → its own CHECK 1
                            const isKindOf =
                                targetMeta.id === declaredType.id ||
                                (Array.isArray(targetMeta.extendsChain) &&
                                    targetMeta.extendsChain.some((sc: any) => sc?.id === declaredType.id));
                            if (!isKindOf) {
                                violations.push({
                                    objectId: objId,
                                    objectName: objName,
                                    violationType: 'reference_target_type_mismatch',
                                    severity: 'error',
                                    message: `Object "${objName || objId}": reference "${ref.name}" points to "${target.name || refId}" of type "${targetMeta.name}" but expected kind of "${declaredType.name}"`,
                                    metamodelElementName: ref.name,
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[ConformanceValidator] CHECK 8 (target type) failed:', e);
                    violations.push({
                        objectId: objId,
                        objectName: objName,
                        violationType: 'check_failed',
                        severity: 'warning',
                        message: `CHECK 8 (reference_target_type_mismatch) could not be evaluated for object "${objName || objId}", reference "${ref.name}": ${e instanceof Error ? e.message : String(e)}`,
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

        // CHECK 11 post-pass: duplicate_id_value — two+ instances sharing a non-null isID value.
        // One violation per involved instance (so future per-node badges attach to each).
        try {
            for (const [attrId, byValue] of idValueGroups.entries()) {
                const attrName = idAttrNames.get(attrId) || 'id';
                for (const [value, carriers] of byValue.entries()) {
                    if (carriers.length < 2) continue;
                    const names = carriers.map(c => c.objName || c.objId);
                    for (const c of carriers) {
                        violations.push({
                            objectId: c.objId,
                            objectName: c.objName,
                            violationType: 'duplicate_id_value',
                            severity: 'error',
                            message: `Duplicate value "${value}" for id attribute "${attrName}" shared by ${carriers.length} instances: ${names.join(', ')}`,
                            metamodelElementName: attrName,
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('[ConformanceValidator] CHECK 11 (id uniqueness) failed:', e);
            // No object in scope here (post-pass over the whole model) → attach to the model.
            violations.push({
                objectId: modelId,
                violationType: 'check_failed',
                severity: 'warning',
                message: `CHECK 11 (duplicate_id_value) post-pass could not be evaluated: ${e instanceof Error ? e.message : String(e)}`,
            });
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
