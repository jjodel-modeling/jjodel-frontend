/**
 * The CPU of the hardware demonstrator runs its program (P-2026-10-21-1145, slice S-B of
 * docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1).
 *
 * The spec hw-cpu.json carries the roles of the plan's §5.3 on the metamodel (an extended state machine, the register
 * transfers as the states' exit actions, `value` a stored word of every `Register` and `Cell`, its width the element's
 * own), the program in the ROM cells' `init` (7 × 6 by repeated addition, the product in RAM[12]), DECODE's `else` to
 * FETCH (R16) and a scenario with its `expect`. The run is the one Reset starts (`compileModelRun`, the copy of
 * simBridge.ts `startRun`) over the synthetic record of exampleFixture.ts, stepped as Play steps it: ε, the one
 * candidate, until the terminal HALT is marked. Its trace, one line per cycle in the format of the plan's §7.4, is the
 * committed hw-cpu.trace.json, the Jjodel side that S-E compares with Verilator's.
 *
 * `HW_CPU_WRITE=1` writes the trace file and the scenario's steps from this run instead of comparing them.
 * Each test name says which break kills it; the bench is in the commit body.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { makeActionOracle } from '../../../../model/simulation/actionEvaluator';
import { buildGuardContext, toJjelStateAccess } from '../../../../model/simulation/guardContext';
import { evaluateGuard } from '../../../../model/simulation/guardEvaluator';
import type { GuardOutcome } from '../../../../model/simulation/guardEvaluator';
import { candidates, step, terminated } from '../../../../model/simulation/netStep';
import type { GuardOracle, NetConfiguration, SimState } from '../../../../model/simulation/netTypes';
import type { ScenarioStep } from '../../../../model/simulation/scenarioCodec';
import { compileWatch, evaluateWatch } from '../../../../model/simulation/watchEvaluator';
import type { JjelBitVector } from '../../../../jjel/evaluator/context';
import { simulate } from '../../../oracle/oracle';
import { loadSpec, recordOf } from '../../../oracle/__tests__/exampleFixture';
import type { ExampleSpec } from '../../../oracle/__tests__/exampleFixture';
import { compileModelRun } from '../../../target/js/access';
import type { ModelRun } from '../../../target/js/access';

const SPEC_URL = new URL('../hw-cpu.json', import.meta.url);
const TRACE_URL = new URL('../hw-cpu.trace.json', import.meta.url);
const WRITE = process.env.HW_CPU_WRITE === '1';
/** simRunState.ts `MAX_PLAY_STEPS`: Play presses ε at most this many times (that module does not import in node). */
const MAX_PLAY_STEPS = 1000;

/** The trace file: the §7.4 line per cycle, cycle 0 the configuration Reset gives, and the state indices it uses. */
interface TraceFile {
    readonly format: string;
    readonly display: string;
    readonly states: readonly string[];
    readonly lines: readonly string[];
}

/** The control states in the spec's order, which gives their indices in the trace (and the Verilog `localparam`s). */
function statesOf(spec: ExampleSpec): string[] {
    const kinds = new Set(['State', 'InitialState', 'FinalState']);
    return Object.values(spec.lookup).filter((d: any) => d.className === 'DObject' && kinds.has(spec.lookup[d.instanceof].name)).map((d: any) => d.id);
}

function compile(spec: ExampleSpec): ModelRun {
    const compiled = compileModelRun(spec.lookup, spec.modelId, recordOf(spec.lookup, spec.modelId));
    if (compiled.kind !== 'ok') throw new Error(compiled.reason);
    return compiled.run;
}

/** Copy of oracle.ts `guardOracle` (itself simBridge.ts `makeGuardOracle`): a site's guards conjoined, a defect winning. */
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

interface Played {
    readonly steps: ScenarioStep[];
    readonly states: SimState[];
    readonly offered: string[][];
    /** Why Play stopped: the terminal is marked, no candidate, a choice of two or more, a step not fired, or the cap. */
    readonly end: string;
}

