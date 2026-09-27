/**
 * profileBinder — a profile's roles matched to a metamodel, without choosing
 * (R-SIM-77, discovery report 2026-09-27 §3).
 *
 * A system profile holds modes only (simProfiles.ts): nothing in it says which
 * metaclass is Node on a given metamodel. The binder reads a plain sketch of
 * the metamodel and gives, for every `edit` role with a binding of its own,
 * `bound` (exactly one candidate passes the role's test), `candidates` (two or
 * more pass: the binder never picks among them, D3) or `none`, each with why.
 * A test is structure first; where a name is part of it, it either filters
 * (Initial is a subclass of Node NAMED like one) or narrows (among Action
 * attributes of the transition, the one named `action`, `effect`, `do`), and a
 * narrowing that matches nothing leaves the structure to decide. The binder
 * proposes; Apply confirms a listed proposal (R-SIM-77, R-SIM-78).
 *
 * Pure data and functions: no joiner, so it runs under the node bench. The
 * sketch comes from components/editor-v2/sim/metamodelSketch.ts.
 */

import { ROLE_CATALOG, roleDescriptor } from './roleCatalog';
import type { RoleBindingKind, RoleId } from './roleCatalog';
import type { SimProfile } from './simProfiles';

// ---------------------------------------------------------------------------
// The sketch
// ---------------------------------------------------------------------------

export interface SketchClass {
    readonly id: string;
    readonly name: string;
    readonly abstract: boolean;
    /** The `extends` pointers, as in the lookup. */
    readonly supers: readonly string[];
}

export interface SketchAttribute {
    readonly id: string;
    readonly name: string;
    /** The class that declares it. */
    readonly owner: string;
    /** The type pointer (`SKETCH_TYPE`). */
    readonly type: string;
}

export interface SketchReference {
    readonly id: string;
    readonly name: string;
    readonly owner: string;
    readonly type: string;
    readonly composition: boolean;
    readonly aggregation: boolean;
}

export interface MetamodelSketch {
    readonly classes: readonly SketchClass[];
    readonly attributes: readonly SketchAttribute[];
    readonly references: readonly SketchReference[];
}

/**
 * The built-in type pointers the tests read, as in common/Defaults.ts, which
 * imports the joiner and does not load under the node bench.
 */
export const SKETCH_TYPE = {
    int: 'Pointer_EINT',
    string: 'Pointer_ESTRING',
    boolean: 'Pointer_EBOOLEAN',
    expression: 'Pointer_EXPRESSION',
    action: 'Pointer_ACTION',
} as const;

// ---------------------------------------------------------------------------
// The bindings
// ---------------------------------------------------------------------------

export type RoleBinding =
    | { readonly status: 'bound'; readonly value: string; readonly why: string }
    | { readonly status: 'candidates'; readonly values: readonly string[]; readonly why: string }
    | { readonly status: 'none'; readonly why: string };

export type ProfileBindings = { readonly [K in RoleId]?: RoleBinding };

/** The kinds that bind an element; `int` is a parameter, `declarations` a table, `derived` has no key. */
const BINDING_KINDS: ReadonlySet<RoleBindingKind> = new Set<RoleBindingKind>([
    'class', 'reference', 'attribute', 'intAttribute', 'expressionAttribute', 'actionListAttribute',
]);

/** Bound only when exactly one candidate passes; two or more are left to the user (D3). */
function one(ids: readonly string[], found: string, missing: string): RoleBinding {
    if (ids.length === 1) return { status: 'bound', value: ids[0], why: found };
    if (ids.length > 1) return { status: 'candidates', values: [...ids], why: `${ids.length} candidates: ${found}` };
    return { status: 'none', why: missing };
}

const lower = (s: string) => s.toLowerCase();

/** The class relations of a sketch: lineage, kind-of, names. */
class SketchIndex {
    private readonly classes = new Map<string, SketchClass>();
    private readonly features = new Map<string, SketchAttribute | SketchReference>();

    constructor(readonly sketch: MetamodelSketch) {
        for (const c of sketch.classes) this.classes.set(c.id, c);
        for (const f of [...sketch.attributes, ...sketch.references]) this.features.set(f.id, f);
    }

    has(id: string): boolean {
        return this.classes.has(id);
    }

    isAbstract(id: string): boolean {
        return !!this.classes.get(id)?.abstract;
    }

    /** `id` and its superclasses, transitively, cycle-safe, `id` first. */
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

    /** The concrete classes that are a kind of `of`, `of` itself excluded, in sketch order. */
    concreteSubclasses(of: string): string[] {
        return this.sketch.classes.filter(c => c.id !== of && !c.abstract && this.isKind(c.id, of)).map(c => c.id);
    }

