/**
 * Classifier-kind rules of a metamodel, in a module the test bench can import.
 *
 * Enum step B (R-EDGE-2, P-2026-09-27-1806): the model layer refuses what the canvas has
 * refused since C1 (`isMetamodelConnectionValid`, `5dc09a4ce`), for the writers C1 does not
 * see: the console, the L API, custom view code. The setters that apply these rules live in
 * `LModelElement.tsx` and `joiner/classes.ts`, which `vitest` cannot load (`window is not
 * defined` through the `joiner` barrel), so the rules live here and are executed, not read.
 *
 * The module imports nothing on purpose, as `nameLookup.ts`: an import from `joiner`, even a
 * type, would pull the barrel back in.
 *
 * Evidence: docs/discovery/discovery_2026-09-27_enum_step_b.md, §3.6 (the candidate guard live
 * on load, undo/redo, VersionFixer replay, «Check integrity» and the Ecore import: 0 refusals)
 * and §4 B1-B3, B5.
 */

/** The D className of the one classifier that can type a reference or sit on either end of an `extends`. */
export const CLASS_KIND = 'DClass';

/** True for a class's D className. `undefined` (a pointer that does not resolve) is not a class. */
export function isClassKind(className: string | undefined | null): boolean {
    return className === CLASS_KIND;
}

/**
 * B1. May a typed element of D className `ownerClassName` take as its type an element of D
 * className `targetClassName`? Only a `DReference` is constrained: it is typed by a class.
 *
 * `targetClassName` is `undefined` when the pointer does not resolve. That passes, as today:
 * `set_type` keeps a name it cannot resolve yet (set-by-name, resolved later by `get_type`).
 */
export function isTypeKindAllowed(ownerClassName: string | undefined, targetClassName: string | undefined): boolean {
    if (ownerClassName !== 'DReference') return true;
    if (targetClassName === undefined) return true;
    return isClassKind(targetClassName);
}

/**
 * B3. May a data type's `extends` go from `prev` to `next`? Only when the write adds nothing.
 *
 * Removals stay open: deleting the class a saved enum «extends» (`Dummy.dclass`) and unlinking
 * that edge from the canvas (`syncDeleteEdge`) are the two legitimate writers, and both shrink
 * the list. Refusing every write was measured to leave a dangling pointer in the first and to
 * block the only in-app repair in the second (report §3.6, mode `on-a`).
 */
export function isDataTypeExtendsWriteAllowed(prev: readonly string[] | undefined | null, next: readonly string[]): boolean {
    const before = new Set(prev ?? []);
    for (const p of next) if (!before.has(p)) return false;
    return true;
}

// ── S24: the saved shapes, detected over idlookup ────────────────────────────
//
// A metamodel saved before C1 and step B may still hold the three shapes of R-EDGE-3 (S1 a
// reference typed by an enum, S6 a reference typed by a package, S5b an enum with a supertype),
// plus a class whose supertype is not a class. The model layer now refuses to write them; a
// saved one loads as it was (report §3.2). The detector finds them for the problems registry
// (UniquenessProblemSync); it shows, it repairs nothing (report §5, decision G).

/** The D classNames of the data types: they have no supertypes. */
export const DATA_TYPE_KINDS: readonly string[] = ['DDataType', 'DEnumerator'];

export type ClassifierKindViolationKind =
    | 'reference-type-not-class'
    | 'reference-type-missing'
    | 'datatype-extends'
    | 'supertype-not-class';

export interface ClassifierKindViolation {
    kind: ClassifierKindViolationKind;
    /** The element that holds the pointer: the reference, the data type, the class. */
    elementId: string;
    /** The pointers that break the rule. */
    targetIds: string[];
    /**
     * Where a surface keyed by element id shows it: the element itself, then the classes that
     * carry a row in the tree (which lists classes, not features nor enumerations): a
     * reference's owner, the classes a data type claims to extend.
     */
    anchorIds: string[];
}

/** The part of an idlookup entry the detector reads. */
export interface ClassifierKindEntry {
    className?: string;
    name?: string;
    father?: string;
    isMetamodel?: boolean;
    type?: unknown;
    extends?: unknown;
}

export type ClassifierKindLookup = Readonly<Record<string, ClassifierKindEntry | null | undefined>>;

/** `Pointers.isPointer` without a state: a pointer is a string that starts with `Pointer`. */
function isPointerLike(v: unknown): v is string {
    return typeof v === 'string' && v.indexOf('Pointer') === 0;
}

function pointersOf(v: unknown): string[] {
    return Array.isArray(v) ? v.filter((p): p is string => typeof p === 'string' && !!p) : [];
}

/** The DModel an element belongs to, walking `father`; undefined on a broken chain or a cycle. */
export function modelIdOf(idlookup: ClassifierKindLookup, id: string, maxDepth: number = 32): string | undefined {
    let cur: string | undefined = id;
    for (let i = 0; i < maxDepth && cur; i++) {
        const d: ClassifierKindEntry | null | undefined = idlookup[cur];
        if (!d) return undefined;
        if (d.className === 'DModel') return cur;
        cur = d.father;
    }
    return undefined;
}

function isKindRelevant(className: string | undefined): boolean {
    return className === 'DReference' || className === CLASS_KIND || DATA_TYPE_KINDS.includes(className as string);
}

