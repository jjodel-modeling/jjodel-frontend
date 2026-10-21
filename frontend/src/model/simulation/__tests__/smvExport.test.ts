/**
 * The nuXmv exporter of slice S-G1 (docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1), checked
 * without nuXmv: the text of each example is compared with its golden, then read back by a small reader of the
 * emitted subset (below) and run against the simulator's core. At every configuration visited, every `DEFINE en_<t>`
 * equals the simulator's candidate set, `TRANS` admits exactly the selectors whose step fires (`none` exactly when the
 * step is a discard or a quiescence, a halt admitting none), and every `next(x)` equals the σ the step produces. The
 * turnstile's configurations are explored exhaustively; the CPU's are the 170 cycles of its committed scenario, whose
 * projection must equal the committed hw-cpu.trace.json of slice S-B.
 *
 * `SMV_WRITE=1` writes the goldens instead of comparing them.
 * Each test name says which break of the exporter kills it; the bench is in the commit body.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import type { JjelBitVector } from '../../../jjel/evaluator/context';
import { loadSpec, recordOf } from '../../../codegen/oracle/__tests__/exampleFixture';
import type { ExampleSpec } from '../../../codegen/oracle/__tests__/exampleFixture';
import { compileModelRun } from '../../../codegen/target/js/access';
import type { ModelRun } from '../../../codegen/target/js/access';
import { makeActionOracle } from '../actionEvaluator';
import { buildGuardContext, toJjelStateAccess } from '../guardContext';
import { evaluateGuard } from '../guardEvaluator';
import type { GuardOutcome } from '../guardEvaluator';
import { candidates, step } from '../netStep';
import type { ActionOracle, GuardOracle, SimState } from '../netTypes';
import type { ScenarioStep } from '../scenarioCodec';
import { exportSmv, SMV_NO_EVENT, SMV_NO_SELECTOR } from '../smvExport';
import type { SmvExportResult, SmvNames } from '../smvExport';
import type { WatchRecord } from '../watchCodec';

const WRITE = process.env.SMV_WRITE === '1';
const golden = (name: string) => new URL(`./fixtures/${name}.smv`, import.meta.url);
const TRACE_URL = new URL('../../../codegen/examples/hw-cpu/hw-cpu.trace.json', import.meta.url);

function compile(spec: ExampleSpec): ModelRun {
    const compiled = compileModelRun(spec.lookup, spec.modelId, recordOf(spec.lookup, spec.modelId));
    if (compiled.kind !== 'ok') throw new Error(compiled.reason);
    return compiled.run;
}

function exportSpec(spec: ExampleSpec, watches?: readonly WatchRecord[]): { run: ModelRun; result: SmvExportResult } {
    const run = compile(spec);
    return { run, result: exportSmv({ ...run, nameOf: id => spec.lookup[id]?.name ?? id, watches }) };
}

function ok(result: SmvExportResult): { text: string; names: SmvNames } {
    if (result.kind !== 'ok') throw new Error(`refused: ${JSON.stringify(result.defects)}`);
    return result;
}

// ── a reader of the emitted nuXmv subset: types, sections, case/esac, words ──

type V =
    | { readonly k: 'bool'; readonly v: boolean }
    | { readonly k: 'int'; readonly v: bigint }
    | { readonly k: 'word'; readonly w: number; readonly s: boolean; readonly v: bigint }
    | { readonly k: 'sym'; readonly v: string };

type SmvType =
    | { readonly k: 'bool' }
    | { readonly k: 'range'; readonly lo: bigint; readonly hi: bigint }
    | { readonly k: 'enum'; readonly values: readonly string[] }
    | { readonly k: 'word'; readonly w: number; readonly s: boolean };

interface Scope { readonly get: (name: string) => V }
type Expr = (scope: Scope) => V;

interface SmvModule {
    readonly vars: Map<string, SmvType>;
    readonly ivars: Map<string, SmvType>;
    readonly defines: Map<string, Expr>;
    readonly init: Map<string, Expr>;
    readonly next: Map<string, Expr>;
    readonly trans: Expr[];
    readonly specs: Map<string, Expr>;
    readonly constants: Set<string>;
}

const TOKEN = /\s*(0[us]d\d+_\d+|\d+|[A-Za-z_][A-Za-z0-9_]*|:=|::|\.\.|<->|->|!=|<=|>=|<<|>>|[()[\]{}:;,&|!=<>+\-*])/y;
const SECTIONS = new Set(['MODULE', 'VAR', 'IVAR', 'DEFINE', 'ASSIGN', 'TRANS', 'INVARSPEC']);
/** Left binding power and associativity; `!` binds at 11, unary `-` at 9, a bit selection tighter than all. */
const INFIX: Record<string, readonly [number, 'left' | 'right']> = {
    '->': [1, 'right'], '<->': [2, 'left'], '|': [3, 'left'], xor: [3, 'left'], xnor: [3, 'left'], '&': [4, 'left'],
    '=': [5, 'left'], '!=': [5, 'left'], '<': [5, 'left'], '<=': [5, 'left'], '>': [5, 'left'], '>=': [5, 'left'],
    '<<': [6, 'left'], '>>': [6, 'left'], '+': [7, 'left'], '-': [7, 'left'], '*': [8, 'left'], '::': [10, 'left'],
};

