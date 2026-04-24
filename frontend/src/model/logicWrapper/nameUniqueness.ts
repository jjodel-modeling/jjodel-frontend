/**
 * Sibling name uniqueness validation for M1 instances.
 *
 * Scope:
 * - Rootable LObject (father is an LModel): whole-model namespace.
 * - Nested LObject (father is an LValue wrapping a containment feature of the
 *   parent DObject): the other LObjects held in the same containment.
 *
 * Used by LObject.set_name (hard-block on rename collision), LObject.set_father
 * (hard-block on reparent that would collide in the destination namespace), and
 * detectDuplicateNames for the soft badge rendered on load.
 *
 * Located alongside LModelElement.tsx to avoid a cross-layer import (the L-layer
 * would otherwise depend on components/editor-v2/ — inverted dependency).
 */

import { DModel, DObject, DValue, LModel, LModelElement, LObject, LValue } from '../../joiner';

export interface NameUniquenessOptions {
    /**
     * When provided, replaces `lobj.father` in the namespace resolution. Used by
     * `set_father` to simulate the post-reparent namespace before applying.
     */
    overrideFather?: LModelElement;
}

function isModelFather(father: LModelElement | undefined | null): father is LModel {
    if (!father) return false;
    return (father as { className?: string }).className === DModel.cname;
}

function isValueFather(father: LModelElement | undefined | null): father is LValue {
    if (!father) return false;
    return (father as { className?: string }).className === DValue.cname;
}

// Resolve the LObjects held in a containment LValue. We iterate `values`
// (proxy-resolved) and filter by className === DObject.cname: the same pattern
// used in LObject.get_subObjects at LModelElement.tsx:6054-6063.
function resolveLObjectsFromLValue(v: LValue): LObject[] {
    const vals = ((v as unknown as { values?: unknown[] }).values ?? []) as unknown[];
    return vals.filter(
        (x): x is LObject => !!x && (x as { className?: string }).className === DObject.cname
    );
}

/**
 * Returns sibling LObjects against which `lobj` must have a unique name.
 * Excludes `lobj` itself.
 */
export function getSiblingNamespace(
    lobj: LObject,
    opts: NameUniquenessOptions = {}
): LObject[] {
    const father = opts.overrideFather ?? (lobj.father as LModelElement | undefined);
    if (!father) return [];

    if (isModelFather(father)) {
        const siblings = (father.allSubObjects ?? []) as LObject[];
        return siblings.filter(o => o && o.id !== lobj.id);
    }

    if (isValueFather(father)) {
        const siblings = resolveLObjectsFromLValue(father);
        return siblings.filter(o => o && o.id !== lobj.id);
    }

    // Fallback: father is a bare LObject (not observed in current Jjodel because
    // nested DObjects are always contained via an LValue feature, but retained
    // defensively in case of future topology changes).
    const siblings = ((father as LObject).subObjects ?? []) as LObject[];
    return siblings.filter(o => o && o.id !== lobj.id);
}

/**
 * Case-sensitive check. Returns `valid: false` plus the colliding LObjects on
 * conflict; `valid: true` otherwise.
 */
export function validateNameUniqueness(
    lobj: LObject,
    newName: string,
    opts: NameUniquenessOptions = {}
): { valid: boolean; collidingWith?: LObject[] } {
    const siblings = getSiblingNamespace(lobj, opts);
    const collidingWith = siblings.filter(o => o.name === newName);
    if (collidingWith.length === 0) return { valid: true };
    return { valid: false, collidingWith };
}

/**
 * Full-model scan. For each LObject whose name collides with at least one
 * sibling in its namespace, the map contains the list of colliding siblings.
 *
 * Complexity O(N × M) worst-case (N = total objects, M = namespace size);
 * acceptable for models up to ~1000 objects. Indexing by namespace key is
 * future work.
 */
export function detectDuplicateNames(model: LModel): Map<string, LObject[]> {
    const result = new Map<string, LObject[]>();
    const all = (model.allSubObjects ?? []) as LObject[];
    for (const obj of all) {
        if (!obj) continue;
        const siblings = getSiblingNamespace(obj);
        const colliding = siblings.filter(s => s.name === obj.name);
        if (colliding.length > 0) {
            result.set(obj.id, colliding);
        }
    }
    return result;
}
