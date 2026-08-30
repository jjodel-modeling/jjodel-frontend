/**
 * Name uniqueness — ONE rule per level, ONE implementation of each.
 *
 * Two halves live here, and they share the verdict shape (`UniquenessVerdict`) and
 * the refusal sentence (`refusalReason`) on purpose: those are the two things that
 * must not exist in two copies, or a create and a rename end up describing the same
 * collision in two ways.
 *
 *   M1 (S1a, R-S1-1..4)  — the siblings under the same father. First half below.
 *   M2 (S1-M2, R-M2U-*)  — six namespaces, two of them wider than the siblings.
 *                          Last section of this file, with its own header.
 *
 * ── M1 ────────────────────────────────────────────────────────────────────────
 *
 * Sibling name uniqueness for M1 instances.
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

import { DModel, DObject, DValue, GObject, LModel, LModelElement, LObject, LValue } from '../../joiner';

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
    /**
     * Present only on an ACCEPTED write that creates a near-homonym (R-M2U-1): the
     * name differs from a sibling only by case. The write goes through — `Foo` and
     * `foo` are different names — but it says so. Never present when `ok` is false:
     * a refusal already carries `reason`. M2 only; the M1 verdict never sets it.
     */
    warning?: string;
}

/** The sentence a refusal carries. One wording for every consumer, so the rename
 *  and the create cannot describe the same collision in two ways.
 *
 *  `inheritedFrom` is the M2 shadowing case (R-M2U-4): a feature colliding with one
 *  the class does not own. It extends the same sentence rather than opening a second
 *  one, so a consumer that prints `reason` verbatim keeps working. */
