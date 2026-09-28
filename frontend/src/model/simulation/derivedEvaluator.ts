/**
 * derivedEvaluator — the derived state attributes, nuXmv's `DEFINE` (lane C2,
 * R-SIM-19, R-SIM-73..75).
 *
 * `compileDerived` runs once per run over the declarations: every equation is
 * parsed strictly and checked as a guard is (`checkGuardSubset`), `E-NODE`
 * only on a semantic one, since a presentation equation reads `node` as its own
 * element; `event` is a defect, a derived value being a function of σ alone,
 * and so is a read of an input's name (R-SIM-88); a semantic equation that reads a presentation attribute, stored or derived, is
 * `E-NODE` too. The dependencies are the attribute names of the `StateAccess`
 * nodes (R-SIM-74, G1 of the report): a cycle among the names is a defect on
 * each member, with its cycle named, and the order of evaluation is
 * topological by name, ties by name. A defective equation is never evaluated.
 *
 * With the frozen M (R-SIM-74 as amended, G3 of
 * docs/discovery/discovery_2026-09-27_sim_derived_recursion.md) the graph is
 * per (element, attribute): the object of each `StateAccess` is folded over M
 * for each owner, a lambda or `forall` variable ranging over its collection,
 * and a read that cannot be folded falls back to the name. So a well-founded
 * recursion on M (`self.children.sum(c => c.[size])`) is ordered, and a cycle
 * is a defect on the elements it goes through only. The order is the plan
 * `makeDerivedOracle` runs; where the name graph accepts the model, the plan
 * is the one it gave.
 *
 * `makeDerivedOracle` is the core's `DerivedOracle`: it evaluates every
 * equation that runs on each element whose declaration it is, in that order,
 * over a map it builds from nothing (R-SIM-73: the input's `derived` is never
 * read), so an equation reads the values before it through the same accessor
 * as a guard. `self` is the owner, the model root for a global; `event` is
 * `null`; `node.[x]` reads the owner's presentation. A value that is not a
 * boolean, a number or a string (`1 / 0` is `null`) is a failure, as an
 * exception is; the domain is the core's to check.
 *
 * The evaluation of report §4 and §5 E1:
 * docs/discovery/discovery_2026-09-27_sim_derived_attributes.md.
 *
 * Pure: JjEL, the shared diagnostics of `jjelTriState.ts`, the subset checker,
 * the guard context and the core's accessor.
 */

import { parseExpressionStrict } from '../../jjel/parser';
import { JjelEvaluator, isJjelObject } from '../../jjel/evaluator';
import type { EvaluationContext, JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelExpression } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { describeType, firstAbsence } from '../jjelTriState';
import { toJjelStateAccess } from './guardContext';
import type { SimSnapshot } from './guardContext';
import { stateAccess } from './netStep';
import { checkGuardSubset } from './subsetChecker';
import type {
    CompiledNet, DeclarationDefect, DerivedFailure, DerivedOracle, DerivedValues, SimState, SimValue, StateAttributeDecl,
} from './netTypes';

export interface CompiledEquation {
    readonly decl: StateAttributeDecl;
    /** Its position among the declarations, as the defects give it. */
    readonly index: number;
    readonly expr: JjelExpression;
    /** The attribute names its `StateAccess` nodes read, in order, once each. */
    readonly reads: readonly string[];
}

export interface CompiledDerived {
    /** The equations that run, in the order of evaluation. */
    readonly order: readonly CompiledEquation[];
    /** Parse, subset, event and cycle: the declaration stays, its value never comes. */
    readonly defects: readonly DeclarationDefect[];
    /**
     * With the frozen M only: every evaluation of a run, one per (owner,
     * equation), in the order of the graph per element. The owners on a
     * cycle are not in it.
     */
    readonly plan?: readonly { readonly eq: CompiledEquation; readonly owner: string }[];
}

/** Every node of an AST, in pre-order, locations aside. */
function visit(node: unknown, f: (e: Record<string, unknown>) => void): void {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const x of node) visit(x, f);
        return;
    }
    f(node as Record<string, unknown>);
    for (const [key, child] of Object.entries(node)) if (key !== 'location') visit(child, f);
}

