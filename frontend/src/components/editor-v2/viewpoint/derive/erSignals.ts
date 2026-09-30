/**
 * erSignals — the name and structure signals of the ER notations (slice A4, P-2026-09-30-0440,
 * docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md §3, R-VP-23).
 *
 * ER has no simulation profile, so no binder prefills its table: these signals do, and the dialog's
 * table stays editable. Four class roles, and two feature signals the derivation reads on the classes
 * the table binds:
 *
 * - **Entity**: a class holding a multi-valued reference (a composition, or a plain one as in
 *   ERDLanguage) to a class with a `type` feature; or a class whose name has the word `entity`.
 * - **Attribute**: the class with `type` an entity (or a relationship) holds that way.
 * - **Relationship**: a class with exactly two single-valued plain references into entities, or
 *   whose name has a word starting with `relat`; it wins over Entity, so a relationship holding
 *   attributes stays a relationship.
 * - **Key**: an attribute class, or a subclass of one, whose name has a word starting with `key`,
 *   `id` or `primary` (`KeyAttribute`, `PrimaryIdentifier`).
 * - **The key flag** (`keyFlagOf`): a boolean attribute of an attribute class named the same way
 *   (`isKey`, `isPrimaryKey`); the derivation underlines the attribute when it holds.
 * - **The cardinality** (`cardinalityOf`): an attribute of a relationship with a word starting with
 *   `card` or `mult`, typed by an enum whose literals name both sides (`OneToMany`, `ONE_TO_MANY`,
 *   `N_M`); else, per end, a slot naming the reference and `max`, `upper`, `card` or `mult`
 *   (`leftMax`, `rightUpper`), where `1` stays `1` and anything else is many.
 *
 * Words are matched, not substrings: camel case and `_` split, as R-VP-19's name signals, so
 * `Valid` is not a key and `Correlation` is not a relationship.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the node bench
 * (derive/__tests__/erChen.test.ts). It reads the raw lookup and writes nothing into it.
 */

import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { SKETCH_TYPE } from '../../../../model/simulation/profileBinder';
import type { SketchAttribute, SketchClass, SketchReference } from '../../../../model/simulation/profileBinder';

type Lookup = Record<string, any>;

/** The class roles of the ER notations, in the table's order. Persisted as `derivedRole_<classId>` values (R-B9). */
export const ER_ROLE_IDS = ['entity', 'relationship', 'attribute', 'key'] as const;
export type ErRoleId = typeof ER_ROLE_IDS[number];

/** How the dialog's table names them. */
export const ER_ROLE_LABELS: Readonly<Record<ErRoleId, string>> = {
    entity: 'Entity', relationship: 'Relationship', attribute: 'Attribute', key: 'Key',
};

export function isErRole(role: unknown): role is ErRoleId {
    return typeof role === 'string' && (ER_ROLE_IDS as readonly string[]).includes(role);
}

/** The words of a name, lower case: `OneToMany`, `ONE_TO_MANY` and `oneToMany` all give one, to, many. */
export const nameWords = (name: string): string[] =>
    name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9*]+/).filter(w => w !== '');
const hasWord = (name: string, re: RegExp) => nameWords(name).some(w => re.test(w));

const KEY_WORD = /^(key|id|primary)/;
const RELATIONSHIP_WORD = /^relat/;
const ENTITY_WORD = /^entit/;
const CARDINALITY_WORD = /^(card|mult)/;
const UPPER_WORD = /^(max|upper|card|mult)/;

/** The endpoint names the derivation's two-refs rule reads (viewpointDerivation.ts), to order a relationship's ends. */
const SOURCE_NAME = /src|source|from/;
const TARGET_NAME = /tgt|target|to$|dest|next/;

/** The structure the signals read, with the lineage helpers every rule shares. */
function structureOf(lookup: Lookup, metamodelId: string) {
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));
    const memo = new Map<string, string[]>();
    const lineage = (id: string): string[] => {
        const hit = memo.get(id);
        if (hit) return hit;
        const out: string[] = [];
        const queue = [id];
        while (queue.length > 0) {
            const c = queue.shift() as string;
            if (out.includes(c)) continue;
            out.push(c);
            for (const s of byId.get(c)?.supers ?? []) queue.push(s);
        }
        memo.set(id, out);
        return out;
    };
    const isKind = (c: string, of: string) => lineage(c).includes(of);
    const upper = (featureId: string): number => {
        const u = lookup[featureId]?.upperBound;
        return typeof u === 'number' ? u : 1;
    };
    const referencesOf = (c: string): SketchReference[] => sketch.references.filter(r => lineage(c).includes(r.owner));
    const attributesOf = (c: string): SketchAttribute[] => sketch.attributes.filter(a => lineage(c).includes(a.owner));
    const hasType = (c: string) => attributesOf(c).some(a => a.name.toLowerCase() === 'type')
        || referencesOf(c).some(r => r.name.toLowerCase() === 'type');
    return { sketch, byId, lineage, isKind, upper, referencesOf, attributesOf, hasType };
}

/**
 * The ER roles the signals give the classes of the metamodel `metamodelId`: class id → role, sketch
 * order. Empty when nothing reads as ER (the four demos, a library of books).
 */
