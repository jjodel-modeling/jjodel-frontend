/**
 * bindingCompat — which elements of a metamodel each role of a profile can
 * bind (S11a, backlog report 2026-09-27 §4.2; the modal lane of R-SIM-55).
 *
 * The producer of `BindingVerdict` (simProfiles.ts). For every `edit` role
 * whose kind binds an element, every element of the role's sort in the sketch
 * (class, reference or attribute) is judged against the bag as it stands:
 * `ok`; `warn`, the engine reads the role through it but some instances or
 * values fall outside the role; `incompatible`, the engine cannot read the role
 * through it, or a decision forbids it. The bag's own value is judged by the
 * same rules, and `currentVerdicts` gives those to `checkability`. The rules,
 * from the catalog (`kind`, `dependsOn`) and the binder's tests:
 *
 * - sort: a class role binds a class, a reference role a reference, an
 *   attribute role an attribute; an id outside the sketch is incompatible;
 * - concrete: a class role binds a concrete class, Node and Transition in
 *   control flow excepted (R-SIM-81);
 * - subclass: Initial, Terminal, Accepting, Activity final, Fork and Join are a
 *   proper subclass of Node, Inhibitor arc of Arc; the context class or a
 *   superclass of it warns (every instance would play the role);
 * - owner: a feature is declared on the lineage of the class whose instances
 *   the role reads (Node, Transition, Arc, the event class); on a proper
 *   subclass of it it warns (the other instances do not carry it); on an
 *   unrelated class it warns too when a common concrete subclass exists (a
 *   mixin owner, R-SIM-89), else it is incompatible;
 * - reference type: Next state and Source lead to Node, Owned transitions to
 *   Transition, a wider type warns; an arc end covers Node and Transition, one
 *   of them warns; Trigger leads to a class unrelated to both (R-SIM-16), else
 *   there is no event role (R-SIM-38);
 * - containment: Owned transitions is a composition, the other references are
 *   plain; the other way round warns (the panel lists them apart);
 * - attribute type: Initial marking and Arc weight an integer type (a decimal
 *   type warns: the engine reads whole numbers only), Guard an Expression or
 *   an EString, Action, Entry and Exit an Action or an EString (R-SIM-44).
 *
 * A context role unset, or set to what is not a class of the sketch, skips the
 * rules that need it: the missing role is `checkability`'s to report. The value
 * of a `multi` role (Guard, Action, Entry, Exit; R-SIM-90) is a list: each
 * attribute is judged on its own, and the role takes its worst verdict, since
 * the engine reads every one of them.
 * Multiplicity is not judged: the sketch carries no upper bound. The overlap of
 * the sorts stays with `overlapVerdict` (R-SIM-16), but for Trigger's type.
 *
 * Pure data and functions: no joiner, so it runs under the node bench. Nothing
 * imports it yet: the compatible-only selects (S10, S11c) and the «with
 * warnings» summary come with the modal lane.
 */

import { ROLE_CATALOG, roleDescriptor, roleValues } from './roleCatalog';
import type { RoleBindingKind, RoleId } from './roleCatalog';
import { SKETCH_TYPE } from './profileBinder';
import type { MetamodelSketch, SketchAttribute, SketchClass, SketchReference } from './profileBinder';
import type { BindingVerdict, SimProfile } from './simProfiles';

export interface CandidateVerdict {
    /** The class or feature id. */
    readonly id: string;
    readonly verdict: BindingVerdict;
    /** Every failed rule, `; `-separated; empty when `ok`. */
    readonly why: string;
}

export interface RoleCompatibility {
    /** Every element of the role's sort in the sketch, in sketch order. */
    readonly candidates: readonly CandidateVerdict[];
    /**
     * The bag's value, judged by the same rules; `null` when the key is unset. For a `multi` role
     * (R-SIM-90), its worst attribute: incompatible above warn above ok, the first of the worst in list order.
     */
    readonly current: CandidateVerdict | null;
    /** R-SIM-90: every attribute of a `multi` role's value, judged, in list order; absent when unset or single-valued. */
    readonly currents?: readonly CandidateVerdict[];
}

export type BindingVerdicts = { readonly [K in RoleId]?: RoleCompatibility };

type Sort = 'class' | 'reference' | 'attribute';