/** The shortest cycle from `name` back to itself, `[name, …, name]`, or `null`: breadth first, the edges in order. */
function cycleThrough(name: string, edges: ReadonlyMap<string, readonly string[]>): string[] | null {
    const parent = new Map<string, string>();
    const queue = [name];
    for (let i = 0; i < queue.length; i++) {
        const x = queue[i];
        for (const y of edges.get(x) ?? []) {
            if (y === name) {
                const path: string[] = [];
                for (let z = x; z !== name; z = parent.get(z) as string) path.unshift(z);
                return [name, ...path, name];
            }
            if (!parent.has(y)) {
                parent.set(y, x);
                queue.push(y);
            }
        }
    }
    return null;
}

/**
 * The strongly connected components of a graph on `0..n-1` (Tarjan, with a
 * worklist: a list of a thousand cells is a path a thousand deep).
 */
function stronglyConnected(n: number, edges: readonly (readonly number[])[]): number[][] {
    const index = new Array<number>(n).fill(-1);
    const low = new Array<number>(n).fill(0);
    const onStack = new Array<boolean>(n).fill(false);
    const stack: number[] = [];
    const out: number[][] = [];
    let next = 0;
    for (let s = 0; s < n; s++) {
        if (index[s] !== -1) continue;
        index[s] = low[s] = next++;
        stack.push(s);
        onStack[s] = true;
        const work: Array<[number, number]> = [[s, 0]];
        while (work.length > 0) {
            const top = work[work.length - 1];
            const v = top[0];
            if (top[1] < edges[v].length) {
                const w = edges[v][top[1]++];
                if (index[w] === -1) {
                    index[w] = low[w] = next++;
                    stack.push(w);
                    onStack[w] = true;
                    work.push([w, 0]);
                } else if (onStack[w]) {
                    low[v] = Math.min(low[v], index[w]);
                }
                continue;
            }
            work.pop();
            if (work.length > 0) {
                const u = work[work.length - 1][0];
                low[u] = Math.min(low[u], low[v]);
            }
            if (low[v] === index[v]) {
                const component: number[] = [];
                let w: number;
                do {
                    w = stack.pop() as number;
                    onStack[w] = false;
                    component.push(w);
                } while (w !== v);
                out.push(component);
            }
        }
    }
    return out;
}

/**
 * Kahn's order of the nodes `include` keeps, a node after every node of
 * `deps[i]`, the ready node of smallest `priority` first. `deps` names only
 * kept nodes, and no node itself.
 */
function inPriorityOrder(
    n: number, deps: readonly (readonly number[])[], priority: readonly number[], include: (i: number) => boolean,
): number[] {
    const waiting = deps.map(d => d.length);
    const readers: number[][] = Array.from({ length: n }, () => []);
    deps.forEach((d, i) => { for (const j of d) readers[j].push(i); });
    const heap: number[] = [];
    const before = (a: number, b: number) => priority[heap[a]] < priority[heap[b]];
    const push = (i: number) => {
        heap.push(i);
        for (let c = heap.length - 1; c > 0;) {
            const p = (c - 1) >> 1;
            if (!before(c, p)) break;
            [heap[c], heap[p]] = [heap[p], heap[c]];
            c = p;
        }
    };
    const pop = (): number => {
        const top = heap[0];
        const last = heap.pop() as number;
        if (heap.length > 0) {
            heap[0] = last;
            for (let p = 0; ;) {
                const l = 2 * p + 1;
                let m = p;
                if (l < heap.length && before(l, m)) m = l;
                if (l + 1 < heap.length && before(l + 1, m)) m = l + 1;
                if (m === p) break;
                [heap[m], heap[p]] = [heap[p], heap[m]];
                p = m;
            }
        }
        return top;
    };
    for (let i = 0; i < n; i++) if (include(i) && waiting[i] === 0) push(i);
    const order: number[] = [];
    while (heap.length > 0) {
        const i = pop();
        order.push(i);
        for (const r of readers[i]) if (--waiting[r] === 0 && include(r)) push(r);
    }
    return order;
}

/** Above this many bindings of its variables, an object is not folded: the read falls back to the name. */
const FOLD_LIMIT = 10000;

/** The values a variable takes over the frozen M, or `null` when only σ knows them. */
type Folded = readonly JjelValue[] | null;

/** An element of M: an object with an id, as `.[x]` needs on its left. */
function isElement(value: JjelValue): boolean {
    return isJjelObject(value) && typeof (value as any).id === 'string' && (value as any).id !== '';
}

