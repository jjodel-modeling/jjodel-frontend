/**
 * The input of the textual notation (R-TXT-16, step T1 of docs/discovery/discovery_2026-11-01_textual_viewpoint.md
 * §A.7): a metamodel and a model as plain data, read the way `buildEvalContext` exposes them to a JjGen generator
 * (class shells with own attributes and references, supertypes, enumerations; objects with every feature slot).
 *
 * A reference or containment slot holds the target's id, or an array of ids when many-valued. An attribute slot holds
 * what the L getter gives: `null` when unset and optional, an array when many-valued (R-TXT-5).
 */

export interface TextAttribute {
    readonly name: string;
    /** A primitive type name (`EInt`, `EString`, ...) or the name of an enumeration. */
    readonly type: string;
    readonly many?: boolean;
    /** Whether the order of the values matters (Ecore `ordered`, R-TXT-19); absent, the notation reads it as unordered. */
    readonly ordered?: boolean;
    /** The bounds as the metamodel declares them, `-1` an unbounded upper (step B1, hover); absent where the data has none. */
    readonly lower?: number;
    readonly upper?: number;
    /** The documentation (the GenModel `documentation` detail of Ecore), where the metamodel carries it (step B1, hover). */
    readonly doc?: string;
}

export interface TextReference {
    readonly name: string;
    /** The name of the target class. */
    readonly type: string;
    readonly containment?: boolean;
    readonly many?: boolean;
    /** As TextAttribute.ordered. */
    readonly ordered?: boolean;
    /** As TextAttribute. */
    readonly lower?: number;
    readonly upper?: number;
    readonly doc?: string;
}

export interface TextClass {
    readonly name: string;
    readonly isAbstract?: boolean;
    /** Direct supertypes, in declaration order. */
    readonly supers?: readonly string[];
    readonly attributes?: readonly TextAttribute[];
    readonly references?: readonly TextReference[];
    /** As TextAttribute.doc. */
    readonly doc?: string;
}

export interface TextEnumeration {
    readonly name: string;
    readonly literals: readonly string[];
    /** As TextAttribute.doc, of the enumeration and of its literals by name. */
    readonly doc?: string;
    readonly literalDocs?: Readonly<Record<string, string>>;
}

export interface TextMetamodel {
    readonly classes: readonly TextClass[];
    readonly enumerations: readonly TextEnumeration[];
}

export interface TextObject {
    readonly id: string;
    /** The name of the object's class. */
    readonly cls: string;
    readonly slots: Readonly<Record<string, unknown>>;
}

/**
 * R-TXT-32: a reference to an object the text does not print, as the parser reads `@"id"`: the target's id as written,
 * never resolved against the text. In the model's objects the same reference is a plain id that names no printed object.
 */
export interface OuterRef {
    readonly outer: string;
}

export const isOuterRef = (v: unknown): v is OuterRef => typeof v === 'object' && v !== null && typeof (v as OuterRef).outer === 'string';

/** A feature as the notation sees it: where it is declared, and whether it is a value, a link or a containment. */
export interface TextFeature {
    readonly name: string;
    readonly owner: string;
    readonly kind: 'attribute' | 'reference' | 'containment';
    readonly type: string;
    readonly many: boolean;
    /** Set only when the metamodel's data says (TextAttribute.ordered). */
    readonly ordered?: boolean;
}

function classNamed(mm: TextMetamodel, name: string): TextClass | undefined {
    return mm.classes.find(c => c.name === name);
}

/** Every ancestor once, depth-first from the class in the declaration order of the supertypes (JjEL `allSuperclasses`). */
function ancestorWalk(mm: TextMetamodel, c: TextClass): TextClass[] {
    const seen: TextClass[] = [];
    const visit = (k: TextClass): void => {
        for (const s of k.supers ?? []) {
            const sc = classNamed(mm, s);
            if (sc && !seen.includes(sc)) {
                seen.push(sc);
                visit(sc);
            }
        }
    };
    visit(c);
    return seen;
}

/**
 * The ancestors of a class, most general first (R-TXT-1): ordered by their own number of ancestors, ties kept in the
 * depth-first declaration order of the walk (R-TXT-12). The sort is stable, as JjEL `sortBy` is.
 */
export function classAncestors(mm: TextMetamodel, c: TextClass): TextClass[] {
    const walk = ancestorWalk(mm, c);
    const count = new Map(walk.map(a => [a, ancestorWalk(mm, a).length] as const));
    return [...walk].sort((x, y) => (count.get(x) ?? 0) - (count.get(y) ?? 0));
}

/** The features of a class in R-TXT-1 order: the ancestors' first, then its own; attributes before references in each. */
export function classFeatures(mm: TextMetamodel, c: TextClass): TextFeature[] {
    const out: TextFeature[] = [];
    for (const k of [...classAncestors(mm, c), c]) {
        for (const a of k.attributes ?? []) {
            out.push({ name: a.name, owner: k.name, kind: 'attribute', type: a.type, many: !!a.many, ...(a.ordered !== undefined ? { ordered: a.ordered } : {}) });
        }
        for (const r of k.references ?? []) {
            out.push({ name: r.name, owner: k.name, kind: r.containment ? 'containment' : 'reference', type: r.type, many: !!r.many,
                ...(r.ordered !== undefined ? { ordered: r.ordered } : {}) });
        }
    }
    return out;
}

/** The concrete classes that can stand where `type` is expected: `type` itself if concrete, and its concrete heirs. */
export function concreteClassesOf(mm: TextMetamodel, type: string): TextClass[] {
    return mm.classes.filter(c => !c.isAbstract && (c.name === type || ancestorWalk(mm, c).some(a => a.name === type)));
}

/** The attribute that is the object's identity slot (R-TXT-3): an attribute called `name`, own or inherited. */
export function isNameFeature(f: TextFeature): boolean {
    return f.kind === 'attribute' && f.name === 'name';
}
