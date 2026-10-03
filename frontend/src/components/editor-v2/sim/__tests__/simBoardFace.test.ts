/**
 * simBoardFace — what each device of the I/O board shows, from the run, the step
 * shown and the resolution of its binding, and what a press from the board sends
 * (R-SIM-110..114, R-SIM-119..121; P-2026-10-03-2000, Lane 2 of
 * docs/discovery/discovery_2026-10-03_sim_io_board.md §8).
 *
 * The turnstile of the demo's §2.3 under Extended state machine, shaped as the store
 * keeps it (simBridge.test.ts): `coins` (0..3) and `paid` (a DEFINE) in the model's
 * own bag (R-SIM-94), and two inputs, `power` and `speed`, that only `stop`'s guard
 * reads, so a press can ask none, one or both. The run is started by the bridge with
 * a synthetic record of `buildEvalContext` and pressed through `pressInput`, as the
 * panel presses it; the view's maps are built as the panel's memo builds them. Each
 * test name says which break of the rule kills it; the bench is in the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    deviceFace, deviceName, heldInputs, NO_HELD, planPress, SEVEN_MAX, SEVEN_MIN,
} from '../simBoardFace';
import type { BoardHeld, BoardInputsView, BoardScene, DeviceFace } from '../simBoardFace';
import { boardContextOf, boardContextOfRun } from '../simBoard';
import type { BoardContext } from '../simBoard';
import {
    inputAsks, inputLabel, inputOffTitle, inputPressTitle, inputReason, panelInputs, pressInput, runStatus, startRun,
} from '../simBridge';
import type { ContextBuilder } from '../simBridge';
import { __resetSimRunsForTests, getSimRun, simReset } from '../simRunState';
import type { SimRun } from '../simRunState';
import { structuralInputs } from '../../../../model/simulation/netStep';
import type { BoardBinding, BoardDevice, DeviceKind } from '../../../../model/simulation/boardCodec';
import type { SimValue } from '../../../../model/simulation/netTypes';

type Lookup = Record<string, any>;

const CLASSES: Lookup = {
    C_State: { className: 'DClass', name: 'State', extends: [] },
    C_Init: { className: 'DClass', name: 'Initial', extends: ['C_State'] },
    C_Final: { className: 'DClass', name: 'Terminal', extends: ['C_State'] },
    C_Event: { className: 'DClass', name: 'Event', extends: [] },
    C_Trans: { className: 'DClass', name: 'Transition', extends: [] },
    R_out: { className: 'DReference', name: 'transitions' },
    R_next: { className: 'DReference', name: 'nextState' },
    R_trigger: { className: 'DReference', name: 'event', type: 'C_Event' },
    A_label: { className: 'DAttribute', name: 'name' },
    A_guard: { className: 'DAttribute', name: 'guard' },
    A_effect: { className: 'DAttribute', name: 'effect' },
};

const ROLES = {
    simInitial: 'C_Init', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger',
    simEventIdentifier: 'A_label', simGuard: 'A_guard', simAction: 'A_effect',
};

type Obj = { cls: string; slots?: Record<string, unknown[]> };

/** The ESM turnstile of the demo (§2.3), plus `stop` guarded by the two inputs. */
const OBJECTS: Record<string, Obj> = {
    locked: { cls: 'C_Init', slots: { R_out: ['tc', 'tp', 'ts'] } },
    unlocked: { cls: 'C_State', slots: { R_out: ['tu'] } },
    off: { cls: 'C_Final' },
    coin: { cls: 'C_Event', slots: { A_label: ['coin'] } },
    push: { cls: 'C_Event', slots: { A_label: ['push'] } },
    stop: { cls: 'C_Event', slots: { A_label: ['stop'] } },
    tc: { cls: 'C_Trans', slots: { R_next: ['locked'], R_trigger: ['coin'], A_effect: ['model.[coins] := model.[coins] + 1'] } },
    tp: { cls: 'C_Trans', slots: { R_next: ['unlocked'], R_trigger: ['push'], A_guard: ['model.[paid]'], A_effect: ['model.[coins] := 0'] } },
    tu: { cls: 'C_Trans', slots: { R_next: ['locked'], R_trigger: ['push'] } },
    ts: { cls: 'C_Trans', slots: { R_next: ['off'], R_trigger: ['stop'], A_guard: ['model.[power] and model.[speed] > 3'] } },
};