    /** The candidates that no other candidate generalises: a subclass is covered by its superclass. */
    topmost(ids: readonly string[]): string[] {
        return ids.filter(c => !ids.some(o => o !== c && this.isKind(c, o)));
    }

    attributesOf(c: string): SketchAttribute[] {
        const lineage = this.lineage(c);
        return this.sketch.attributes.filter(a => lineage.includes(a.owner));
    }

    /** References that are neither compositions nor aggregations: the panel's reference list. */
    plainReferencesOf(c: string): SketchReference[] {
        const lineage = this.lineage(c);
        return this.sketch.references.filter(r => !r.composition && !r.aggregation && lineage.includes(r.owner));
    }

    name(id: string): string {
        const f = this.features.get(id);
        if (f) return `${this.classes.get(f.owner)?.name ?? f.owner}.${f.name}`;
        return this.classes.get(id)?.name ?? id;
    }

    /** The bare name of a class or feature, lowercased, for the name tests. */
    bare(id: string): string {
        return lower(this.features.get(id)?.name ?? this.classes.get(id)?.name ?? id);
    }
}

/** The name narrows the structural candidates; when it matches none, the structure alone decides. */
function narrowed(ix: SketchIndex, ids: readonly string[], name: RegExp, found: string, missing: string): RoleBinding {
    const named = ids.filter(id => name.test(ix.bare(id)));
    return one(named.length > 0 ? named : ids, found, missing);
}

const boundValue = (b: RoleBinding | undefined): string | undefined => (b?.status === 'bound' ? b.value : undefined);

// ---------------------------------------------------------------------------
// Name tests (report §3.1)
// ---------------------------------------------------------------------------

const NEXT_NAME = /next|target|to$|dest/;
const TRANSITION_CLASS_NAME = /trans|edge|flow|step/;
const NODE_CLASS_NAME = /state|node|place|location|vertex|activity/;
const SOURCE_NAME = /source|src|from/;
const TRIGGER_NAME = /trigger|event|input|symbol|^on/;
const ACTIVITY_FINAL_NAME = /activity.?final/;

/** The class roles recognised as a named subclass of the node metaclass. */
const NODE_SUBCLASS_ROLES: ReadonlyArray<{ role: RoleId; name: RegExp; except?: RegExp }> = [
    { role: 'initial', name: /init|start|begin/ },
    // An activity final is its own role, never a flow final.
    { role: 'terminal', name: /final|end|terminal|stop/, except: ACTIVITY_FINAL_NAME },
    { role: 'accepting', name: /accept|final/ },
    { role: 'activityFinal', name: ACTIVITY_FINAL_NAME },
    { role: 'fork', name: /fork/ },
    { role: 'join', name: /join/ },
];

type Found = Partial<Record<RoleId, RoleBinding>>;

/** A class role must be concrete: the panel's selects list concrete classes only. */
function concrete(ix: SketchIndex, b: RoleBinding): RoleBinding {
    return b.status === 'bound' && ix.isAbstract(b.value)
        ? { status: 'none', why: `${ix.name(b.value)} is abstract: choose a concrete class` }
        : b;
}

/** Node, Transition, Next state (control flow): the best-scored plain reference T → N between unrelated classes. */
function controlFlowCore(ix: SketchIndex, out: Found): { node?: string; transition?: string } {
    const pairs = ix.sketch.references
        .filter(r => !r.composition && !r.aggregation && ix.has(r.owner) && ix.has(r.type) && !ix.related(r.owner, r.type))
        .map(r => {
            let score = 0;
            if (NEXT_NAME.test(lower(r.name))) score += 2;
            if (TRANSITION_CLASS_NAME.test(ix.bare(r.owner))) score += 1;
            if (NODE_CLASS_NAME.test(ix.bare(r.type))) score += 1;
            if (ix.sketch.references.some(o => o.composition && ix.lineage(r.type).includes(o.owner) && ix.isKind(r.owner, o.type))) score += 2;
            if (SOURCE_NAME.test(lower(r.name))) score -= 1;
            return { r, score };
        });
    if (pairs.length === 0) {
        const why = 'No plain reference between two unrelated classes';
        out.nextState = out.node = out.transition = { status: 'none', why };
        return {};
    }
    const best = Math.max(...pairs.map(p => p.score));
    const top = pairs.filter(p => p.score === best).map(p => p.r);
    const unique = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) === i);
    out.nextState = one(top.map(r => r.id), 'The transition-to-node reference with the best name score', 'No reference');
    const nodes = unique(top.map(r => r.type));
    const transitions = unique(top.map(r => r.owner));
    out.node = concrete(ix, one(nodes, 'The type of Next state', 'No reference'));
    out.transition = concrete(ix, one(transitions, 'The owner of Next state', 'No reference'));
    return { node: nodes.length === 1 ? nodes[0] : undefined, transition: transitions.length === 1 ? transitions[0] : undefined };
}