const mask = (w: number) => (1n << BigInt(w)) - 1n;
const word = (w: number, s: boolean, v: bigint): V => ({ k: 'word', w, s, v: v & mask(w) });
const bool = (v: boolean): V => ({ k: 'bool', v });

function fmt(x: V): string {
    if (x.k === 'bool') return x.v ? 'TRUE' : 'FALSE';
    if (x.k === 'word') return `0${x.s ? 's' : 'u'}d${x.w}_${x.v}`;
    return String(x.v);
}

function truth(x: V): boolean {
    if (x.k !== 'bool') throw new Error(`smv: a condition is ${fmt(x)}`);
    return x.v;
}

/** An integer or a word's value, signed by its type. */
function num(x: V): bigint {
    if (x.k === 'int') return x.v;
    if (x.k === 'word') return x.s ? BigInt.asIntN(x.w, x.v) : x.v;
    throw new Error(`smv: ${fmt(x)} is not a number`);
}

function sameWords(op: string, a: V, b: V): { w: number; s: boolean; a: bigint; b: bigint } {
    if (a.k !== 'word' || b.k !== 'word' || a.w !== b.w || a.s !== b.s) throw new Error(`smv: '${op}' on ${fmt(a)} and ${fmt(b)}`);
    return { w: a.w, s: a.s, a: a.v, b: b.v };
}

function equal(a: V, b: V): boolean {
    if (a.k !== b.k) throw new Error(`smv: '=' on ${fmt(a)} and ${fmt(b)}`);
    if (a.k === 'word') sameWords('=', a, b);
    return fmt(a) === fmt(b);
}

function binary(op: string, a: V, b: V): V {
    switch (op) {
        case '&': case '|': case 'xor': case 'xnor': case '->': case '<->': {
            if (a.k === 'bool' && b.k === 'bool') {
                const r = { '&': a.v && b.v, '|': a.v || b.v, xor: a.v !== b.v, xnor: a.v === b.v, '->': !a.v || b.v, '<->': a.v === b.v }[op];
                return bool(r);
            }
            const x = sameWords(op, a, b);
            if (op === '&') return word(x.w, x.s, x.a & x.b);
            if (op === '|') return word(x.w, x.s, x.a | x.b);
            if (op === 'xor') return word(x.w, x.s, x.a ^ x.b);
            throw new Error(`smv: '${op}' on words`);
        }
        case '=': return bool(equal(a, b));
        case '!=': return bool(!equal(a, b));
        case '<': case '<=': case '>': case '>=': {
            if (a.k !== b.k) throw new Error(`smv: '${op}' on ${fmt(a)} and ${fmt(b)}`);
            if (a.k === 'word') sameWords(op, a, b);
            const x = num(a), y = num(b);
            return bool(op === '<' ? x < y : op === '<=' ? x <= y : op === '>' ? x > y : x >= y);
        }
        case '+': case '-': case '*': {
            if (a.k === 'int' && b.k === 'int') return { k: 'int', v: op === '+' ? a.v + b.v : op === '-' ? a.v - b.v : a.v * b.v };
            const x = sameWords(op, a, b);
            return word(x.w, x.s, op === '+' ? x.a + x.b : op === '-' ? x.a - x.b : x.a * x.b);
        }
        case '<<': case '>>': {
            if (a.k !== 'word') throw new Error(`smv: '${op}' on ${fmt(a)}`);
            const n = num(b);
            if (op === '<<') return word(a.w, a.s, a.v << n);
            return word(a.w, a.s, a.s ? BigInt.asIntN(a.w, a.v) >> n : a.v >> n);
        }
        case '::': {
            if (a.k !== 'word' || b.k !== 'word') throw new Error(`smv: '::' on ${fmt(a)} and ${fmt(b)}`);
            return word(a.w + b.w, false, (a.v << BigInt(b.w)) | b.v);
        }
    }
    throw new Error(`smv: no operator '${op}'`);
}