const GLOBALS = JSON.stringify({
    v: 1,
    attrs: [
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' },
        { name: 'power', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, input: true },
        { name: 'speed', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 9 }, input: true },
        { name: 'level', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 1, max: 5 }, initial: '2' },
    ],
});

function buildLookup(profile = 'extendedStateMachine'): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(CLASSES)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', name: 'DemoESM', _state: { ...ROLES, simProfile: profile } };
    lookup.M = { className: 'DModel', id: 'M', name: 'demoESM', instanceof: 'MM', _state: { simStateAttributes: GLOBALS } };
    for (const [id, o] of Object.entries(OBJECTS)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: id, features };
    }
    return lookup;
}

const build: ContextBuilder = () => {
    const h: Record<string, any> = {};
    for (const id of Object.keys(OBJECTS)) h[id] = { id, __type: 'Object', name: id };
    return { instances: Object.values(h), classes: [], ...h };
};

/** Reset, then the presses, each through `pressInput` as the panel's `fire` makes it; the run as the store holds it. */
function runOf(lookup: Lookup, presses: Array<string | [string, Array<{ element: string; attr: string; value: SimValue }>]> = []): SimRun {
    const r = startRun(lookup, 'M', 'MM', 'P', build);
    if (r.kind !== 'started') throw new Error(r.reason);
    simReset('M', r.run);
    for (const p of presses) {
        const [event, values] = typeof p === 'string' ? [p, undefined] : p;
        pressInput('M', event, undefined, lookup, event, values);
    }
    return getSimRun('M')!;
}

/** The panel's view of the live run (SimulationPanel.tsx `view`): status, the events on, why one has no candidate, what it asks. */
function viewOf(run: SimRun | undefined, lookup: Lookup): BoardInputsView {
    if (!run) return { status: 'Not started', eventsOn: new Set(), noCandidate: new Map(), asks: new Map() };
    const status = runStatus(run);
    const inputs = panelInputs(status, structuralInputs(run.net, run.config.state));
    const noCandidate = new Map<string | null, string>();
    const asks = new Map<string | null, string>();
    if (status === 'Running') {
        for (const e of run.alphabet) {
            const why = inputReason(run, e, lookup, x => (x === null ? 'ε' : lookup[x].name), ['A_guard']);
            if (why) noCandidate.set(e, why.full);
            const read = inputAsks(run, e);
            if (read.length > 0) asks.set(e, read.map(a => inputLabel(a, run.net, lookup)).join(', '));
        }
    }
    return { status, eventsOn: inputs.events, noCandidate, asks };
}

interface Opts { held?: BoardHeld; n?: number; ctx?: BoardContext | null }

function scene(lookup: Lookup, run: SimRun | undefined, opts: Opts = {}): BoardScene {
    const ctx = opts.ctx !== undefined ? opts.ctx : run ? boardContextOfRun(run, lookup, 'MM') : boardContextOf(lookup, 'M', 'MM');
    return { run, n: opts.n ?? run?.trace?.length ?? 0, ctx, inputs: viewOf(run, lookup), held: opts.held ?? NO_HELD, lookup };
}

const dev = (id: string, kind: DeviceKind, binding: BoardBinding | null, label = ''): BoardDevice => ({ id, kind, cell: [0, 0], label, binding });

const face = (d: BoardDevice, s: BoardScene): DeviceFace => deviceFace(d, s);

const held = (values: Record<string, SimValue>, buffers: Record<string, string> = {}): BoardHeld =>
    ({ values: new Map(Object.entries(values)), buffers: new Map(Object.entries(buffers)) });