/** The roles whose class the other roles are judged against. */
type Context = 'node' | 'transition' | 'arc' | 'event';

/** The kinds that bind an element, as in the binder; `int`, `declarations` and `derived` have no candidate. */
const SORT: Readonly<Partial<Record<RoleBindingKind, Sort>>> = {
    class: 'class',
    reference: 'reference',
    attribute: 'attribute',
    intAttribute: 'attribute',
    expressionAttribute: 'attribute',
    actionListAttribute: 'attribute',
};

/** The class roles that name a kind of their context class. */
const SUBCLASS_OF: Readonly<Partial<Record<RoleId, Context>>> = {
    initial: 'node', terminal: 'node', accepting: 'node', activityFinal: 'node', fork: 'node', join: 'node',
    inhibitorArc: 'arc',
};

/** The class whose instances carry the feature a role reads. */
const OWNER: Readonly<Partial<Record<RoleId, Context>>> = {
    initialMarking: 'node', ownedTransitions: 'node', entry: 'node', exit: 'node', stateOutput: 'node',
    source: 'transition', nextState: 'transition', trigger: 'transition',
    guard: 'transition', action: 'transition', transitionOutput: 'transition',
    arcSource: 'arc', arcTarget: 'arc', arcWeight: 'arc',
    eventIdentifier: 'event',
};

/** The class a reference role's values are a kind of. */
const VALUES_OF: Readonly<Partial<Record<RoleId, Context>>> = {
    ownedTransitions: 'transition', source: 'node', nextState: 'node',
};

/** The type pointers of common/Defaults.ts, which does not load under the node bench. */
const INTEGER_TYPES: ReadonlySet<string> = new Set(['Pointer_EBYTE', 'Pointer_ESHORT', SKETCH_TYPE.int, 'Pointer_ELONG']);
const DECIMAL_TYPES: ReadonlySet<string> = new Set(['Pointer_EFLOAT', 'Pointer_EDOUBLE']);
const EXPRESSION_TYPES: ReadonlySet<string> = new Set([SKETCH_TYPE.expression, SKETCH_TYPE.string]);
const ACTION_TYPES: ReadonlySet<string> = new Set([SKETCH_TYPE.action, SKETCH_TYPE.string]);

const A_SORT: { readonly [S in Sort]: string } = { class: 'a class', reference: 'a reference', attribute: 'an attribute' };

class Index {
    readonly classes = new Map<string, SketchClass>();
    readonly references = new Map<string, SketchReference>();
    readonly attributes = new Map<string, SketchAttribute>();

    constructor(sketch: MetamodelSketch) {
        for (const c of sketch.classes) this.classes.set(c.id, c);
        for (const r of sketch.references) this.references.set(r.id, r);
        for (const a of sketch.attributes) this.attributes.set(a.id, a);
    }

    sortOf(id: string): Sort | undefined {
        if (this.classes.has(id)) return 'class';
        if (this.references.has(id)) return 'reference';
        return this.attributes.has(id) ? 'attribute' : undefined;
    }

    /** `id` and its superclasses, transitively, cycle-safe. */
    lineage(id: string): string[] {
        const out: string[] = [];
        const queue = [id];
        while (queue.length > 0) {
            const c = queue.shift() as string;
            if (out.includes(c)) continue;
            out.push(c);
            for (const s of this.classes.get(c)?.supers ?? []) queue.push(s);
        }
        return out;
    }

    /** `c` is `of` or inherits from it (the engine's «is a», R-SIM-8). */
    isKind(c: string, of: string): boolean {
        return this.lineage(c).includes(of);
    }

    related(a: string, b: string): boolean {
        return this.isKind(a, b) || this.isKind(b, a);
    }

    /** A concrete class that is a kind of both `a` and `b` (mixin owners, R-SIM-89). */
    hasCommonConcreteSubclass(a: string, b: string): boolean {
        for (const c of this.classes.values()) {
            if (!c.abstract && this.isKind(c.id, a) && this.isKind(c.id, b)) return true;
        }
        return false;
    }

    /** A class by name, a feature as `Owner.name`, a type pointer without its prefix. */
    name(id: string): string {
        const f = this.references.get(id) ?? this.attributes.get(id);
        if (f) return `${this.classes.get(f.owner)?.name ?? f.owner}.${f.name}`;
        return this.classes.get(id)?.name ?? id.replace(/^Pointer_/, '');
    }
}

