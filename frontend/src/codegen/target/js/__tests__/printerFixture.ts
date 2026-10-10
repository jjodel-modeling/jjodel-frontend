/**
 * The fixture of the printer tests: a frozen M shaped like `buildEvalContext`'s
 * output (as in the simulator's guard and action tests), its declarations, σ,
 * and the two sides of every comparison: the JjEL evaluator on the simulator's
 * guard context, and the printed JavaScript executed with `new Function`.
 *
 * Not a test file: imported by `printer.test.ts` and `printer.differential.test.ts`.
 */

import { JjelEvaluator } from '../../../../jjel/evaluator';
import type { JjelValue } from '../../../../jjel/evaluator';
import type { JjelExpression } from '../../../../jjel/types/ast';
import { buildGuardContext, freezeSnapshot, toJjelStateAccess } from '../../../../model/simulation/guardContext';
import type { SimSnapshot } from '../../../../model/simulation/guardContext';
import { stateAccess } from '../../../../model/simulation/netStep';
import type { CompiledNet, SimState, SimValue, StateAttributeDecl } from '../../../../model/simulation/netTypes';
import { JS_RUNTIME } from '../printer';
import type { JsPrintContext, JsState } from '../printer';

export const MODEL = { id: 'M', name: 'machine' };

function shell(name: string): any {
    return { __type: 'Class', className: 'DClass', name, superTypes: [], subTypes: [], instances: [], allInstances: [], instanceCount: 0 };
}

/**
 * Two places P and Q, two transitions T1 and T2, two children of T1, an event
 * `go`. T1 carries a number, a decimal, a string, a null reference, a
 * collection, a reference to Q and its children; T2 requires P.
 */
export function makeGlobals(): Record<string, any> {
    const Place = shell('Place');
    const Transition = shell('Transition');
    const Child = shell('Child');
    const Event = shell('Event');
    const P: any = { id: 'P', __type: 'Object', name: 'P', instanceOf: Place };
    const Q: any = { id: 'Q', __type: 'Object', name: 'Q', instanceOf: Place };
    const c1: any = { id: 'c1', __type: 'Object', name: 'c1', instanceOf: Child, weight: 1 };
    const c2: any = { id: 'c2', __type: 'Object', name: 'c2', instanceOf: Child, weight: 3 };
    const t1: any = {
        id: 't1', __type: 'Object', name: 'T1', instanceOf: Transition, count: 2, ratio: 2.5, label: 'go',
        requires: null, items: [P, Q], next: Q, children: [c1, c2],
    };
    const t2: any = { id: 't2', __type: 'Object', name: 'T2', instanceOf: Transition, count: 5, requires: P, children: [] };
    const go: any = { id: 'go', __type: 'Object', name: 'go', instanceOf: Event };
    Place.instances = [P, Q];
    Transition.instances = [t1, t2];
    Child.instances = [c1, c2];
    Event.instances = [go];
    return {
        classes: [Place, Transition, Child, Event],
        instances: [P, Q, c1, c2, t1, t2, go],
        Place, Transition, Child, Event,
        P, Q, c1, c2, T1: t1, T2: t2, go,
    };
}

export function makeSnapshot(): SimSnapshot {
    return freezeSnapshot(makeGlobals(), MODEL);
}

export const PLACES: ReadonlySet<string> = new Set(['P', 'Q']);

const semantic = (name: string): StateAttributeDecl =>
    ({ name, metaclass: null, space: 'semantic', domain: { kind: 'range', min: -9, max: 9 }, initial: 0 });
const presentation = (name: string): StateAttributeDecl =>
    ({ name, metaclass: null, space: 'presentation', domain: null, initial: 'red' });

/** The declarations by element, as `compileNet` indexes them. */
export const DECLARED: CompiledNet['declared'] = new Map([
    ['M', new Map([['a', semantic('a')], ['b', semantic('b')], ['f', semantic('f')], ['s', semantic('s')], ['e', semantic('e')]])],
    ['t1', new Map([['n', semantic('n')], ['color', presentation('color')]])],
    ['Q', new Map([['n', semantic('n')]])],
    ['c1', new Map([['k', semantic('k')]])],
    ['c2', new Map([['k', semantic('k')]])],
]);

export function ctxFor(site = 't1', snapshot: SimSnapshot = makeSnapshot()): JsPrintContext {
    return { snapshot, site, places: PLACES, declared: DECLARED };
}