/** The demo's ten presses (§2.3 of the script). */
const TEN = ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'];

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('inputs: a press reaches the machine when the panel\'s own button would, and says why not in the panel\'s words (R-SIM-113)', () => {
    const BUTTON = dev('b1', 'button', { kind: 'event', event: 'coin' });

    it('before Reset a Button is off, its title the panel\'s «Reset starts the run.» (mutant: on without a run)', () => {
        const lookup = buildLookup();
        const f = face(BUTTON, scene(lookup, undefined));
        expect([f.on, f.title, f.fires]).toEqual([false, inputOffTitle('Fire coin', undefined, 'Not started'), 'coin']);
        expect(f.title).toBe('Fire coin\nOff. Reset starts the run.');
    });

    it('running, a Button is on exactly when the panel\'s event button is, with byte-identical titles (mutants: on from the alphabet; another title)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup);
        const s = scene(lookup, run);
        for (const e of ['coin', 'push', 'stop']) {
            const f = face(dev('b', 'button', { kind: 'event', event: e }), s);
            const on = s.inputs.eventsOn.has(e);
            expect(f.on).toBe(on);
            const why = s.inputs.noCandidate.get(e);
            expect(f.title).toBe(on ? inputPressTitle(`Fire ${e}`, why, s.inputs.asks.get(e)) : inputOffTitle(`Fire ${e}`, why, s.inputs.status));
        }
        expect(face(dev('b', 'button', { kind: 'event', event: 'stop' }), s).title).toBe('Fire stop\nAsks: power, speed');
        expect(face(BUTTON, s).title).toBe('Fire coin');
    });

    it('after push to unlocked, coin is off and says why, as the panel does (mutant: the reason dropped from the title)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup, ['coin', 'coin', 'push']);
        const s = scene(lookup, run);
        const f = face(BUTTON, s);
        expect(f.on).toBe(false);
        expect(f.title).toBe(inputOffTitle('Fire coin', s.inputs.noCandidate.get('coin'), 'Running'));
        expect(f.title.startsWith('Fire coin\nOff. ')).toBe(true);
    });

    it('a Button whose event is gone is off and flagged, the reason in its title (R-SIM-115; mutant: a flagged device left on)', () => {
        const lookup = buildLookup();
        const s = scene(lookup, runOf(lookup));
        const f = face(dev('b9', 'button', { kind: 'event', event: 'gone' }), s);
        expect([f.on, f.flag]).toEqual([false, 'The event no longer exists.']);
        expect(f.title).toBe('Button · (missing)\nOff. The event no longer exists.');
    });

    it('an unbound device is off, «Not bound.», and named by its kind (mutant: unbound read as bound)', () => {
        const lookup = buildLookup();
        const f = face(dev('b2', 'button', null), scene(lookup, runOf(lookup)));
        expect([f.on, f.flag, f.name, f.caption]).toEqual([false, 'Not bound.', 'Button', 'unbound']);
    });

    it('a Switch on an IVAR holds false until flipped, a Slider its minimum, both operable without a step (R-SIM-120; mutants: another default; off without a run)', () => {
        const lookup = buildLookup();
        const sw = dev('s1', 'switch', { kind: 'ivar', element: 'M', attr: 'power' });
        const sl = dev('s2', 'slider', { kind: 'ivar', element: 'M', attr: 'speed' });
        const none = scene(lookup, undefined);
        expect([face(sw, none).on, face(sw, none).held]).toEqual([true, false]);
        expect([face(sl, none).on, face(sl, none).held, face(sl, none).range]).toEqual([true, 0, { min: 0, max: 9 }]);
        const s = scene(lookup, runOf(lookup), { held: held({ s1: true, s2: 6 }) });
        expect(face(sw, s).held).toBe(true);
        expect(face(sw, s).title).toBe('Switch · IVAR power\npower = true: given to the press that reads it.');
        expect([face(sl, s).held, face(sl, s).fill]).toEqual([6, 6 / 9]);
        expect(face(sl, scene(lookup, undefined, { held: held({ s2: 42 }) })).held).toBe(9);
    });

    it('a Switch on two events fires on, then off, from its position; on as the panel\'s button of that event (mutant: always the on event)', () => {
        const lookup = buildLookup();
        const sw = dev('s3', 'switch', { kind: 'events', on: 'coin', off: 'push' });
        const s = scene(lookup, runOf(lookup));
        expect([face(sw, s).fires, face(sw, s).held, face(sw, s).title]).toEqual(['coin', false, 'Fire coin']);
        const flipped = scene(lookup, runOf(lookup), { held: held({ s3: true }) });
        expect([face(sw, flipped).fires, face(sw, flipped).held]).toEqual(['push', true]);
    });

    it('the keypad in value mode: a key that leaves the domain is off with the reason, or hidden; Enter needs a typed value (R-SIM-121; mutants: hideOut ignored, Enter on an empty buffer)', () => {
        const lookup = buildLookup();
        const kp = (hideOut: boolean) => dev('k1', 'keypad', { kind: 'keypadValue', element: 'M', attr: 'speed', enter: 'stop', hideOut });
        const empty = face(kp(false), scene(lookup, runOf(lookup)));
        expect(empty.keys!.filter(k => /^\d$/.test(k.key)).every(k => k.on && !k.hidden)).toBe(true);
        const enter0 = empty.keys!.find(k => k.key === '↵')!;
        expect([enter0.on, enter0.title]).toEqual([false, 'Enter\nOff. Nothing typed.']);
        expect(empty.keys!.find(k => k.key === 'C')!.on).toBe(false);
        const five = face(kp(false), scene(lookup, runOf(lookup), { held: held({}, { k1: '5' }) }));
        expect(five.buffer).toBe('5');
        const k3 = five.keys!.find(k => k.key === '3')!;
        expect([k3.on, k3.hidden, k3.title]).toEqual([false, false, '3\nOff. 53 is above 9.']);
        const enter = five.keys!.find(k => k.key === '↵')!;
        expect([enter.on, enter.title]).toEqual([true, 'Fire stop with speed = 5']);
        expect(five.keys!.find(k => k.key === 'C')!.on).toBe(true);
        const hidden = face(kp(true), scene(lookup, runOf(lookup), { held: held({}, { k1: '5' }) }));
        expect(hidden.keys!.find(k => k.key === '3')!.hidden).toBe(true);
    });

    it('a keypad whose input is not declared is flagged and draws every key off (mutant: no keys on a flagged keypad)', () => {
        const lookup = buildLookup();
        const f = face(dev('k3', 'keypad', { kind: 'keypadValue', element: 'M', attr: 'nope', enter: 'stop', hideOut: false }), scene(lookup, runOf(lookup)));
        expect([f.on, f.flag, f.mode]).toEqual([false, 'The input nope is not declared.', 'value']);
        expect(f.keys!.map(k => k.key)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '↵']);
        expect(f.keys!.every(k => !k.on && k.title.endsWith('\nOff. The input nope is not declared.'))).toBe(true);
    });

    it('the keypad in events mode: each key is the button of its event, an unbound key off (mutant: unbound keys on)', () => {
        const lookup = buildLookup();
        const keys = ['coin', 'push', '', '', '', '', '', '', '', 'stop'];
        const f = face(dev('k2', 'keypad', { kind: 'keypadEvents', keys }), scene(lookup, runOf(lookup)));
        const k = (key: string) => f.keys!.find(x => x.key === key)!;
        expect([k('0').on, k('0').event, k('0').title]).toEqual([true, 'coin', 'Fire coin']);
        expect([k('2').on, k('2').event, k('2').title]).toEqual([false, null, '2\nOff. Not bound.']);
        expect(k('9').title).toBe('Fire stop\nAsks: power, speed');
        expect(f.keys!.some(x => x.key === '↵')).toBe(false);
    });

    it('inputs read the live run while a past step is shown: a press acts on live (R-SIM-113; mutant: inputs from the step shown)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup, ['coin', 'coin', 'push']);
        const past = scene(lookup, run, { n: 0 });
        expect(face(dev('b', 'button', { kind: 'event', event: 'push' }), past).on).toBe(true);
        expect(face(dev('b', 'button', { kind: 'event', event: 'coin' }), past).on).toBe(false);
    });
});