/** Owned transitions, Source, the node subclasses, Trigger (control flow), given N and T. */
function controlFlowRoles(ix: SketchIndex, n: string, t: string, out: Found): void {
    out.ownedTransitions = one(
        ix.sketch.references.filter(r => r.composition && ix.lineage(n).includes(r.owner) && ix.isKind(r.type, t)).map(r => r.id),
        `The composition from ${ix.name(n)} to ${ix.name(t)}`,
        `No composition from ${ix.name(n)} to ${ix.name(t)}`,
    );
    const next = boundValue(out.nextState);
    out.source = one(
        ix.plainReferencesOf(t).filter(r => r.id !== next && ix.related(r.type, n) && SOURCE_NAME.test(lower(r.name))).map(r => r.id),
        `The reference from ${ix.name(t)} to ${ix.name(n)} named like a source`,
        `No reference from ${ix.name(t)} to ${ix.name(n)} named source, src or from`,
    );
    // Trigger: from the transition's lineage only, to a class of neither lineage (report §3.1).
    out.trigger = narrowed(
        ix,
        ix.plainReferencesOf(t).filter(r => ix.has(r.type) && !ix.related(r.type, n) && !ix.related(r.type, t)).map(r => r.id),
        TRIGGER_NAME,
        `The reference from ${ix.name(t)} to an event class`,
        `No reference from ${ix.name(t)} to a class other than ${ix.name(n)} and ${ix.name(t)}`,
    );
}

/** Initial, Terminal, Accepting, Activity final, Fork, Join: a concrete subclass of N with the role's name. */
function nodeSubclassRoles(ix: SketchIndex, n: string, out: Found): void {
    const subs = ix.concreteSubclasses(n);
    const booleans = ix.attributesOf(n).filter(a => a.type === SKETCH_TYPE.boolean);
    for (const { role, name, except } of NODE_SUBCLASS_ROLES) {
        const label = roleDescriptor(role).label;
        const flag = booleans.find(a => name.test(lower(a.name)));
        out[role] = one(
            subs.filter(c => name.test(ix.bare(c)) && !(except && except.test(ix.bare(c)))),
            `The subclass of ${ix.name(n)} named like ${label}`,
            flag
                ? `${ix.name(flag.id)} is a boolean attribute: ${label} binds a class`
                : `No concrete subclass of ${ix.name(n)} named like ${label}`,
        );
    }
}

/** Initial marking: an EInt of the node, preferring `token`, `marking`, `initial`. */
function initialMarking(ix: SketchIndex, n: string): RoleBinding {
    return narrowed(
        ix,
        ix.attributesOf(n).filter(a => a.type === SKETCH_TYPE.int).map(a => a.id),
        /token|marking|initial/,
        `The integer attribute of ${ix.name(n)}`,
        `No integer attribute on ${ix.name(n)}`,
    );
}

/** Guard, Action, Entry, Exit, State output, Transition output, given the node and transition classes. */
function dataRoles(ix: SketchIndex, n: string | undefined, t: string | undefined, out: Found): void {
    if (t) {
        const ta = ix.attributesOf(t);
        const expressions = ta.filter(a => a.type === SKETCH_TYPE.expression).map(a => a.id);
        out.guard = expressions.length > 0
            ? one(expressions, `The Expression attribute of ${ix.name(t)}`, '')
            : one(
                ta.filter(a => a.type === SKETCH_TYPE.string && /guard|cond/.test(lower(a.name))).map(a => a.id),
                `The EString of ${ix.name(t)} named like a guard`,
                `No Expression attribute on ${ix.name(t)}`,
            );
        out.action = narrowed(
            ix, ta.filter(a => a.type === SKETCH_TYPE.action).map(a => a.id), /action|effect|^do/,
            `The Action attribute of ${ix.name(t)}`, `No Action attribute on ${ix.name(t)}`,
        );
        out.transitionOutput = one(
            ta.filter(a => /^out/.test(lower(a.name))).map(a => a.id),
            `The attribute of ${ix.name(t)} named like an output`, `No attribute of ${ix.name(t)} named out…`,
        );
    }
    if (n) {
        const na = ix.attributesOf(n);
        const actions = na.filter(a => a.type === SKETCH_TYPE.action);
        out.entry = one(
            actions.filter(a => /entry|enter/.test(lower(a.name))).map(a => a.id),
            `The Action attribute of ${ix.name(n)} named entry`, `No Action attribute of ${ix.name(n)} named entry`,
        );
        out.exit = one(
            actions.filter(a => /exit|leave/.test(lower(a.name))).map(a => a.id),
            `The Action attribute of ${ix.name(n)} named exit`, `No Action attribute of ${ix.name(n)} named exit`,
        );
        out.stateOutput = one(
            na.filter(a => /^out/.test(lower(a.name))).map(a => a.id),
            `The attribute of ${ix.name(n)} named like an output`, `No attribute of ${ix.name(n)} named out…`,
        );
    }
}

