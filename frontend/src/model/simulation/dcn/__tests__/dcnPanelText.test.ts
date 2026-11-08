/**
 * dcnPanelText — the panel's words for a DCN run (P-2026-11-08-0303,
 * continuing P-2026-11-08-0248 decision 5; R-DCN-3, R-DCN-22).
 *
 * The step model is built by hand: dji with the viewpoints Mode {Ready, Flying,
 * Charging} and Alert {Nominal, Windy}, a static `takeOff` redefined in Flying,
 * a static `charge(rate)`, the Flying monitor `drain` on the tick, and wau1, an
 * instance with slots and no viewpoint. The classifications are given, not
 * computed: the texts read them. Each test names the mutant it kills (the bench
 * is in the commit).
 */

import { describe, it, expect } from 'vitest';
import {
    DCN_PANEL_HEADING, dcnCandidateLabel, dcnDefectsLine, dcnLastStepText, dcnMarkingChips, dcnMarkingLine,
} from '../dcnPanelText';
import { DCN_SYNC_SELECTOR } from '../dcnStep';
import type { DcnClassification, DcnStepModel } from '../dcnStep';
import { DCN_TICK_EVENT } from '../dcnCompile';
import type { DcnEntry, DcnSlot } from '../dcnCompile';
import type { DcnDynamicClass } from '../dcnHandles';
import type { CompiledNet, DeclarationDefect, HaltReason, InputRead, NetLabel, SimState, SimValue, StepOutcome } from '../../netTypes';

// ── the step model ───────────────────────────────────────────────────────────

const NAMES: Record<string, string> = {
    dji: 'dji', wau1: 'wau1',
    'op-takeOff': 'takeOff', 'op-takeOff-flying': 'takeOff', 'op-charge': 'charge', 'mon-drain': 'drain',
    'vp-mode': 'Mode', 'vp-alert': 'Alert',
    'dc-ready': 'Ready', 'dc-flying': 'Flying', 'dc-charging': 'Charging', 'dc-nominal': 'Nominal', 'dc-windy': 'Windy',
};
const nameOf = (id: string): string => NAMES[id] ?? id;

const dc = (id: string, viewpoint: string): DcnDynamicClass => ({ id, viewpoint, name: NAMES[id], invariant: null, problem: null });

const RATE: InputRead = { element: 't_charge', attr: 'rate', domain: { kind: 'range', min: 0, max: 10 } };

function entry(id: string, kind: DcnEntry['kind'], element: string, viewpoint: string | null, dynamicClass: string | null, inputs: InputRead[] = []): DcnEntry {
    return { id, kind, instance: 'dji', element, viewpoint, dynamicClass, guard: { precondition: null, classifiedAs: dynamicClass }, body: [], inputs };
}

const ENTRIES = new Map<string, DcnEntry>([
    ['t_takeOff', entry('t_takeOff', 'invocation', 'op-takeOff', null, null)],
    ['t_Flying_takeOff', entry('t_Flying_takeOff', 'invocation', 'op-takeOff-flying', 'vp-mode', 'dc-flying')],
    ['t_charge', entry('t_charge', 'invocation', 'op-charge', null, null, [RATE])],
    ['t_drain', entry('t_drain', 'tick', 'mon-drain', 'vp-mode', 'dc-flying')],
]);

const slot = (feature: string, dormantOwner: string | null = null): DcnSlot => ({ feature, dormantOwner });

const SLOTS = new Map<string, Map<string, DcnSlot>>([
    ['dji', new Map([['battery', slot('f-battery')], ['altitude', slot('f-altitude', 'dc-flying')], ['rateSet', slot('f-rate', 'dc-charging')]])],
    ['wau1', new Map([['speed', slot('f-speed')]])],
]);

function net(defects: DeclarationDefect[] = []): CompiledNet {
    return {
        modelId: 'm1', places: new Set(), transitions: [], bound: 1, final: null, hasEventRole: true,
        attributes: [], declared: new Map(), initial: { marking: new Map(), attrs: new Map(), presentation: new Map() },
        defects: [], declarationDefects: defects,
    } as unknown as CompiledNet;
}