const FUNCTIONS: Record<string, (args: V[]) => V> = {
    extend: ([x, k]) => {
        if (x.k !== 'word') throw new Error(`smv: extend of ${fmt(x)}`);
        const w = x.w + Number(num(k));
        return word(w, x.s, x.s ? BigInt.asUintN(w, BigInt.asIntN(x.w, x.v)) : x.v);
    },
    resize: ([x, n]) => {
        if (x.k !== 'word' || x.s) throw new Error(`smv: resize of ${fmt(x)} (only unsigned is emitted)`);
        return word(Number(num(n)), false, x.v);
    },
    signed: ([x]) => { if (x.k !== 'word') throw new Error(`smv: signed of ${fmt(x)}`); return word(x.w, true, x.v); },
    unsigned: ([x]) => { if (x.k !== 'word') throw new Error(`smv: unsigned of ${fmt(x)}`); return word(x.w, false, x.v); },
};

class Parser {
    private i = 0;
    constructor(private readonly tokens: readonly string[]) {}
    peek(k = 0): string | undefined { return this.tokens[this.i + k]; }
    take(expected?: string): string {
        const tok = this.tokens[this.i++];
        if (tok === undefined || (expected !== undefined && tok !== expected)) throw new Error(`smv: expected ${expected ?? 'a token'}, got ${tok} at token ${this.i - 1}`);
        return tok;
    }
    isName(k = 0): boolean {
        const tok = this.peek(k);
        return tok !== undefined && /^[A-Za-z_]/.test(tok) && !SECTIONS.has(tok);
    }

    expr(min = 0): Expr {
        let left = this.prefix();
        for (;;) {
            const op = this.peek();
            if (op === '[') { left = this.select(left); continue; }
            const info = op === undefined ? undefined : INFIX[op];
            if (!info || info[0] <= min) return left;
            this.take();
            const l = left, r = this.expr(info[1] === 'left' ? info[0] : info[0] - 1);
            left = s => binary(op!, l(s), r(s));
        }
    }

    private select(x: Expr): Expr {
        this.take('[');
        const hi = Number(this.take());
        this.take(':');
        const lo = Number(this.take());
        this.take(']');
        return s => {
            const v = x(s);
            if (v.k !== 'word' || hi >= v.w || lo > hi) throw new Error(`smv: [${hi}:${lo}] of ${fmt(v)}`);
            return word(hi - lo + 1, false, v.v >> BigInt(lo));
        };
    }

