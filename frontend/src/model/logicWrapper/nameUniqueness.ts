/**
 * Sibling name uniqueness for M1 instances — ONE rule, ONE implementation.
 *
 * Scope (R-S1-1, ratified 2026-08-30): the namespace is the set of SIBLINGS under
 * the same father, whatever their metaclass.
 * - Rootable LObject (father is an LModel): whole-model namespace.
 * - Nested LObject (father is an LValue wrapping a containment feature of the
 *   parent DObject): the other LObjects held in the same containment.
 *
 * ── Why the entry point is a FATHER and not an instance ───────────────────────
 *
 * Until S1a this module could only answer for an instance that already exists
 * (`lobj.father`). A CREATE has no instance yet — it has the father it is about to
 * join. So the namespace resolution is expressed over the father
 * (`getNamespaceOf`), and every other entry is a shape of the same call:
 *
 *   getNamespaceOf(father, excludeId?)  — the namespace itself
 *   checkNameUniqueness({father, name}) — THE VERDICT, `{ok, reason}`
 *   getSiblingNamespace(lobj, opts)     — the instance-shaped namespace (legacy shape)
 *   validateNameUniqueness(lobj, name)  — the instance-shaped verdict (legacy shape)
 *   detectDuplicateNames(model)         — the full-model scan behind the badge
 *
 * `{ok, reason}` is deliberately the shape `WriteResult` will take in S2: a refusal
 * that says why, instead of a boolean the caller has to interpret.
 *
 * Consumers (S1a): LObject.set_name (rename), LObject.set_father (reparent),
 * LValue.get_addObject (create — the L-layer create primitive both `LModel.addObject`
 * and `LValue.addObject` route through), createAdapter.draftContext (the manager's
 * anticipated validation), and detectDuplicateNames for the badge.
 * Declared and NOT closed in S1a: the three creates that call `DObject.new` directly
 * (jjscript, ProjectEditor seeding, canvasToJjom) — they are S1b's branch. See
 * docs/discovery/discovery_2026-08-30_s1a_una_funzione_uniqueness.md §3.
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
 * The namespace a name must be unique in, resolved from the FATHER.
 *
 * This is the single place the scope of the rule is decided. `excludeId` drops the
 * element that is being renamed or reparented; a create passes none, because the
 * instance it is about to make is not in the namespace yet.
 */
export function getNamespaceOf(
    father: LModelElement | undefined | null,
    excludeId?: string
): LObject[] {
    if (!father) return [];

    let siblings: LObject[];
    if (isModelFather(father)) {
        siblings = (father.allSubObjects ?? []) as LObject[];
    } else if (isValueFather(father)) {
        siblings = resolveLObjectsFromLValue(father);
    } else {
        // Fallback: father is a bare LObject (not observed in current Jjodel because
        // nested DObjects are always contained via an LValue feature, but retained
        // defensively in case of future topology changes).
        siblings = ((father as LObject).subObjects ?? []) as LObject[];
    }
    return siblings.filter(o => !!o && o.id !== excludeId);
}

/**
 * Returns sibling LObjects against which `lobj` must have a unique name.
 * Excludes `lobj` itself. The instance-shaped form of `getNamespaceOf`.
 */
export function getSiblingNamespace(
    lobj: LObject,
    opts: NameUniquenessOptions = {}
): LObject[] {
    const father = opts.overrideFather ?? (lobj.father as LModelElement | undefined);
    return getNamespaceOf(father, lobj?.id);
}

/** The verdict. `ok: false` always carries a `reason` — the sentence a consumer
 *  without a UI of its own can print verbatim, and the one `set_name` has always
 *  shown. Anticipates the `WriteResult` shape of S2 without implementing it. */
export interface UniquenessVerdict {
    ok: boolean;
    /** Present exactly when `ok` is false. */
    reason?: string;
    /** The siblings that already hold the name. Present exactly when `ok` is false. */
    collidingWith?: LObject[];
}

/** The sentence a refusal carries. One wording for every consumer, so the rename
 *  and the create cannot describe the same collision in two ways. */
function refusalReason(name: string, collider: LObject | undefined): string {
    const ownerType = (collider?.className ?? 'Element').replace(/^[DLW]/, '');
    const ownerName = collider?.name ?? '?';
    return `Name "${name}" already used by ${ownerType} "${ownerName}"`;
}

/**
 * THE VERDICT — case-sensitive, class-agnostic, over the siblings of `father`.
 *
 * `undefined`/`null` is «no name asked for», not a name, and never collides — that is
 * the case a create hits when it lets `DObject.new3` compute the auto-name. The EMPTY
 * STRING is left to compare like any other value, because that is what
 * `validateNameUniqueness` has always done and the rename must not change verdict.
 */
export function checkNameUniqueness(args: {
    father: LModelElement | undefined | null;
    name: string;
    /** The element being renamed or reparented; omitted by a create. */
    excludeId?: string;
}): UniquenessVerdict {
    const name = args?.name;
    if (name === undefined || name === null) return { ok: true };
    const collidingWith = getNamespaceOf(args.father, args.excludeId).filter(o => o.name === name);
    if (collidingWith.length === 0) return { ok: true };
    return { ok: false, reason: refusalReason(name, collidingWith[0]), collidingWith };
}

/**
 * Case-sensitive check. Returns `valid: false` plus the colliding LObjects on
 * conflict; `valid: true` otherwise.
 *
 * The legacy shape of `checkNameUniqueness`, kept for callers outside S1a's scope
 * (the JjScript / seeding branch of S1b is expected to reach for one of the two).
 * It delegates: there is no second rule here.
 */
export function validateNameUniqueness(
    lobj: LObject,
    newName: string,
    opts: NameUniquenessOptions = {}
): { valid: boolean; collidingWith?: LObject[] } {
    const father = opts.overrideFather ?? (lobj?.father as LModelElement | undefined);
    const verdict = checkNameUniqueness({ father, name: newName, excludeId: lobj?.id });
    if (verdict.ok) return { valid: true };
    return { valid: false, collidingWith: verdict.collidingWith };
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
