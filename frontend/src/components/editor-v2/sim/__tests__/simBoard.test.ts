/**
 * simBoard — the I/O board against a model and a run: what each binding resolves
 * to, the held inputs, the keypad, the editor's operations and its table
 * (R-SIM-110..115; P-2026-10-03-1845 Lane 1, docs/discovery/discovery_2026-10-03_sim_io_board.md
 * §3, §5, §6, §7).
 *
 * Raw lookups shaped as the store keeps them, as in simBridge.test.ts: the
 * turnstile of step 1 under Extended state machine with the globals in the model's
 * own bag (R-SIM-94), and the same model under State machine, whose profile turns
 * the declarations off (R-SIM-78). The run is started by the bridge with a
 * synthetic record of `buildEvalContext`. Each test name says which break of the
 * rule kills it; the mutation bench is in the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    DEVICE_LABELS, addDevice, bindingCaption, boardContextOf, boardContextOfRun, clockPeriodText, firstFreeCell, heldAnswer, keypadEnterValue, keypadKeyReason,
    keypadPress, maxDisplayLength, moveDevice, nuxmvRows, removeDevice, resolveDevice, setAccent, setAutoStart, setBinding, setBoardCols, setBoardTheme, setLabel, setPeriod,
    setSpan, setStyle, stateAttributesReason,
} from '../simBoard';
import type { BoardContext } from '../simBoard';
import { startRun } from '../simBridge';
import type { ContextBuilder } from '../simBridge';
import { __resetSimRunsForTests } from '../simRunState';
import type { BoardBinding, BoardDevice, DeviceKind } from '../../../../model/simulation/boardCodec';
import type { Domain, InputRead } from '../../../../model/simulation/netTypes';

type Lookup = Record<string, any>;

const CLASSES: Lookup = {
    C_State: { className: 'DClass', name: 'State', extends: [] },
    C_Init: { className: 'DClass', name: 'Init', extends: ['C_State'] },
    C_Event: { className: 'DClass', name: 'Event', extends: [] },
    C_Trans: { className: 'DClass', name: 'Trans', extends: [] },
    R_out: { className: 'DReference', name: 'out' },
    R_next: { className: 'DReference', name: 'next' },
    R_trigger: { className: 'DReference', name: 'trigger', type: 'C_Event' },
    A_label: { className: 'DAttribute', name: 'label' },
};

const ROLES = {
    simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger', simEventIdentifier: 'A_label',
};

const OBJECTS: Record<string, { cls: string; slots: Record<string, unknown[]> }> = {
    Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } },
    Unlocked: { cls: 'C_State', slots: { R_out: ['tPushU'] } },
    coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
    push: { cls: 'C_Event', slots: { A_label: ['Push'] } },
    tCoin: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['coin'] } },
    tPushU: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'] } },
    tPushL: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'] } },
};

/** The model's globals: VAR, DEFINE and four IVAR of the four domains a device can read, as `encodeStateAttributes` writes them. */
const GLOBALS = JSON.stringify({
    v: 1,
    attrs: [
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' },
        { name: 'power', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, input: true },
        { name: 'speed', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 9 }, input: true },
        { name: 'pin', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 99 }, input: true },
        { name: 'mode', metaclass: null, space: 'semantic', domain: { kind: 'enum', literals: ['a', 'b'] }, input: true },
    ],
});

