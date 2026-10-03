/**
 * simViewerPrefs — the viewer preferences of the run (P-2026-10-03-0040; R-SIM-104
 * pins, R-SIM-107 tags and globals card, R-SIM-109 «Inspect node.[x]»; the I/O
 * board's skin and «Show bindings», R-SIM-114, P-2026-10-03-2000).
 *
 * Executes the module (P11) beside the run store: the prefs are per model, on a
 * channel of their own, untouched by the run primitives and never read by
 * `runSignature`. Both stores are module-level, so both are reset before every
 * test. Each test name says which break of the rule kills it; the mutation bench
 * is in the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    __resetSimViewerPrefsForTests, DEFAULT_SIM_VIEWER_PREFS, defaultSimPins, getSimViewerPrefs, getSimViewerPrefsVersion, MAX_SIM_PINS,
    setSimViewerPrefs,
} from '../simViewerPrefs';
import type { SimAttrRef, SimViewerPrefs } from '../simViewerPrefs';
import {
    __resetSimRunsForTests, getSimVersion, simClear, simCommit, simReset, simSetView,
} from '../simRunState';
import type { SimRun } from '../simRunState';
import { runSignature } from '../simBridge';
import { step } from '../../../../model/simulation/netStep';
import type { ActionOracle, CompiledNet, GuardOracle, StateAttributeDecl } from '../../../../model/simulation/netTypes';

const TRUE: GuardOracle = () => ({ kind: 'true' });
const NONE: ActionOracle = () => ({ kind: 'ok', assignments: [] });

/** a -t-> b -u-> a. */
const NET: CompiledNet = {
    modelId: 'M', places: new Set(['a', 'b']), bound: 1, final: null, hasEventRole: false, attributes: [], declared: new Map(), defects: [],
    transitions: [
        { id: 't', origin: ['t'], preset: [{ place: 'a', weight: 1 }], postset: [{ place: 'b', weight: 1 }], inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [] },
        { id: 'u', origin: ['u'], preset: [{ place: 'b', weight: 1 }], postset: [{ place: 'a', weight: 1 }], inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [] },
    ],
    initial: { marking: new Map([['a', 1]]), attrs: new Map(), presentation: new Map() },
};
const RUN: SimRun = { net: NET, config: { state: NET.initial, event: null }, halt: null, guards: TRUE, actions: NONE, alphabet: [], signature: 'sig' };

const pin = (name: string, metaclass: string | null = null, space: SimAttrRef['space'] = 'semantic'): SimAttrRef => ({ metaclass, name, space });
const EVERY: Partial<SimViewerPrefs> = {
    pins: [pin('coins')], tags: [pin('heat', 'C_State', 'presentation')], globalsCard: true, inspectNode: true, boardSkin: 'panel', showBindings: true,
};
/** The defaults in full, the board's two included (R-SIM-114). */
const DEFAULTS: SimViewerPrefs = { pins: null, tags: [], globalsCard: false, inspectNode: false, boardSkin: 'board', showBindings: false };

beforeEach(() => {
    __resetSimRunsForTests();
    __resetSimViewerPrefsForTests();
});