    private prefix(): Expr {
        const tok = this.take();
        if (tok === '(') { const e = this.expr(); this.take(')'); return e; }
        if (tok === '!') {
            const x = this.expr(11);
            return s => { const v = x(s); return v.k === 'bool' ? bool(!v.v) : v.k === 'word' ? word(v.w, v.s, ~v.v) : binary('!', v, v); };
        }
        if (tok === '-') {
            const x = this.expr(9);
            return s => { const v = x(s); return v.k === 'int' ? { k: 'int', v: -v.v } : v.k === 'word' ? word(v.w, v.s, -v.v) : binary('-', v, v); };
        }
        if (tok === 'case') {
            const arms: Array<readonly [Expr, Expr]> = [];
            while (this.peek() !== 'esac') {
                const c = this.expr();
                this.take(':');
                const v = this.expr();
                this.take(';');
                arms.push([c, v]);
            }
            this.take('esac');
            return s => {
                for (const [c, v] of arms) if (truth(c(s))) return v(s);
                throw new Error('smv: no arm of a case holds');
            };
        }
        if (tok === 'TRUE' || tok === 'FALSE') { const v = bool(tok === 'TRUE'); return () => v; }
        if (/^\d+$/.test(tok)) { const v: V = { k: 'int', v: BigInt(tok) }; return () => v; }
        const w = /^0([us])d(\d+)_(\d+)$/.exec(tok);
        if (w) {
            const v = word(Number(w[2]), w[1] === 's', BigInt(w[3]));
            if (v.v !== BigInt(w[3])) throw new Error(`smv: ${tok} does not fit`);
            return () => v;
        }
        const fn = FUNCTIONS[tok];
        if (fn && this.peek() === '(') {
            this.take('(');
            const args: Expr[] = [this.expr()];
            while (this.peek() === ',') { this.take(','); args.push(this.expr()); }
            this.take(')');
            return s => fn(args.map(a => a(s)));
        }
        if (/^[A-Za-z_]/.test(tok)) return s => s.get(tok);
        throw new Error(`smv: unexpected '${tok}'`);
    }

    type(): SmvType {
        const tok = this.take();
        if (tok === 'boolean') return { k: 'bool' };
        if (tok === '{') {
            const values: string[] = [this.take()];
            while (this.peek() === ',') { this.take(','); values.push(this.take()); }
            this.take('}');
            return { k: 'enum', values };
        }
        if (tok === 'unsigned' || tok === 'signed') {
            this.take('word');
            this.take('[');
            const w = Number(this.take());
            this.take(']');
            return { k: 'word', w, s: tok === 'signed' };
        }
        const lo = tok === '-' ? -BigInt(this.take()) : BigInt(tok);
        this.take('..');
        const hi = this.peek() === '-' ? (this.take(), -BigInt(this.take())) : BigInt(this.take());
        return { k: 'range', lo, hi };
    }
}

function tokenize(text: string): string[] {
    const src = text.replace(/--[^\n]*/g, '').trimEnd();
    const out: string[] = [];
    TOKEN.lastIndex = 0;
    while (TOKEN.lastIndex < src.length) {
        const at = TOKEN.lastIndex;
        const m = TOKEN.exec(src);
        if (!m) throw new Error(`smv: cannot read '${src.slice(at, at + 20)}'`);
        out.push(m[1]);
    }
    return out;
}

function parseModule(text: string): SmvModule {
    const p = new Parser(tokenize(text));
    const m: SmvModule = {
        vars: new Map(), ivars: new Map(), defines: new Map(), init: new Map(), next: new Map(), trans: [], specs: new Map(), constants: new Set(),
    };
    const fresh = (name: string) => {
        if (m.vars.has(name) || m.ivars.has(name) || m.defines.has(name)) throw new Error(`smv: ${name} declared twice`);
        return name;
    };
    p.take('MODULE');
    p.take('main');
    while (p.peek() !== undefined) {
        const section = p.take();
        if (section === 'VAR' || section === 'IVAR') {
            while (p.isName() && p.peek(1) === ':') {
                const name = fresh(p.take());
                p.take(':');
                const type = p.type();
                p.take(';');
                (section === 'VAR' ? m.vars : m.ivars).set(name, type);
                if (type.k === 'enum') for (const c of type.values) m.constants.add(c);
            }
        } else if (section === 'DEFINE') {
            while (p.isName() && p.peek(1) === ':=') {
                const name = fresh(p.take());
                p.take(':=');
                m.defines.set(name, p.expr());
                p.take(';');
            }
        } else if (section === 'ASSIGN') {
            while (p.peek() === 'init' || p.peek() === 'next') {
                const which = p.take();
                p.take('(');
                const name = p.take();
                p.take(')');
                p.take(':=');
                const target = which === 'init' ? m.init : m.next;
                if (!m.vars.has(name) || target.has(name)) throw new Error(`smv: ${which}(${name}) of no VAR or twice`);
                target.set(name, p.expr());
                p.take(';');
            }
        } else if (section === 'TRANS') {
            m.trans.push(p.expr());
            if (p.peek() === ';') p.take(';');
        } else if (section === 'INVARSPEC') {
            p.take('NAME');
            const name = p.take();
            p.take(':=');
            m.specs.set(name, p.expr());
            p.take(';');
        } else {
            throw new Error(`smv: no section ${section}`);
        }
    }
    for (const name of m.vars.keys()) if (!m.init.has(name) || !m.next.has(name)) throw new Error(`smv: ${name} lacks init or next`);
    return m;
}