/** σ from plain records; `derived` lands in `derived.attrs`. */
export function sigma(
    marking: Record<string, number>,
    attrs: Record<string, Record<string, SimValue | null>>,
    derived: Record<string, Record<string, SimValue>> = {},
): SimState {
    const toMap = (r: Record<string, Record<string, any>>) => new Map(Object.entries(r).map(([k, v]) => [k, new Map(Object.entries(v))]));
    return {
        marking: new Map(Object.entries(marking)),
        attrs: toMap(attrs) as SimState['attrs'],
        presentation: new Map([['t1', new Map([['color', 'red']])]]),
        derived: { attrs: toMap(derived) as SimState['attrs'], presentation: new Map() },
    };
}

/** The default σ of the hand-written tests. */
export const SIGMA: SimState = sigma(
    { P: 1, Q: 0 },
    { M: { a: 2, b: 0, f: true, s: 'x', e: 'RED' }, t1: { n: 1 }, Q: { n: 0 }, c1: { k: 1 }, c2: { k: 2 } },
    { t2: { d: 7 } },
);

/** What one side produced: a value, or a throw. */
export type Outcome = { readonly kind: 'value'; readonly value: unknown } | { readonly kind: 'throw'; readonly message: string };

/** A value in a form both sides share: an element is `{ $el: id }`, on either side. */
export function canon(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(canon);
    if (v !== null && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (typeof o.$id === 'string') return { $el: o.$id };
        if (typeof o.id === 'string') return { $el: o.id };
        return { $object: Object.keys(o).sort() };
    }
    return v;
}

const EVALUATOR = new JjelEvaluator();

/**
 * The JjEL side: the simulator's guard context (`buildGuardContext` with σ read
 * through `toJjelStateAccess(stateAccess(σ, site))`), evaluated with
 * diagnostics. An absence is reported as such: a printed guard never has one.
 */
export function evaluateJjel(expr: JjelExpression, state: SimState, event: string | null, site = 't1', snapshot = makeSnapshot()): Outcome & { absent?: string } {
    const ctx = buildGuardContext(snapshot, { transitionId: site }, { event }, toJjelStateAccess(stateAccess(state, site), PLACES));
    if (ctx === null) throw new Error('fixture: no handle');
    try {
        const out = EVALUATOR.evaluateWithDiagnostics(expr, ctx);
        const absent = out.warnings.find(w => w.kind === 'undefined-identifier' || w.kind === 'property-not-found');
        return { kind: 'value', value: canon(out.value as JjelValue), ...(absent ? { absent: absent.identifier } : {}) };
    } catch (e: any) {
        return { kind: 'throw', message: String(e?.message ?? e) };
    }
}

type Printed = (s: JsState, e: string | null) => unknown;

/** One compilation per printed text: the runtime is long and the differential test runs a text on many σ. */
const COMPILED = new Map<string, Printed>();

/** The printed side of a guard: the runtime, then the expression, run in strict code as in a module. */
export function runPrintedGuard(code: string, state: JsState, event: string | null): Outcome {
    let fn = COMPILED.get(code);
    if (fn === undefined) {
        try {
            // eslint-disable-next-line no-new-func
            fn = new Function('state', 'event', `'use strict';\n${JS_RUNTIME}\nreturn (${code});`) as Printed;
        } catch (e: any) {
            throw new Error(`the printed guard does not compile: ${e?.message}\n${code}`);
        }
        COMPILED.set(code, fn);
    }
    try {
        return { kind: 'value', value: canon(fn(state, event)) };
    } catch (e: any) {
        return { kind: 'throw', message: String(e?.message ?? e) };
    }
}

/** The printed side of a list of actions: a function body that returns the next state. */
export function runPrintedActions(code: string, state: JsState, event: string | null): Outcome {
    let fn: (s: JsState, e: string | null) => unknown;
    try {
        // eslint-disable-next-line no-new-func
        fn = new Function('state', 'event', `'use strict';\n${JS_RUNTIME}\n${code}`) as any;
    } catch (e: any) {
        throw new Error(`the printed actions do not compile: ${e?.message}\n${code}`);
    }
    try {
        return { kind: 'value', value: fn(state, event) };
    } catch (e: any) {
        return { kind: 'throw', message: String(e?.message ?? e) };
    }
}