/** The context classes the bag names; one that is not a class of the sketch is unset. */
function contextsOf(ix: Index, bag: Readonly<Record<string, unknown>>): Partial<Record<Context, string>> {
    const classOf = (key: string): string | undefined => {
        const value = bag[key];
        return typeof value === 'string' && ix.classes.has(value) ? value : undefined;
    };
    const trigger = typeof bag.simTrigger === 'string' ? ix.references.get(bag.simTrigger) : undefined;
    return {
        node: classOf('simNode'),
        transition: classOf('simTransition'),
        arc: classOf('simArc'),
        // The event class is the declared type of Trigger (R-SIM-38).
        event: trigger && ix.classes.has(trigger.type) ? trigger.type : undefined,
    };
}

interface Issue { readonly verdict: 'warn' | 'incompatible'; readonly why: string }

const VERDICT_RANK: Readonly<Record<BindingVerdict, number>> = { ok: 0, warn: 1, incompatible: 2 };

/** The worst of `verdicts`, the first of the worst in order (R-SIM-90); `verdicts` is not empty. */
function worstOf(verdicts: readonly CandidateVerdict[]): CandidateVerdict {
    return verdicts.reduce((worst, v) => (VERDICT_RANK[v.verdict] > VERDICT_RANK[worst.verdict] ? v : worst));
}

function verdictOf(id: string, issues: readonly Issue[]): CandidateVerdict {
    const verdict: BindingVerdict = issues.some(i => i.verdict === 'incompatible') ? 'incompatible' : issues.length > 0 ? 'warn' : 'ok';
    return { id, verdict, why: issues.map(i => i.why).join('; ') };
}

/** `id` for `role`, every rule of the header that applies. */
function judge(
    ix: Index, profile: SimProfile, role: RoleId, sort: Sort, id: string, cx: Partial<Record<Context, string>>,
): CandidateVerdict {
    const actual = ix.sortOf(id);
    if (actual === undefined) return verdictOf(id, [{ verdict: 'incompatible', why: 'Not in this metamodel' }]);
    if (actual !== sort) return verdictOf(id, [{ verdict: 'incompatible', why: `${ix.name(id)} is ${A_SORT[actual]}, not ${A_SORT[sort]}` }]);

    const issues: Issue[] = [];
    const warn = (why: string): void => { issues.push({ verdict: 'warn', why }); };
    const bad = (why: string): void => { issues.push({ verdict: 'incompatible', why }); };
    const name = ix.name(id);
    const label = roleDescriptor(role).label;

    if (sort === 'class') {
        const abstractAllowed = profile.shape === 'controlFlow' && (role === 'node' || role === 'transition');
        if (ix.classes.get(id)?.abstract && !abstractAllowed) bad(`${name} is abstract: choose a concrete class`);
        const ctx = SUBCLASS_OF[role] && cx[SUBCLASS_OF[role] as Context];
        if (ctx) {
            if (ix.isKind(ctx, id)) warn(`every ${ix.name(ctx)} would be ${label}: choose a subclass of ${ix.name(ctx)}`);
            else if (!ix.isKind(id, ctx)) bad(`${name} is not a kind of ${ix.name(ctx)}`);
        }
        return verdictOf(id, issues);
    }

    const feature = (ix.references.get(id) ?? ix.attributes.get(id)) as SketchReference | SketchAttribute;
    const owner = OWNER[role] && cx[OWNER[role] as Context];
    if (owner && !ix.isKind(owner, feature.owner)) {
        if (ix.isKind(feature.owner, owner)) {
            warn(`${name} is declared on ${ix.name(feature.owner)}, a subclass of ${ix.name(owner)}: other ${ix.name(owner)} instances do not carry it`);
        } else if (ix.hasCommonConcreteSubclass(owner, feature.owner)) {
            warn(`${name} is declared on ${ix.name(feature.owner)}: only ${ix.name(owner)} instances that are also ${ix.name(feature.owner)} carry it`);
        } else {
            bad(`${name} is not a feature of ${ix.name(owner)}`);
        }
    }

    if (sort === 'reference') {
        const r = feature as SketchReference;
        if (role === 'ownedTransitions') {
            if (!r.composition) warn(`${name} is not a composition`);
        } else if (r.composition || r.aggregation) {
            warn(`${name} is a containment, not a plain reference`);
        }
        const values = VALUES_OF[role] && cx[VALUES_OF[role] as Context];
        if (values && !ix.isKind(r.type, values)) {
            if (ix.isKind(values, r.type)) warn(`${ix.name(r.type)} is wider than ${ix.name(values)}: some values may not be one`);
            else bad(`${name} does not lead to ${ix.name(values)}`);
        }
        if (role === 'trigger') {
            if (!ix.classes.has(r.type)) bad(`the type of ${name} is not a class: no event role`);
            else {
                for (const c of [cx.node, cx.transition]) {
                    if (c && ix.related(r.type, c)) bad(`${ix.name(r.type)} is related to ${ix.name(c)}: the event role would overlap it (R-SIM-16)`);
                }
            }
        }
        if (role === 'arcSource' || role === 'arcTarget') {
            const ends = [cx.node, cx.transition].filter((c): c is string => c !== undefined);
            const uncovered = ends.filter(c => !ix.isKind(c, r.type));
            if (uncovered.length > 0) {
                if (ends.some(c => ix.related(c, r.type))) warn(`${ix.name(r.type)} does not cover ${uncovered.map(c => ix.name(c)).join(' and ')}`);
                else bad(`${name} does not lead to ${ends.map(c => ix.name(c)).join(' or ')}`);
            }
        }
        return verdictOf(id, issues);
    }

    const type = (feature as SketchAttribute).type;
    const kind = roleDescriptor(role).kind;
    if (kind === 'intAttribute') {
        if (DECIMAL_TYPES.has(type)) warn(`${name} is ${ix.name(type)}: only whole values are read`);
        else if (!INTEGER_TYPES.has(type)) bad(`${name} is not an integer attribute`);
    } else if (kind === 'expressionAttribute') {
        if (!EXPRESSION_TYPES.has(type)) bad(`${name} is neither an Expression nor an EString`);
    } else if (kind === 'actionListAttribute') {
        if (!ACTION_TYPES.has(type)) bad(`${name} is neither an Action nor an EString`);
    }
    return verdictOf(id, issues);
}