/**
 * The violations held by the elements of model `modelId`, sorted by element id.
 *
 * Own keys only: `idlookup`'s `__proto__` holds the pending creates, and a create the store
 * has not committed is not a problem the user can act on (the rule UniquenessProblemSync
 * follows, for the same reason).
 *
 * A reference whose type is a pointer to nothing is `reference-type-missing`, its own verdict,
 * not a non-class: undo can expose one between two steps (report §3.3, §8 decision 6). A type
 * that is a name, set before its class existed, is not reported.
 */
export function findClassifierKindViolations(idlookup: ClassifierKindLookup, modelId: string): ClassifierKindViolation[] {
    const out: ClassifierKindViolation[] = [];
    for (const id of Object.keys(idlookup)) {
        const d = idlookup[id];
        if (!d || typeof d !== 'object' || !isKindRelevant(d.className)) continue;
        if (modelIdOf(idlookup, id) !== modelId) continue;
        if (d.className === 'DReference') {
            const t = d.type;
            if (typeof t !== 'string' || !t) continue;
            const owner = d.father && isClassKind(idlookup[d.father]?.className) ? [d.father] : [];
            const target = idlookup[t];
            if (!target) {
                if (isPointerLike(t)) out.push({ kind: 'reference-type-missing', elementId: id, targetIds: [t], anchorIds: [id, ...owner] });
                continue;
            }
            if (!isClassKind(target.className)) out.push({ kind: 'reference-type-not-class', elementId: id, targetIds: [t], anchorIds: [id, ...owner] });
        } else if (isClassKind(d.className)) {
            const bad = pointersOf(d.extends).filter((p) => !!idlookup[p] && !isClassKind(idlookup[p]?.className));
            if (bad.length) out.push({ kind: 'supertype-not-class', elementId: id, targetIds: bad, anchorIds: [id] });
        } else {
            const ext = pointersOf(d.extends);
            if (ext.length) out.push({ kind: 'datatype-extends', elementId: id, targetIds: ext, anchorIds: [id, ...ext.filter((p) => isClassKind(idlookup[p]?.className))] });
        }
    }
    out.sort((a, b) => (a.elementId < b.elementId ? -1 : a.elementId > b.elementId ? 1 : 0));
    return out;
}

/**
 * A string that changes whenever a verdict of `findClassifierKindViolations` can change: the
 * type, supertypes and father of every reference, class and data type, with the kind of each
 * target. Names are left out on purpose (a rename changes no verdict, only a text). Own keys
 * only, as above: the commit of a create is what moves it.
 */
export function classifierKindSignature(idlookup: ClassifierKindLookup): string {
    const kindOf = (p: string) => `${p}=${idlookup[p]?.className ?? ''}`;
    const parts: string[] = [];
    for (const id of Object.keys(idlookup)) {
        const d = idlookup[id];
        if (!d || typeof d !== 'object' || !isKindRelevant(d.className)) continue;
        const t = typeof d.type === 'string' ? kindOf(d.type) : '';
        parts.push(`${id}:${d.className}:${d.father ?? ''}:${t}:${pointersOf(d.extends).map(kindOf).join(',')}`);
    }
    parts.sort();
    return parts.join('|');
}

function kindLabel(className: string | undefined): string {
    switch (className) {
        case 'DEnumerator': return 'the enumeration';
        case 'DDataType': return 'the data type';
        case 'DPackage': return 'the package';
        case 'DModel': return 'the model';
        default: return 'the element';
    }
}

/** The title and description a problem entry carries. English, no em dash. */
export function describeClassifierKindViolation(v: ClassifierKindViolation, idlookup: ClassifierKindLookup): { title: string; description: string } {
    const d = idlookup[v.elementId];
    const name = d?.name ?? v.elementId;
    const nameOf = (p: string) => idlookup[p]?.name ?? p;
    switch (v.kind) {
        case 'reference-type-not-class': {
            const t = v.targetIds[0];
            const owner = d?.father ? nameOf(d.father) + '.' : '';
            return {
                title: 'Reference typed by a non-class',
                description: `Reference "${owner}${name}" is typed by ${kindLabel(idlookup[t]?.className)} "${nameOf(t)}". A reference can only be typed by a class: retype it to a class.`,
            };
        }
        case 'reference-type-missing': {
            const owner = d?.father ? nameOf(d.father) + '.' : '';
            return {
                title: 'Reference type missing',
                description: `Reference "${owner}${name}" is typed by an element that no longer exists.`,
            };
        }
        case 'datatype-extends': {
            const what = d?.className === 'DEnumerator' ? 'Enumeration' : 'Data type';
            return {
                title: 'Supertype on a non-class',
                description: `${what} "${name}" extends ${v.targetIds.map((p) => `"${nameOf(p)}"`).join(', ')}. Only a class can have supertypes: remove the inheritance edge.`,
            };
        }
        case 'supertype-not-class': {
            const list = v.targetIds.map((p) => `${kindLabel(idlookup[p]?.className)} "${nameOf(p)}"`).join(', ');
            return {
                title: 'Non-class supertype',
                description: `Class "${name}" extends ${list}. Only a class can be a supertype: remove it from the supertypes of "${name}".`,
            };
        }
    }
}