/** Whether `node` reads σ anywhere in it. */
function readsState(node: unknown): boolean {
    let found = false;
    visit(node, e => { if (e.type === 'StateAccess') found = true; });
    return found;
}

/**
 * The values of `object` over the frozen M, once per binding of the variables
 * of `env` it names, `self` the owner. `null` when it reads σ, when a variable
 * it names is known only on σ, or above `FOLD_LIMIT` bindings. An evaluation
 * that throws gives no value: over M alone, the read throws the same way in
 * the run, and depends on nothing.
 */
function foldObject(object: JjelExpression, env: ReadonlyMap<string, Folded>, self: JjelValue, snapshot: SimSnapshot): Folded {
    if (readsState(object)) return null;
    const names = new Set<string>();
    visit(object, e => { if (e.type === 'Identifier' && typeof e.name === 'string') names.add(e.name); });
    let bindings: Array<Record<string, JjelValue>> = [{}];
    for (const name of names) {
        if (!env.has(name)) continue;
        const values = env.get(name) as Folded;
        if (values === null || bindings.length * values.length > FOLD_LIMIT) return null;
        bindings = bindings.flatMap(b => values.map(v => ({ ...b, [name]: v })));
    }
    const out: JjelValue[] = [];
    for (const b of bindings) {
        try {
            out.push(EVALUATOR.evaluate(object, snapshot.base.child({ self, event: null, model: snapshot.model, ...b })));
        } catch {
            // no value, no dependency
        }
    }
    return out;
}

/** The elements among folded values, a collection opened: what a lambda or `forall` variable ranges over. */
function elementsOf(values: Folded): Folded {
    return values === null ? null : values.flatMap(v => (Array.isArray(v) ? v : [v])).filter(isElement);
}

/**
 * The (element, attribute) pairs one equation reads on its owner, `self` its
 * handle: `node.[a]` the owner; a path folded over M, the elements it gives;
 * a variable bound by a lambda that is a collection method's argument, or by
 * `forall`/`exists`, the elements of that collection; `element: null`, any
 * owner of the name, where the fold cannot say.
 */
function foldedReads(expr: JjelExpression, owner: string, self: JjelValue, snapshot: SimSnapshot): Array<{ element: string | null; attr: string }> {
    const out: Array<{ element: string | null; attr: string }> = [];
    const walk = (node: unknown, env: ReadonlyMap<string, Folded>): void => {
        if (node === null || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const x of node) walk(x, env);
            return;
        }
        const e = node as JjelExpression;
        switch (e.type) {
            case 'StateAccess': {
                if (e.object.type === 'Identifier' && e.object.name === STATE_RESERVED.presentationRoot) {
                    out.push({ element: owner, attr: e.attribute });
                    return;
                }
                const values = foldObject(e.object, env, self, snapshot);
                if (values === null) out.push({ element: null, attr: e.attribute });
                else for (const v of values) if (isElement(v)) out.push({ element: (v as any).id, attr: e.attribute });
                walk(e.object, env);
                return;
            }
            case 'MethodCall':
            case 'NullSafeMethodCall': {
                walk(e.object, env);
                const items = elementsOf(foldObject(e.object, env, self, snapshot));
                for (const arg of e.args) {
                    if (arg.type !== 'Lambda') {
                        walk(arg, env);
                        continue;
                    }
                    // Every collection method calls its function with the element alone (`collections.ts`).
                    const inner = new Map(env);
                    arg.params.forEach((p, i) => inner.set(p, i === 0 ? items : null));
                    walk(arg.body, inner);
                }
                return;
            }
            case 'ForAll':
            case 'Exists': {
                walk(e.collection, env);
                const inner = new Map(env);
                inner.set(e.variable, elementsOf(foldObject(e.collection, env, self, snapshot)));
                if (e.type === 'ForAll') {
                    walk(e.filter, inner);
                    walk(e.projection, inner);
                } else {
                    walk(e.predicate, inner);
                }
                return;
            }
            case 'Lambda': {
                const inner = new Map(env);
                for (const p of e.params) inner.set(p, null);
                walk(e.body, inner);
                return;
            }
            default:
                for (const [key, child] of Object.entries(e)) if (key !== 'location') walk(child, env);
        }
    };
    walk(expr, new Map());
    return out;
}