describe('the prefs of a model: defaults, per model, a change keeps what it does not name', () => {
    it('a model without prefs reads the defaults: default pins, no tag, no globals card, inspector off, the board skin, bindings hidden (mutant: another default)', () => {
        expect(getSimViewerPrefs('M')).toEqual<SimViewerPrefs>(DEFAULTS);
        expect(DEFAULT_SIM_VIEWER_PREFS).toEqual<SimViewerPrefs>(DEFAULTS);
        expect(MAX_SIM_PINS).toBe(4);
    });

    it('the board\'s skin defaults to Variant A, \'board\', and «Show bindings» to off (R-SIM-114; mutants: the front panel first, bindings shown)', () => {
        expect(getSimViewerPrefs('M').boardSkin).toBe('board');
        expect(getSimViewerPrefs('M').showBindings).toBe(false);
    });

    it('the skin and «Show bindings» are per model and kept apart from the other prefs (mutant: the skin shared by every model)', () => {
        setSimViewerPrefs('M1', { boardSkin: 'panel' });
        setSimViewerPrefs('M1', { showBindings: true });
        expect(getSimViewerPrefs('M1')).toEqual({ ...DEFAULTS, boardSkin: 'panel', showBindings: true });
        expect(getSimViewerPrefs('M2')).toEqual(DEFAULTS);
        expect(setSimViewerPrefs('M1', { pins: [pin('coins')] }).boardSkin).toBe('panel');
        expect(setSimViewerPrefs('M1', { boardSkin: 'board' })).toEqual({ ...DEFAULTS, pins: [pin('coins')], showBindings: true });
    });

    it('per model: a change of one model leaves another at the defaults, and a model switch back finds its own (mutant: one prefs for every model)', () => {
        setSimViewerPrefs('M1', EVERY);
        setSimViewerPrefs('M2', { globalsCard: true });
        expect(getSimViewerPrefs('M1')).toEqual({ ...DEFAULT_SIM_VIEWER_PREFS, ...EVERY });
        expect(getSimViewerPrefs('M2')).toEqual({ ...DEFAULT_SIM_VIEWER_PREFS, globalsCard: true });
        expect(getSimViewerPrefs('M3')).toEqual(DEFAULT_SIM_VIEWER_PREFS);
    });

    it('a change keeps what it does not name and returns the prefs stored; pins back to null is the default again (mutant: a change replaces the whole prefs)', () => {
        setSimViewerPrefs('M', { inspectNode: true });
        expect(setSimViewerPrefs('M', { pins: [pin('coins')] })).toEqual({ ...DEFAULT_SIM_VIEWER_PREFS, inspectNode: true, pins: [pin('coins')] });
        expect(setSimViewerPrefs('M', { pins: null }).pins).toBeNull();
        expect(getSimViewerPrefs('M').inspectNode).toBe(true);
    });

    it('at most four pins, the first four kept in order (mutants: no cap; the cap off by one)', () => {
        const six = ['a', 'b', 'c', 'd', 'e', 'f'].map(n => pin(n));
        expect(setSimViewerPrefs('M', { pins: six }).pins).toEqual(six.slice(0, 4));
        expect(setSimViewerPrefs('M', { pins: six.slice(0, 3) }).pins).toEqual(six.slice(0, 3));
        // tags are not capped
        expect(setSimViewerPrefs('M', { tags: six }).tags).toEqual(six);
    });

    it('the test reset drops every prefs and the counter (mutant: the prefs outlive __resetSimViewerPrefsForTests)', () => {
        setSimViewerPrefs('M', EVERY);
        __resetSimViewerPrefsForTests();
        expect(getSimViewerPrefs('M')).toEqual(DEFAULT_SIM_VIEWER_PREFS);
        expect(getSimViewerPrefsVersion()).toBe(0);
    });
});