/** Play from Reset: ε pressed, the one candidate taken, until the terminal is marked or the run cannot go on. */
function play(run: ModelRun): Played {
    const guards = guardOracle(run);
    const actions = makeActionOracle(run.snapshot, run.net, run.actions);
    let cfg: NetConfiguration = { state: run.net.initial, event: null };
    const out: Played = { steps: [], states: [cfg.state], offered: [], end: 'cap' };
    for (let k = 0; k < MAX_PLAY_STEPS; k++) {
        if (terminated(run.net, cfg.state)) return { ...out, end: 'terminal' };
        const offered = candidates(run.net, cfg, guards).candidates.map(c => c.transition);
        out.offered.push(offered);
        if (offered.length !== 1) return { ...out, end: offered.length === 0 ? `no candidate at step ${k + 1}` : `a choice at step ${k + 1}: ${offered.join(', ')}` };
        const o = step(run.net, cfg, offered[0], guards, actions);
        if (o.kind !== 'fired') return { ...out, end: `step ${k + 1} ${o.kind}${o.kind === 'halted' ? ` ${JSON.stringify(o.reason)}` : ''}` };
        out.steps.push({ event: null, selector: offered[0], kind: 'fired' });
        out.states.push(o.next.state);
        cfg = o.next;
    }
    return out;
}

const word = (state: SimState, element: string) => state.attrs.get(element)?.get('value') as JjelBitVector;
const hex = (v: JjelBitVector) => v.bits.toString(16).padStart(Math.ceil(v.width / 4), '0');
const bin = (v: JjelBitVector) => v.bits.toString(2).padStart(v.width, '0');

/** The marked control state: one token, a single-token profile. */
function marked(state: SimState): string[] {
    return [...state.marking].filter(([, n]) => n > 0).map(([p]) => p);
}

/** The line of the plan's §7.4: `<cycle> <state> <PC> <IR> <ACC> <Z>`, as the testbench's `$display` prints it. */
function line(cycle: number, state: SimState, states: readonly string[]): string {
    const [place] = marked(state);
    return `${cycle} ${states.indexOf(place)} ${hex(word(state, 'PC'))} ${hex(word(state, 'IR'))} ${hex(word(state, 'ACC'))} ${bin(word(state, 'Z'))}`;
}

function traceOf(spec: ExampleSpec, played: Played): TraceFile {
    const states = statesOf(spec);
    return {
        format: '<cycle> <state> <PC> <IR> <ACC> <Z>',
        display: '$display("%0d %0d %h %h %h %b", cycle, state, pc, ir, acc, z)',
        states,
        lines: played.states.map((s, i) => line(i, s, states)),
    };
}

/** The spec with the scenario's steps replaced, in the file's own layout: one step a line. */
function withSteps(text: string, steps: readonly ScenarioStep[]): string {
    const body = steps.map(s => `      ${JSON.stringify(s)}`).join(',\n');
    const out = text.replace(/\n {4}"steps": \[[\s\S]*?\n {4}\],\n/, `\n    "steps": [\n${body}\n    ],\n`);
    if (out === text && steps.length > 0) throw new Error('the scenario\'s steps are not where the layout puts them');
    return out;
}

if (WRITE) {
    const spec = loadSpec('hw-cpu');
    const played = play(compile(spec));
    if (played.end !== 'terminal') throw new Error(`Play does not reach HALT: ${played.end}`);
    writeFileSync(TRACE_URL, JSON.stringify(traceOf(spec, played), null, 2).replace(/\n {4}"(\d+ [^"]*)"/g, '\n    "$1"') + '\n');
    writeFileSync(SPEC_URL, withSteps(readFileSync(SPEC_URL, 'utf8'), played.steps));
}