export function erSignalRoles(lookup: Lookup, metamodelId: string): Record<string, ErRoleId> {
    const { sketch, byId, isKind, upper, referencesOf, hasType } = structureOf(lookup, metamodelId);
    const classes = sketch.classes.map(c => c.id);
    /** The classes with `type` that `c` holds through a multi-valued reference, none of its own hierarchy. */
    const heldAttributes = (c: string) => referencesOf(c)
        .filter(r => upper(r.id) !== 1 && byId.has(r.type) && hasType(r.type) && !isKind(c, r.type) && !isKind(r.type, c))
        .map(r => r.type);

    const holders = classes.filter(c => heldAttributes(c).length > 0 || hasWord(byId.get(c)!.name, ENTITY_WORD));
    const attributeClasses = new Set(holders.flatMap(heldAttributes));
    const entityCandidates = holders.filter(c => !attributeClasses.has(c));
    const intoEntity = (r: SketchReference, self: string) => entityCandidates.some(e => e !== self && isKind(r.type, e));
    const isRelationship = (c: string) => {
        if (attributeClasses.has(c)) return false;
        const single = referencesOf(c).filter(r => !r.composition && upper(r.id) === 1 && byId.has(r.type));
        const intoEntities = single.filter(r => intoEntity(r, c));
        return (intoEntities.length === 2 && single.length === 2) || hasWord(byId.get(c)!.name, RELATIONSHIP_WORD);
    };
    const relationships = new Set(classes.filter(isRelationship));

    const out: Record<string, ErRoleId> = {};
    for (const c of classes) {
        const name = byId.get(c)!.name;
        const underAttribute = [...attributeClasses].some(a => isKind(c, a));
        if (relationships.has(c)) out[c] = 'relationship';
        else if (underAttribute && hasWord(name, KEY_WORD)) out[c] = 'key';
        else if (attributeClasses.has(c)) out[c] = 'attribute';
        else if (entityCandidates.includes(c)) out[c] = 'entity';
    }
    return out;
}

/** The key flag of an attribute class: a boolean attribute named by the key signal (`isKey`), own or inherited. */
export function keyFlagOf(lookup: Lookup, metamodelId: string, classId: string): string | undefined {
    const { attributesOf } = structureOf(lookup, metamodelId);
    return attributesOf(classId).find(a => a.type === SKETCH_TYPE.boolean && hasWord(a.name, KEY_WORD))?.name;
}

/** An end of a relationship as a literal reads it: one, or many. */
export type EndMultiplicity = 'one' | 'many';

/** How a relationship's two ends read their marks. */
export type ChenCardinality =
    /** One enum slot naming both sides: per literal, what each end reads (null: not read). */
    | { kind: 'pair'; slot: string; literals: ReadonlyArray<{ name: string; ends: readonly [EndMultiplicity | null, EndMultiplicity | null] }> }
    /** A slot per end, 1 or anything else (undefined: that end has none). */
    | { kind: 'ends'; slots: readonly [string | undefined, string | undefined] };

const sideOf = (words: string[]): EndMultiplicity | null => {
    const s = words.join(' ');
    if (s === 'one' || s === '1' || s === 'single') return 'one';
    if (s === 'many' || s === 'n' || s === 'm' || s === '*' || s === 'multiple') return 'many';
    return null;
};

/** The two sides a literal names: `OneToMany` one and many, `N_M` many and many; null when it names no two. */
export function endsOfLiteral(name: string): readonly [EndMultiplicity | null, EndMultiplicity | null] | null {
    const words = nameWords(name);
    const to = words.indexOf('to');
    const [a, b] = to > 0 ? [words.slice(0, to), words.slice(to + 1)] : words.length === 2 ? [[words[0]], [words[1]]] : [null, null];
    if (!a || !b || b.length === 0) return null;
    const ends = [sideOf(a), sideOf(b)] as const;
    return ends[0] || ends[1] ? ends : null;
}

/**
 * The two ends of a relationship class: its two single-valued plain references into the given
 * entity classes, in the derivation's order (by name, `source` before `target`, else declaration
 * order); null when it has not exactly two.
 */
export function relationshipEnds(lookup: Lookup, metamodelId: string, classId: string, entityClasses: readonly string[]): [SketchReference, SketchReference] | null {
    const { byId, isKind, upper, referencesOf } = structureOf(lookup, metamodelId);
    const ends = referencesOf(classId).filter(r => !r.composition && upper(r.id) === 1 && byId.has(r.type) && entityClasses.some(e => isKind(r.type, e)));
    if (ends.length !== 2) return null;
    let [a, b] = ends;
    if (SOURCE_NAME.test(b.name.toLowerCase()) || TARGET_NAME.test(a.name.toLowerCase())) [a, b] = [b, a];
    return [a, b];
}

/** How the relationship class `classId` with the ends `ends` reads its marks; null when nothing says. */
export function cardinalityOf(lookup: Lookup, metamodelId: string, classId: string, ends: readonly [SketchReference, SketchReference]): ChenCardinality | null {
    const { attributesOf } = structureOf(lookup, metamodelId);
    const attributes = attributesOf(classId);
    const enumOf = (a: SketchAttribute) => (lookup[a.type]?.className === 'DEnumerator' ? lookup[a.type] : undefined);
    const pair = attributes.find(a => enumOf(a) && (hasWord(a.name, CARDINALITY_WORD) || hasWord(enumOf(a).name ?? '', CARDINALITY_WORD)));
    if (pair) {
        const literals = (Array.isArray(enumOf(pair).literals) ? enumOf(pair).literals : [])
            .map((id: string) => lookup[id]?.name)
            .filter((n: unknown): n is string => typeof n === 'string')
            .map((name: string) => ({ name, ends: endsOfLiteral(name) }))
            .filter((l: { ends: unknown }) => l.ends !== null);
        if (literals.length > 0) return { kind: 'pair', slot: pair.name, literals };
    }
    const slotOf = (end: SketchReference) => attributes.find(a => {
        const words = nameWords(a.name);
        return words.includes(end.name.toLowerCase()) && words.some(w => UPPER_WORD.test(w));
    })?.name;
    const slots = [slotOf(ends[0]), slotOf(ends[1])] as const;
    return slots[0] || slots[1] ? { kind: 'ends', slots } : null;
}
