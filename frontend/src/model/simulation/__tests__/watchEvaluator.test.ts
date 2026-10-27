/**
 * watchEvaluator — an invariant or a breakpoint, compiled and read as a board output plus a boolean check
 * (R-SIM-137; P-2026-10-05-1735, docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §1, W2, Q1).
 *
 * The fixture is boardOutputs.test.ts's DemoESM turnstile written by hand: places `locked`, `unlocked`, `off`;
 * globals `coins` (VAR, 0..3), `paid` (DEFINE, `model.[coins] >= 2`), `power` (IVAR); a presentation `shade` on
 * `locked`; `BARE` is the State machine profile, no declaration. A watch is read with `self` the model root and
 * `event` null; what does not compile, and a value that is not a boolean, is a defect of the watch, never a hit.
 * Each test name says which break of the rule kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { compileWatch, evaluateWatch, isWatchHit, readWatches } from '../watchEvaluator';
import type { WatchReading } from '../watchEvaluator';
import type { OutputScope } from '../boardOutputs';
import { freezeSnapshot } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import type { WatchKind, WatchRecord } from '../watchCodec';
import type { CompiledNet, SimState, SimValue, StateAttributeDecl } from '../netTypes';

const COINS: StateAttributeDecl = { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: 0 };
const PAID: StateAttributeDecl = { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' };
const POWER: StateAttributeDecl = { name: 'power', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, input: true };
const SHADE: StateAttributeDecl = { name: 'shade', metaclass: 'C_State', space: 'presentation', domain: null, initial: 'red' };

type Net = Pick<CompiledNet, 'modelId' | 'attributes' | 'declared' | 'places'>;

const NET: Net = {
    modelId: 'M',
    places: new Set(['locked', 'unlocked', 'off']),
    attributes: [COINS, PAID, POWER, SHADE],
    declared: new Map([
        ['M', new Map([['coins', COINS], ['paid', PAID], ['power', POWER]])],
        ['locked', new Map([['shade', SHADE]])],
    ]),
};

/** The State machine profile: no declarations reach the run (R-SIM-78). */
const BARE: Net = { ...NET, attributes: [], declared: new Map() };

function snapshot(): SimSnapshot {
    const h: Record<string, any> = {};
    for (const id of ['locked', 'unlocked', 'off', 'tc', 'coin']) h[id] = { id, __type: 'Object', name: id };
    return freezeSnapshot({ instances: Object.values(h), classes: [], ...h }, { id: 'M', name: 'demoESM' });
}

/** σ with one marked place, the stored `coins` and the derived `paid`. */
function sigma(marked: string, coins: number, paid: boolean): SimState {
    return {
        marking: new Map([[marked, 1]]),
        attrs: new Map([['M', new Map<string, SimValue>([['coins', coins]])]]),
        presentation: new Map([['locked', new Map<string, SimValue>([['shade', 'red']])]]),
        derived: { attrs: new Map([['M', new Map<string, SimValue>([['paid', paid]])]]), presentation: new Map() },
    };
}

const scope = (net: Net = NET, snap?: SimSnapshot): OutputScope => ({ net, snapshot: snap, nameOf: id => id });
const w = (text: string, kind: WatchKind = 'invariant', name = 'w'): WatchRecord => ({ name, kind, text });

/** The reading of one watch on σ, with the run's snapshot. */
function read(text: string, state: SimState, net: Net = NET): WatchReading {
    const snap = snapshot();
    return evaluateWatch(compileWatch(w(text), scope(net, snap)), snap, net, state);
}

describe('compileWatch: a board output\'s checks (W2), the defect on the watch', () => {
    it('keeps the record: name, kind and text as stored (mutant: the kind not carried)', () => {
        const c = compileWatch(w('model.[paid]', 'breakpoint', 'paid'), scope());
        expect([c.name, c.kind, c.text, c.output.defect]).toEqual(['paid', 'breakpoint', 'model.[paid]', null]);
    });

    it('X.[marked] compiles with no declaration at all, the State machine profile (mutant: marked read as undeclared)', () => {
        expect(compileWatch(w('locked.[marked] or unlocked.[marked] or off.[marked]'), scope(BARE)).output.defect).toBeNull();
        expect(compileWatch(w('locked.[marked]'), scope(BARE, snapshot())).output.defect).toBeNull();
    });

    it('node.[x] is refused at compile: presentation, not σ (R-SIM-108; mutant: E-NODE dropped)', () => {
        expect(compileWatch(w('node.[shade] == 1'), scope()).output.defect?.code).toBe('node');
        expect(compileWatch(w('locked.[shade] == \'red\''), scope()).output.defect?.code).toBe('node');
    });

    it('event is refused at compile: it is null after every step (mutant: the event check dropped)', () => {
        expect(compileWatch(w('event == null', 'breakpoint'), scope()).output.defect?.code).toBe('event');
    });

    it('an input variable is refused at compile: chosen per step, never in σ (R-SIM-88; mutant: the input check dropped)', () => {
        expect(compileWatch(w('model.[power]'), scope()).output.defect?.code).toBe('input');
    });

    it('an undeclared name is refused at compile, named as the panel names it (mutant: R1 dropped)', () => {
        const c = compileWatch(w('model.[nope] <= 3'), scope());
        expect([c.output.defect?.code, c.output.defect?.short]).toEqual(['undeclared', "undeclared 'nope'"]);
    });

    it('a blank text and a parse error are defects, never a watch that holds (mutant: blank compiled to true)', () => {
        expect(compileWatch(w('  '), scope()).output.defect?.code).toBe('empty');
        expect(compileWatch(w('model.[coins] <='), scope()).output.defect?.code).toBe('parse');
    });
});

