/**
 * createAdapter — the D-graph backend of `jjform`'s `create` event (slice 2c).
 *
 * Sibling of `shapeAdapter.ts` and split the same way: THIS file is the impure
 * half — it touches the store and the L proxies — while `createDraw.ts` next door
 * is the pure half the unit tests can reach. The joiner barrel reaches monaco and
 * monaco dereferences `window` at import time, so anything importable under vitest
 * has to stay out of here.
 *
 * ── One event, one primitive ──────────────────────────────────────────────────
 *
 * `create(cls, ownerId|null, childKey|null, draft)` (contract §5) lands on
 * `addObject`, NOT on `DObject.new`. Measured, and it is the whole reason this
 * module is short:
 *
 *  - `LValue.get_addObject` (`LModelElement.tsx:7035`) is defined once and serves
 *    both receivers — `LModel.addObject` (`:5307`, delegating at `:5310`) for a
 *    root and `LValue.addObject` (`:7019`) for a contained instance;
 *  - called on a containment slot it sets `father = c.data.id` (`:7043`), i.e. the
 *    SLOT, and `LPointerTargetable.getCollection` (`joiner/classes.ts:2551`) routes
 *    a DObject under a DValue into `values`. So `owner` and `children[childKey]`
 *    are written by the SAME call, and the invariant of contract §2 — `owner`
 *    redundant with `children` — cannot drift, because there is no second write to
 *    disagree with the first.
 *
 * `DObject.new`, which `canvasToJjom.syncCreateObject` and the JjScript `create`
 * command use, only ever makes ROOTS (`fatherType` is always `DModel` there). The
 * comment at `canvasToJjom.ts:1421` already points at `LValue.addObject` as the
 * path that «auto-appends to parent.values via the containment father».
 *
 * `forceCreation: true` is not optional: without it `:7095` picks a subclass by
 * schema match, and the manager must instantiate the metaclass the user chose.
 *
 * ── No outer TRANSACTION ──────────────────────────────────────────────────────
 *
 * `addObject` opens its own (`:7134`) and calls `DObject.new3` inside it. Wrapping
 * the call would nest a creator, which is the coordinate-loss hazard of CLAUDE.md
 * rule 12 / §3.3. Nothing here opens one.
 *
 * ── The values arrive with the create, not after it ───────────────────────────
 *
 * `addObject` seeds the slots from its `json` argument on a `setTimeout` of
 * `U.UpdatingTimer * 2` (`:7153`), and says why in its own comment: the constructor
 * actions have not run yet, so `dobject.features` is still empty. That is the same
 * deferral CLAUDE.md §9.2 prescribes to anyone who creates and then writes — so the
 * draft is handed over AS the json rather than replayed field by field afterwards,
 * and there is exactly one deferral instead of two.
 *
 * Keys are `$`-prefixed, which `:7157` treats as «slot, and only slot». The one
 * exception is `name`, passed bare so that the same string reaches `DObject.name`
 * (through the `{...json, father}` spread at `:7045`) AND the identity slot — the
 * double binding of §3.12, from the one place that can set both at once. It is only
 * included when the metaclass actually declares a `name` attribute; otherwise the
 * auto-name `DObject.new3` computes stands, and no key is sent that the seeding
 * loop would have to warn about.
 */

import { LPointerTargetable, store, U } from '../../../joiner';
import type { LModelElement } from '../../../joiner';
import { getNamespaceOf } from '../../../model/logicWrapper/nameUniqueness';
import type { AttrShape, ClassShape, Draft, DraftContext, DraftOption, MetamodelShape } from '../../../jjform';
import { draftableAttrs, draftableRefs } from '../../../jjform';
import { candidatesFor, childCount, containmentChain } from './createDraw';
import { getMetaclassInfo, type MetaclassInfo } from './useEditorMode';

type Idlookup = Record<string, any>;

const lookup = (): Idlookup => (store.getState() as any)?.idlookup ?? {};

/** `MetaclassInfo` of every class of the model, by NAME. `MetamodelShape` keys the
 *  same way, so the two structures address the same class with the same string. */
function classesByName(modelId: string): Record<string, MetaclassInfo> {
    const out: Record<string, MetaclassInfo> = {};
    if (!modelId) return out;
    try {
        for (const c of getMetaclassInfo(modelId).allClasses ?? []) out[c.name] = c;
    } catch {
        // A half-loaded model resolves to no metamodel. An empty map is the honest
        // answer and the next store change rebuilds it.
    }
    return out;
}