/** The frozen M an order per element is read on: the snapshot of the run and the declarations of its net. */
interface FrozenM {
    readonly snapshot: SimSnapshot;
    readonly net: Pick<CompiledNet, 'modelId' | 'declared'>;
}

/**
 * The graph per (element, attribute) of `compiled` on the frozen M (R-SIM-74
 * as amended), its cycles and its plan. The names are ranked by the
 * components of the name graph `nameEdges`, the smallest name first, and
 * the nodes are numbered in that rank, then in the owners' order: the ready
 * node of smallest number runs first, so where the name graph has no cycle
 * the plan is the one it gave. A cycle that stays on one element is named
 * as the name graph names it; one across elements names them.
 */
function compileOnM(
    compiled: readonly CompiledEquation[], nameEdges: ReadonlyMap<string, readonly string[]>,
    defects: DeclarationDefect[], frozen: FrozenM,
): CompiledDerived {
    const { snapshot, net } = frozen;
    const names = [...nameEdges.keys()];
    const nameAt = new Map(names.map((n, i) => [n, i]));
    const nameComponents = stronglyConnected(names.length, names.map(n => (nameEdges.get(n) as string[]).map(m => nameAt.get(m) as number)));
    const componentOf = new Array<number>(names.length);
    nameComponents.forEach((c, k) => { for (const i of c) componentOf[i] = k; });
    const componentDeps = nameComponents.map((c, k) => [...new Set(c.flatMap(i => (nameEdges.get(names[i]) as string[])
        .map(m => componentOf[nameAt.get(m) as number]).filter(j => j !== k)))]);
    const ranked = inPriorityOrder(nameComponents.length, componentDeps, nameComponents.map(c => Math.min(...c)), () => true)
        .flatMap(k => [...nameComponents[k]].sort((a, b) => a - b).map(i => names[i]));

    // The nodes: per name in rank, per equation of the name, per owner where it holds.
    const nodes: Array<{ eq: CompiledEquation; owner: string }> = [];
    const at = new Map<string, number>();
    const ownersOf = new Map<string, number[]>();
    for (const name of ranked) {
        for (const eq of compiled) {
            if (eq.decl.name !== name) continue;
            for (const [owner, byName] of net.declared) {
                if (byName.get(name) !== eq.decl) continue;
                at.set(`${owner}\u0000${name}`, nodes.length);
                ownersOf.set(name, [...(ownersOf.get(name) ?? []), nodes.length]);
                nodes.push({ eq, owner });
            }
        }
    }

    const edges: number[][] = nodes.map(({ eq, owner }) => {
        const self = owner === net.modelId ? snapshot.model : snapshot.handleById.get(owner);
        const reads = self === undefined
            ? eq.reads.map(attr => ({ element: null, attr }))
            : foldedReads(eq.expr, owner, self, snapshot);
        const out = new Set<number>();
        for (const r of reads) {
            if (r.element === null) for (const j of ownersOf.get(r.attr) ?? []) out.add(j);
            else if (at.has(`${r.element}\u0000${r.attr}`)) out.add(at.get(`${r.element}\u0000${r.attr}`) as number);
        }
        return [...out].sort((a, b) => a - b);
    });

    const cyclic = new Set<number>();
    for (const c of stronglyConnected(nodes.length, edges)) {
        if (c.length > 1 || edges[c[0]].includes(c[0])) for (const i of c) cyclic.add(i);
    }
    const label = (owner: string) => {
        const handle = owner === net.modelId ? snapshot.model : snapshot.handleById.get(owner);
        const name = (handle as any)?.name;
        return typeof name === 'string' && name !== '' ? name : owner;
    };
    const byKey = new Map(edges.map((out, i) => [String(i), out.map(String)]));
    for (const eq of compiled) {
        const first = nodes.findIndex((n, i) => n.eq === eq && cyclic.has(i));
        if (first === -1) continue;
        const cycle = (cycleThrough(String(first), byKey) as string[]).map(Number);
        const oneElement = cycle.every(i => nodes[i].owner === nodes[first].owner);
        const text = cycle.map(i => (oneElement ? nodes[i].eq.decl.name : `${label(nodes[i].owner)}.${nodes[i].eq.decl.name}`));
        defects.push({ index: eq.index, name: eq.decl.name, code: 'cycle', message: `equation cycle: ${text.join(' → ')}` });
    }
    defects.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    const deps = edges.map((out, i) => out.filter(j => j !== i && !cyclic.has(j)));
    const plan = inPriorityOrder(nodes.length, deps, nodes.map((_, i) => i), i => !cyclic.has(i)).map(i => nodes[i]);
    const runs = new Set(plan.map(p => p.eq));
    const order = ranked.flatMap(n => compiled.filter(c => c.decl.name === n && (runs.has(c) || !nodes.some(x => x.eq === c))));
    return { order, defects, plan };
}

