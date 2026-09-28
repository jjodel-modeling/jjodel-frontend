/**
 * netCompile — the STC roles to a Petri net (step 3a, R-SIM-21, R-SIM-22, R-SIM-31, R-SIM-32).
 *
 * `netStcFromRoles` reads the flat `sim*` keys of the M2 bag (R-SIM-2) and
 * `compileNet` turns the M1 model into a net: places, transitions with weighted
 * preset and postset, inhibitors, triggers, guard sites, `else` siblings and
 * action sites, the initial σ, and the compile defects. Two shapes, one net:
 *
 * - control-flow (flowcharts, state machines): an edge is a transition, its
 *   sources (`simSource`, else the owner through `simOwnedTransitions`,
 *   R-SIM-10) the preset, its targets (`simNextState`) the postset; a node of
 *   `simFork`/`simJoin` is not a place, its edges fuse into one transition;
 * - Petri (`simArc` set): places, transitions and arcs are elements; an arc's
 *   weight is `simArcWeight` (default 1); an arc of `simInhibitorArc` from a
 *   place to a transition is an inhibitor.
 *
 * A defective element never becomes a candidate: it is left out of the net and
 * kept in `defects` with the reason (R-SIM-31). The table the rules implement:
 * docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md §5.3.
 *
 * Pure: reads the model only through `NetModelView`, by feature pointer. Wired
 * in step 3b by the bridge of the panel (`components/editor-v2/sim/simBridge.ts`).
 */

import type {
    ActionSite, Arc, CompiledNet, DeclarationDefect, DerivedOracle, Domain, NetDefect, NetModelView, NetStc, NetTransition,
    SimValue, StateAttributeDecl,
} from './netTypes';
import type { SimEventInfo, SimModelView } from './types';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { inDomain } from './netStep';

/** A role value: a non-empty string, as the M2 face writes it (R-SIM-2). */
function pointer(bag: Record<string, unknown>, key: string): string | undefined {
    const value = bag[key];
    return typeof value === 'string' && value ? value : undefined;
}

/** k: an integer ≥ 1, as a number or a string of digits. `undefined` when absent, `null` when malformed. */
function readBound(raw: unknown): number | null | undefined {
    if (raw === undefined || raw === null || raw === '') return undefined;
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\s*\d+\s*$/.test(raw) ? Number(raw) : NaN;
    return Number.isInteger(n) && n >= 1 ? n : null;
}

const ROLE_KEYS: ReadonlyArray<[Exclude<keyof NetStc, 'shape' | 'bound'>, string]> = [
    ['node', 'simNode'], ['transition', 'simTransition'], ['initial', 'simInitial'],
    ['initialMarking', 'simInitialMarking'], ['terminal', 'simTerminal'], ['activityFinal', 'simActivityFinal'],
    ['ownedTransitions', 'simOwnedTransitions'], ['source', 'simSource'], ['nextState', 'simNextState'],
    ['fork', 'simFork'], ['join', 'simJoin'], ['guard', 'simGuard'],
    ['action', 'simAction'], ['entry', 'simEntry'], ['exit', 'simExit'],
    ['arc', 'simArc'], ['arcSource', 'simArcSource'], ['arcTarget', 'simArcTarget'],
    ['arcWeight', 'simArcWeight'], ['inhibitorArc', 'simInhibitorArc'],
    ['event', 'simEvent'], ['trigger', 'simTrigger'], ['eventIdentifier', 'simEventIdentifier'],
];

/**
 * The STC from the role bag, or `null` when it cannot run. Control-flow needs
 * `simNextState`, a source rule (`simOwnedTransitions` or `simSource`) and an
 * initial rule (`simInitial` or `simInitialMarking`); Petri needs `simNode`,
 * `simTransition`, `simArc`, `simArcSource`, `simArcTarget` and
 * `simInitialMarking`. A malformed `simBound` makes it `null` too. The event
 * role exists only when `simEvent` and `simTrigger` are both set; the callers
 * derive `simEvent` from the Trigger first (`withDerivedEventRole`, R-SIM-38).
 */