/**
 * The D-layer class ids an instance may have to conform to `className`.
 *
 * The class itself plus its CONCRETE subclasses, which `getMetaclassInfo` already
 * computes (`concreteSubclasses`, folded recursively). A reference typed on a class
 * accepts an instance of any of its concretions, and a candidate list that only
 * matched the exact class would hide legal targets — the same conformance the
 * canvas endpoints use, read from the same field rather than recomputed.
 */
export function conformanceClassIds(modelId: string, className: string): Set<string> {
    const info = classesByName(modelId)[className];
    const ids = new Set<string>();
    if (!info) return ids;
    ids.add(info.id);
    for (const sub of info.concreteSubclasses ?? []) ids.add(sub.id);
    return ids;
}

/** The D-layer id of a metaclass by name, or null. */
export function classIdOf(modelId: string, className: string): string | null {
    return classesByName(modelId)[className]?.id ?? null;
}

/** How many values a child slot of an instance holds — the upper-bound gate's input. */
export function childSlotCount(ownerId: string, childKey: string): number {
    return childCount(lookup(), ownerId, childKey);
}

/**
 * Everything the pure engine needs about the live model to render and validate a
 * draft: the candidates of each reference, and the names already taken among the
 * siblings this draft would join.
 *
 * THE CONTAINMENT-LOOP FILTER IS APPLIED HERE, and it is the answer to point 6 of
 * `form-engine-contract.md`. The exclusion set is the containment chain of the
 * draft's OWNER — the chain the draft will inherit the moment it is committed —
 * because the draft has no chain of its own yet. It is subtracted only from
 * containment features, exactly as `LValue.get_validTargets` subtracts
 * `fatherList` behind its own `if (isContainment)`; a non-containment reference
 * cannot close a containment cycle, and filtering one would forbid a legal model.
 *
 * A root draft (`ownerId === null`) has an empty chain: nothing can be its ancestor
 * yet, so nothing is excluded.
 *
 * MEASURED, AND DECLARED RATHER THAN LEFT TO BE DISCOVERED: through THIS path the
 * filter is currently inert, and it is inert for a reason that is itself a
 * ratification. `draftableRefs` returns `ClassShape.refs`, which holds the
 * NON-containment references only — «containment creates» (Turno 10) leaves no
 * containment picker in a draft, so `r.composition` is false for every candidate
 * list built here. The condition is written as the rule reads, not as today's data
 * happens to make it, because the two paths that will reach it are already named:
 * the containment-slot EDIT of 12b/12c, and any «move an existing child here»
 * gesture. Until then the guarantee is the core's: `setValueAtPosition` refuses the
 * write outright (`LModelElement.tsx:7654`), and `LValue.get_validTargets` filters
 * the picker `IRForm` already mounts. `createDraw.candidatesFor` is what a caller
 * on those paths uses, and it is tested by contrast rather than by assertion of
 * absence.
 */
export function draftContext(
    modelId: string,
    shape: MetamodelShape,
    draft: Draft,
): DraftContext {
    const idlookup = lookup();
    const cls: ClassShape | undefined = shape?.classes?.[draft?.cls];
    if (!cls) return { candidates: {}, siblingNames: [] };

    const chain = draft.ownerId ? containmentChain(idlookup, draft.ownerId).objectIds : [];

    const candidates: Record<string, DraftOption[]> = {};
    for (const r of draftableRefs(cls)) {
        candidates[r.key] = candidatesFor(
            idlookup,
            modelId,
            conformanceClassIds(modelId, r.of),
            { isContainment: r.composition, excludeIds: chain },
        );
    }

    return { candidates, siblingNames: namespaceNames(modelId, draft) };
}

/**
 * The names already taken in the namespace the draft would join — READ FROM THE
 * CORE, not recomputed here (R-S1-3).
 *
 * Until S1a this came from `createDraw.siblingNames`, which scoped the check to
 * «same metaclass, same owner». The core scopes it to «same father, whatever the
 * metaclass», and the two are ORTHOGONAL, not nested: each accepts something the
 * other refuses (`discovery_2026-08-30_s1_uniqueness_consumatori.md` §3). Two rules
 * that disagree is the divergence this slice exists to close, so the adapter now
 * resolves the FATHER the draft will hang from and hands the core's namespace to
 * `jjform.validateDraft` — which stays a consumer, and gains no rule of its own.
 *
 * The father is the same one `applyCreate` writes under: the owner's containment
 * slot for a contained draft, the model for a root. `LObject.name` is the identity
 * slot first, then `DObject.name` (`LModelElement.tsx:5969`), i.e. the name the user
 * reads — so a duplicate that shows on screen is a duplicate the check sees.
 */