function buildLookup(profile: string): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(CLASSES)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', name: 'Turn', _state: { ...ROLES, simProfile: profile } };
    lookup.M = { className: 'DModel', id: 'M', name: 'turnstile', instanceof: 'MM', _state: { simStateAttributes: GLOBALS } };
    for (const [id, o] of Object.entries(OBJECTS)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots)) {
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

const ESM = 'extendedStateMachine';
const SM = 'stateMachine';

function ctxOf(profile: string = ESM): BoardContext {
    const ctx = boardContextOf(buildLookup(profile), 'M', 'MM');
    if (!ctx) throw new Error('no context');
    return ctx;
}

const dev = (id: string, kind: DeviceKind, binding: BoardBinding | null, cell: [number, number] = [0, 0], label = ''): BoardDevice =>
    ({ id, kind, cell, label, binding });

const ok = (d: BoardDevice, ctx: BoardContext = ctxOf()) => resolveDevice(d, ctx);

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('boardContextOf: what a board can bind to, from the model, without a run', () => {
    it('events (the alphabet with the panel\'s labels), places, transitions, IVAR and the σ attributes with a domain', () => {
        const ctx = ctxOf();
        expect(ctx.events).toEqual([{ id: 'coin', label: 'Coin' }, { id: 'push', label: 'Push' }]);
        expect(ctx.places.map(p => p.id).sort()).toEqual(['Locked', 'Unlocked']);
        expect(ctx.transitions.map(t => t.id).sort()).toEqual(['tCoin', 'tPushL', 'tPushU']);
        expect(ctx.ivars.map(i => i.attr)).toEqual(['power', 'speed', 'pin', 'mode']);
        expect(ctx.attrs.map(a => [a.attr, a.kind])).toEqual([['coins', 'VAR'], ['paid', 'DEFINE']]);
        expect([ctx.stateAttributesOff, ctx.profileName]).toEqual([false, 'Extended state machine']);
        expect(ctx.snapshot).toBeUndefined();
    });

    it('a profile without state attributes reaches no declaration: no IVAR, no attribute (R-SIM-78; mutant: the merge ignores the profile)', () => {
        const ctx = ctxOf(SM);
        expect([ctx.stateAttributesOff, ctx.profileName, ctx.ivars, ctx.attrs]).toEqual([true, 'State machine', [], []]);
        expect(ctx.events.map(e => e.id)).toEqual(['coin', 'push']);
    });

    it('null when the roles make no STC (an incomplete binding)', () => {
        const lookup = buildLookup(ESM);
        delete lookup.MM._state.simNextState;
        expect(boardContextOf(lookup, 'M', 'MM')).toBeNull();
    });
});

describe('boardContextOfRun: the run\'s own net and its snapshot (report §4)', () => {
    it('the same choices as from the model, and the run\'s frozen snapshot for the outputs (mutant: snapshot not carried)', () => {
        const lookup = buildLookup(ESM);
        const r = startRun(lookup, 'M', 'MM', 'P', build);
        if (r.kind !== 'started') throw new Error(r.reason);
        const ctx = boardContextOfRun(r.run, lookup, 'MM');
        expect(ctx.events).toEqual(ctxOf().events);
        expect(ctx.ivars.map(i => i.attr)).toEqual(['power', 'speed', 'pin', 'mode']);
        expect(ctx.snapshot).toBe(r.run.snapshot);
        expect(ctx.snapshot).toBeDefined();
    });
});

describe('resolveDevice: a binding that no longer resolves flags its device, never the run (R-SIM-115)', () => {
    it('an unbound device is flagged', () => {
        expect(ok(dev('d1', 'button', null))).toEqual({ ok: false, reason: 'Not bound.' });
    });

    it('an event resolves by id in the alphabet; gone, or not an event, are told apart (mutant: by name; mutant: one reason)', () => {
        expect(ok(dev('d1', 'button', { kind: 'event', event: 'coin' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'button', { kind: 'event', event: 'gone' }))).toEqual({ ok: false, reason: 'The event no longer exists.' });
        expect(ok(dev('d1', 'button', { kind: 'event', event: 'Locked' }))).toEqual({ ok: false, reason: 'Not an event of this model.' });
    });

    it('a renamed event keeps its binding: the id is what is stored (report §3)', () => {
        const lookup = buildLookup(ESM);
        lookup.coin.name = 'insertCoin';
        lookup.v_coin_A_label.values = ['Insert'];
        const ctx = boardContextOf(lookup, 'M', 'MM')!;
        const d = dev('d1', 'button', { kind: 'event', event: 'coin' });
        expect(resolveDevice(d, ctx)).toEqual({ ok: true });
        expect(bindingCaption(d, ctx)).toBe('Insert');
    });

    it('a switch on two events needs both', () => {
        expect(ok(dev('d1', 'switch', { kind: 'events', on: 'coin', off: 'push' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'switch', { kind: 'events', on: 'coin', off: 'gone' })).ok).toBe(false);
    });

    it('an IVAR resolves by element and name among the inputs; a switch needs a boolean, a slider a range (mutant: domain not checked)', () => {
        expect(ok(dev('d1', 'switch', { kind: 'ivar', element: 'M', attr: 'power' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'switch', { kind: 'ivar', element: 'M', attr: 'speed' }))).toEqual({ ok: false, reason: 'speed is not boolean.' });
        expect(ok(dev('d1', 'slider', { kind: 'ivar', element: 'M', attr: 'speed' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'slider', { kind: 'ivar', element: 'M', attr: 'power' }))).toEqual({ ok: false, reason: 'power has no range domain.' });
        expect(ok(dev('d1', 'switch', { kind: 'ivar', element: 'M', attr: 'coins' }))).toEqual({ ok: false, reason: 'The input coins is not declared.' });
    });

    it('an IVAR of a metaclass is per element: the same name on the model is another input (mutant: by name only)', () => {
        const lookup = buildLookup(ESM);
        lookup.MM._state.simStateAttributes = JSON.stringify({
            v: 1, attrs: [{ name: 'decision', metaclass: 'C_State', space: 'semantic', domain: { kind: 'boolean' }, input: true }],
        });
        const ctx = boardContextOf(lookup, 'M', 'MM')!;
        expect(ctx.ivars.filter(i => i.attr === 'decision').map(i => i.label).sort()).toEqual(['Locked.decision', 'Unlocked.decision']);
        expect(resolveDevice(dev('d1', 'switch', { kind: 'ivar', element: 'Locked', attr: 'decision' }), ctx)).toEqual({ ok: true });
        expect(resolveDevice(dev('d1', 'switch', { kind: 'ivar', element: 'M', attr: 'decision' }), ctx))
            .toEqual({ ok: false, reason: 'The input decision is not declared.' });
    });

    it('the keypad in value mode needs a range from 0 and its Enter event; in events mode at least one key, each an event', () => {
        const value = (attr: string, enter: string) => dev('d1', 'keypad', { kind: 'keypadValue', element: 'M', attr, enter, hideOut: false });
        expect(ok(value('pin', 'coin'))).toEqual({ ok: true });
        expect(ok(value('pin', 'gone'))).toEqual({ ok: false, reason: 'The event no longer exists.' });
        expect(ok(value('mode', 'coin'))).toEqual({ ok: false, reason: 'mode needs a range of whole numbers from 0.' });
        const keys = (k: string[]) => dev('d1', 'keypad', { kind: 'keypadEvents', keys: [...k, ...Array(10 - k.length).fill('')] });
        expect(ok(keys([]))).toEqual({ ok: false, reason: 'No key is bound.' });
        expect(ok(keys(['coin', 'push']))).toEqual({ ok: true });
        expect(ok(keys(['coin', 'gone'])).ok).toBe(false);
    });

    it('marked names a place by id; a transition or a missing element is flagged', () => {
        expect(ok(dev('d1', 'led', { kind: 'marked', place: 'Locked' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'led', { kind: 'marked', place: 'coin' }))).toEqual({ ok: false, reason: 'Not a state of this model.' });
        expect(ok(dev('d1', 'led', { kind: 'marked', place: 'gone' }))).toEqual({ ok: false, reason: 'The state no longer exists.' });
    });

    it('an expression resolves when it compiles as an output; its defect is the reason (mutant: the compile not run)', () => {
        expect(ok(dev('d1', 'seven', { kind: 'expr', text: 'model.[coins]' }))).toEqual({ ok: true });
        const bad = ok(dev('d1', 'seven', { kind: 'expr', text: 'model.[nope]' }));
        expect(bad.ok).toBe(false);
        expect(!bad.ok && bad.reason).toContain("'nope'");
    });

    it('a pulse names a transition or an event; the configuration needs nothing', () => {
        expect(ok(dev('d1', 'pulse', { kind: 'transition', transition: 'tCoin' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'pulse', { kind: 'transition', transition: 'gone' }))).toEqual({ ok: false, reason: 'The transition no longer exists.' });
        expect(ok(dev('d1', 'pulse', { kind: 'transition', transition: 'Locked' }))).toEqual({ ok: false, reason: 'Not a transition of this model.' });
        expect(ok(dev('d1', 'pulse', { kind: 'event', event: 'push' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'text', { kind: 'configuration' }))).toEqual({ ok: true });
    });

    it('a gauge reads a σ attribute with a range: not an IVAR, not a boolean', () => {
        expect(ok(dev('d1', 'gauge', { kind: 'attr', element: 'M', attr: 'coins' }))).toEqual({ ok: true });
        expect(ok(dev('d1', 'gauge', { kind: 'attr', element: 'M', attr: 'paid' }))).toEqual({ ok: false, reason: 'paid has no range domain.' });
        expect(ok(dev('d1', 'gauge', { kind: 'attr', element: 'M', attr: 'speed' }))).toEqual({ ok: false, reason: 'speed is not declared.' });
    });

    it('a binding that does not fit the device is flagged (decoded boards are checked, a hand-made one too)', () => {
        expect(ok(dev('d1', 'gauge', { kind: 'expr', text: 'model.[coins]' })).ok).toBe(false);
    });

    it('under a profile without state attributes, what needs them is flagged with the panel\'s words; X.[marked] and events still resolve (H5)', () => {
        const sm = ctxOf(SM);
        const reason = '«State machine» has no state attributes: use Extended state machine.';
        expect(stateAttributesReason('State machine')).toBe(reason);
        expect(ok(dev('d1', 'switch', { kind: 'ivar', element: 'M', attr: 'power' }), sm)).toEqual({ ok: false, reason, stateAttributes: true });
        expect(ok(dev('d1', 'seven', { kind: 'expr', text: 'model.[coins]' }), sm)).toEqual({ ok: false, reason, stateAttributes: true });
        expect(ok(dev('d1', 'gauge', { kind: 'attr', element: 'M', attr: 'coins' }), sm)).toEqual({ ok: false, reason, stateAttributes: true });
        expect(ok(dev('d1', 'led', { kind: 'expr', text: 'Locked.[marked]' }), sm)).toEqual({ ok: true });
        expect(ok(dev('d1', 'led', { kind: 'marked', place: 'Locked' }), sm)).toEqual({ ok: true });
        expect(ok(dev('d1', 'button', { kind: 'event', event: 'coin' }), sm)).toEqual({ ok: true });
    });
});

describe('heldAnswer: the values a Switch or a Slider holds answer the inputs a press asks; the dialog asks the rest (report §5)', () => {
    const POWER: InputRead = { element: 'M', attr: 'power', domain: { kind: 'boolean' } };
    const SPEED: InputRead = { element: 'M', attr: 'speed', domain: { kind: 'range', min: 0, max: 9 } };

    it('partial: the held one is given, the other is left to ask (mutant: held values ignored)', () => {
        expect(heldAnswer([POWER, SPEED], [{ element: 'M', attr: 'power', value: true }]))
            .toEqual({ given: [{ element: 'M', attr: 'power', value: true }], rest: [SPEED] });
    });

    it('covered: given in the order of the asks, a held value nobody asks is dropped (mutant: extra values passed on)', () => {
        const held = [{ element: 'M', attr: 'speed', value: 4 }, { element: 'X', attr: 'other', value: 1 }, { element: 'M', attr: 'power', value: false }];
        expect(heldAnswer([POWER, SPEED], held)).toEqual({ given: [{ element: 'M', attr: 'power', value: false }, { element: 'M', attr: 'speed', value: 4 }], rest: [] });
    });

    it('none held: everything is asked; the same name on another element does not answer (mutant: match by name only)', () => {
        expect(heldAnswer([POWER], [{ element: 'Locked', attr: 'power', value: true }])).toEqual({ given: [], rest: [POWER] });
    });
});

describe('the keypad in value mode: the buffer is the device\'s, Enter gives the IVAR (R-SIM-112)', () => {
    const PIN: Domain = { kind: 'range', min: 0, max: 99 };
    const TEENS: Domain = { kind: 'range', min: 10, max: 99 };

    it('a key that would take the buffer above the maximum is off with its reason (mutant: bound not checked)', () => {
        expect(keypadKeyReason(PIN, '', 5)).toBeNull();
        expect(keypadKeyReason(PIN, '9', 9)).toBeNull();
        expect(keypadKeyReason(PIN, '10', 0)).toBe('100 is above 99.');
    });

    it('a leading zero is replaced, not kept', () => {
        expect(keypadPress('', 0)).toBe('0');
        expect(keypadPress('0', 5)).toBe('5');
        expect(keypadPress('4', 2)).toBe('42');
    });

    it('Enter gives the value only in the domain; empty or below the minimum is refused with the reason', () => {
        expect(keypadEnterValue(PIN, '42')).toEqual({ value: 42 });
        expect(keypadEnterValue(PIN, '')).toEqual({ refused: 'Nothing typed.' });
        expect(keypadEnterValue(TEENS, '5')).toEqual({ refused: '5 is outside 10..99.' });
    });
});

describe('the editor\'s operations: pure, on a draft', () => {
    it('add takes the first free id and the first free cell, row by row (mutant: ids reused, cells stacked)', () => {
        let devices: BoardDevice[] = [];
        const ids: string[] = [];
        for (const kind of ['button', 'led', 'switch', 'seven', 'gauge'] as DeviceKind[]) {
            const r = addDevice(devices, kind);
            devices = r.devices;
            ids.push(r.id);
        }
        expect(ids).toEqual(['d1', 'd2', 'd3', 'd4', 'd5']);
        expect(devices.map(d => d.cell)).toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1]]);
        expect(devices.every(d => d.binding === null && d.label === '')).toBe(true);
        const gap = removeDevice(devices, 'd2');
        const again = addDevice(gap, 'pulse');
        expect([again.id, again.devices.find(d => d.id === 'd2')?.cell]).toEqual(['d2', [1, 0]]);
    });

    it('move onto an occupied cell swaps the two; off the grid changes nothing', () => {
        const devices = [dev('d1', 'button', null, [0, 0]), dev('d2', 'led', null, [1, 0])];
        expect(moveDevice(devices, 'd1', [1, 0]).map(d => d.cell)).toEqual([[1, 0], [0, 0]]);
        expect(moveDevice(devices, 'd1', [2, 3]).map(d => d.cell)).toEqual([[2, 3], [1, 0]]);
        expect(moveDevice(devices, 'd1', [4, 0])).toBe(devices);
        expect(moveDevice(devices, 'd1', [0, -1])).toBe(devices);
    });

    it('a binding that does not fit is refused; label and binding change only the device named', () => {
        const devices = [dev('d1', 'button', null), dev('d2', 'led', null, [1, 0])];
        expect(setBinding(devices, 'd1', { kind: 'marked', place: 'Locked' })).toBe(devices);
        const bound = setBinding(devices, 'd1', { kind: 'event', event: 'coin' });
        expect(bound.map(d => d.binding)).toEqual([{ kind: 'event', event: 'coin' }, null]);
        expect(setLabel(bound, 'd2', 'Locked lamp').map(d => d.label)).toEqual(['', 'Locked lamp']);
        expect(removeDevice(bound, 'd1').map(d => d.id)).toEqual(['d2']);
    });
});

describe('the clock on the board (R-SIM-122): one event, a period', () => {
    const clock = (binding: BoardBinding | null, period = 1000, id = 'c1'): BoardDevice => ({ ...dev(id, 'clock', binding), period });

    it('add gives a new clock the default period and auto-start, and no other kind either (R-SIM-134; mutants: period missing; autoStart missing; both on every kind)', () => {
        const a = addDevice([], 'clock');
        expect(a.devices[0]).toEqual({ id: 'd1', kind: 'clock', cell: [0, 0], label: '', binding: null, period: 1000, autoStart: true });
        const b = addDevice(a.devices, 'button');
        expect(['period' in b.devices[1], 'autoStart' in b.devices[1]]).toEqual([false, false]);
    });

    it('setAutoStart switches a clock\'s auto-start; off removes the field, so the board encodes as before; any other kind or id changes nothing (R-SIM-134; mutants: false stored; any kind)', () => {
        const devices = [clock(null), dev('d2', 'button', null, [1, 0])];
        const on = setAutoStart(devices, 'c1', true);
        expect(on[0].autoStart).toBe(true);
        expect(on[1]).toBe(devices[1]);
        const off = setAutoStart(on, 'c1', false);
        expect('autoStart' in off[0]).toBe(false);
        expect(off[0]).toEqual(devices[0]);
        expect(setAutoStart(devices, 'd2', true)).toBe(devices);
        expect(setAutoStart(devices, 'nope', true)).toBe(devices);
    });

    it('setPeriod takes a whole number in 100..60000 for a clock only; anything else changes nothing (mutant: clamped; mutant: any kind)', () => {
        const devices = [clock(null), dev('d2', 'button', null, [1, 0])];
        expect(setPeriod(devices, 'c1', 250).map(d => d.period)).toEqual([250, undefined]);
        for (const bad of [99, 60001, 1.5, NaN]) expect(setPeriod(devices, 'c1', bad)).toBe(devices);
        expect(setPeriod(devices, 'd2', 500)).toBe(devices);
        expect(setPeriod(devices, 'nope', 500)).toBe(devices);
    });

    it('resolves as the Button\'s event does; a period out of range flags it, never runs it (mutant: period not checked)', () => {
        const ctx = ctxOf();
        expect(ok(clock({ kind: 'event', event: 'coin' }), ctx)).toEqual({ ok: true });
        expect(ok(clock(null), ctx)).toEqual({ ok: false, reason: 'Not bound.' });
        expect(ok(clock({ kind: 'event', event: 'gone' }), ctx)).toEqual({ ok: false, reason: 'The event no longer exists.' });
        expect(ok(clock({ kind: 'event', event: 'Locked' }), ctx)).toEqual({ ok: false, reason: 'Not an event of this model.' });
        expect(ok(clock({ kind: 'event', event: 'coin' }, 50), ctx)).toEqual({ ok: false, reason: 'The period 50 ms is outside 100..60000 ms.' });
        expect(ok({ ...dev('c2', 'clock', { kind: 'event', event: 'coin' }) }, ctx)).toEqual({ ok: true });
    });

    it('the period in words: whole seconds, decimal seconds from one second, milliseconds below (mutant: always ms)', () => {
        expect([100, 250, 999, 1000, 1500, 1250, 60000].map(clockPeriodText)).toEqual(['100 ms', '250 ms', '999 ms', '1 s', '1.5 s', '1.25 s', '60 s']);
    });

    it('caption: the event and its period; nuXmv: an ordinary event, as the Button\'s (R-SIM-122 decision 3)', () => {
        const ctx = ctxOf();
        const devices = [clock({ kind: 'event', event: 'coin' }), clock({ kind: 'event', event: 'push' }, 250, 'c2'), clock(null, 1000, 'c3')];
        expect(nuxmvRows(devices, ctx).map(r => [r.device, r.binding, r.nuxmv])).toEqual([
            ['Clock c1', 'Coin every 1 s', 'event = Coin'],
            ['Clock c2', 'Push every 250 ms', 'event = Push'],
            ['Clock c3', 'unbound', '—'],
        ]);
        expect(bindingCaption(clock({ kind: 'event', event: 'gone' }), ctx)).toBe('(missing) every 1 s');
    });
});

describe('the caption and the table device → binding → nuXmv (R-SIM-111, report §7)', () => {
    it('every kind, in the editor\'s words; the Pulse LED stays out of the export', () => {
        const ctx = ctxOf();
        const devices: BoardDevice[] = [
            dev('d1', 'button', { kind: 'event', event: 'coin' }, [0, 0], 'Coin slot'),
            dev('d2', 'switch', { kind: 'ivar', element: 'M', attr: 'power' }, [1, 0]),
            dev('d3', 'switch', { kind: 'events', on: 'coin', off: 'push' }, [2, 0]),
            dev('d4', 'slider', { kind: 'ivar', element: 'M', attr: 'speed' }, [3, 0]),
            dev('d5', 'keypad', { kind: 'keypadValue', element: 'M', attr: 'pin', enter: 'push', hideOut: false }, [0, 1]),
            dev('d6', 'keypad', { kind: 'keypadEvents', keys: ['coin', 'push', '', '', '', '', '', '', '', ''] }, [1, 1]),
            dev('d7', 'led', { kind: 'marked', place: 'Locked' }, [2, 1]),
            dev('d8', 'seven', { kind: 'expr', text: 'model.[coins]' }, [3, 1]),
            dev('d9', 'pulse', { kind: 'transition', transition: 'tCoin' }, [0, 2]),
            dev('d10', 'text', { kind: 'configuration' }, [1, 2]),
            dev('d11', 'gauge', { kind: 'attr', element: 'M', attr: 'coins' }, [2, 2]),
            dev('d12', 'led', null, [3, 2]),
        ];
        expect(nuxmvRows(devices, ctx).map(r => [r.device, r.binding, r.nuxmv])).toEqual([
            ['Button Coin slot', 'Coin', 'event = Coin'],
            ['Switch d2', 'IVAR power', 'IVAR power : boolean'],
            ['Switch d3', 'Coin / Push', 'event ∈ {Coin, Push}'],
            ['Slider d4', 'IVAR speed', 'IVAR speed : 0..9'],
            ['Keypad d5', 'IVAR pin · Enter Push', 'IVAR pin : 0..99; event = Push'],
            ['Keypad d6', '2 keys', 'event ∈ {Coin, Push}'],
            ['LED d7', 'Locked.[marked]', 'DEFINE d7 := Locked.[marked]'],
            ['7-segment d8', 'model.[coins]', 'DEFINE d8 := model.[coins]'],
            ['Pulse LED d9', 'tCoin (Locked → Unlocked)', '— (reads the trace; not exported)'],
            ['Text display d10', 'the configuration', '— (the configuration)'],
            ['Gauge d11', 'coins', 'reads VAR coins : 0..3'],
            ['LED d12', 'unbound', '—'],
        ]);
    });

    it('the device labels of the palette', () => {
        expect(DEVICE_LABELS).toEqual({
            button: 'Button', switch: 'Switch', slider: 'Slider', keypad: 'Keypad', clock: 'Clock',
            led: 'LED', pulse: 'Pulse LED', seven: '7-segment', text: 'Text display', gauge: 'Gauge', buzzer: 'Buzzer', silk: 'Silkscreen',
        });
    });
});

// ---------------------------------------------------------------------------
// R-SIM-123..128 (P-2026-10-04-1130): spans, columns, styles, display lengths, the new kinds
// ---------------------------------------------------------------------------

const spanned = (id: string, kind: DeviceKind, cell: [number, number], span: [number, number]): BoardDevice => ({ ...dev(id, kind, null, cell), span });

describe('occupancy by covered cells (R-SIM-125)', () => {
    it('the first free cell skips every covered cell, row by row, within the board\'s columns (mutant: anchors only; mutant: four columns always)', () => {
        const devices = [spanned('d1', 'seven', [0, 0], [3, 1]), spanned('d2', 'led', [3, 0], [1, 2])];
        expect(firstFreeCell(devices)).toEqual([0, 1]);
        expect(firstFreeCell([spanned('d1', 'seven', [0, 0], [4, 2])])).toEqual([0, 2]);
        expect(firstFreeCell([spanned('d1', 'seven', [0, 0], [4, 1])], 6)).toEqual([4, 0]);
        const full = Array.from({ length: 8 }, (_, r) => spanned(`r${r}`, 'seven', [0, r], [4, 1]));
        expect(firstFreeCell(full)).toBeNull();
        expect(addDevice(full, 'led')).toEqual({ devices: full, id: '' });
        expect(addDevice([spanned('d1', 'seven', [0, 0], [4, 1])], 'led', 6).devices[1].cell).toEqual([4, 0]);
    });

    it('a move whose span leaves the grid or overlaps another device is refused; within its own cells it moves (mutant: overlap allowed)', () => {
        const devices = [spanned('d1', 'seven', [0, 0], [2, 1]), dev('d2', 'led', null, [3, 0])];
        expect(moveDevice(devices, 'd1', [1, 0]).map(d => d.cell)).toEqual([[1, 0], [3, 0]]);
        expect(moveDevice(devices, 'd1', [2, 0])).toBe(devices);
        expect(moveDevice(devices, 'd1', [3, 1])).toBe(devices);
        expect(moveDevice(devices, 'd1', [3, 1], 6).map(d => d.cell)).toEqual([[3, 1], [3, 0]]);
        expect(moveDevice(devices, 'd1', [0, 7]).map(d => d.cell)).toEqual([[0, 7], [3, 0]]);
        expect(moveDevice([spanned('d1', 'led', [0, 0], [1, 2])], 'd1', [0, 7]).map(d => d.cell)).toEqual([[0, 0]]);
    });

    it('a move onto another device swaps the two when the swapped board fits; otherwise nothing changes (committed swap kept, mutant: swap dropped)', () => {
        const ones = [dev('d1', 'button', null, [0, 0]), dev('d2', 'led', null, [1, 0])];
        expect(moveDevice(ones, 'd1', [1, 0]).map(d => d.cell)).toEqual([[1, 0], [0, 0]]);
        const wide = [spanned('d1', 'seven', [0, 0], [2, 1]), dev('d2', 'led', null, [3, 0])];
        expect(moveDevice(wide, 'd2', [0, 0]).map(d => d.cell)).toEqual([[0, 0], [3, 0]]);
        expect(moveDevice(wide, 'd2', [0, 0])).toBe(wide);
        const pair = [spanned('d1', 'seven', [0, 0], [2, 1]), spanned('d2', 'seven', [2, 0], [2, 1])];
        expect(moveDevice(pair, 'd1', [2, 0]).map(d => d.cell)).toEqual([[2, 0], [0, 0]]);
    });
});

describe('setSpan (R-SIM-125)', () => {
    it('a span within its domain, on the grid and over free cells is set; [1, 1] removes it (mutant: [1, 1] stored)', () => {
        const devices = [dev('d1', 'seven', null, [0, 0]), dev('d2', 'led', null, [3, 1])];
        const wide = setSpan(devices, 'd1', [4, 1]);
        expect(wide[0].span).toEqual([4, 1]);
        expect(wide[1]).toBe(devices[1]);
        expect('span' in setSpan(wide, 'd1', [1, 1])[0]).toBe(false);
    });

    it('out of its domain, off the grid, over another device, or unknown: refused and nothing changes (mutants: clamped; overlap allowed)', () => {
        const devices = [dev('d1', 'seven', null, [1, 0]), dev('d2', 'led', null, [1, 1])];
        for (const bad of [[0, 1], [5, 1], [1, 3], [1.5, 1]] as Array<[number, number]>) expect(setSpan(devices, 'd1', bad)).toBe(devices);
        expect(setSpan(devices, 'd1', [4, 1])).toBe(devices);
        expect(setSpan(devices, 'd1', [4, 1], 6)[0].span).toEqual([4, 1]);
        expect(setSpan(devices, 'd1', [1, 2])).toBe(devices);
        expect(setSpan(devices, 'nope', [2, 1])).toBe(devices);
    });
});

describe('setStyle (R-SIM-126, R-SIM-127)', () => {
    const devices = [dev('b1', 'button', null, [0, 0]), dev('b2', 'button', null, [1, 0]), dev('t1', 'text', null, [2, 0]), dev('l1', 'led', null, [3, 0])];

    it('sets the fields of its kind in their order; null removes one; a default leaves no style at all (mutant: defaults stored)', () => {
        const a = setStyle(devices, 'b1', { key: 'q', shape: 'round', role: 'go' });
        expect(a[0].style).toEqual({ shape: 'round', role: 'go', key: 'q' });
        expect(Object.keys(a[0].style!)).toEqual(['shape', 'role', 'key']);
        expect(a.slice(1)).toEqual(devices.slice(1));
        const b = setStyle(a, 'b1', { role: null, key: null });
        expect(b[0].style).toEqual({ shape: 'round' });
        expect('style' in setStyle(b, 'b1', { shape: 'key' })[0]).toBe(false);
        expect(setStyle(devices, 't1', { size: 'XL', face: 'vfd' })[2].style).toEqual({ size: 'XL', face: 'vfd' });
        expect(setStyle(devices, 'l1', { shape: 'bar', color: 'red' })[3].style).toEqual({ shape: 'bar', color: 'red' });
    });

    it('a field another kind takes, or a value outside its field, refuses the whole change (mutant: the valid part applied)', () => {
        expect(setStyle(devices, 'b1', { role: 'go', size: 'L' })).toBe(devices);
        expect(setStyle(devices, 'b1', { shape: 'bar' })).toBe(devices);
        expect(setStyle(devices, 'l1', { shape: 'key' })).toBe(devices);
        expect(setStyle(devices, 'b1', { icon: 'bi-play' })).toBe(devices);
        expect(setStyle(devices, 'b1', { key: 'Q' })).toBe(devices);
        expect(setStyle(devices, 'nope', { role: 'go' })).toBe(devices);
    });

    it('an explicit key another device holds is refused; none is never taken (R-SIM-127; mutant: duplicates allowed)', () => {
        const a = setStyle(devices, 'b1', { key: 'q' });
        expect(setStyle(a, 'b2', { key: 'q' })).toBe(a);
        expect(setStyle(a, 'b1', { key: 'q', role: 'stop' })[0].style).toEqual({ role: 'stop', key: 'q' });
        const none = setStyle(setStyle(devices, 'b1', { key: 'none' }), 'b2', { key: 'none' });
        expect(none.map(d => d.style?.key)).toEqual(['none', 'none', undefined, undefined]);
    });
});

describe('the board\'s settings (R-SIM-124, R-SIM-125)', () => {
    it('setBoardTheme: one of the four; graphite removes it; anything else changes nothing (mutant: an unknown theme stored)', () => {
        expect(setBoardTheme({}, 'print')).toEqual({ theme: 'print' });
        expect(setBoardTheme({ theme: 'print', cols: 6 }, 'graphite')).toEqual({ cols: 6 });
        const s = { theme: 'appliance' as const };
        expect(setBoardTheme(s, 'neon' as any)).toBe(s);
    });

    it('setAccent: a colour #rrggbb, lower case; null removes it; anything else changes nothing (mutant: case kept)', () => {
        expect(setAccent({}, '#E11D48')).toEqual({ accent: '#e11d48' });
        expect(setAccent({ accent: '#e11d48', theme: 'print' }, null)).toEqual({ theme: 'print' });
        const s = { accent: '#e11d48' };
        expect(setAccent(s, 'red')).toBe(s);
        expect(setAccent(s, '#fff')).toBe(s);
    });

    it('setBoardCols: 4, 6 or 8; widening always; narrowing refused while a device covers a removed column (mutant: anchors only)', () => {
        const devices = [dev('d1', 'led', null, [0, 0]), spanned('d2', 'seven', [2, 1], [3, 1])];
        expect(setBoardCols({}, devices, 8)).toEqual({ cols: 8 });
        const six = { cols: 6 as const };
        expect(setBoardCols(six, devices, 4)).toBe(six);
        expect(setBoardCols(six, [dev('d1', 'led', null, [3, 7])], 4)).toEqual({});
        expect(setBoardCols({ cols: 8 }, [dev('d1', 'led', null, [5, 0])], 6)).toEqual({ cols: 6 });
        expect(setBoardCols({ cols: 8 }, [dev('d1', 'led', null, [6, 0])], 6)).toEqual({ cols: 8 });
        expect(setBoardCols(six, devices, 5 as any)).toBe(six);
    });
});

describe('maxDisplayLength (R-SIM-126): the longest value the binding\'s domain can produce, never the current one', () => {
    /** The turnstile with two more globals, an enum and a range below zero, for the displays. */
    function displayCtx(): BoardContext {
        const lookup = buildLookup(ESM);
        const g = JSON.parse(GLOBALS);
        g.attrs.push(
            { name: 'phase', metaclass: null, space: 'semantic', domain: { kind: 'enum', literals: ['idle', 'cooking', 'done'] }, initial: 'idle' },
            { name: 'temp', metaclass: null, space: 'semantic', domain: { kind: 'range', min: -100, max: 50 }, initial: '0' },
        );
        lookup.M._state.simStateAttributes = JSON.stringify(g);
        const ctx = boardContextOf(lookup, 'M', 'MM');
        if (!ctx) throw new Error('no context');
        return ctx;
    }
    const len = (kind: DeviceKind, binding: BoardBinding | null, ctx = displayCtx()) => maxDisplayLength(dev('x', kind, binding), ctx);

    it('a range: the longer of its minimum and its maximum as text (mutant: the maximum only)', () => {
        expect(len('seven', { kind: 'expr', text: 'model.[coins]' })).toBe(1);
        expect(len('text', { kind: 'expr', text: 'model.[temp]' })).toBe(4);
        expect(len('text', { kind: 'expr', text: 'self.[temp]' })).toBe(4);
    });

    it('an enum: the longest literal; a boolean: false (mutant: the first literal)', () => {
        expect(len('text', { kind: 'expr', text: 'model.[phase]' })).toBe(7);
        expect(len('text', { kind: 'expr', text: 'model.[paid]' })).toBe(5);
        expect(len('text', { kind: 'expr', text: 'Locked.[marked]' })).toBe(5);
    });

    it('a state name: the longest state label (mutant: the first place)', () => {
        expect(len('text', { kind: 'configuration' })).toBe('Unlocked'.length);
    });

    it('an expression without a known domain, one that does not compile, an unbound or non-display device: null (mutant: a length guessed)', () => {
        expect(len('seven', { kind: 'expr', text: 'model.[coins] * 10' })).toBeNull();
        expect(len('text', { kind: 'expr', text: 'model.[nope]' })).toBeNull();
        expect(len('text', null)).toBeNull();
        expect(len('led', { kind: 'expr', text: 'model.[paid]' })).toBeNull();
        expect(len('gauge', { kind: 'attr', element: 'M', attr: 'coins' })).toBeNull();
    });
});

describe('the silkscreen and the buzzer (R-SIM-128)', () => {
    it('a silkscreen never flags, unbound as it always is; a buzzer resolves as an LED does (mutant: a silkscreen flagged Not bound)', () => {
        const ctx = ctxOf();
        expect(ok(dev('k1', 'silk', null, [0, 0], 'COOK'), ctx)).toEqual({ ok: true });
        expect(ok(dev('z1', 'buzzer', { kind: 'marked', place: 'Locked' }), ctx)).toEqual({ ok: true });
        expect(ok(dev('z2', 'buzzer', { kind: 'expr', text: 'model.[nope]' }), ctx).ok).toBe(false);
        expect(ok(dev('z3', 'buzzer', null), ctx)).toEqual({ ok: false, reason: 'Not bound.' });
        expect(ok(dev('z4', 'buzzer', { kind: 'transition', transition: 'tCoin' }), ctx)).toEqual({ ok: false, reason: 'A Buzzer does not take this binding.' });
        expect(setBinding([dev('k1', 'silk', null)], 'k1', { kind: 'expr', text: 'true' })[0].binding).toBeNull();
    });

    it('captions and the table: a silkscreen has no binding to name; a buzzer is presentation, out of the export (mutant: a buzzer as a DEFINE)', () => {
        const ctx = ctxOf();
        const devices = [dev('k1', 'silk', null, [0, 0], 'COOK'), dev('z1', 'buzzer', { kind: 'marked', place: 'Locked' }, [1, 0]), dev('z2', 'buzzer', { kind: 'expr', text: 'model.[paid]' }, [2, 0])];
        expect(nuxmvRows(devices, ctx).map(r => [r.device, r.binding, r.nuxmv])).toEqual([
            ['Silkscreen COOK', '', '— (a silkscreen; not exported)'],
            ['Buzzer z1', 'Locked.[marked]', '— (sounds on the rising edge; not exported)'],
            ['Buzzer z2', 'model.[paid]', '— (sounds on the rising edge; not exported)'],
        ]);
    });
});