export function netStcFromRoles(bag: Record<string, unknown> | undefined): NetStc | null {
    if (!bag) return null;
    const bound = readBound(bag.simBound);
    if (bound === null) return null;
    const stc: { -readonly [K in keyof NetStc]: NetStc[K] } = {
        shape: pointer(bag, 'simArc') ? 'petri' : 'control-flow',
        bound: bound ?? 1,
    };
    for (const [field, key] of ROLE_KEYS) {
        const value = pointer(bag, key);
        if (value) stc[field] = value;
    }
    if (!(stc.event && stc.trigger)) {
        delete stc.event;
        delete stc.trigger;
        delete stc.eventIdentifier;
    }
    const ok = stc.shape === 'petri'
        ? !!(stc.node && stc.transition && stc.arc && stc.arcSource && stc.arcTarget && stc.initialMarking)
        : !!(stc.nextState && (stc.ownedTransitions || stc.source) && (stc.initial || stc.initialMarking));
    return ok ? stc : null;
}

/**
 * The bag with the event class derived from the Trigger (R-SIM-38): `simEvent`
 * becomes the declared type of the `simTrigger` reference, read from the raw
 * `lookup` at every call and never stored. A `simEvent` already in the bag is
 * ignored, without migration. With no Trigger, or one that is not a
 * `DReference`, or whose type is not a non-primitive `DClass` of the lookup,
 * the bag comes back without `simEvent`: no event role. An abstract type is
 * returned as is, and the engine's `isKindOf` reaches the instances of its
 * concrete subclasses (R-SIM-8). The input is not mutated. Every reader of the
 * bag passes it through here before `netStcFromRoles`.
 */
export function withDerivedEventRole(bag: Record<string, unknown>, lookup: Record<string, any>): Record<string, unknown> {
    const derived: Record<string, unknown> = { ...bag };
    delete derived.simEvent;
    const trigger = pointer(bag, 'simTrigger');
    const reference = trigger ? lookup[trigger] : undefined;
    const type = reference?.className === 'DReference' ? reference.type : undefined;
    const cls = typeof type === 'string' && type ? lookup[type] : undefined;
    if (cls?.className === 'DClass' && !cls.isPrimitive) derived.simEvent = type;
    return derived;
}

/** Arcs of weight 1 on each place, one arc per place with the weights summed. */
function merge(arcs: readonly Arc[]): Arc[] {
    const byPlace = new Map<string, number>();
    for (const a of arcs) byPlace.set(a.place, (byPlace.get(a.place) ?? 0) + a.weight);
    return [...byPlace].map(([place, weight]) => ({ place, weight }));
}

function unit(places: readonly string[]): Arc[] {
    return merge(places.map(place => ({ place, weight: 1 })));
}

/** exit(preset), the transition's own elements, entry(postset): one parallel assignment (R-SIM-17). */
function actionSites(preset: readonly Arc[], own: readonly string[], postset: readonly Arc[]): ActionSite[] {
    return [
        ...preset.map((a): ActionSite => ({ element: a.place, role: 'exit' })),
        ...own.map((element): ActionSite => ({ element, role: 'transition' })),
        ...postset.map((a): ActionSite => ({ element: a.place, role: 'entry' })),
    ];
}

/** Siblings of an `else`: the same preset and the same triggers (R-SIM-31). */
function siblingKey(t: NetTransition): string {
    const pre = [...t.preset].map(a => `${a.place}*${a.weight}`).sort().join(',');
    const trig = [...new Set(t.triggers)].sort().join(',');
    return `${pre}|${trig}`;
}

/**
 * The `else` among `transitions` (R-SIM-31, R-SIM-64), for both shapes: an
 * `else` loses the guard site of its `else` element (`isElse`: transition id →
 * that element) and becomes the complement of its siblings; two `else` among
 * siblings are `else-twice` and neither is compiled. `what` ends the defect
 * message. Order is kept.
 */
