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
    ActionSite, Arc, CompiledNet, NetDefect, NetModelView, NetStc, NetTransition, SimValue, StateAttributeDecl,
} from './netTypes';
import type { SimEventInfo, SimModelView } from './types';

/** A role value: a non-empty string, as `stcFromRoles` reads it. */
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
    ['initialMarking', 'simInitialMarking'], ['terminal', 'simTerminal'],
    ['ownedTransitions', 'simOwnedTransitions'], ['source', 'simSource'], ['nextState', 'simNextState'],
    ['fork', 'simFork'], ['join', 'simJoin'], ['guard', 'simGuard'],
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
 * role exists only when `simEvent` and `simTrigger` are both set.
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

    // Plain edges, and the `else` among them.
    const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);
    const isElse = new Set<string>();
    for (const e of plain) {
        const text = stc.guard ? view.values(e.id, stc.guard)[0] : undefined;
        if (typeof text === 'string' && text.trim() === 'else') isElse.add(e.id);
        transitions.push(make(e.id, [e.id], e.sources, e.targets, triggersOf(e.id), [e.id]));
    }
    const groups = new Map<string, NetTransition[]>();
    for (const t of transitions) {
        const key = siblingKey(t);
        const g = groups.get(key);
        if (g) g.push(t); else groups.set(key, [t]);
    }
    const dropped = new Set<string>();
    for (const t of transitions) {
        if (!isElse.has(t.id)) continue;
        const group = groups.get(siblingKey(t)) ?? [];
        const elses = group.filter(s => isElse.has(s.id));
        if (elses.length > 1) {
            dropped.add(t.id);
            defects.push({ element: t.id, code: 'else-twice', message: `two else edges share a source: ${elses.map(s => s.id).join(', ')}` });
            continue;
        }
        const i = transitions.indexOf(t);
        transitions[i] = { ...t, guardSites: [], elseOf: group.filter(s => s !== t).map(s => s.id) };
    }
    const kept = transitions.filter(t => !dropped.has(t.id));

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
        if (fork && !join) {
            for (const e of ins) {
                kept.push(make(ins.length === 1 ? p : `${p}#${e.id}`, [e.id, p, ...edgeIdsOf(outs)], e.sources, targetsOf(outs),
                    triggersOf(e.id), [e.id, ...edgeIdsOf(outs)]));
            }
        } else if (join && !fork) {
            for (const e of outs) {
                kept.push(make(outs.length === 1 ? p : `${p}#${e.id}`, [...edgeIdsOf(ins), p, e.id], sourcesOf(ins), e.targets,
                    triggersOf(e.id), [...edgeIdsOf(ins), e.id]));
            }
        } else {
            kept.push(make(p, [...edgeIdsOf(ins), p, ...edgeIdsOf(outs)], sourcesOf(ins), targetsOf(outs),
                [...ins, ...outs].flatMap(e => triggersOf(e.id)), [...edgeIdsOf(ins), ...edgeIdsOf(outs)]));
        }
    }
    return { places, transitions: kept };
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

    const transitions = trs.map((t): NetTransition => {
        const preset = merge(pre.get(t)!);
        const postset = merge(post.get(t)!);
        return {
            id: t, origin: [t], preset, postset, inhibitors: merge(inh.get(t)!), triggers: triggersOf(t),
            guardSites: stc.guard ? [t] : [], elseOf: null, actionSites: actionSites(preset, [t], postset),
        };
    });
    return { places, transitions };
}

/**
 * The net of one M1 model. `ids` are the model's DObject ids, as for
 * `initialConfiguration`; which ids belong to the model is the caller's
 * reading of the store. `decls` are the declared state attributes (R-SIM-19):
 * in 3a they come from the caller, the STC authoring of them is later.
 *
 * The initial σ: one token on each place that is a kind of `simInitial`, or,
 * when `simInitialMarking` is set, its value on each place; a value that is not
 * an integer in 0..k is the defect `initial-over-bound` and the place starts
 * empty. Attributes start at their declared initial value; when two
 * declarations give an element the same name, the first one holds.
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
    for (const decl of decls) {
        const owners = decl.metaclass === null
            ? [modelId]
            : ids.filter(id => view.exists(id) && view.isInstanceOf(id, decl.metaclass as string));
        for (const e of owners) {
            let byName = declared.get(e);
            if (!byName) { byName = new Map(); declared.set(e, byName); }
            if (byName.has(decl.name)) continue;
            byName.set(decl.name, decl);
            const space = decl.space === 'semantic' ? attrs : presentation;
            let values = space.get(e);
            if (!values) { values = new Map(); space.set(e, values); }
            values.set(decl.name, decl.initial);
        }
    }

    const final = stc.terminal ? new Set(places.filter(p => kind(p, stc.terminal))) : null;
    return {
        modelId,
        places: new Set(places),
        transitions,
        bound: stc.bound,
        final,
        hasEventRole,
        attributes: [...decls],
        declared,
        initial: { marking, attrs, presentation },
        defects,
    };
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