function scope(m: SmvModule, vars: ReadonlyMap<string, V>, ivars: ReadonlyMap<string, V>): Scope {
    const memo = new Map<string, V>();
    const s: Scope = {
        get: name => {
            const v = vars.get(name) ?? ivars.get(name);
            if (v) return v;
            if (m.vars.has(name) || m.ivars.has(name)) throw new Error(`smv: ${name} has no value here`);
            const d = m.defines.get(name);
            if (d) {
                let x = memo.get(name);
                if (x === undefined) { x = d(s); memo.set(name, x); }
                return x;
            }
            if (m.constants.has(name)) return { k: 'sym', v: name };
            throw new Error(`smv: no identifier ${name}`);
        },
    };
    return s;
}

/** nuXmv stops on a value outside a VAR's type: the reader does too. */
function fits(type: SmvType, x: V): boolean {
    if (type.k === 'bool') return x.k === 'bool';
    if (type.k === 'range') return x.k === 'int' && x.v >= type.lo && x.v <= type.hi;
    if (type.k === 'enum') return x.k === 'sym' && type.values.includes(x.v);
    return x.k === 'word' && x.w === type.w && x.s === type.s;
}

type SmvState = ReadonlyMap<string, V>;

function assign(m: SmvModule, exprs: ReadonlyMap<string, Expr>, s: Scope): SmvState {
    const out = new Map<string, V>();
    for (const [name, type] of m.vars) {
        const v = exprs.get(name)!(s);
        if (!fits(type, v)) throw new Error(`smv: ${name} := ${fmt(v)} is outside its type`);
        out.set(name, v);
    }
    return out;
}

const smvInit = (m: SmvModule): SmvState => assign(m, m.init, scope(m, new Map(), new Map()));
const smvNext = (m: SmvModule, state: SmvState, inputs: SmvState): SmvState => assign(m, m.next, scope(m, state, inputs));
const smvTrans = (m: SmvModule, state: SmvState, inputs: SmvState): boolean => m.trans.every(t => truth(t(scope(m, state, inputs))));
const show = (m: SmvModule, state: SmvState): string => [...m.vars.keys()].map(n => `${n}=${fmt(state.get(n)!)}`).join(' ');

// ── the simulator's side ──

/** Copy of oracle.ts `guardOracle` (simBridge.ts `makeGuardOracle`): a site's guards conjoined, a defect winning. */
function guardOracle(run: ModelRun): GuardOracle {
    return (site, event, state) => {
        const list = run.guards.get(site) ?? [];
        if (list.length === 0) return { kind: 'true' };
        const ctx = buildGuardContext(run.snapshot, { transitionId: site }, { event }, toJjelStateAccess(state, run.net.places));
        let result: GuardOutcome = { kind: 'true' };
        for (const g of list) {
            const outcome = evaluateGuard(g, ctx);
            if (outcome.kind === 'defect') return outcome;
            if (outcome.kind === 'false') result = outcome;
        }
        return result;
    };
}