function resolveElse(transitions: readonly NetTransition[], isElse: ReadonlyMap<string, string>, defects: NetDefect[], what: string): NetTransition[] {
    const groups = new Map<string, NetTransition[]>();
    for (const t of transitions) {
        const key = siblingKey(t);
        const g = groups.get(key);
        if (g) g.push(t); else groups.set(key, [t]);
    }
    const out: NetTransition[] = [];
    for (const t of transitions) {
        if (!isElse.has(t.id)) {
            out.push(t);
            continue;
        }
        const group = groups.get(siblingKey(t)) ?? [];
        const elses = group.filter(s => isElse.has(s.id));
        if (elses.length > 1) {
            defects.push({ element: t.id, code: 'else-twice', message: `two else ${what}: ${elses.map(s => s.id).join(', ')}` });
            continue;
        }
        // Only the `else` edge loses its site: a fused transition keeps its other edges' guards (G7).
        out.push({ ...t, guardSites: t.guardSites.filter(s => s !== isElse.get(t.id)), elseOf: group.filter(s => s !== t).map(s => s.id) });
    }
    return out;
}

interface Edge {
    readonly id: string;
    readonly sources: readonly string[];
    readonly targets: readonly string[];
    /** The fork/join node at an end, when there is one (R-SIM-31). */
    readonly pseudoSource: string | null;
    readonly pseudoTarget: string | null;
}

interface Compiled {
    places: string[];
    transitions: NetTransition[];
}