/**
 * The equations of `decls`, checked, and the order they run in (R-SIM-74,
 * R-SIM-75). Only a declaration with an `equation` is looked at. Without
 * `frozen` the graph is by name; with it, per (element, attribute) over the
 * frozen M, with the plan of the run (`compileOnM`).
 */
export function compileDerived(decls: readonly StateAttributeDecl[], frozen?: FrozenM): CompiledDerived {
    const defects: DeclarationDefect[] = [];
    const presentationNames = new Set(decls.filter(d => d.space === 'presentation').map(d => d.name));
    // By name, as the presentation names: an input is chosen per step, a derived value is a function of σ (R-SIM-88).
    const inputNames = new Set(decls.filter(d => d.input === true).map(d => d.name));
    const compiled: CompiledEquation[] = [];
    decls.forEach((decl, index) => {
        const text = decl.equation;
        if (text === undefined) return;
        const defect = (code: DeclarationDefect['code'], message: string) => defects.push({ index, name: decl.name, code, message });
        const parsed = parseExpressionStrict(text);
        if (parsed.errors.length > 0 || !parsed.expression) {
            const e = parsed.errors[0];
            defect('parse', e ? `parse error ${e.line}:${e.column} ${e.message}` : 'parse error, no expression');
            return;
        }
        const expr = parsed.expression;
        const semantic = decl.space === 'semantic';
        const error = checkGuardSubset(expr, text).find(d => d.severity === 'error' && (semantic || d.code !== 'E-NODE'));
        if (error) {
            defect('subset', error.code === 'E-NODE'
                ? 'E-NODE: `node` is presentation state: a semantic equation cannot read it (R-SIM-18).'
                : `${error.code}: ${error.message}`);
            return;
        }
        let event = false;
        const reads: string[] = [];
        visit(expr, e => {
            if (e.type === 'Identifier' && e.name === 'event') event = true;
            if (e.type === 'StateAccess' && typeof e.attribute === 'string' && !reads.includes(e.attribute)) reads.push(e.attribute);
        });
        if (event) {
            defect('event', 'the equation reads event');
            return;
        }
        const asked = reads.find(r => inputNames.has(r));
        if (asked !== undefined) {
            defect('input', `the equation reads the input '${asked}'`);
            return;
        }
        const shown = semantic ? reads.find(r => presentationNames.has(r)) : undefined;
        if (shown !== undefined) {
            defect('subset', `E-NODE: the semantic equation reads the presentation attribute '${shown}' (R-SIM-18).`);
            return;
        }
        compiled.push({ decl, index, expr, reads });
    });

    // The graph by name (G1): an edge from a derived name to every derived name its equations read.
    const names = [...new Set(compiled.map(c => c.decl.name))].sort();
    const edges = new Map<string, string[]>(names.map(n => [n, []]));
    for (const c of compiled) {
        const out = edges.get(c.decl.name) as string[];
        for (const r of c.reads) if (edges.has(r) && !out.includes(r)) out.push(r);
    }
    for (const out of edges.values()) out.sort();
    if (frozen) return compileOnM(compiled, edges, defects, frozen);

    const cyclic = new Set<string>();
    for (const n of names) {
        const cycle = cycleThrough(n, edges);
        if (cycle === null) continue;
        cyclic.add(n);
        for (const c of compiled) {
            if (c.decl.name === n) defects.push({ index: c.index, name: n, code: 'cycle', message: `equation cycle: ${cycle.join(' → ')}` });
        }
    }
    defects.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    // Topological by name, the smallest ready name first.
    const pending = new Map<string, string[]>();
    for (const n of names) if (!cyclic.has(n)) pending.set(n, (edges.get(n) as string[]).filter(m => m !== n && !cyclic.has(m)));
    const orderNames: string[] = [];
    while (pending.size > 0) {
        const ready = [...pending].filter(([, deps]) => deps.every(d => !pending.has(d))).map(([n]) => n);
        if (ready.length === 0) break;
        const next = ready.sort()[0];
        orderNames.push(next);
        pending.delete(next);
    }
    return { order: orderNames.flatMap(n => compiled.filter(c => c.decl.name === n)), defects };
}