/** The Petri roles: the arc and its two references, then place and transition among the arc ends' subclasses. */
function petriRoles(ix: SketchIndex, out: Found): { node?: string; transition?: string } {
    const arcs = ix.topmost(ix.sketch.classes.filter(c => !c.abstract).map(c => c.id).filter(c => {
        const refs = ix.plainReferencesOf(c);
        return refs.some((r1, i) => refs.some((r2, j) => j > i && ix.lineage(r1.type).some(s => ix.lineage(r2.type).includes(s))));
    }));
    out.arc = narrowed(ix, arcs, /arc|edge|flow/, 'The class with two references to a common supertype', 'No class with two references to a common supertype');
    const arc = boundValue(out.arc);
    if (!arc) return {};
    const refs = ix.plainReferencesOf(arc);
    out.arcSource = one(refs.filter(r => /src|source|from/.test(lower(r.name))).map(r => r.id), `The reference of ${ix.name(arc)} named like a source`, `No reference of ${ix.name(arc)} named src, source or from`);
    out.arcTarget = one(refs.filter(r => /tgt|target|to$|dest/.test(lower(r.name))).map(r => r.id), `The reference of ${ix.name(arc)} named like a target`, `No reference of ${ix.name(arc)} named tgt, target or to`);
    out.arcWeight = one(
        ix.attributesOf(arc).filter(a => a.type === SKETCH_TYPE.int && /weight/.test(lower(a.name))).map(a => a.id),
        `The integer attribute of ${ix.name(arc)} named weight`, `No integer attribute of ${ix.name(arc)} named weight`,
    );
    out.inhibitorArc = one(
        ix.concreteSubclasses(arc).filter(c => /inhib/.test(ix.bare(c))),
        `The subclass of ${ix.name(arc)} named like an inhibitor`, `No subclass of ${ix.name(arc)} named like an inhibitor`,
    );
    const end = ix.sketch.references.find(r => r.id === (boundValue(out.arcSource) ?? boundValue(out.arcTarget)))?.type;
    if (!end) {
        out.node = out.transition = { status: 'none', why: 'Needs Arc source or Arc target' };
        return {};
    }
    const kinds = ix.concreteSubclasses(end).filter(c => !ix.related(c, arc));
    const places = ix.topmost(kinds.filter(c => /place|state/.test(ix.bare(c))
        || ix.attributesOf(c).some(a => a.type === SKETCH_TYPE.int && /token|marking/.test(lower(a.name)))));
    out.node = one(places, `The subclass of ${ix.name(end)} that holds tokens`, `No subclass of ${ix.name(end)} named place or with tokens`);
    const place = boundValue(out.node);
    const rest = ix.topmost(kinds.filter(c => !places.some(p => ix.isKind(c, p))));
    out.transition = narrowed(ix, rest, /trans/, `The other subclass of ${ix.name(end)}`, `No other subclass of ${ix.name(end)}`);
    return { node: place, transition: boundValue(out.transition) };
}

/**
 * The bindings of `profile` on `sketch`: one per `edit` role whose kind binds
 * an element, in catalog order. A role whose rule needs another role that did
 * not bind is `none`, and says which.
 */
export function bindProfile(profile: SimProfile, sketch: MetamodelSketch): ProfileBindings {
    const ix = new SketchIndex(sketch);
    const found: Found = {};
    let node: string | undefined;
    let transition: string | undefined;

    if (profile.shape === 'controlFlow') {
        ({ node, transition } = controlFlowCore(ix, found));
        if (node && transition) controlFlowRoles(ix, node, transition, found);
    } else {
        ({ node, transition } = petriRoles(ix, found));
    }
    if (node) {
        nodeSubclassRoles(ix, node, found);
        found.initialMarking = initialMarking(ix, node);
    }
    dataRoles(ix, node, transition, found);
    found.eventIdentifier = { status: 'none', why: 'Defaults to name' };

    const out: Partial<Record<RoleId, RoleBinding>> = {};
    for (const d of ROLE_CATALOG) {
        if (profile.modes[d.id].mode !== 'edit' || d.key === null || !BINDING_KINDS.has(d.kind)) continue;
        const needs = d.dependsOn.filter(r => r !== 'stateAttributes').map(r => roleDescriptor(r).label).join(' and ');
        out[d.id] = found[d.id] ?? { status: 'none', why: needs ? `Needs ${needs}` : 'No rule for this shape' };
    }
    return out;
}