describe('outputs: lit, a value, Err, or off with the reason, on the step shown (R-SIM-111, R-SIM-113)', () => {
    const LED_LOCKED = dev('l1', 'led', { kind: 'marked', place: 'locked' });
    const LED_UNLOCKED = dev('l2', 'led', { kind: 'marked', place: 'unlocked' });
    const SEVEN = dev('n1', 'seven', { kind: 'expr', text: 'model.[coins]' });
    const PULSE_TC = dev('p1', 'pulse', { kind: 'transition', transition: 'tc' });

    it('without a run every output is off with «Reset starts the run.», nothing lit, no text (mutant: a reading before Reset)', () => {
        const lookup = buildLookup();
        for (const d of [LED_LOCKED, SEVEN, PULSE_TC, dev('t1', 'text', { kind: 'configuration' })]) {
            const f = face(d, scene(lookup, undefined));
            expect([f.on, !!f.lit, f.text ?? '', f.err ?? false]).toEqual([false, false, '', false]);
            expect(f.title.endsWith('\nOff. Reset starts the run.')).toBe(true);
        }
    });

    it('an LED on a state is lit while the state is marked (mutant: lit from the alphabet or always)', () => {
        const lookup = buildLookup();
        const s0 = scene(lookup, runOf(lookup));
        expect([face(LED_LOCKED, s0).lit, face(LED_UNLOCKED, s0).lit]).toEqual([true, false]);
        const s5 = scene(lookup, runOf(lookup, TEN.slice(0, 5)));
        expect([face(LED_LOCKED, s5).lit, face(LED_UNLOCKED, s5).lit]).toEqual([false, true]);
        expect(face(LED_UNLOCKED, s5).title).toBe('LED · unlocked.[marked]\nLit.');
    });

    it('the 7-segment follows the demo\'s coins along the ten presses, and stays 3 when the tenth halts (mutant: σ before the step)', () => {
        const lookup = buildLookup();
        const shown: string[] = [];
        for (let k = 0; k <= TEN.length; k++) shown.push(face(SEVEN, scene(lookup, runOf(lookup, TEN.slice(0, k)))).text!);
        expect(shown).toEqual(['0', '0', '1', '1', '2', '0', '0', '1', '2', '3', '3']);
    });

    it('a viewed past step shows that step\'s outputs and says so in the title; live shows live (R-SIM-113; mutant: outputs read live while viewing)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup, TEN.slice(0, 5));
        const past = scene(lookup, run, { n: 4 });
        expect(face(SEVEN, past).text).toBe('2');
        expect([face(LED_LOCKED, past).lit, face(LED_UNLOCKED, past).lit]).toEqual([true, false]);
        expect(face(SEVEN, past).title).toBe('7-segment · model.[coins]\n2\nViewing step 4.');
        expect(face(SEVEN, scene(lookup, run)).title).toBe('7-segment · model.[coins]\n0');
    });

    it('the Pulse LED is lit on the step that fired its transition only; a discard and step 0 are dark (mutant: lit on any step of the trace)', () => {
        const lookup = buildLookup();
        const lit = (k: number, d = PULSE_TC) => !!face(d, scene(lookup, runOf(lookup, TEN.slice(0, k)))).lit;
        expect([0, 1, 2, 3, 4, 5].map(k => lit(k))).toEqual([false, false, true, false, true, false]);
        const pushPulse = dev('p2', 'pulse', { kind: 'event', event: 'push' });
        expect([lit(1, pushPulse), lit(5, pushPulse)]).toEqual([false, true]);
        const run = runOf(lookup, TEN.slice(0, 5));
        expect(face(PULSE_TC, scene(lookup, run, { n: 2 })).lit).toBe(true);
    });

    it('the text display names the marked states, two lines at most by the skin; an expression shows its value (mutant: the configuration of the live step while viewing)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup, TEN.slice(0, 5));
        const conf = dev('t1', 'text', { kind: 'configuration' });
        expect(face(conf, scene(lookup, run)).text).toBe('unlocked');
        expect(face(conf, scene(lookup, run, { n: 0 })).text).toBe('locked');
        expect(face(dev('t2', 'text', { kind: 'expr', text: 'model.[paid]' }), scene(lookup, run, { n: 4 })).text).toBe('true');
    });

    it('the gauge reads its attribute against the range, the bar from the minimum (mutant: the fill not normalised)', () => {
        const lookup = buildLookup();
        const g = dev('g1', 'gauge', { kind: 'attr', element: 'M', attr: 'coins' });
        const f = face(g, scene(lookup, runOf(lookup, ['coin', 'coin'])));
        expect([f.text, f.fill, f.range, f.err ?? false]).toEqual(['2', 2 / 3, { min: 0, max: 3 }, false]);
        const level = face(dev('g2', 'gauge', { kind: 'attr', element: 'M', attr: 'level' }), scene(lookup, runOf(lookup)));
        expect([level.text, level.fill, level.title]).toEqual(['2', 0.25, 'Gauge · level\n2 of 1..5']);
    });

    it('Err for a value out of the display\'s domain, a value of the wrong type, an evaluation defect (R-SIM-111; mutants: the domain unchecked, the type unchecked)', () => {
        const lookup = buildLookup();
        const s = scene(lookup, runOf(lookup, ['coin']));
        const err = (kind: DeviceKind, text: string) => {
            const f = face(dev('x', kind, { kind: 'expr', text }), s);
            return [f.err ?? false, f.text, f.lit ?? false, f.on];
        };
        expect([SEVEN_MIN, SEVEN_MAX]).toEqual([-999, 9999]);
        expect(err('seven', 'model.[coins] * 10000')).toEqual([true, 'Err', false, true]);
        expect(err('seven', 'model.[coins] - 1001')).toEqual([true, 'Err', false, true]);
        expect(err('seven', 'model.[coins] - 1000')).toEqual([false, '-999', false, true]);
        expect(err('seven', 'model.[coins] * 9999')).toEqual([false, '9999', false, true]);
        expect(err('seven', 'model.[coins] / 2')).toEqual([true, 'Err', false, true]);
        expect(err('seven', 'model.[paid]')).toEqual([true, 'Err', false, true]);
        expect(err('led', 'model.[coins]')).toEqual([true, 'Err', false, true]);
        expect(err('seven', 'model.[coins] / 0')).toEqual([true, 'Err', false, true]);
        expect(face(dev('x', 'seven', { kind: 'expr', text: 'model.[coins] * 10000' }), s).title).toBe('7-segment · model.[coins] * 10000\nErr. 10000 does not fit the display, -999..9999.');
        expect(face(dev('x', 'led', { kind: 'expr', text: 'model.[coins]' }), s).title).toBe('LED · model.[coins]\nErr. The value is a number, not a boolean.');
        expect(face(dev('x', 'seven', { kind: 'expr', text: 'model.[paid]' }), s).title).toBe('7-segment · model.[paid]\nErr. The value is a boolean, not a number.');
        expect(face(dev('x', 'seven', { kind: 'expr', text: 'model.[coins] / 2' }), s).title).toBe('7-segment · model.[coins] / 2\nErr. 0.5 is not a whole number.');
    });

    it('a binding that does not resolve flags the device, dark, the reason in the title, never Err (R-SIM-115; mutant: a compile defect read as Err)', () => {
        const lookup = buildLookup();
        const s = scene(lookup, runOf(lookup));
        const f = face(dev('x', 'seven', { kind: 'expr', text: 'model.[nope]' }), s);
        expect([f.on, f.err ?? false, f.text ?? '', f.flag !== null]).toEqual([false, false, '', true]);
        expect(f.title).toBe(`7-segment · model.[nope]\nOff. ${f.flag}`);
        const gone = face(dev('y', 'led', { kind: 'marked', place: 'gone' }), s);
        expect([gone.lit ?? false, gone.flag]).toEqual([false, 'The state no longer exists.']);
    });

    it('under State machine, what needs state attributes is flagged with the panel\'s words; X.[marked] still reads (R-SIM-117)', () => {
        const lookup = buildLookup('stateMachine');
        const run = runOf(lookup);
        const s = scene(lookup, run);
        expect(face(SEVEN, s).flag).toBe('«State machine» has no state attributes: use Extended state machine.');
        expect(face(dev('l', 'led', { kind: 'expr', text: 'locked.[marked]' }), s).lit).toBe(true);
        expect(face(LED_LOCKED, s).lit).toBe(true);
    });
});

