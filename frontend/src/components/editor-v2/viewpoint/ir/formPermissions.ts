/**
 * formPermissions — what a stand-alone profile lets the IR form show and offer (#157 step B).
 *
 * The form knew nothing of the profile. In the Configurator it named instances of a hidden
 * type in its reference chips, offered them in its pickers, and offered elements of a `read`
 * type in a containment picker, where a pick MOVES the element into the slot. It also let the
 * viewer remove or replace a `read` element held in a containment slot, which evicts it.
 * Measured on dcb13dc55 (`docs/discovery/discovery_2026-10-04_157_step_b_ir_form_profile.md` §3).
 *
 * Three rules, all of them about references only — an attribute, an enum literal or a scalar
 * is never filtered, so a profile cannot blank a field it has no say on:
 *  - a feature TYPED by a hidden class is not rendered at all;
 *  - no candidate of a hidden class is offered anywhere; in a containment slot only FREE
 *    (at the model's root) elements of an `edit` class are offered, because a pick into
 *    such a slot re-fathers the element, and a bound one would be taken out of another
 *    container the viewer is not looking at;
 *  - a value of a non-`edit` class held in a containment slot is LOCKED: no remove, no
 *    replace, since both evict it.
 *
 * Containment is the L-layer's: composition OR aggregation (`LReference.get_containment`),
 * because that is what a write re-fathers by, not the IR descriptor's `isComposition`.
 *
 * No profile (`reads` absent: the Data Manager, the developer) → every function returns its
 * input or `false`, so the form is exactly the one without this module. Pure, and reading the
 * D-layer only through what it is handed, so the bench imports it without the runtime.
 */

import type { TargetOption } from '../../../../jjform';
import type { EnvPermission } from '../../../../joiner/environmentConfig';

/** The profile's rule for one metaclass, by DClass id. */
export type PermissionOf = (classId: string) => EnvPermission;

/** What the three rules need to know about one feature of the form's subject. */
export interface FeatureAccess {
    /** A DReference. Attributes are never filtered. */
    isReference: boolean;
    /** The L-layer's containment: composition OR aggregation. A write into it re-fathers. */
    containment: boolean;
    /** DClass id of the feature's type; null when it does not resolve. */
    typeId: string | null;
}

/** The profile, and the two D-layer reads the rules need, asked at the moment of use. */
export interface ProfileReads {
    permissionOf: PermissionOf;
    /** Metaclass id of an instance (`DObject.instanceof`); null when it does not resolve. */
    classOf: (instanceId: string) => string | null | undefined;
    /** True unless the instance sits at the model's root (its father is a DModel). */
    isBound: (instanceId: string) => boolean;
}

/** An instance's permission: its exact class's, as `InstanceDetail.permOfInstance` reads
 *  it. An instance whose class does not resolve is `edit`, the same default. */
export function instancePermission(instanceId: string, reads: ProfileReads): EnvPermission {
    const classId = reads.classOf(instanceId);
    return classId ? reads.permissionOf(classId) : 'edit';
}

/**
 * The access record of `featureKey` on `objectId`, read off the D-layer: the object's
 * `features` (DValue ids), each slot's `instanceof`, and that metafeature's own fields.
 * Undefined when the object or the feature is not there; the callers read undefined as
 * «nothing to filter».
 */
export function featureAccessIn(idlookup: Record<string, any> | null | undefined, objectId: string, featureKey: string): FeatureAccess | undefined {
    const featureIds = idlookup?.[objectId]?.features;
    if (!idlookup || !Array.isArray(featureIds)) return undefined;
    for (const valueId of featureIds) {
        const slot = idlookup[valueId];
        const meta = slot && typeof slot.instanceof === 'string' ? idlookup[slot.instanceof] : undefined;
        const name = meta?.name ?? slot?.name;
        if (name !== featureKey) continue;
        return {
            isReference: meta?.className === 'DReference',
            containment: meta?.composition === true || meta?.aggregation === true,
            typeId: typeof meta?.type === 'string' ? meta.type : null,
        };
    }
    return undefined;
}

/** Rule 1: a reference typed by a hidden class is not a field of this form. */
export function isHiddenFeature(feature: FeatureAccess | undefined, reads?: ProfileReads): boolean {
    if (!reads || !feature?.isReference || !feature.typeId) return false;
    return reads.permissionOf(feature.typeId) === 'hidden';
}

/** Rule 1 over a described form. The same array when there is nothing to drop. */
export function withoutHiddenFeatures<T extends { name: string }>(
    fields: T[],
    accessOf: (featureKey: string) => FeatureAccess | undefined,
    reads?: ProfileReads,
): T[] {
    if (!reads) return fields;
    const kept = fields.filter(f => !isHiddenFeature(accessOf(f.name), reads));
    return kept.length === fields.length ? fields : kept;
}

/** Rule 2: the candidates a picker may show for this feature. */
export function offerForProfile(offered: TargetOption[], feature: FeatureAccess | undefined, reads?: ProfileReads): TargetOption[] {
    if (!reads || !feature?.isReference) return offered;
    return offered.filter(o => {
        const p = instancePermission(o.id, reads);
        if (p === 'hidden') return false;
        if (!feature.containment) return true;
        return p === 'edit' && !reads.isBound(o.id);
    });
}

/** Rule 3: a value this viewer may neither remove nor replace. */
export function isLockedValue(valueId: unknown, feature: FeatureAccess | undefined, reads?: ProfileReads): boolean {
    if (!reads || !feature?.isReference || !feature.containment) return false;
    if (typeof valueId !== 'string' || valueId === '') return false;
    return instancePermission(valueId, reads) !== 'edit';
}
