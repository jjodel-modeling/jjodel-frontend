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
 *
 * ── The auto-increment of an ID attribute rides the SAME json (AUTO1) ─────────
 *
 * An `isID` attribute typed `EInt` is not offered in the draft (`draftableAttrs`
 * excludes it) and is not typed by anyone: its value is computed here, from the
 * model, and put in the json the create already carries. Not written afterwards —
 * that would be a SECOND deferral on top of `addObject`'s own, i.e. a window in
 * which the instance exists with an empty id and anything watching the store sees
 * it. One json, one deferral, one moment at which the instance is complete.
 *
 * A value the CALLER supplied always wins. `createInstance` has two callers —
 * `applyCreate` below and `writeCtxLproxy` (S4) — and an explicit seed is a fact
 * the host stated, while the generated number is a default; overwriting the first
 * with the second would make an import or a scripted create unable to keep its own
 * ids.
 *
 * Keys are `$`-prefixed here too: the generated value is a SLOT value like any
 * other. The one exception below is `name`, and it is the same exception.
 */

import { LPointerTargetable, store, U } from '../../../joiner';
import type { LModelElement } from '../../../joiner';
import { getNamespaceOf } from '../../../model/logicWrapper/nameUniqueness';
import type { AttrShape, ClassShape, CreateResult, Draft, DraftContext, DraftOption, MetamodelShape } from '../../../jjform';
import { draftableAttrs, draftableRefs, draftTargets } from '../../../jjform';
// Deep import, as `shapeDraw.ts` next door already does: `isAutoIdAttr` is not on
// the barrel's public surface, and putting it there would be a seventh file this
// task is not scoped to touch. The module is the same either way.
import { isAutoIdAttr } from '../../../jjform/shape';
import { candidatesFor, childCount, containmentChain, nextIdValue } from './createDraw';
import { getMetaclassInfo, type MetaclassInfo } from './useEditorMode';

type Idlookup = Record<string, any>;

/** What one seed key may carry. The array is CRUD2's widening — a multivalued
 *  reference handed over as ONE list, mirroring `WriteCtx.create`'s own parameter.
 *  Declared once here so the primitive, its auto-id helper and the draft translator
 *  cannot drift apart on it. */