describe('names and the press a device sends (R-SIM-120)', () => {
    it('a device is named by its label, else by what it is bound to, else by its kind (mutant: the id shown)', () => {
        const lookup = buildLookup();
        const ctx = boardContextOf(lookup, 'M', 'MM')!;
        expect(deviceName(dev('b', 'button', { kind: 'event', event: 'coin' }, 'Insert'), ctx)).toBe('Insert');
        expect(deviceName(dev('b', 'button', { kind: 'event', event: 'coin' }), ctx)).toBe('coin');
        expect(deviceName(dev('l', 'led', { kind: 'marked', place: 'locked' }), ctx)).toBe('locked');
        expect(deviceName(dev('p', 'pulse', { kind: 'transition', transition: 'tc' }), ctx)).toBe('tc');
        expect(deviceName(dev('s', 'switch', { kind: 'ivar', element: 'M', attr: 'power' }), ctx)).toBe('power');
        expect(deviceName(dev('n', 'seven', { kind: 'expr', text: 'model.[coins]' }), ctx)).toBe('7-segment');
        expect(deviceName(dev('t', 'text', { kind: 'configuration' }), ctx)).toBe('Text display');
    });

    it('heldInputs: a Switch and a Slider on an IVAR give their value, defaults included; a flagged one gives none (mutant: flagged devices answer)', () => {
        const lookup = buildLookup();
        const ctx = boardContextOf(lookup, 'M', 'MM')!;
        const devices = [
            dev('s1', 'switch', { kind: 'ivar', element: 'M', attr: 'power' }),
            dev('s2', 'slider', { kind: 'ivar', element: 'M', attr: 'speed' }),
            dev('s3', 'switch', { kind: 'ivar', element: 'M', attr: 'nope' }),
            dev('b1', 'button', { kind: 'event', event: 'coin' }),
        ];
        expect(heldInputs(devices, ctx, NO_HELD)).toEqual([{ element: 'M', attr: 'power', value: false }, { element: 'M', attr: 'speed', value: 0 }]);
        expect(heldInputs(devices, ctx, held({ s1: true, s2: 7, s3: true }))).toEqual([
            { element: 'M', attr: 'power', value: true }, { element: 'M', attr: 'speed', value: 7 },
        ]);
        expect(heldInputs(devices, null, NO_HELD)).toEqual([]);
    });

    it('planPress: no ask, the hand press itself, held values dropped (mutant: held values sent with every press)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup);
        expect(planPress(run, 'coin', [{ element: 'M', attr: 'power', value: true }])).toEqual({ kind: 'fire', event: 'coin' });
        expect(planPress(undefined, 'coin', [])).toEqual({ kind: 'fire', event: 'coin' });
    });

    it('planPress: every ask held, the press fires with them in the asks\' order; some held, the dialog asks the rest with the given carried (mutants: partial fired; given dropped)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup);
        const power = { element: 'M', attr: 'power', value: true };
        const speed = { element: 'M', attr: 'speed', value: 5 };
        expect(planPress(run, 'stop', [speed, power])).toEqual({ kind: 'fire', event: 'stop', values: [power, speed] });
        expect(planPress(run, 'stop', [power])).toEqual({
            kind: 'ask', event: 'stop', given: [power], asks: [{ element: 'M', attr: 'speed', domain: { kind: 'range', min: 0, max: 9 } }],
        });
        expect(planPress(run, 'stop', [])).toEqual({ kind: 'ask', event: 'stop', given: [], asks: inputAsks(run, 'stop') });
    });

    it('a press planned from held values reaches the machine: stop fires with power true and speed 5, and the trace records them (R-SIM-120, R-SIM-106)', () => {
        const lookup = buildLookup();
        const run = runOf(lookup);
        const plan = planPress(run, 'stop', [{ element: 'M', attr: 'power', value: true }, { element: 'M', attr: 'speed', value: 5 }]);
        if (plan.kind !== 'fire') throw new Error('expected a fire');
        expect(pressInput('M', plan.event, undefined, lookup, 'stop', plan.values).lastStep).toBe('stop: ts (locked → off) fired');
        expect(getSimRun('M')!.trace![0].inputs).toEqual(plan.values);
    });
});
