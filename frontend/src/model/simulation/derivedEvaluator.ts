/**
 * derivedEvaluator — the derived state attributes, nuXmv's `DEFINE` (lane C2,
 * R-SIM-19, R-SIM-73..75).
 *
 * `compileDerived` runs once per run over the declarations: every equation is
 * parsed strictly and checked as a guard is (`checkGuardSubset`), `E-NODE`
 * only on a semantic one, since a presentation equation reads `node` as its own
 * element; `event` is a defect, a derived value being a function of σ alone; a
 * semantic equation that reads a presentation attribute, stored or derived, is
 * `E-NODE` too. The dependencies are the attribute names of the `StateAccess`
 * nodes (R-SIM-74, G1 of the report): a cycle among the names is a defect on
 * each member, with its cycle named, and the order of evaluation is
 * topological by name, ties by name. A defective equation is never evaluated.
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
import { JjelEvaluator } from '../../jjel/evaluator';
import type { EvaluationContext, JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelExpression } from '../../jjel/types/ast';
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
 * The equations of `decls`, checked, and the order they run in (R-SIM-74,
 * R-SIM-75). Only a declaration with an `equation` is looked at.
 */
export function compileDerived(decls: readonly StateAttributeDecl[]): CompiledDerived {
    const defects: DeclarationDefect[] = [];
    const presentationNames = new Set(decls.filter(d => d.space === 'presentation').map(d => d.name));
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
    const plan: Evaluation[] = [];
    for (const eq of compiled.order) {
        for (const [owner, byName] of net.declared) if (byName.get(eq.decl.name) === eq.decl) plan.push({ eq, owner });
    }
    return state => evaluateDerived(state, plan, snapshot, net);
}