function compileControlFlow(
    stc: NetStc, view: NetModelView, ids: readonly string[], idSet: ReadonlySet<string>, defects: NetDefect[],
    kind: (id: string, cls: string | undefined) => boolean, triggersOf: (id: string) => string[],
): Compiled {
    const isPseudo = (id: string) => kind(id, stc.fork) || kind(id, stc.join);
    const isEvent = (id: string) => !!(stc.event && stc.trigger) && kind(id, stc.event);

    // The edges: owned through the composition, or carrying a source, or of the transition metaclass.
    const owner = new Map<string, string>();
    const order: string[] = [];
    const seen = new Set<string>();
    const add = (t: string) => {
        if (seen.has(t) || !view.exists(t)) return;
        seen.add(t);
        order.push(t);
    };
    if (stc.ownedTransitions) {
        for (const s of ids) {
            if (!view.exists(s)) continue;
            for (const t of view.references(s, stc.ownedTransitions)) {
                if (!owner.has(t)) owner.set(t, s);
                add(t);
            }
        }
    }
    if (stc.source) for (const t of ids) if (view.references(t, stc.source).length > 0) add(t);
    if (stc.transition) for (const t of ids) if (kind(t, stc.transition)) add(t);
    const edgeIds = new Set(order);

    const isPlace = (x: string) => view.exists(x) && !edgeIds.has(x) && !isPseudo(x) && !isEvent(x)
        && (stc.node ? kind(x, stc.node) : idSet.has(x));
    const places = ids.filter(isPlace);

    /** The endpoints of one side, or the defect that excludes the edge. */
    const side = (t: string, list: readonly string[], which: 'source' | 'target'): NetDefect | null => {
        const code = which === 'source' ? 'no-source' : 'no-target';
        if (list.length === 0) return { element: t, code, message: `the edge has no ${which}` };
        const gone = list.find(x => !view.exists(x));
        if (gone !== undefined) return { element: t, code, message: `the ${which} ${gone} is not in the model` };
        const stray = list.find(x => !isPlace(x) && !isPseudo(x));
        if (stray !== undefined) return { element: t, code: 'not-a-place', message: `the ${which} ${stray} is not a place` };
        return null;
    };

    const edges: Edge[] = [];
    for (const t of order) {
        const declared = stc.source ? view.references(t, stc.source) : [];
        const sources = declared.length > 0 ? declared : owner.has(t) ? [owner.get(t) as string] : [];
        const targets = stc.nextState ? view.references(t, stc.nextState) : [];
        const bad = side(t, sources, 'source') ?? side(t, targets, 'target');
        if (bad) { defects.push(bad); continue; }
        const ps = sources.filter(isPseudo);
        const pt = targets.filter(isPseudo);
        if (ps.length > 0 && pt.length > 0) {
            defects.push({ element: t, code: 'pseudo-chain', message: 'an edge between two fork/join nodes' });
            continue;
        }
        if ((ps.length > 0 && sources.length > 1) || (pt.length > 0 && targets.length > 1)) {
            defects.push({ element: t, code: 'pseudo-chain', message: 'a fork/join node must be the only endpoint on its side of the edge' });
            continue;
        }
        edges.push({ id: t, sources, targets, pseudoSource: ps[0] ?? null, pseudoTarget: pt[0] ?? null });
    }

    const guardSites = (els: readonly string[]) => (stc.guard ? [...els] : []);
    const transitions: NetTransition[] = [];
    const make = (id: string, origin: string[], sources: readonly string[], targets: readonly string[],
        triggers: readonly string[], fused: readonly string[]): NetTransition => {
        const preset = unit(sources);
        const postset = unit(targets);
        return {
            id, origin, preset, postset, inhibitors: [], triggers: [...new Set(triggers)],
            guardSites: guardSites(fused), elseOf: null, actionSites: actionSites(preset, fused, postset),
        };
    };

    const saysElse = (edge: string) => {
        const text = stc.guard ? view.values(edge, stc.guard)[0] : undefined;
        return typeof text === 'string' && text.trim() === 'else';
    };
    // Transition id → its `else` edge: a plain edge itself, a fused transition its choice edge (G7).
    const isElse = new Map<string, string>();

    // Plain edges.
    const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);
    for (const e of plain) {
        if (saysElse(e.id)) isElse.set(e.id, e.id);
        transitions.push(make(e.id, [e.id], e.sources, e.targets, triggersOf(e.id), [e.id]));
    }

    // Fork and join nodes: not places, their edges fuse (R-SIM-22, R-SIM-31).
    const pseudoNodes: string[] = [];
    for (const e of edges) {
        for (const p of [e.pseudoTarget, e.pseudoSource]) if (p !== null && !pseudoNodes.includes(p)) pseudoNodes.push(p);
    }
    for (const p of pseudoNodes) {
        const ins = edges.filter(e => e.pseudoTarget === p);
        const outs = edges.filter(e => e.pseudoSource === p);
        if (ins.length === 0 || outs.length === 0) {
            defects.push({ element: p, code: 'pseudo-open', message: 'a fork/join node needs incoming and outgoing edges' });
            continue;
        }
        const fork = kind(p, stc.fork);
        const join = kind(p, stc.join);
        const sourcesOf = (es: readonly Edge[]) => es.flatMap(e => e.sources);
        const targetsOf = (es: readonly Edge[]) => es.flatMap(e => e.targets);
        const edgeIdsOf = (es: readonly Edge[]) => es.map(e => e.id);
        // An `else` chooses on the edge into a fork or on an edge out of a join; elsewhere its siblings are undefined (G7).
        const what = fork && !join ? 'fork' : join && !fork ? 'join' : 'fork/join';
        const stray = (fork && !join ? outs : join && !fork ? ins : [...ins, ...outs]).find(e => saysElse(e.id));
        if (stray) {
            defects.push({ element: stray.id, code: 'else-position', message: `else on an edge ${stray.pseudoTarget === p ? 'into' : 'out of'} a ${what}: it has no siblings` });
            continue;
        }
        if (fork && !join) {
            for (const e of ins) {
                const id = ins.length === 1 ? p : `${p}#${e.id}`;
                if (saysElse(e.id)) isElse.set(id, e.id);
                transitions.push(make(id, [e.id, p, ...edgeIdsOf(outs)], e.sources, targetsOf(outs),
                    triggersOf(e.id), [e.id, ...edgeIdsOf(outs)]));
            }
        } else if (join && !fork) {
            for (const e of outs) {
                const id = outs.length === 1 ? p : `${p}#${e.id}`;
                if (saysElse(e.id)) isElse.set(id, e.id);
                transitions.push(make(id, [...edgeIdsOf(ins), p, e.id], sourcesOf(ins), e.targets,
                    triggersOf(e.id), [...edgeIdsOf(ins), e.id]));
            }
        } else {
            transitions.push(make(p, [...edgeIdsOf(ins), p, ...edgeIdsOf(outs)], sourcesOf(ins), targetsOf(outs),
                [...ins, ...outs].flatMap(e => triggersOf(e.id)), [...edgeIdsOf(ins), ...edgeIdsOf(outs)]));
        }
    }
    // The `else` among plain and fused transitions alike (R-SIM-31, G7).
    return { places, transitions: resolveElse(transitions, isElse, defects, 'edges share a source') };
}

