/**
 * boardOutputs — an output device's expression, compiled and evaluated as a global
 * DEFINE (R-SIM-110, R-SIM-111; P-2026-10-03-1845 Lane 1, report §4).
 *
 * The fixture is the DemoESM turnstile of the demo script §2.3 written by hand:
 * places `locked`, `unlocked`, `off`; globals `coins` (VAR, 0..3), `paid` (DEFINE,
 * `model.[coins] >= 2`), `power` (IVAR); a presentation `shade` on `locked`. The
 * ten outputs and their values are the probe's of the discovery (io-board-outputs.ts,
 * measured on the real app). Each test name says which break of the rule kills it;
 * the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { compileOutput, evaluateOutput, pulseLit } from '../boardOutputs';
import type { OutputScope } from '../boardOutputs';
import { freezeSnapshot } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
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

const TEN = [
    'locked.[marked]', 'unlocked.[marked]', 'off.[marked]',
    'model.[coins]', 'model.[paid]', 'model.[coins] >= 2', 'model.[coins] * 10 + 1',
    'model.[paid] and locked.[marked]', 'unlocked.[marked] or off.[marked]', 'not model.[paid]',
];

const scope = (net: Net = NET, snap?: SimSnapshot): OutputScope => ({ net, snapshot: snap, nameOf: id => id });

function readAll(texts: readonly string[], state: SimState, net: Net = NET): Array<SimValue | string> {
    const snap = snapshot();
    return texts.map(t => {
        const r = evaluateOutput(compileOutput(t, scope(net, snap)), snap, net, state);
        return r.kind === 'value' ? r.value : `defect: ${r.detail}`;
    });
}

describe('compileOutput: the checks of a global semantic DEFINE (derivedEvaluator.compileDerived) and R1', () => {
    it('the ten outputs of the probe compile, with and without the snapshot', () => {
        for (const t of TEN) {
            expect(compileOutput(t, scope()).defect).toBeNull();
            expect(compileOutput(t, scope(NET, snapshot())).defect).toBeNull();
        }
    });

    it('blank is a defect: no expression is never true (mutant: blank compiles to nothing)', () => {
        expect(compileOutput('  ', scope()).defect?.code).toBe('empty');
    });

    it('a parse error is a defect with its position', () => {
        const c = compileOutput('model.[coins] +', scope());
        expect(c.defect?.code).toBe('parse');
        expect(c.expr).toBeNull();
    });

    it('node.[x] is E-NODE: an output is semantic, presentation stays out of σ and of the export (R-SIM-18)', () => {
        expect(compileOutput('node.[shade]', scope()).defect?.code).toBe('node');
    });

    it('a read of a presentation name through .[x] is E-NODE too (mutant: the presentation-name check dropped)', () => {
        expect(compileOutput('locked.[shade]', scope()).defect?.code).toBe('node');
    });

    it('event is a defect: after a step it is null, an output is a function of σ alone (mutant: the event check dropped)', () => {
        expect(compileOutput('event.name', scope()).defect?.code).toBe('event');
        expect(compileOutput('model.[coins] + event', scope()).defect?.code).toBe('event');
    });

    it('an IVAR is a defect: it is chosen per step and never in σ (R-SIM-88; mutant: the input check dropped)', () => {
        expect(compileOutput('model.[power]', scope()).defect?.code).toBe('input');
    });

    it('a name no declaration has is undeclared, named in the short form the panel uses (mutant: R1 dropped)', () => {
        const c = compileOutput('model.[nope]', scope());
        expect(c.defect?.code).toBe('undeclared');
        expect(c.defect?.short).toBe("undeclared 'nope'");
    });

    it('R2 with the run\'s snapshot: the element left of .[x] folded over M, as the run will read it (mutant: R2 dropped; mutant: checked on the name only)', () => {
        const snap = snapshot();
        expect(compileOutput('tc.[marked]', scope(NET, snap)).defect).toMatchObject({ code: 'unresolved', short: "'marked' on tc, not a place" });
        expect(compileOutput('locked.[coins]', scope(NET, snap)).defect).toMatchObject({ code: 'undeclared', short: "undeclared 'coins' on locked" });
        expect(compileOutput('nowhere.[marked]', scope(NET, snap)).defect?.code).toBe('unresolved');
        // controls: the model root and a place read as the run reads them; a lambda's variable is not folded
        expect(compileOutput('model.[coins] + self.[coins]', scope(NET, snap)).defect).toBeNull();
        expect(compileOutput('locked.[marked] and off.[tokens] == 0', scope(NET, snap)).defect).toBeNull();
        expect(compileOutput('instances.any(x => x.[marked])', scope(NET, snap)).defect).toBeNull();
    });

    it('marked and tokens are every place\'s: X.[marked] compiles with no declaration at all (the State machine profile, H5)', () => {
        expect(compileOutput('locked.[marked]', scope(BARE)).defect).toBeNull();
        expect(compileOutput('off.[tokens] > 0', scope(BARE)).defect).toBeNull();
        expect(compileOutput('model.[coins]', scope(BARE)).defect?.code).toBe('undeclared');
    });
});

describe('evaluateOutput: self the model root, event null, σ through the core\'s accessor', () => {
    it('the ten outputs on steps 0, 4, 5 and 10 of the ESM table read as the probe measured them on the app', () => {
        expect(readAll(TEN, sigma('locked', 0, false))).toEqual([true, false, false, 0, false, false, 1, false, false, true]);
        expect(readAll(TEN, sigma('locked', 2, true))).toEqual([true, false, false, 2, true, true, 21, true, false, false]);
        expect(readAll(TEN, sigma('unlocked', 0, false))).toEqual([false, true, false, 0, false, false, 1, false, true, true]);
        expect(readAll(TEN, sigma('locked', 3, true))).toEqual([true, false, false, 3, true, true, 31, true, false, false]);
    });

    it('a DEFINE is read from σ\'s derived map, never recomputed by the board (mutant: stored map only)', () => {
        const s = sigma('locked', 0, true); // paid true against its equation: the board reads what the run derived
        expect(readAll(['model.[paid]'], s)).toEqual([true]);
    });

    it('self is the model root, as for a global equation (mutant: self bound to null or to a place)', () => {
        expect(readAll(['self.name', 'self.id == model.id'], sigma('locked', 0, false))).toEqual(['demoESM', true]);
    });

    it('X.[marked] reads the marking with no declaration (State machine): locked, then off after stop', () => {
        expect(readAll(['locked.[marked]', 'off.[marked]'], sigma('locked', 0, false), BARE)).toEqual([true, false]);
        expect(readAll(['locked.[marked]', 'off.[marked]'], sigma('off', 0, false), BARE)).toEqual([false, true]);
    });

    it('without a snapshot, .[marked] on a non-place compiles and fails at evaluation: a defect, never a value, never a throw (report H6)', () => {
        const snap = snapshot();
        const c = compileOutput('tc.[marked]', scope());
        expect(c.defect).toBeNull();
        expect(evaluateOutput(c, snap, NET, sigma('locked', 0, false)).kind).toBe('defect');
    });

    it('an absent identifier, and a value that is no scalar, are defects (mutant: absence ignored, null accepted)', () => {
        const [absent, divided] = readAll(['nowhere', '1 / 0'], sigma('locked', 0, false));
        expect(absent).toMatch(/^defect: 'nowhere' does not exist/);
        expect(divided).toMatch(/^defect: the value is/);
    });

    it('a compiled defect is never evaluated: its reading is the defect (mutant: the defect guard dropped)', () => {
        const snap = snapshot();
        const r = evaluateOutput(compileOutput('model.[nope]', scope()), snap, NET, sigma('locked', 0, false));
        expect(r).toEqual({ kind: 'defect', detail: expect.stringContaining("'nope'") });
    });
});

describe('pulseLit: the Pulse LED reads the trace, not σ (R-SIM-111)', () => {
    const TRACE = [
        { event: 'coin', selector: 'tc', kind: 'fired' as const },
        { event: 'push', selector: null, kind: 'discard' as const },
        { event: 'push', selector: 'tp', kind: 'halted' as const },
        { event: null, selector: 'te', kind: 'fired' as const },
    ];

    it('lit on the step whose fired transition is the one named, or whose input is the event named', () => {
        expect(pulseLit(TRACE, 1, { kind: 'transition', id: 'tc' })).toBe(true);
        expect(pulseLit(TRACE, 1, { kind: 'event', id: 'coin' })).toBe(true);
        expect(pulseLit(TRACE, 4, { kind: 'transition', id: 'te' })).toBe(true);
    });

    it('dark on another step: the pulse is for one step only (mutant: any step of the trace)', () => {
        expect(pulseLit(TRACE, 4, { kind: 'transition', id: 'tc' })).toBe(false);
        expect(pulseLit(TRACE, 4, { kind: 'event', id: 'coin' })).toBe(false);
    });

    it('dark on a discard and on a halted step: nothing fired (mutant: kind not checked)', () => {
        expect(pulseLit(TRACE, 2, { kind: 'event', id: 'push' })).toBe(false);
        expect(pulseLit(TRACE, 3, { kind: 'transition', id: 'tp' })).toBe(false);
    });

    it('dark at Reset and out of the trace', () => {
        expect(pulseLit(TRACE, 0, { kind: 'transition', id: 'tc' })).toBe(false);
        expect(pulseLit(TRACE, 5, { kind: 'transition', id: 'tc' })).toBe(false);
        expect(pulseLit([], 0, { kind: 'event', id: 'coin' })).toBe(false);
    });
});