function simValue(x: unknown): V {
    if (typeof x === 'boolean') return bool(x);
    if (typeof x === 'number' && Number.isInteger(x)) return { k: 'int', v: BigInt(x) };
    if (typeof x === 'object' && x !== null && (x as JjelBitVector).__type === 'BitVector') {
        const b = x as JjelBitVector;
        return word(b.width, b.signed, b.bits);
    }
    throw new Error(`no nuXmv value for ${String(x)}`);
}

interface Case {
    readonly run: ModelRun;
    readonly m: SmvModule;
    readonly names: SmvNames;
    readonly guards: GuardOracle;
    readonly actions: ActionOracle;
    readonly placeConst: ReadonlyMap<string, string>;
    /** Each selector, `null` for none, to its constant of `sel`. */
    readonly selConst: ReadonlyMap<string | null, string>;
    readonly eventConst: ReadonlyMap<string | null, string>;
    /** How many derived values were compared with their `DEFINE`. */
    derivedCompared: number;
}

const invert = (m: ReadonlyMap<string, string>) => new Map([...m].map(([k, v]) => [v, k]));

function caseOf(spec: ExampleSpec, watches?: readonly WatchRecord[]): Case {
    const { run, result } = exportSpec(spec, watches);
    const { text, names } = ok(result);
    expect([...names.attributes.values()].filter(a => a.role === 'input')).toEqual([]);
    return {
        run, names, m: parseModule(text),
        guards: guardOracle(run),
        actions: makeActionOracle(run.snapshot, run.net, run.actions),
        placeConst: invert(names.states),
        selConst: new Map<string | null, string>([[null, SMV_NO_SELECTOR], ...invert(names.transitions)]),
        eventConst: new Map<string | null, string>([[null, SMV_NO_EVENT], ...invert(names.events)]),
        derivedCompared: 0,
    };
}

function fromSim(c: Case, state: SimState): SmvState {
    const out = new Map<string, V>();
    for (const name of c.m.vars.keys()) {
        if (name === 'state') {
            const marked = [...state.marking].filter(([, n]) => n > 0).map(([p]) => p);
            expect(marked).toHaveLength(1);
            out.set(name, { k: 'sym', v: c.placeConst.get(marked[0])! });
            continue;
        }
        const a = c.names.attributes.get(name);
        if (!a) throw new Error(`no attribute behind ${name}`);
        out.set(name, simValue(state.attrs.get(a.element)?.get(a.attr)));
    }
    return out;
}

function inputsOf(c: Case, event: string | null, selector: string | null): SmvState {
    const out = new Map<string, V>([['sel', { k: 'sym', v: c.selConst.get(selector)! }]]);
    if (c.m.ivars.has('event')) out.set('event', { k: 'sym', v: c.eventConst.get(event)! });
    return out;
}

/**
 * One configuration, both sides: the `en_<t>` against the candidate set, `TRANS` and `next` against the step of
 * every selector. The σ the fired selectors produce, by selector.
 */
function checkConfiguration(c: Case, state: SimState, event: string | null): Map<string | null, SimState> {
    const smv = fromSim(c, state);
    const where = `${show(c.m, smv)} event=${event}`;
    const offered = new Set(candidates(c.run.net, { state, event }, c.guards).candidates.map(x => x.transition));
    const before = scope(c.m, smv, inputsOf(c, event, null));
    for (const [t, k] of c.selConst) {
        if (t !== null) expect(truth(before.get(`en_${k}`)), `en_${k} at ${where}`).toBe(offered.has(t));
    }
    for (const [name, a] of c.names.attributes) {
        const value = state.derived?.attrs.get(a.element)?.get(a.attr);
        if (a.role !== 'derived' || value === undefined) continue;
        expect(fmt(before.get(name)), `${name} at ${where}`).toBe(fmt(simValue(value)));
        c.derivedCompared++;
    }
    const fired = new Map<string | null, SimState>();
    for (const [selector, k] of c.selConst) {
        const inputs = inputsOf(c, event, selector);
        const o = step(c.run.net, { state, event }, selector, c.guards, c.actions, c.run.derived);
        const admitted = o.kind !== 'inadmissible' && o.kind !== 'halted';
        expect(smvTrans(c.m, smv, inputs), `TRANS sel=${k} (${o.kind}) at ${where}`).toBe(admitted);
        if (o.kind === 'inadmissible' || o.kind === 'halted') continue;
        expect(show(c.m, smvNext(c.m, smv, inputs)), `next with sel=${k} at ${where}`).toBe(show(c.m, fromSim(c, o.next.state)));
        fired.set(selector, o.next.state);
    }
    return fired;
}