function compilePetri(
    stc: NetStc, view: NetModelView, ids: readonly string[], defects: NetDefect[],
    kind: (id: string, cls: string | undefined) => boolean, triggersOf: (id: string) => string[],
): Compiled {
    const places = ids.filter(id => view.exists(id) && kind(id, stc.node));
    const trs = ids.filter(id => view.exists(id) && kind(id, stc.transition));
    const P = new Set(places);
    const T = new Set(trs);
    const pre = new Map<string, Arc[]>();
    const post = new Map<string, Arc[]>();
    const inh = new Map<string, Arc[]>();
    for (const t of trs) { pre.set(t, []); post.set(t, []); inh.set(t, []); }

    for (const a of ids) {
        if (!view.exists(a) || !(kind(a, stc.arc) || kind(a, stc.inhibitorArc))) continue;
        const inhibitor = kind(a, stc.inhibitorArc);
        const src = stc.arcSource ? view.references(a, stc.arcSource)[0] : undefined;
        const tgt = stc.arcTarget ? view.references(a, stc.arcTarget)[0] : undefined;
        const raw = stc.arcWeight ? view.values(a, stc.arcWeight)[0] : undefined;
        const weight = raw === undefined ? 1 : raw;
        if (typeof weight !== 'number' || !Number.isInteger(weight) || weight < 1) {
            defects.push({ element: a, code: 'bad-weight', message: `weight ${String(weight)}: a natural ≥ 1 is required` });
            continue;
        }
        if (src !== undefined && tgt !== undefined && P.has(src) && T.has(tgt)) {
            (inhibitor ? inh : pre).get(tgt)!.push({ place: src, weight });
        } else if (src !== undefined && tgt !== undefined && T.has(src) && P.has(tgt) && !inhibitor) {
            post.get(src)!.push({ place: tgt, weight });
        } else {
            defects.push({
                element: a, code: 'bad-arc',
                message: inhibitor ? 'an inhibitor arc goes from a place to a transition' : 'an arc joins a place and a transition',
            });
        }
    }

    // The literal `else`, as on a control-flow edge (R-SIM-64).
    const isElse = new Map<string, string>();
    const transitions = trs.map((t): NetTransition => {
        const preset = merge(pre.get(t)!);
        const postset = merge(post.get(t)!);
        const text = stc.guard ? view.values(t, stc.guard)[0] : undefined;
        if (typeof text === 'string' && text.trim() === 'else') isElse.set(t, t);
        return {
            id: t, origin: [t], preset, postset, inhibitors: merge(inh.get(t)!), triggers: triggersOf(t),
            guardSites: stc.guard ? [t] : [], elseOf: null, actionSites: actionSites(preset, [t], postset),
        };
    });
    return { places, transitions: resolveElse(transitions, isElse, defects, 'transitions share a preset') };
}

/** A domain as the defects print it: `0..3`, `{A, B}`, `{true, false}`. */
function domainText(domain: Domain): string {
    switch (domain.kind) {
        case 'boolean': return '{true, false}';
        case 'range': return `${domain.min}..${domain.max}`;
        case 'enum': return `{${domain.literals.join(', ')}}`;
    }
}

/**
 * What is wrong with one declaration on its own (R-SIM-71): a reserved name,
 * a metaclass the model does not have, a semantic attribute without a domain,
 * range bounds that are not integers or are reversed, an initial value outside
 * the domain or of another type. The initial is checked only on a sound domain.
 * A derived declaration has no initial (R-SIM-72): both or neither is `exclusive`;
 * its equation is compiled at Reset (`derivedEvaluator.ts`). An input has
 * neither (R-SIM-88): one of the two with it is `exclusive`, and it is semantic.
 */
