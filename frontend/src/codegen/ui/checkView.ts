/**
 * checkView — the oracle's result as the code panel shows it under «Check» (slice S7b, P-2026-10-11-1053; R-GEN-11,
 * spec §8).
 *
 * One result, three shapes. A pass is one line, the scenario's step count and name. A divergence names its step (0 is
 * the initial state), the transition the simulator fired there, and what differs: the two step kinds, or every
 * place and attribute whose value differs at that step, read from the two traces (the verdict names only the first),
 * each with the simulator's value as expected and the program's as actual, at most `CHECK_MAX_LINES` of them and the
 * rest counted; and the transition to link, with the line of its generated text, when the result carries an origin.
 * A failure is why no comparison was made, with the line of the generated text for a run that did not finish.
 *
 * Names come from the caller (`nameOf`), so the module reads no store. Pure: types only.
 */

import type { Divergence, OracleResult, TraceStep } from '../oracle/oracle';
import type { ScenarioRecord } from '../../model/simulation/scenarioCodec';

/** The differing values a divergence lists at most; the rest are counted. */
export const CHECK_MAX_LINES = 5;

/** What a divergence links to: the transition, and the line of the generated text whose origin it is. */
export interface CheckLink {
    readonly elementId: string;
    readonly line: number;
}

export type CheckView =
    | { readonly status: 'pass'; readonly steps: number; readonly scenario: string; readonly text: string }
    | {
        readonly status: 'divergence';
        readonly kind: Divergence;
        readonly step: number;
        readonly transitionId: string | null;
        readonly transition: string | null;
        readonly text: string;
        readonly lines: readonly string[];
        readonly more: number;
        readonly link: CheckLink | null;
    }
    | {
        readonly status: 'failure';
        readonly kind: 'model' | 'scenario' | 'run';
        readonly step: number;
        readonly text: string;
        readonly message: string;
        readonly line: number | null;
    };

type Failed = Extract<OracleResult, { readonly kind: 'model' | 'scenario' | 'run' }>;
type Diverged = Extract<OracleResult, { readonly kind: Divergence }>;

const isFailed = (r: OracleResult): r is Failed => {
    const kind = (r as { readonly kind?: string }).kind;
    return kind === 'model' || kind === 'scenario' || kind === 'run';
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

interface Leaf {
    readonly keys: readonly string[];
    readonly expected: unknown;
    readonly actual: unknown;
}

/** Every leaf where `a` and `b` differ, keys in sorted order at every level, as the oracle walks them; absent is undefined. */
function differences(a: unknown, b: unknown, keys: readonly string[] = []): Leaf[] {
    const objectA = isPlainObject(a) || a === undefined;
    const objectB = isPlainObject(b) || b === undefined;
    if ((isPlainObject(a) || isPlainObject(b)) && objectA && objectB) {
        const ra = (a ?? {}) as Record<string, unknown>;
        const rb = (b ?? {}) as Record<string, unknown>;
        const all = [...new Set([...Object.keys(ra), ...Object.keys(rb)])].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
        const own = (r: Record<string, unknown>, k: string) => (Object.prototype.hasOwnProperty.call(r, k) ? r[k] : undefined);
        return all.flatMap(k => differences(own(ra, k), own(rb, k), [...keys, k]));
    }
    if (Object.is(a, b) || (a !== undefined && b !== undefined && JSON.stringify(a) === JSON.stringify(b))) return [];
    return [{ keys, expected: a, actual: b }];
}

/** A value for a reader: a text quoted, a place's absent count 0, any other absent value `none`. */
function valueText(v: unknown, place: boolean): string {
    if (v === undefined || v === null) return place ? '0' : 'none';
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v) ?? String(v);
}

/** One differing value: `place <name>`, `<element>.<attr>`, `<element>.<attr> (derived)`, else the path. */
function leafLine(leaf: Leaf, nameOf: (id: string) => string): string {
    const [space, element, attr] = leaf.keys;
    const place = space === 'marking' && leaf.keys.length === 2;
    const what = place
        ? `place ${nameOf(element)}`
        : (space === 'attrs' || space === 'derived') && leaf.keys.length === 3
            ? `${nameOf(element)}.${attr}${space === 'derived' ? ' (derived)' : ''}`
            : leaf.keys.join('.');
    return `${what}: expected ${valueText(leaf.expected, place)}, actual ${valueText(leaf.actual, place)}`;
}

const stepText = (n: number) => `${n} step${n === 1 ? '' : 's'}`;

/** The view of one oracle result over `scenario`; `nameOf` names an element by id. */
export function checkView(result: OracleResult, scenario: ScenarioRecord, nameOf: (id: string) => string): CheckView {
    if (result.ok) {
        const steps = scenario.steps.length;
        return { status: 'pass', steps, scenario: scenario.name, text: `Agrees with the simulator on ${stepText(steps)} · ${scenario.name}` };
    }
    if (isFailed(result)) {
        const failure = result;
        const text = failure.kind === 'model'
            ? 'The model cannot be simulated'
            : failure.kind === 'scenario' ? `The simulator does not replay ${scenario.name}` : 'The program did not run';
        return { status: 'failure', kind: failure.kind, step: failure.step, text, message: failure.message, line: failure.line ?? null };
    }
    const d = result as Diverged;
    const transitionId = d.transitionId ?? null;
    const transition = transitionId === null ? null : nameOf(transitionId);
    const text = `Diverges at step ${d.step}${d.step === 0 ? ', the initial state' : ''}${transition === null ? '' : ` · ${transition}`}`;
    let all: string[];
    switch (d.kind) {
        case 'kind': {
            const reason = (d.gen[d.step] as TraceStep | undefined)?.reason;
            all = [`step kind: expected ${String(d.expected)}, actual ${String(d.actual)}`, ...(reason !== undefined ? [`the program: ${reason}`] : [])];
            break;
        }
        case 'observe': {
            const leaves = differences(d.sim[d.step]?.observed, d.gen[d.step]?.observed);
            all = (leaves.length > 0 ? leaves : [{ keys: (d.path ?? '').split('.'), expected: d.expected, actual: d.actual }]).map(l => leafLine(l, nameOf));
            break;
        }
        case 'error':
            all = [`the program threw: ${String(d.actual)}`];
            break;
        case 'length':
            all = [d.actual === null ? `the program's trace stops before step ${d.step}` : `the program's trace goes on: ${String(d.actual)} at step ${d.step}`];
            break;
    }
    const origin = d.origin;
    const link = origin && transitionId !== null
        ? { elementId: origin.origin.kind === 'model' ? origin.origin.elementId : transitionId, line: origin.line }
        : null;
    return {
        status: 'divergence', kind: d.kind, step: d.step, transitionId, transition, text,
        lines: all.slice(0, CHECK_MAX_LINES), more: Math.max(0, all.length - CHECK_MAX_LINES), link,
    };
}