function refusalReason(
    name: string,
    collider: { className?: string; name?: string } | undefined,
    inheritedFrom?: string
): string {
    const ownerType = (collider?.className ?? 'Element').replace(/^[DLW]/, '');
    const ownerName = collider?.name ?? '?';
    const base = `Name "${name}" already used by ${ownerType} "${ownerName}"`;
    return inheritedFrom ? `${base} inherited from Class "${inheritedFrom}"` : base;
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

// ─────────────────────────────────────────────────────────────────────────────
//  M2 — the metamodel namespace (S1-M2)
// ─────────────────────────────────────────────────────────────────────────────
//
// Same design as the M1 half above, and deliberately the SAME `UniquenessVerdict`
// and the SAME `refusalReason`: the create and the rename of an M2 element must not
// be able to describe one collision in two ways, and the sentence exists once.
//
// What is NOT shared is the namespace, because M2's is not «the siblings»:
//
//   classifier  R-M2U-2  the WHOLE metamodel — two `DupProbe` in two packages of one
//                        metamodel collide; the same name in another metamodel does not.
//   datatype    R-M2U-3  a namespace of its own — a class and a datatype may share a
//                        name. This is intended behaviour, not a hole: see the referto.
//   feature     R-M2U-4  the class's own AND inherited features — no shadowing.
//   package     ─        `father.children`, exactly as today.
//   literal     ─        `father.children`, exactly as today.
//   parameter   ─        `father.children`, exactly as today.
//
// The last three are unchanged on purpose. The ratified decisions widen classifiers
// and features; narrowing or widening the other three was not decided, and either
// would silently move a committed, on-screen check (CLAUDE.md rule 3).
//
// Measured, and the reason the auto-name is NOT gated here: `idlookup` is a Proxy
// whose `get` trap resolves a pending creation but whose enumeration does not list
// it (`Object.keys` unchanged, a scan finds nothing, the direct hit by id finds the
// object). So NO namespace source — collection, `children`, or an idlookup scan —
// can see a create made in the same tick, and four `addClass()` in one tick still
// take the same `defaultname`. That duplicate needs the tick fix and is declared,
// not closed: docs/discovery/discovery_2026-08-30_s1m2_una_regola.md §3.

/** The six M2 namespaces. Not a metaclass list: `DClass` and `DEnumerator` share one. */
export type M2NamespaceKind = 'classifier' | 'datatype' | 'feature' | 'package' | 'literal' | 'parameter';

const M2_KIND_BY_CLASSNAME: { [className: string]: M2NamespaceKind } = {
    DClass: 'classifier',
    DEnumerator: 'classifier',
    DDataType: 'datatype',
    DAttribute: 'feature',
    DReference: 'feature',
    DOperation: 'feature',
    DPackage: 'package',
    DEnumLiteral: 'literal',
    DParameter: 'parameter',
};

/**
 * The namespace an element of this D-layer className belongs to, or `null` when the
 * className is not an M2 named element (`DModel`, `DObject`, `DValue`, `DVertex`, …).
 *
 * `null` is the signal every consumer uses to fall back to the behaviour it had
 * before S1-M2 — it must never be read as «no rule applies».
 *
 * Reminder (CLAUDE.md §3.13): an L-proxy's `.className` is the D name, so passing
 * `lproxy.className` straight in is correct; `'LClass'` would never match.
 */
export function m2KindOf(className: string | undefined | null): M2NamespaceKind | null {
    if (!className) return null;
    return M2_KIND_BY_CLASSNAME[className] ?? null;
}

/** Walk up the `father` chain to the owning DModel. Bounded: a malformed chain must
 *  return null, never spin. Returns null when the element is not under a model yet. */
function ownerModelOf(start: LModelElement | undefined | null): LModel | null {
    let node: GObject | null | undefined = start as unknown as GObject;
    for (let i = 0; i < 32 && node; i++) {
        if ((node as { className?: string }).className === DModel.cname) return node as unknown as LModel;
        node = (node as { father?: GObject }).father;
    }
    return null;
}

/** Every package of the metamodel `start` belongs to, including the root one.
 *  `allSubPackages` on the model is recursive (measured: it grows by one when a
 *  subpackage is added), so this is the whole metamodel and not one level. */
function packagesOfMetamodel(start: LModelElement | undefined | null): GObject[] {
    const model = ownerModelOf(start);
    if (!model) return [];
    return ((model as unknown as { allSubPackages?: GObject[] }).allSubPackages ?? []) as GObject[];
}

function collectionOf(holder: GObject | undefined | null, field: string): GObject[] {
    const v = holder ? (holder as { [k: string]: unknown })[field] : undefined;
    return Array.isArray(v) ? (v as GObject[]) : [];
}

/**
 * The namespace a name must be unique in, resolved from the FATHER and the kind of
 * element being named. The M2 twin of `getNamespaceOf`, and the single place the
 * scope of the M2 rule is decided.
 *
 * `father` is the PROSPECTIVE parent: a create has no element yet, so the namespace
 * cannot be read off the element. `excludeId` drops the element being renamed; a
 * create passes none.
 */
export function getM2NamespaceOf(
    father: LModelElement | undefined | null,
    kind: M2NamespaceKind,
    excludeId?: string
): GObject[] {
    if (!father) return [];
    let pool: GObject[] = [];

    switch (kind) {
        case 'classifier': {
            // The whole metamodel, classes and enumerators together: they already
            // shared `pkg.children`, so keeping them in one namespace preserves the
            // committed class-agnostic behaviour while widening the pool.
            for (const pkg of packagesOfMetamodel(father)) {
                pool = pool.concat(collectionOf(pkg, 'classes'), collectionOf(pkg, 'enumerators'));
            }
            break;
        }
        case 'datatype': {
            for (const pkg of packagesOfMetamodel(father)) pool = pool.concat(collectionOf(pkg, 'datatypes'));
            break;
        }
        case 'feature': {
            // own ++ inherited, over the extendsChain (LModelElement.tsx:3080-3090).
            // Attributes, references and operations together: that is the union
            // `LClass.get_children_idlist` already used, minus the shadowing hole.
            pool = pool.concat(
                collectionOf(father as unknown as GObject, 'allAttributes'),
                collectionOf(father as unknown as GObject, 'allReferences'),
                collectionOf(father as unknown as GObject, 'allOperations')
            );
            break;
        }
        default: {
            // package / literal / parameter — unchanged: exactly the list the core
            // rule has always compared against.
            pool = collectionOf(father as unknown as GObject, 'children');
            break;
        }
    }

    return pool.filter(e => !!e && (e as { id?: string }).id !== excludeId);
}

/** The name of the class a feature is declared on, when that is NOT the class being
 *  written — i.e. the shadowing case. `undefined` for an own feature. */
function inheritedOwnerName(collider: GObject | undefined, father: LModelElement | undefined | null): string | undefined {
    const ownerId = (collider as { father?: { id?: string } } | undefined)?.father?.id;
    const fatherId = (father as unknown as { id?: string } | undefined)?.id;
    if (!ownerId || !fatherId || ownerId === fatherId) return undefined;
    return (collider as { father?: { name?: string } } | undefined)?.father?.name ?? undefined;
}

/**
 * THE M2 VERDICT — case-sensitive, over the namespace of `kind` under `father`.
 *
 * Case-sensitive by decision (R-M2U-1): `Foo` and `foo` are different names and both
 * are legal. What the rule adds is that the write which creates the near-homonym
 * SAYS SO — `warning` on an accepted verdict. A refusal never carries one.
 *
 * `undefined`/`null` is «no name asked for», not a name, and never collides: that is
 * the case a create hits when it lets `defaultname` compute the auto-name. Same
 * convention as `checkNameUniqueness`, so the two halves cannot drift.
 */
export function checkM2NameUniqueness(args: {
    father: LModelElement | undefined | null;
    kind: M2NamespaceKind;
    name: string;
    /** The element being renamed; omitted by a create. */
    excludeId?: string;
}): UniquenessVerdict {
    const name = args?.name;
    if (name === undefined || name === null) return { ok: true };

    const namespace = getM2NamespaceOf(args.father, args.kind, args.excludeId);
    const collidingWith = namespace.filter(e => (e as { name?: string }).name === name);
    if (collidingWith.length > 0) {
        const collider = collidingWith[0];
        return {
            ok: false,
            reason: refusalReason(
                name,
                collider as { className?: string; name?: string },
                args.kind === 'feature' ? inheritedOwnerName(collider, args.father) : undefined
            ),
            collidingWith: collidingWith as unknown as LObject[],
        };
    }

    // Accepted. Declare the near-homonym if there is one — the same namespace, read
    // case-insensitively. Only the FIRST is named: listing them all would turn a
    // notice into a report.
    const lowered = typeof name === 'string' ? name.toLowerCase() : '';
    const nearby = namespace.find(e => {
        const n = (e as { name?: string }).name;
        return typeof n === 'string' && n !== name && n.toLowerCase() === lowered;
    });
    if (!nearby) return { ok: true };
    return {
        ok: true,
        warning: `Name "${name}" differs only by case from "${(nearby as { name?: string }).name}" in the same scope`,
    };
}

/**
 * Full-metamodel scan — the M2 twin of `detectDuplicateNames`, and the producer
 * behind the badge (R-M2U-6).
 *
 * For each M2 element whose name collides in ITS namespace, the map holds the
 * elements it collides with. Keyed by element id, exactly like the M1 map, so the
 * badge producer treats both the same way.
 *
 * Only OWN features are walked: an inherited one belongs to the class that declares
 * it, and reporting it on every subclass would turn one duplicate into N. The
 * shadowing case still surfaces, because the own feature is checked against a
 * namespace that includes what it inherits.
 *
 * Complexity O(N × M) like the M1 scan; acceptable at metamodel sizes.
 */
export function detectM2DuplicateNames(model: LModel): Map<string, GObject[]> {
    const result = new Map<string, GObject[]>();
    if (!model) return result;

    const consider = (el: GObject | undefined, father: GObject | undefined, kind: M2NamespaceKind): void => {
        if (!el || !father) return;
        const verdict = checkM2NameUniqueness({
            father: father as unknown as LModelElement,
            kind,
            name: (el as { name?: string }).name as string,
            excludeId: (el as { id?: string }).id,
        });
        if (!verdict.ok) result.set((el as { id: string }).id, (verdict.collidingWith ?? []) as unknown as GObject[]);
    };

    for (const pkg of ((model as unknown as { allSubPackages?: GObject[] }).allSubPackages ?? [])) {
        for (const sub of collectionOf(pkg, 'subpackages')) consider(sub, pkg, 'package');
        for (const dt of collectionOf(pkg, 'datatypes')) consider(dt, pkg, 'datatype');
        const enums = collectionOf(pkg, 'enumerators');
        const classes = collectionOf(pkg, 'classes');
        for (const cl of classes) consider(cl, pkg, 'classifier');
        for (const en of enums) {
            consider(en, pkg, 'classifier');
            for (const lit of collectionOf(en, 'literals')) consider(lit, en, 'literal');
        }
        for (const cl of classes) {
            const ops = collectionOf(cl, 'ownOperations');
            for (const f of collectionOf(cl, 'ownAttributes')) consider(f, cl, 'feature');
            for (const f of collectionOf(cl, 'ownReferences')) consider(f, cl, 'feature');
            for (const op of ops) {
                consider(op, cl, 'feature');
                for (const par of collectionOf(op, 'parameters')) consider(par, op, 'parameter');
            }
        }
    }
    return result;
}