function declarationDefects(decl: StateAttributeDecl, index: number, view: NetModelView): DeclarationDefect[] {
    const out: DeclarationDefect[] = [];
    const defect = (code: DeclarationDefect['code'], message: string) => out.push({ index, name: decl.name, code, message });
    if (decl.input === true) {
        if (decl.initial !== undefined) defect('exclusive', 'input and initial');
        else if (decl.equation !== undefined) defect('exclusive', 'input and equation');
        if (decl.space !== 'semantic') defect('input', 'an input is semantic');
    } else if ((decl.initial === undefined) === (decl.equation === undefined)) {
        defect('exclusive', decl.equation === undefined ? 'no initial or equation' : 'initial and equation');
    }
    if (STATE_RESERVED.readOnlyAttributes.includes(decl.name)) defect('reserved', 'reserved name');
    if (decl.metaclass !== null && !view.exists(decl.metaclass)) defect('metaclass', 'unknown metaclass');
    const domain = decl.domain;
    if (decl.space !== 'semantic') return out;
    if (domain === null) {
        defect('no-domain', 'semantic without a domain');
        return out;
    }
    if (domain.kind === 'range' && !(Number.isInteger(domain.min) && Number.isInteger(domain.max))) {
        defect('bounds', `bounds ${domain.min}..${domain.max} are not integers`);
    } else if (domain.kind === 'range' && domain.min > domain.max) {
        defect('bounds', `min ${domain.min} > max ${domain.max}`);
    } else if (decl.equation === undefined && decl.initial !== undefined && !inDomain(decl.initial, domain)) {
        defect('initial', `initial ${String(decl.initial)} outside ${domainText(domain)}`);
    }
    return out;
}

/**
 * The net of one M1 model. `ids` are the model's DObject ids; which ids
 * belong to the model is the caller's reading of the store
 * (`collectModelObjectIds` in the bridge). `decls` are the declared state
 * attributes (R-SIM-19), decoded by the caller from `simStateAttributes`
 * (`stateAttributesCodec.ts`, R-SIM-67).
 *
 * The initial σ: one token on each place that is a kind of `simInitial`, or,
 * when `simInitialMarking` is set, its value on each place; a value that is not
 * an integer in 0..k is the defect `initial-over-bound` and the place starts
 * empty. Attributes start at their declared initial value; when two
 * declarations give an element the same name, the first one holds, and the
 * second is a declaration defect (`two-spaces` or `twice`, R-SIM-71) reported
 * once, at the first element where they meet. A defective declaration still
 * applies where it can: the defects are reported, not enforced. A derived
 * attribute is declared but has no stored value: its values come at Reset from
 * `withDerivedInitial` (lane C2, R-SIM-73). An input is declared and never has
 * one: the bridge asks it for the step that reads it (R-SIM-88).
 */