const MODEL: DcnStepModel = {
    model: {
        compiled: { net: net(), entries: ENTRIES, slots: SLOTS, unexportable: [] },
        instances: new Map([
            ['dji', {
                id: 'dji', name: 'dji', classifier: 'Drone', links: new Map(),
                viewpoints: new Map([
                    ['Mode', new Map([['Ready', dc('dc-ready', 'Mode')], ['Flying', dc('dc-flying', 'Mode')], ['Charging', dc('dc-charging', 'Mode')]])],
                    ['Alert', new Map([['Nominal', dc('dc-nominal', 'Alert')], ['Windy', dc('dc-windy', 'Alert')]])],
                ]),
            }],
            ['wau1', { id: 'wau1', name: 'wau1', classifier: 'Sensor', links: new Map(), viewpoints: new Map() }],
        ]),
    },
    flags: new Map(),
    redefines: new Map([['t_Flying_takeOff', 't_takeOff']]),
};

function classified(mode: string[], alert: string[] = ['Nominal']): DcnClassification {
    return {
        classes: new Map([['dji', new Map([['Mode', mode], ['Alert', alert]])], ['wau1', new Map()]]),
        halt: null,
    };
}

function sigma(dji: Record<string, SimValue> = {}): SimState {
    return {
        marking: new Map(),
        attrs: new Map([
            ['dji', new Map(Object.entries({ battery: 80, altitude: 0, rateSet: 0, ...dji }))],
            ['wau1', new Map([['speed', 3]])],
        ]),
        presentation: new Map(),
    };
}

const label = (selector: string | null, event: string | null = selector): NetLabel =>
    ({ event, selector, candidates: selector ? [selector] : [], evaluated: [], consumed: [], produced: [], assignments: [] }) as NetLabel;

// ── the classification line, its title and its chips ─────────────────────────

describe('dcnPanelText: the classification line (decision 5)', () => {
    it('reads instance, viewpoint and class in model order; wau1, with no viewpoint, is left out (mutants: wau1 kept, viewpoints reordered)', () => {
        expect(dcnMarkingLine(sigma(), MODEL, classified(['Ready'])).line).toBe('Classification: dji: Mode = Ready, Alert = Nominal');
    });

    it('a viewpoint with no active class reads unclassified, two read joined by + (mutants: the empty class list printed empty, the join word)', () => {
        expect(dcnMarkingLine(sigma(), MODEL, classified([], ['Nominal', 'Windy'])).line)
            .toBe('Classification: dji: Mode = unclassified, Alert = Nominal + Windy');
    });

    it('the heading of a DCN run is Classification', () => {
        expect(DCN_PANEL_HEADING).toBe('Classification');
    });

    it('the title adds one line per instance with its slot values, (dormant) on a slot whose class is inactive (R-DCN-3; mutants: dormant on every owned slot, wau1 left out of the title)', () => {
        const { line, title } = dcnMarkingLine(sigma({ altitude: 12 }), MODEL, classified(['Ready']));
        expect(title.split('\n')).toEqual([
            line,
            'dji: battery = 80, altitude = 12 (dormant), rateSet = 0 (dormant)',
            'wau1: speed = 3',
        ]);
    });

    it('in Flying the altitude slot is live, the Charging one stays dormant (mutant: dormancy read off the first dynamic class)', () => {
        expect(dcnMarkingLine(sigma(), MODEL, classified(['Flying'])).title.split('\n')[1])
            .toBe('dji: battery = 80, altitude = 0, rateSet = 0 (dormant)');
    });

    it('the chips are the segments of the line, one per viewpoint of an instance (decision 4)', () => {
        expect(dcnMarkingChips(MODEL, classified(['Flying'], ['Windy']))).toEqual([
            { place: 'dji#Mode', name: 'dji.Mode', tokens: 1, text: 'dji.Mode = Flying' },
            { place: 'dji#Alert', name: 'dji.Alert', tokens: 1, text: 'dji.Alert = Windy' },
        ]);
    });
});

// ── the candidates and the last step ─────────────────────────────────────────