describe('the hw-cpu example runs its program', () => {
    const spec = loadSpec('hw-cpu');
    const committed: TraceFile = JSON.parse(readFileSync(TRACE_URL, 'utf8'));

    it('compiles at Reset with no defect, a 4-bit PC, an 8-bit IR and ACC, a 1-bit Z and 32 8-bit cells (mutant: a declaration or a role dropped)', () => {
        const run = compile(spec);
        expect(run.net.defects).toEqual([]);
        expect(run.net.declarationDefects ?? []).toEqual([]);
        expect(run.actionRoles).toBe(true);
        const width = (e: string) => run.net.widths?.get(e)?.get('value');
        expect(['PC', 'IR', 'ACC', 'Z'].map(width)).toEqual([4, 8, 8, 1]);
        const cells = Object.values(spec.lookup).filter((d: any) => d.className === 'DObject' && spec.lookup[d.instanceof].name === 'Cell').map((d: any) => d.id);
        expect(cells.length).toBe(32);
        expect(cells.every(c => width(c) === 8)).toBe(true);
        expect(marked(run.net.initial)).toEqual(['FETCH']);
    });

    it('Play runs to HALT, one candidate at every step, and stops on the terminal (mutant: the exit role, a guard or the program broken)', () => {
        const played = play(compile(spec));
        expect(played.end).toBe('terminal');
        expect(played.offered.every(o => o.length === 1)).toBe(true);
        expect(marked(played.states[played.states.length - 1])).toEqual(['HALT']);
        expect(played.steps.length).toBe(170);
    });

    it('writes the product 7 × 6 = 0x2a into RAM[12] and leaves its operands beside it (mutant: a program byte or an ALU transfer changed)', () => {
        const played = play(compile(spec));
        const last = played.states[played.states.length - 1];
        const ram = Array.from({ length: 16 }, (_, i) => hex(word(last, `ram_${i}`)));
        expect(ram).toEqual(['00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '2a', '07', '00', '01']);
        expect(Array.from({ length: 16 }, (_, i) => hex(word(last, `rom_${i}`))).every(v => v === '00')).toBe(true);
    });

    it.skipIf(WRITE)('has the committed trace, one §7.4 line per cycle from Reset to HALT (mutant: any transfer or the state order changed)', () => {
        const trace = traceOf(spec, play(compile(spec)));
        expect(committed.states).toEqual(trace.states);
        expect(committed.lines.length).toBe(171);
        expect(committed.lines[0]).toBe('0 0 0 00 00 0');
        for (let i = 0; i < trace.lines.length; i++) expect(trace.lines[i], `cycle ${i}`).toBe(committed.lines[i]);
        expect(trace.lines.length).toBe(committed.lines.length);
    });

    it.skipIf(WRITE)('stores the run as its scenario, which the oracle\'s simulator replays offering each selector alone, and its expect holds (mutant: the scenario or the expect edited)', () => {
        const run = compile(spec);
        const scenario = spec.scenario!;
        expect(scenario.steps).toEqual(play(run).steps);
        const sim = simulate(run, scenario);
        expect(sim.failure).toBeNull();
        expect(sim.trace.slice(1).every(s => s.offered?.length === 1 && s.offered[0] === s.transition)).toBe(true);
        const last = sim.trace[sim.trace.length - 1].observed!;
        expect(last.marking).toEqual({ HALT: 1 });
        const nameOf = (id: string) => String(spec.lookup[id]?.name ?? id);
        const final = play(run).states.at(-1)!;
        const reading = evaluateWatch(compileWatch({ name: 'expect', kind: 'invariant', text: scenario.expect! }, { net: run.net, snapshot: run.snapshot, nameOf }), run.snapshot, run.net, final);
        expect(reading).toEqual({ kind: 'value', value: true });
        const before = evaluateWatch(compileWatch({ name: 'expect', kind: 'invariant', text: scenario.expect! }, { net: run.net, snapshot: run.snapshot, nameOf }), run.snapshot, run.net, run.net.initial);
        expect(before).toEqual({ kind: 'value', value: false });
    });

    it('sends the six undefined opcodes back to FETCH through DECODE\'s else, as NOP (R16; mutant: the else removed)', () => {
        for (const opcode of [9, 10, 11, 12, 13, 14]) {
            const altered: ExampleSpec = JSON.parse(JSON.stringify(spec));
            altered.lookup.V_rom_0_init.values = [`0x${opcode.toString(16)}0`];
            const run = compile(altered);
            const guards = guardOracle(run);
            const actions = makeActionOracle(run.snapshot, run.net, run.actions);
            const fetched = step(run.net, { state: run.net.initial, event: null }, 'fetch_decode', guards, actions);
            if (fetched.kind !== 'fired') throw new Error(fetched.kind);
            const offered = candidates(run.net, fetched.next, guards).candidates.map(c => c.transition);
            expect(offered, `opcode ${opcode}`).toEqual(['dec_else']);
            const decoded = step(run.net, fetched.next, 'dec_else', guards, actions);
            expect(decoded.kind === 'fired' && marked(decoded.next.state)).toEqual(['FETCH']);
        }
    });
});