export function compileNet(
    stc: NetStc, view: NetModelView, modelId: string, ids: readonly string[],
    decls: readonly StateAttributeDecl[] = [],
): CompiledNet {
    const defects: NetDefect[] = [];
    const idSet = new Set(ids);
    const kind = (id: string, cls: string | undefined) => !!cls && view.isInstanceOf(id, cls);
    const hasEventRole = !!(stc.event && stc.trigger);
    const triggersOf = (id: string) => (hasEventRole ? view.references(id, stc.trigger as string) : []);

    const { places, transitions } = stc.shape === 'petri'
        ? compilePetri(stc, view, ids, defects, kind, triggersOf)
        : compileControlFlow(stc, view, ids, idSet, defects, kind, triggersOf);

    const marking = new Map<string, number>();
    for (const p of places) {
        if (stc.initialMarking) {
            const raw = view.values(p, stc.initialMarking)[0];
            if (raw === undefined) continue;
            if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > stc.bound) {
                defects.push({ element: p, code: 'initial-over-bound', message: `initial marking ${String(raw)}: an integer in 0..${stc.bound} is required` });
                continue;
            }
            if (raw > 0) marking.set(p, raw);
        } else if (kind(p, stc.initial)) {
            marking.set(p, 1);
        }
    }

    const declared = new Map<string, Map<string, StateAttributeDecl>>();
    const attrs = new Map<string, Map<string, SimValue>>();
    const presentation = new Map<string, Map<string, SimValue>>();
    const declarationDefectList: DeclarationDefect[] = [];
    for (const [index, decl] of decls.entries()) {
        declarationDefectList.push(...declarationDefects(decl, index, view));
        const owners = decl.metaclass === null
            ? [modelId]
            : ids.filter(id => view.exists(id) && view.isInstanceOf(id, decl.metaclass as string));
        let met = false;
        for (const e of owners) {
            let byName = declared.get(e);
            if (!byName) { byName = new Map(); declared.set(e, byName); }
            const first = byName.get(decl.name);
            if (first) {
                if (!met) {
                    met = true;
                    const twoSpaces = first.space !== decl.space;
                    declarationDefectList.push({
                        index, name: decl.name, code: twoSpaces ? 'two-spaces' : 'twice',
                        message: twoSpaces ? `${first.space} and ${decl.space}` : 'declared twice', element: e,
                    });
                }
                continue;
            }
            byName.set(decl.name, decl);
            // A derived value comes from its equation, an input from the environment at each step (R-SIM-88).
            if (decl.equation !== undefined || decl.input === true || decl.initial === undefined) continue;
            const space = decl.space === 'semantic' ? attrs : presentation;
            let values = space.get(e);
            if (!values) { values = new Map(); space.set(e, values); }
            values.set(decl.name, decl.initial);
        }
    }

    const final = stc.terminal ? new Set(places.filter(p => kind(p, stc.terminal))) : null;
    const activityFinal = stc.activityFinal ? new Set(places.filter(p => kind(p, stc.activityFinal))) : null;
    return {
        modelId,
        places: new Set(places),
        transitions,
        bound: stc.bound,
        final,
        activityFinal,
        hasEventRole,
        attributes: [...decls],
        declared,
        initial: { marking, attrs, presentation },
        defects,
        declarationDefects: declarationDefectList,
    };
}

/**
 * The net with the derived values of its initial σ (lane C2, R-SIM-73), at
 * Reset: the oracle's fresh map goes on `initial`, and what it says wrong is a
 * declaration defect, once per declaration, at the first element: a failure
 * leaves the value out, a semantic value outside its domain stays, as an
 * initial value outside it does (report §5, decision 5). `equationDefects`,
 * those of `compileDerived`, go between the compiler's defects and the values'
 * own. The input net is not changed.
 */
export function withDerivedInitial(
    net: CompiledNet, oracle: DerivedOracle, equationDefects: readonly DeclarationDefect[] = [],
): CompiledNet {
    const { derived, failures } = oracle(net.initial);
    const defects: DeclarationDefect[] = [...(net.declarationDefects ?? []), ...equationDefects];
    const reported = new Set<StateAttributeDecl>();
    const report = (element: string, attr: string, message: string) => {
        const decl = net.declared.get(element)?.get(attr);
        if (!decl || reported.has(decl)) return;
        reported.add(decl);
        defects.push({ index: net.attributes.indexOf(decl), name: attr, code: 'derived', message, element });
    };
    for (const f of failures) report(f.element, f.attr, `failed: ${f.detail}`);
    for (const [element, values] of derived.attrs) {
        for (const [attr, value] of values) {
            const domain = net.declared.get(element)?.get(attr)?.domain ?? null;
            if (domain !== null && !inDomain(value, domain)) report(element, attr, `= ${String(value)} outside ${domainText(domain)}`);
        }
    }
    return { ...net, initial: { ...net.initial, derived }, declarationDefects: defects };
}

/**
 * The event alphabet: the instances of the event metaclass among `ids`, with
 * their labels, sorted by label and then by id. `[]` without the event role.
 * `ids` are the DObject ids of the model, as for `compileNet`. Moved here from
 * the old step (step 3b), unchanged but for the STC it reads.
 */
export function eventAlphabet(stc: NetStc, view: SimModelView, ids: readonly string[]): SimEventInfo[] {
    const eventClass = stc.event;
    if (!(stc.event && stc.trigger) || !eventClass) return [];
    return ids
        .filter(id => view.isInstanceOf(id, eventClass))
        .map(id => ({ id, label: view.label ? view.label(id) : id }))
        .sort((a, b) => a.label.localeCompare(b.label) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