describe('dcnPanelText: the candidate labels (decision 5, R-DCN-22)', () => {
    it('an invocation reads instance and operation; the active redefinitions follow it (mutants: redefinition shown when its class is inactive, never shown)', () => {
        expect(dcnCandidateLabel(MODEL, 't_takeOff', nameOf, classified(['Ready']))).toBe('dji.takeOff()');
        expect(dcnCandidateLabel(MODEL, 't_takeOff', nameOf, classified(['Flying']))).toBe('dji.takeOff() + Mode::Flying');
        expect(dcnCandidateLabel(MODEL, 't_takeOff', nameOf, null)).toBe('dji.takeOff()');
    });

    it('the arguments: names before the press, values after (mutant: the values ignored)', () => {
        expect(dcnCandidateLabel(MODEL, 't_charge', nameOf, null)).toBe('dji.charge(rate)');
        expect(dcnCandidateLabel(MODEL, 't_charge', nameOf, null, [{ element: 't_charge', attr: 'rate', value: 5 }])).toBe('dji.charge(rate = 5)');
    });

    it('a tick contribution reads its viewpoint, class and monitor; the Sync selector reads sync; an unknown id its name (mutant: the viewpoint id printed)', () => {
        expect(dcnCandidateLabel(MODEL, 't_drain', nameOf, null)).toBe('tick: Mode::Flying drain');
        expect(dcnCandidateLabel(MODEL, DCN_SYNC_SELECTOR, nameOf, null)).toBe('sync');
        expect(dcnCandidateLabel(MODEL, 'dji', nameOf, null)).toBe('dji');
    });

    it('a redefinition by itself names its class', () => {
        expect(dcnCandidateLabel(MODEL, 't_Flying_takeOff', nameOf, null)).toBe('dji.takeOff() in Mode::Flying');
    });

    it('the last step: fired, halted with the halt words, discarded, refused (mutants: the halt words dropped, the classification before the step ignored)', () => {
        const before = classified(['Flying']);
        const fired: StepOutcome = { kind: 'fired', next: { state: sigma(), event: null }, label: label('t_takeOff') };
        expect(dcnLastStepText(fired, MODEL, nameOf, before, 'takeOff')).toBe('takeOff: dji.takeOff() + Mode::Flying fired');
        const reason: HaltReason = { kind: 'unclassified', element: 'dji', viewpoint: 'Mode' };
        const halted: StepOutcome = { kind: 'halted', reason, next: { state: sigma(), event: null }, label: label('t_takeOff') };
        expect(dcnLastStepText(halted, MODEL, nameOf, before, 'takeOff')).toBe('takeOff: dji.takeOff() + Mode::Flying halted the run: dji in no class of Mode');
        const ambiguous: StepOutcome = { ...halted, reason: { kind: 'ambiguous', element: 'dji', viewpoint: 'Alert', classes: ['Nominal', 'Windy'] } };
        expect(dcnLastStepText(ambiguous, MODEL, nameOf, before, 'tick')).toBe('tick: dji.takeOff() + Mode::Flying halted the run: dji in Nominal + Windy of Alert');
        const discard: StepOutcome = { kind: 'discard', next: { state: sigma(), event: DCN_TICK_EVENT }, label: label(null, DCN_TICK_EVENT) };
        expect(dcnLastStepText(discard, MODEL, nameOf, before, 'tick')).toBe('tick: discarded, no contribution accepted it');
        const refused: StepOutcome = { kind: 'inadmissible', label: label('t_Flying_takeOff') };
        expect(dcnLastStepText(refused, MODEL, nameOf, before, 'takeOff')).toBe('takeOff: refused, dji.takeOff() in Mode::Flying is not a candidate');
    });

    it('a core halt reads its kind and the slot (mutant: the slot dropped)', () => {
        const halted: StepOutcome = {
            kind: 'halted', reason: { kind: 'double-assignment', element: 'dji', attr: 'battery' } as HaltReason,
            next: { state: sigma(), event: null }, label: label('t_charge'),
        };
        expect(dcnLastStepText(halted, MODEL, nameOf, null, 'charge')).toBe('charge: dji.charge(rate) halted the run: double-assignment of dji.battery');
    });
});

// ── the defects ──────────────────────────────────────────────────────────────

describe('dcnPanelText: the defects line', () => {
    it('none is null; the declaration defects read element.slot (message), the first three then a count (mutant: the count dropped)', () => {
        expect(dcnDefectsLine(net(), nameOf)).toBeNull();
        const d = (name: string | null, element: string): DeclarationDefect => ({ index: null, name, code: 'initial', message: 'no slot and no default', element });
        expect(dcnDefectsLine(net([d('battery', 'dji')]), nameOf)).toBe('1 defect: dji.battery (no slot and no default).');
        expect(dcnDefectsLine(net([d('a', 'dji'), d('b', 'dji'), d(null, 'wau1'), d('c', 'wau1')]), nameOf))
            .toBe('4 defects: dji.a (no slot and no default); dji.b (no slot and no default); wau1 (no slot and no default), and 1 more.');
    });
});