/** Path B, as for guards and actions: no context at construction, so no builtins. */
const EVALUATOR = new JjelEvaluator();

type Evaluated = { readonly ok: true; readonly value: JjelValue } | { readonly ok: false; readonly why: string };

/** One expression with diagnostics, as `evaluateTriState` reads them: an exception, then an absence. */
function evaluate(expr: JjelExpression, ctx: EvaluationContext): Evaluated {
    let out: { value: JjelValue; warnings: JjelWarning[] };
    try {
        out = EVALUATOR.evaluateWithDiagnostics(expr, ctx);
    } catch (error) {
        const e: any = error;
        return { ok: false, why: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}` };
    }
    const absent = firstAbsence(out.warnings);
    if (absent) {
        return {
            ok: false,
            why: absent.suggestion
                ? `'${absent.identifier}' does not exist; maybe '${absent.suggestion}'`
                : `'${absent.identifier}' does not exist`,
        };
    }
    return { ok: true, value: out.value };
}

function isSimValue(value: JjelValue): value is SimValue {
    return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
}

interface Evaluation {
    readonly eq: CompiledEquation;
    readonly owner: string;
}

/** The derived values of `state`, in the order of `plan`, over a map built here and nowhere else. */
function evaluateDerived(
    state: SimState, plan: readonly Evaluation[], snapshot: SimSnapshot, net: Pick<CompiledNet, 'modelId' | 'places'>,
): { derived: DerivedValues; failures: DerivedFailure[] } {
    const attrs = new Map<string, Map<string, SimValue>>();
    const presentation = new Map<string, Map<string, SimValue>>();
    const derived: DerivedValues = { attrs, presentation };
    // σ with the map being built in the place of the one it came with (R-SIM-73).
    const working: SimState = { marking: state.marking, attrs: state.attrs, presentation: state.presentation, derived };
    const failures: DerivedFailure[] = [];
    for (const { eq, owner } of plan) {
        const fail = (detail: string) => failures.push({ element: owner, attr: eq.decl.name, space: eq.decl.space, detail });
        const self = owner === net.modelId ? snapshot.model : snapshot.handleById.get(owner);
        if (self === undefined) {
            fail(`${owner} has no handle in the snapshot`);
            continue;
        }
        const ctx = snapshot.base.child({ self, event: null, model: snapshot.model });
        ctx.stateAccess = toJjelStateAccess(stateAccess(working, owner), net.places);
        const out = evaluate(eq.expr, ctx);
        if (!out.ok) {
            fail(out.why);
            continue;
        }
        if (!isSimValue(out.value)) {
            fail(`the value is ${describeType(out.value)}, not a boolean, a number or a string`);
            continue;
        }
        const space = eq.decl.space === 'semantic' ? attrs : presentation;
        let values = space.get(owner);
        if (!values) {
            values = new Map();
            space.set(owner, values);
        }
        values.set(eq.decl.name, out.value);
    }
    return { derived, failures };
}

/**
 * The core's `DerivedOracle` over the snapshot of the run: the equations of
 * `compiled` on every element whose declaration they are, the first
 * declaration of a name holding there (R-SIM-71), with the places and the
 * model of the compiled net.
 */
export function makeDerivedOracle(
    snapshot: SimSnapshot, net: Pick<CompiledNet, 'modelId' | 'places' | 'declared'>, compiled: CompiledDerived,
): DerivedOracle {
    // The plan of the graph per element when there is one (R-SIM-74 as amended), else the loop by name.
    const plan: Evaluation[] = compiled.plan ? [...compiled.plan] : [];
    if (!compiled.plan) {
        for (const eq of compiled.order) {
            for (const [owner, byName] of net.declared) if (byName.get(eq.decl.name) === eq.decl) plan.push({ eq, owner });
        }
    }
    return state => evaluateDerived(state, plan, snapshot, net);
}