describe('the channel of the prefs: their own, never the \'mark\' one', () => {
    it('a change bumps the prefs version by one and leaves the \'mark\' version, with a run in the store (mutant: a change bumps \'mark\')', () => {
        simReset('M', RUN);
        const mark = getSimVersion();
        const v = getSimViewerPrefsVersion();
        setSimViewerPrefs('M', EVERY);
        expect(getSimViewerPrefsVersion()).toBe(v + 1);
        setSimViewerPrefs('M', { inspectNode: false });
        expect(getSimViewerPrefsVersion()).toBe(v + 2);
        expect(getSimVersion()).toBe(mark);
    });

    it('the skin switch and «Show bindings» bump the prefs version, never the \'mark\' one, with a run in the store (R-SIM-114; mutant: the board\'s prefs on \'mark\')', () => {
        simReset('M', RUN);
        const mark = getSimVersion();
        const v = getSimViewerPrefsVersion();
        setSimViewerPrefs('M', { boardSkin: 'panel' });
        setSimViewerPrefs('M', { showBindings: true });
        expect(getSimViewerPrefsVersion()).toBe(v + 2);
        expect(getSimVersion()).toBe(mark);
    });

    it('the run primitives move the \'mark\' version and never the prefs one (mutant: the prefs read on the \'mark\' channel)', () => {
        const v = getSimViewerPrefsVersion();
        simReset('M', RUN);
        simCommit('M', step(NET, RUN.config, 't', TRUE, NONE));
        simSetView('M', 0);
        simSetView('M', null);
        simClear('M');
        expect(getSimVersion()).toBe(5);
        expect(getSimViewerPrefsVersion()).toBe(v);
    });

    it('kept across Reset, a commit, a view, Stop and a model switch: no run primitive touches them (mutant: simReset or simClear drop the prefs)', () => {
        setSimViewerPrefs('M', EVERY);
        simReset('M', RUN);
        simCommit('M', step(NET, RUN.config, 't', TRUE, NONE));
        simSetView('M', 0);
        simClear('M');
        simReset('M2', { ...RUN, net: { ...NET, modelId: 'M2' } });
        __resetSimRunsForTests();
        expect(getSimViewerPrefs('M')).toEqual({ ...DEFAULT_SIM_VIEWER_PREFS, ...EVERY });
    });

    it('never read by runSignature, never written into the lookup (R-SIM-6, R-SIM-104)', () => {
        const lookup: Record<string, any> = {
            MM: { className: 'DModel', id: 'MM', name: 'mm', _state: { simInitial: 'C', simStateAttributes: '{"v":1,"attrs":[]}' } },
            M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM', _state: {} },
            C: { className: 'DClass', id: 'C', name: 'State', attributes: [], references: [], extends: [] },
        };
        const before = structuredClone(lookup);
        const signature = runSignature(lookup, 'M', 'MM');
        const mark = getSimVersion();
        setSimViewerPrefs('M', EVERY);
        setSimViewerPrefs('MM', EVERY);
        expect(runSignature(lookup, 'M', 'MM')).toBe(signature);
        expect(lookup).toEqual(before);
        expect(getSimVersion()).toBe(mark);
    });
});

describe('defaultSimPins: what Watch shows with pins null (R-SIM-104)', () => {
    const decl = (name: string, metaclass: string | null, x: Partial<StateAttributeDecl> = {}): StateAttributeDecl =>
        ({ name, metaclass, space: 'semantic', domain: { kind: 'boolean' }, initial: false, ...x });

    it('globals first, then the metaclasses\' attributes, each group in declaration order (mutant: declaration order alone)', () => {
        const attrs = [decl('visits', 'C_State'), decl('coins', null), decl('heat', 'C_State'), decl('paid', null, { equation: 'true', initial: undefined })];
        expect(defaultSimPins(attrs)).toEqual([pin('coins'), pin('paid'), pin('visits', 'C_State'), pin('heat', 'C_State')]);
    });

    it('the first four only (mutants: no cap; the cap off by one)', () => {
        const attrs = ['a', 'b', 'c', 'd', 'e'].map(n => decl(n, null));
        expect(defaultSimPins(attrs).map(p => p.name)).toEqual(['a', 'b', 'c', 'd']);
        expect(defaultSimPins(attrs.slice(0, 3)).map(p => p.name)).toEqual(['a', 'b', 'c']);
        expect(defaultSimPins([])).toEqual([]);
    });

    it('σ only: a presentation attribute is never a default pin, an input is (R-SIM-102; mutant: the presentation pinned)', () => {
        const attrs = [
            decl('glow', null, { space: 'presentation', domain: null }), decl('amount', null, { input: true, initial: undefined }), decl('coins', null),
        ];
        expect(defaultSimPins(attrs)).toEqual([pin('amount'), pin('coins')]);
    });

    it('a name declared twice for the same owner is pinned once (mutant: one pin per declaration)', () => {
        expect(defaultSimPins([decl('coins', null), decl('coins', null), decl('coins', 'C_State')])).toEqual([pin('coins'), pin('coins', 'C_State')]);
    });
});