/** The scenario run by the text alone, from `init`, checked step by step against the simulator; the text's states. */
function replay(c: Case, steps: readonly ScenarioStep[]): SmvState[] {
    let smv = smvInit(c.m);
    let state = c.run.net.initial;
    expect(show(c.m, smv)).toBe(show(c.m, fromSim(c, state)));
    const out = [smv];
    for (const [i, s] of steps.entries()) {
        const fired = checkConfiguration(c, state, s.event);
        const inputs = inputsOf(c, s.event, s.selector);
        expect(smvTrans(c.m, smv, inputs), `TRANS at step ${i + 1}`).toBe(true);
        smv = smvNext(c.m, smv, inputs);
        const o = step(c.run.net, { state, event: s.event }, s.selector, c.guards, c.actions, c.run.derived);
        expect(o.kind, `step ${i + 1}`).toBe(s.kind);
        if (o.kind === 'inadmissible') throw new Error(`step ${i + 1} inadmissible`);
        state = o.next.state;
        expect(fired.has(s.selector), `step ${i + 1} admitted`).toBe(true);
        expect(show(c.m, smv), `σ after step ${i + 1}`).toBe(show(c.m, fromSim(c, state)));
        out.push(smv);
    }
    return out;
}

/** Every configuration reachable from Reset under every event, each checked; the σ reached, by their text. */
function explore(c: Case, limit: number): Map<string, SimState> {
    const events = [...c.eventConst.keys()];
    const seen = new Map<string, SimState>();
    const queue = [c.run.net.initial];
    while (queue.length > 0) {
        const state = queue.shift()!;
        const key = show(c.m, fromSim(c, state));
        if (seen.has(key)) continue;
        seen.set(key, state);
        if (seen.size > limit) throw new Error(`more than ${limit} configurations`);
        for (const e of events) queue.push(...checkConfiguration(c, state, e).values());
    }
    return seen;
}

// ── the tests ──

describe('smvExport goldens', () => {
    for (const name of ['turnstile', 'hw-cpu'] as const) {
        it(`${name}: the text equals the golden (dies with any change of the text)`, () => {
            const { text } = ok(exportSpec(loadSpec(name)).result);
            if (WRITE) writeFileSync(golden(name), text);
            expect(text).toBe(readFileSync(golden(name), 'utf8'));
        });
    }
});

describe('smvExport round trip by the simulator', () => {
    it('turnstile: every reachable configuration agrees (dies with the frame arm, the ok_ guard, the derived DEFINE)', () => {
        const c = caseOf(loadSpec('turnstile'));
        const reached = explore(c, 200);
        // locked, unlocked and off, coins 0..3 where reachable: coin three times reaches 3, a fourth coin halts.
        expect([...reached.keys()].some(k => k.includes('model_coins=3'))).toBe(true);
        expect(reached.size).toBeGreaterThanOrEqual(8);
        expect(c.derivedCompared).toBeGreaterThan(0);
    });

    it('turnstile: the scenario run by the text alone ends where the simulator ends (dies with the frame arm)', () => {
        const spec = loadSpec('turnstile');
        const c = caseOf(spec);
        const states = replay(c, spec.scenario!.steps);
        expect(fmt(states[states.length - 1].get('model_coins')!)).toBe('1');
        expect(fmt(states[states.length - 1].get('state')!)).toBe('off');
    });

    it('hw-cpu: the 170 cycles agree and project to the committed trace (dies with the else negation and the cell unrolling)', () => {
        const spec = loadSpec('hw-cpu');
        const c = caseOf(spec);
        const states = replay(c, spec.scenario!.steps);
        const trace = JSON.parse(readFileSync(TRACE_URL, 'utf8')) as { states: string[]; lines: string[] };
        const varOf = (element: string) => [...c.names.attributes].find(([, a]) => a.element === element && a.attr === 'value')![0];
        const pad = (x: V, radix: number, digits: (w: number) => number) => {
            if (x.k !== 'word') throw new Error(`${fmt(x)} is not a word`);
            return x.v.toString(radix).padStart(digits(x.w), '0');
        };
        const hex = (x: V) => pad(x, 16, w => Math.ceil(w / 4));
        const lines = states.map((s, i) => {
            const place = c.names.states.get((s.get('state') as { v: string }).v)!;
            return `${i} ${trace.states.indexOf(place)} ${hex(s.get(varOf('PC'))!)} ${hex(s.get(varOf('IR'))!)} ${hex(s.get(varOf('ACC'))!)} ${pad(s.get(varOf('Z'))!, 2, w => w)}`;
        });
        expect(lines).toEqual(trace.lines);
        expect(truth(scope(c.m, states[states.length - 1], inputsOf(c, null, null)).get('final'))).toBe(true);
    });
});