/**
 * The compatibility of every `edit` role of `profile` whose kind binds an
 * element, in catalog order: each element of its sort in `sketch`, and the
 * bag's value, judged against the context roles as the bag sets them.
 */
export function bindingVerdicts(
    profile: SimProfile,
    bag: Readonly<Record<string, unknown>>,
    sketch: MetamodelSketch,
): BindingVerdicts {
    const ix = new Index(sketch);
    const cx = contextsOf(ix, bag);
    const out: Partial<Record<RoleId, RoleCompatibility>> = {};
    for (const d of ROLE_CATALOG) {
        const sort = SORT[d.kind];
        if (profile.modes[d.id].mode !== 'edit' || d.key === null || sort === undefined) continue;
        const pool: ReadonlyArray<{ readonly id: string }> = sort === 'class'
            ? sketch.classes
            : sort === 'reference' ? sketch.references : sketch.attributes;
        const value = bag[d.key];
        const candidates = pool.map(e => judge(ix, profile, d.id, sort, e.id, cx));
        if (d.multi) {
            // R-SIM-90: each attribute of the list on its own; the role reads the worst.
            const currents = roleValues(value).map(id => judge(ix, profile, d.id, sort, id, cx));
            out[d.id] = currents.length === 0 ? { candidates, current: null } : { candidates, current: worstOf(currents), currents };
            continue;
        }
        out[d.id] = {
            candidates,
            current: typeof value === 'string' && value !== '' ? judge(ix, profile, d.id, sort, value, cx) : null,
        };
    }
    return out;
}

/** The verdicts `checkability` reads: the bag's value of each role whose key is set. */
export function currentVerdicts(verdicts: BindingVerdicts): Partial<Record<RoleId, BindingVerdict>> {
    const out: Partial<Record<RoleId, BindingVerdict>> = {};
    for (const [role, v] of Object.entries(verdicts) as Array<[RoleId, RoleCompatibility]>) {
        if (v.current) out[role] = v.current.verdict;
    }
    return out;
}