function namespaceNames(modelId: string, draft: Draft): string[] {
    let father: unknown = null;
    if (draft.ownerId && draft.childKey) {
        const lOwner: any = LPointerTargetable.fromPointer(draft.ownerId);
        father = lOwner?.['$' + draft.childKey]
            ?? (lOwner?.features ?? []).find((f: any) => f?.name === draft.childKey)
            ?? null;
    } else {
        father = LPointerTargetable.fromPointer(modelId) ?? null;
    }
    if (!father) return [];
    return getNamespaceOf(father as LModelElement)
        .map(o => (o?.name ?? '') as string)
        .filter(Boolean);
}

/** The slot value a draft string becomes, by the attribute's type.
 *  `enum` keeps the literal POINTER the draft holds; a number becomes a number so
 *  the slot is not a string that merely looks numeric. */
function typedValue(attr: AttrShape, raw: string): string | number | boolean {
    switch (attr.type) {
        case 'number': {
            const n = Number(raw);
            return Number.isNaN(n) ? raw : n;
        }
        case 'boolean':
            return raw === 'true' || raw === '1';
        default:
            return raw;
    }
}

/**
 * Apply a validated draft to the D graph. Returns the new instance's id, or null.
 *
 * The caller validates first: this function does NOT re-run `validateDraft`, on
 * purpose — a second verdict computed from a second reading of the model could
 * disagree with the one the user is looking at, and the commit button is the place
 * where the two must be the same. What it does check is the shape of its own
 * arguments, because a missing owner slot is a bug here, not a user error.
 */
export function applyCreate(
    modelId: string,
    shape: MetamodelShape,
    draft: Draft,
): string | null {
    const cls: ClassShape | undefined = shape?.classes?.[draft?.cls];
    if (!cls) return null;
    const classId = classIdOf(modelId, cls.key);
    if (!classId) return null;

    // The json the seeding loop of `addObject` reads. `$`-prefixed everywhere but
    // `name`, which has to reach `DObject.name` as well — see the header.
    const json: Record<string, unknown> = {};
    const hasNameAttr = cls.attrs.some(a => a.key === 'name');
    for (const a of draftableAttrs(cls)) {
        const raw = (draft.values[a.key] ?? '').trim();
        if (!raw) continue;                       // an untouched field writes nothing
        if (a.key === 'name' && hasNameAttr) json.name = raw;
        else json['$' + a.key] = typedValue(a, raw);
    }
    for (const r of draftableRefs(cls)) {
        const target = (draft.refs[r.key] ?? '').trim();
        if (target) json['$' + r.key] = target;
    }

    try {
        let created: any = null;
        if (draft.ownerId && draft.childKey) {
            const lOwner: any = LPointerTargetable.fromPointer(draft.ownerId);
            // `$key` is the documented slot accessor (CLAUDE.md §9.1) and the one
            // `addObject` itself uses when it seeds values. `features` is the
            // fallback for a slot the accessor does not resolve.
            const slot: any = lOwner?.['$' + draft.childKey]
                ?? (lOwner?.features ?? []).find((f: any) => f?.name === draft.childKey);
            if (!slot) {
                console.warn('[createAdapter] applyCreate: child slot not found', {
                    ownerId: draft.ownerId, childKey: draft.childKey,
                });
                return null;
            }
            // No outer TRANSACTION: addObject opens its own around DObject.new3.
            created = slot.addObject(json, classId, true);
        } else {
            const lModel: any = LPointerTargetable.fromPointer(modelId);
            if (!lModel) return null;
            created = lModel.addObject(json, classId, true);
        }

        if (!created?.id) {
            console.warn('[createAdapter] applyCreate: addObject returned no instance', { draft });
            return null;
        }
        U.isProjectModified = true;
        return created.id as string;
    } catch (err) {
        console.warn('[createAdapter] applyCreate failed', { draft, err });
        return null;
    }
}