describe('smvExport watches', () => {
    it('an invariant as it is, a breakpoint negated, on every reachable configuration (dies with the negation dropped)', () => {
        const watches: WatchRecord[] = [
            { name: 'coins_in_range', kind: 'invariant', text: 'model.[coins] <= 3' },
            { name: 'two_coins', kind: 'breakpoint', text: 'model.[coins] == 2' },
        ];
        const c = caseOf(loadSpec('turnstile'), watches);
        expect([...c.m.specs.keys()]).toEqual(['coins_in_range', 'two_coins']);
        const modelId = loadSpec('turnstile').modelId;
        for (const state of explore(c, 200).values()) {
            const s = scope(c.m, fromSim(c, state), new Map());
            const coins = state.attrs.get(modelId)?.get('coins');
            expect(truth(c.m.specs.get('coins_in_range')!(s))).toBe(true);
            expect(truth(c.m.specs.get('two_coins')!(s))).toBe(coins !== 2);
        }
    });
});

describe('smvExport refusals', () => {
    /** The spec with one stored text replaced; the text must occur once. */
    function withText(spec: ExampleSpec, from: string, to: string): ExampleSpec {
        const hits = Object.values(spec.lookup).filter((d: any) => Array.isArray(d.values) && d.values.includes(from));
        expect(hits).toHaveLength(1);
        const d = hits[0] as { values: unknown[] };
        d.values = d.values.map(v => (v === from ? to : v));
        return spec;
    }
    const ADD = 'ACC.[value] := ACC.[value] + ram.cells.filter(c => c.addr == IR.[value].slice(3, 0).toNumber()).first.[value]';

    it('a Petri net is refused, every defect naming what it is about', () => {
        const { result } = exportSpec(loadSpec('petri-producer-consumer'));
        if (result.kind !== 'refused') throw new Error('exported');
        expect(result.defects.length).toBeGreaterThan(0);
        for (const d of result.defects) expect(d.message).not.toBe('');
    });

    it("'/' is refused, naming the element of its site", () => {
        const { result } = exportSpec(withText(loadSpec('hw-cpu'), ADD, ADD.replace('ACC.[value] + ram', 'ACC.[value] / ram')));
        if (result.kind !== 'refused') throw new Error('exported');
        expect(result.defects.map(d => d.message).join('\n')).toMatch(/'\/' has no nuXmv translation/);
        expect(result.defects.every(d => d.element !== null)).toBe(true);
    });

    it('toNumber outside the key of the memory idiom is refused', () => {
        const { result } = exportSpec(withText(loadSpec('hw-cpu'), ADD, 'ACC.[value] := ACC.[value] + bits(8, PC.[value].toNumber())'));
        if (result.kind !== 'refused') throw new Error('exported');
        expect(result.defects.map(d => d.message).join('\n')).toMatch(/toNumber outside the key of the memory idiom/);
    });
});