describe('evaluateWatch: the boolean check, with self the model root and event null (W2)', () => {
    it('X.[marked] reads the marking under State machine: true on the marked place, false elsewhere (mutant: the state accessor not set)', () => {
        expect(read('locked.[marked]', sigma('locked', 0, false), BARE)).toEqual({ kind: 'value', value: true });
        expect(read('unlocked.[marked]', sigma('locked', 0, false), BARE)).toEqual({ kind: 'value', value: false });
    });

    it('model.[x] and self.[x] read the same global: self is the model root (mutant: self bound to something else)', () => {
        for (const coins of [0, 2, 3]) {
            expect(read('self.[coins] == model.[coins]', sigma('locked', coins, coins >= 2))).toEqual({ kind: 'value', value: true });
        }
        expect(read('self.[coins] <= 2', sigma('locked', 3, true))).toEqual({ kind: 'value', value: false });
        expect(read('model.[coins] <= 2', sigma('locked', 2, true))).toEqual({ kind: 'value', value: true });
    });

    it('a DEFINE is read from σ\'s derived map (mutant: the derived values not read)', () => {
        expect(read('model.[paid]', sigma('unlocked', 2, true))).toEqual({ kind: 'value', value: true });
        expect(read('model.[paid]', sigma('unlocked', 1, false))).toEqual({ kind: 'value', value: false });
    });

    it('a value that is not a boolean is a defect at evaluation, named by its type (mutants: a number read as truthy; the check dropped)', () => {
        const number = read('1 + 1', sigma('locked', 0, false));
        expect(number.kind).toBe('defect');
        expect(number.kind === 'defect' ? number.short : '').toBe('non-boolean: number');
        const text = read('\'a\'', sigma('locked', 0, false));
        expect(text.kind === 'defect' ? text.short : '').toBe('non-boolean: string');
        const coins = read('model.[coins]', sigma('locked', 1, false));
        expect(coins.kind === 'defect' ? coins.short : '').toBe('non-boolean: number');
    });

    it('a compile defect reads as a defect, its short form kept; never throws (mutant: the compile defect evaluated)', () => {
        const r = read('node.[shade] == 1', sigma('locked', 0, false));
        expect(r).toMatchObject({ kind: 'defect', short: 'reads node' });
        expect(() => read('nowhere.[marked] and (', sigma('locked', 0, false))).not.toThrow();
    });
});

describe('the hit rule: an invariant false, a breakpoint true (W3, level-triggered)', () => {
    const T: WatchReading = { kind: 'value', value: true };
    const F: WatchReading = { kind: 'value', value: false };
    const D: WatchReading = { kind: 'defect', short: 'non-boolean: number', detail: 'x' };

    it('invariant: hit when false; breakpoint: hit when true (mutants: the two kinds swapped; a breakpoint on false)', () => {
        expect([isWatchHit('invariant', F), isWatchHit('invariant', T), isWatchHit('breakpoint', T), isWatchHit('breakpoint', F)])
            .toEqual([true, false, true, false]);
    });

    it('a defect is never a hit, of either kind: it is shown on the watch, not a stop (mutant: a defect read as false)', () => {
        expect([isWatchHit('invariant', D), isWatchHit('breakpoint', D)]).toEqual([false, false]);
    });

    it('readWatches reads every watch in declaration order, each with its reading and its hit (mutants: the first hit only; the order sorted)', () => {
        const snap = snapshot();
        const watches = [
            w('model.[paid]', 'breakpoint', 'zPaid'),
            w('model.[coins] <= 2', 'invariant', 'aCoins'),
            w('1 + 1', 'invariant', 'broken'),
            w('off.[marked]', 'breakpoint', 'off'),
        ].map(x => compileWatch(x, scope(NET, snap)));
        const results = readWatches(watches, snap, NET, sigma('unlocked', 3, true));
        expect(results.map(r => [r.watch.name, r.reading.kind, r.hit])).toEqual([
            ['zPaid', 'value', true], ['aCoins', 'value', true], ['broken', 'defect', false], ['off', 'value', false],
        ]);
        // level-triggered: the same σ gives the same hits every time it is read
        expect(readWatches(watches, snap, NET, sigma('unlocked', 3, true)).map(r => r.hit)).toEqual([true, true, false, false]);
        expect(readWatches(watches, snap, NET, sigma('locked', 0, false)).map(r => r.hit)).toEqual([false, false, false, false]);
    });
});