type SeedValue = string | number | boolean | readonly string[];

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
 * The generated value of every auto-ID attribute of `className` the caller did not
 * already supply.
 *
 * The attributes come from `MetaclassInfo.allAttributes` — own AND inherited, the
 * same field `shapeAdapter` builds `ClassShape.attrs` from — because an id
 * declared on a superclass is exactly the case that must keep working: one
 * `DAttribute.id`, one sequence, shared down the hierarchy. The flag itself is NOT
 * on `MetaclassAttribute` and is not put there (that structure is out of this
 * task's perimeter): it is read off the raw `DAttribute` in `idlookup`, which is
 * where `shapeDraw.attrShape` reads it too.
 *
 * The gate is `isAutoIdAttr`, the same predicate that hid the control in the draft
 * and renders the field read-only in the form. An `isID` attribute over any other
 * type is left alone: nothing here knows how to generate a string, and seeding it
 * would put a number where the metamodel asked for something else.
 *
 * A metamodel this host cannot resolve yields no keys — `classesByName` already
 * answers an empty map for a half-loaded model, and a create that cannot see the
 * metaclass has bigger problems than a missing id.
 */
function autoIdSeed(
    modelId: string,
    className: string,
    seed: Readonly<Record<string, SeedValue>>,
): Record<string, number> {
    const info = classesByName(modelId)[className];
    const attrs = info?.allAttributes ?? info?.attributes ?? [];
    if (attrs.length === 0) return {};

    const idlookup = lookup();
    const out: Record<string, number> = {};
    for (const a of attrs) {
        if (!a?.name || !a?.id) continue;
        if (Object.prototype.hasOwnProperty.call(seed ?? {}, a.name)) continue;
        if (!isAutoIdAttr({ isID: idlookup[a.id]?.isID === true, typeName: a.type })) continue;
        out[a.name] = nextIdValue(idlookup, a.id);
    }
    return out;
}

/**
 * The feature names of `className` whose reference the CORE treats as containment
 * while the SHAPE does not — i.e. the pure aggregations (CRUD2 §2.5).
 *
 * Two readings of one word disagree, and both are load-bearing where they are:
 *
 *   useEditorMode.ts:421     containment: !!(ref.composition)
 *   LModelElement.tsx:4164   get_containment: composition || aggregation
 *
 * `{composition} ⊂ {composition ∨ aggregation}`, so a reference with `aggregation`
 * and no `composition` lands in `ClassShape.refs` — the modal offers it as «pick a
 * target» — while the write path takes it for a containment and REPARENTS the
 * target. Measured: picking an existing `s1` for a `Group.members` aggregation moved
 * `s1.father` from its `states` slot to `members` and left `sm1.states = [null]`,
 * with no error and no way for the caller to notice
 * (`discovery_2026-09-01_crud2_cardinalita_aggancio.md` §2.5).
 *
 * Measured per contrasto on the same fixture, and it is why this set is the
 * aggregations and NOT every non-composition reference: a PURE reference seeded
 * through the same json leaves the father exactly where it was. Only the
 * aggregation branch evicts, so only the aggregation branch is diverted.
 *
 * An empty set is the honest answer for a metamodel this host cannot resolve, and
 * it restores the previous behaviour rather than diverting everything.
 */
function aggregationKeys(modelId: string, className: string): Set<string> {
    const out = new Set<string>();
    const info = classesByName(modelId)[className];
    for (const r of info?.references ?? []) {
        if (r?.name && r.aggregation === true && r.containment !== true) out.add(r.name);
    }
    return out;
}

/**
 * Write the diverted aggregation values, with the eviction switched OFF.
 *
 * `setValueAtPosition`'s third argument is the escape hatch the core already
 * exposes: `info.isContainment` is only DERIVED from `LReference.containment` when
 * the caller leaves it undefined, so passing `false` writes the value and skips
 * both the father reassignment and the detach-from-old-parent action. Measured:
 * the value lands in the slot, `{success: true}` comes back, and the target's
 * father does not move. Nothing in `set_values` or `get_containment` is touched —
 * changing either would be a core change (rule 5) and this does not need one.
 *
 * The indices are the CALLER's, taken from the array in hand and never re-derived
 * from the store — the contract ENG1 §B.4 pinned as a comment on
 * `get_setValueAtPosition`. That is the same discipline `set_values` follows
 * internally, and it is what makes N values one gesture rather than N racing ones.
 *
 * ── Why this one pays a second deferral, and only this one ───────────────────
 *
 * The json route cannot carry `info`, so an aggregation cannot ride `addObject`'s
 * own deferral. The slots themselves exist from the constructor, not from the
 * seeding, so the wait is for the same window `addObject` waits for — scheduled at
 * `UpdatingTimer * 3` so it lands after the seeding at `* 2` rather than racing it
 * for the same slot. Declared rather than hidden: `createInstance` returns before
 * these values are in the store, so a caller that reads the slot synchronously sees
 * it empty. Every other value still arrives with the create.
 */
function writeApart(objectId: string, entries: Array<[string, readonly string[]]>): void {
    if (entries.length === 0) return;
    setTimeout(() => {
        const lobj: any = LPointerTargetable.fromPointer(objectId);
        if (!lobj) { console.warn('[createAdapter] aggregation write: instance vanished', { objectId }); return; }
        for (const [key, ids] of entries) {
            const slot: any = lobj['$' + key] ?? (lobj.features ?? []).find((f: any) => f?.name === key);
            if (!slot) { console.warn('[createAdapter] aggregation write: slot not found', { objectId, key }); continue; }
            for (let i = 0; i < ids.length; i++) {
                const r = slot.setValueAtPosition(i, ids[i], { isContainment: false });
                if (r && r.success === false) {
                    console.warn('[createAdapter] aggregation write refused', { objectId, key, i, reason: r.reason });
                }
            }
        }
    }, U.UpdatingTimer * 3);
}

/**
 * Create ONE instance — the `create` primitive of `WriteCtx` (S4), on this host.
 *
 * Split out of `applyCreate` unchanged: same `addObject`, same arguments, same
 * `forceCreation: true`, same absence of an outer TRANSACTION. What the split buys is
 * that the primitive now has the contract's SHAPE — `(cls, ownerId|null,
 * childKey|null, seed)` returning a `CreateResult` — so `writeCtxLproxy` can hand it
 * to the engine without a translation layer in between, and `applyCreate` above stays
 * what it was: the draft's translator.
 *
 * `seed` carries BARE feature keys. The `$`-prefixing is this host's, and it happens
 * here: `:7157` reads a `$` key as «slot, and only slot». `name` is the one exception
 * and passes bare, so the same string reaches `DObject.name` through the
 * `{...json, father}` spread AND the identity slot — the double binding of §3.12, from
 * the one place that can write both at once. A caller that does not want the name
 * bound simply does not put `name` in the seed.
 */
export function createInstance(
    modelId: string,
    className: string,
    ownerId: string | null,
    childKey: string | null,
    seed: Readonly<Record<string, SeedValue>>,
): CreateResult {
    const classId = classIdOf(modelId, className);
    if (!classId) return { ok: false, id: null, reason: `metaclass "${className}" is not in this model` };

    // CRUD2 §2.5: the aggregation keys leave the json and are written apart. Every
    // other key — attributes, the auto-id of AUTO1, composition and plain
    // references — keeps riding the single deferral `addObject` already pays.
    const evicting = aggregationKeys(modelId, className);
    const json: Record<string, unknown> = {};
    const apart: Array<[string, readonly string[]]> = [];
    const route = (key: string, value: unknown) => {
        if (evicting.has(key)) {
            apart.push([key, Array.isArray(value) ? value.map(String) : [String(value)]]);
            return;
        }
        if (key === 'name') json.name = value;
        else json['$' + key] = value;
    };
    for (const [key, value] of Object.entries(seed ?? {})) route(key, value);
    for (const [key, value] of Object.entries(autoIdSeed(modelId, className, seed))) route(key, value);

    try {
        let created: any = null;
        if (ownerId && childKey) {
            const lOwner: any = LPointerTargetable.fromPointer(ownerId);
            // `$key` is the documented slot accessor (CLAUDE.md §9.1) and the one
            // `addObject` itself uses when it seeds values. `features` is the
            // fallback for a slot the accessor does not resolve.
            const slot: any = lOwner?.['$' + childKey]
                ?? (lOwner?.features ?? []).find((f: any) => f?.name === childKey);
            if (!slot) {
                console.warn('[createAdapter] applyCreate: child slot not found', { ownerId, childKey });
                return { ok: false, id: null, reason: `feature "${childKey}" is not on this object` };
            }
            // No outer TRANSACTION: addObject opens its own around DObject.new3.
            created = slot.addObject(json, classId, true);
        } else {
            const lModel: any = LPointerTargetable.fromPointer(modelId);
            if (!lModel) return { ok: false, id: null, reason: 'model not found' };
            created = lModel.addObject(json, classId, true);
        }

        if (!created?.id) {
            console.warn('[createAdapter] applyCreate: addObject returned no instance', { className, ownerId, childKey });
            return { ok: false, id: null, reason: 'the host created no instance' };
        }
        writeApart(created.id as string, apart);
        U.isProjectModified = true;
        return { ok: true, id: created.id as string };
    } catch (err) {
        console.warn('[createAdapter] applyCreate failed', { className, ownerId, childKey, err });
        const message = (err as { message?: unknown })?.message;
        return { ok: false, id: null, reason: typeof message === 'string' ? message : undefined };
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
 *
 * Since S4 the write itself is `createInstance` above, and this function is what it
 * always was underneath: the translation of a DRAFT — untouched fields dropped,
 * strings typed by the attribute's type — into the seed the primitive takes. The
 * translation is shape-driven and stays here, next to the draft; the write is the
 * contract's and is one call away.
 */
export function applyCreate(
    modelId: string,
    shape: MetamodelShape,
    draft: Draft,
): string | null {
    const cls: ClassShape | undefined = shape?.classes?.[draft?.cls];
    if (!cls) return null;

    // The seed the create carries. `name` is included only when the metaclass
    // actually declares the attribute — `draftableAttrs` reads `cls.attrs`, so a
    // class without it never offers the field and never reaches this line.
    const seed: Record<string, SeedValue> = {};
    for (const a of draftableAttrs(cls)) {
        const raw = (draft.values[a.key] ?? '').trim();
        if (!raw) continue;                       // an untouched field writes nothing
        seed[a.key] = typedValue(a, raw);
    }
    for (const r of draftableRefs(cls)) {
        // `draftTargets` answers for both cardinalities, so this loop does not
        // branch on `many`: what changes is only the SHAPE of the value handed over
        // — one id, or the whole list in one key. A multivalued feature with no pick
        // writes nothing, exactly as an untouched single one does; sending `[]`
        // would be a write that clears a slot the user never opened.
        const targets = draftTargets(draft, r);
        if (targets.length === 0) continue;
        seed[r.key] = r.many ? targets : targets[0];
    }

    const result = createInstance(modelId, cls.key, draft.ownerId ?? null, draft.childKey ?? null, seed);
    return result.ok ? result.id : null;
}
