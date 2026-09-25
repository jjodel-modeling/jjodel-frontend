/**
 * simRoleStatus — what the simulation panel says is missing (P-2026-09-24-1005,
 * per shape since step 3b, P-2026-09-25-1103).
 *
 * Executes the pure module the panel reads (P11); the panel itself imports the
 * joiner and does not load under this bench. Each test name says which break
 * of the rule kills it; the mutation bench is in the commit message.
 *
 * `netStcFromRoles` is the engine's own completeness rule: the parity test runs
 * it on the same bags, so the panel's gate and the engine cannot drift apart.
 */

import { describe, it, expect } from 'vitest';
import {
    ENGINE_ROLE_KEYS,
    eventRoleWarning,
    incompleteConfigurationMessage,
    invalidEngineRoles,
    missingEngineRoles,
    ROLE_SPECS,
} from '../simRoleStatus';
import type { Roles } from '../simRoleStatus';
import { netStcFromRoles } from '../../../../model/simulation/netCompile';

/** A runnable control-flow bag: an initial rule, a source rule, the next state. */
const CF: Roles = { simInitial: 'C_Initial', simOwnedTransitions: 'R_out', simNextState: 'R_next' };
/** A runnable Petri bag: the arc role selects the shape (R-SIM-31). */
const PETRI: Roles = {
    simArc: 'C_Arc', simNode: 'C_Place', simTransition: 'C_Trans', simArcSource: 'R_src', simArcTarget: 'R_tgt', simInitialMarking: 'A_m',
};
const DECLARATIVE: Roles = { simTerminal: 'C_Final', simEvent: 'C_Event', simTrigger: 'R_trigger', simEventIdentifier: 'A_name', simGuard: 'A_g' };

describe('missingEngineRoles, per shape (R-SIM-28, R-SIM-31)', () => {
    it('control flow: the three requirements, a pair as one entry, in ROLE_SPECS order, whatever else is set', () => {
        const all = ['Initial or Initial marking', 'Owned transitions or Source', 'Next state'];
        expect(missingEngineRoles({})).toEqual(all);
        expect(missingEngineRoles(DECLARATIVE)).toEqual(all);
        expect(missingEngineRoles({ ...CF, ...DECLARATIVE })).toEqual([]);
    });

    it('control flow: either member of a pair will do (Source for Owned transitions, Initial marking for Initial)', () => {
        expect(missingEngineRoles({ ...CF, simOwnedTransitions: undefined, simSource: 'R_src' })).toEqual([]);
        expect(missingEngineRoles({ ...CF, simInitial: undefined, simInitialMarking: 'A_m' })).toEqual([]);
        // control: neither member of the pair
        expect(missingEngineRoles({ ...CF, simOwnedTransitions: undefined })).toEqual(['Owned transitions or Source']);
        expect(missingEngineRoles({ ...CF, simInitial: undefined })).toEqual(['Initial or Initial marking']);
    });

    it('Petri: names exactly the one required key left unset (the five keys)', () => {
        const labels: Record<string, string> = {
            simNode: 'Node', simInitialMarking: 'Initial marking', simTransition: 'Transition', simArcSource: 'Arc source', simArcTarget: 'Arc target',
        };
        for (const key of Object.keys(labels)) {
            expect(missingEngineRoles({ ...PETRI, [key]: undefined })).toEqual([labels[key]]);
        }
        expect(missingEngineRoles({ simArc: 'C_Arc' })).toEqual(['Node', 'Initial marking', 'Transition', 'Arc source', 'Arc target']);
        // control: complete, and the control-flow keys are not asked of a Petri bag
        expect(missingEngineRoles(PETRI)).toEqual([]);
    });

    it('Terminal is never required (R-SIM-28): a bag without it runs on both shapes', () => {
        expect(missingEngineRoles(CF)).toEqual([]);
        expect(missingEngineRoles(PETRI)).toEqual([]);
        expect(netStcFromRoles(CF)).not.toBeNull();
        expect(netStcFromRoles(PETRI)).not.toBeNull();
    });

    it('counts an empty string as unset (non-empty rule, not "defined")', () => {
        expect(missingEngineRoles({ ...CF, simNextState: '' })).toEqual(['Next state']);
        expect(missingEngineRoles({ ...PETRI, simNode: '' })).toEqual(['Node']);
    });
});

describe('invalidEngineRoles: the bound (R-SIM-23, R-SIM-37)', () => {
    it('a whole number >= 1 in digits is valid; unset is valid (default 1)', () => {
        for (const ok of ['1', '2', ' 3 ', '10']) expect(invalidEngineRoles({ ...CF, simBound: ok })).toEqual([]);
        expect(invalidEngineRoles(CF)).toEqual([]);
    });

    it('zero, a sign, a fraction or a word is invalid, and says why', () => {
        for (const bad of ['0', '-1', '1.5', 'x', '2e1']) {
            expect(invalidEngineRoles({ ...CF, simBound: bad })).toEqual(['Bound (a whole number ≥ 1)']);
        }
    });
});

describe('parity with the engine (replaces the 16-subset parity of step 1)', () => {
    const BOUNDS: Array<string | undefined> = [undefined, '2', '0', 'x'];
    const VALUES: Record<string, string> = {
        simNextState: 'R_next', simOwnedTransitions: 'R_out', simSource: 'R_src', simInitial: 'C_Initial', simInitialMarking: 'A_m',
        simNode: 'C_Place', simTransition: 'C_Trans', simArc: 'C_Arc', simArcSource: 'R_src2', simArcTarget: 'R_tgt',
    };

    const bags = (): Roles[] => {
        const out: Roles[] = [];
        for (let mask = 0; mask < 1 << ENGINE_ROLE_KEYS.length; mask++) {
            for (const bound of BOUNDS) {
                const bag: Roles = { ...DECLARATIVE };
                ENGINE_ROLE_KEYS.forEach((key, i) => { if (mask & (1 << i)) bag[key] = VALUES[key]; });
                if (bound !== undefined) bag.simBound = bound;
                out.push(bag);
            }
        }
        return out;
    };

    it('nothing missing and nothing invalid exactly when netStcFromRoles builds an STC, over 4096 bags (both shapes, four bounds)', () => {
        let runnable = 0;
        const all = bags();
        expect(all).toHaveLength(4096);
        for (const bag of all) {
            const gate = missingEngineRoles(bag).length === 0 && invalidEngineRoles(bag).length === 0;
            expect(gate).toBe(netStcFromRoles(bag) !== null);
            if (gate) runnable++;
        }
        // control: the parity is not vacuous, some bags run and some do not
        expect(runnable).toBeGreaterThan(0);
        expect(runnable).toBeLessThan(all.length);
    });

    it('Terminal changes neither side on any bag (R-SIM-28)', () => {
        for (const bag of bags()) {
            const without: Roles = { ...bag, simTerminal: undefined };
            expect(missingEngineRoles(without)).toEqual(missingEngineRoles(bag));
            expect(netStcFromRoles(without) !== null).toBe(netStcFromRoles(bag) !== null);
        }
    });
});

describe('the event role specs (R-SIM-38)', () => {
    it('simEvent stays a readable key, so the panel copies the derived value into its roles', () => {
        expect(ROLE_SPECS.map(spec => spec.key)).toContain('simEvent');
        // control: its partners are there too
        expect(ROLE_SPECS.map(spec => spec.key)).toEqual(expect.arrayContaining(['simTrigger', 'simEventIdentifier']));
    });

    it('the identifier is an override of name: its empty option reads "name (default)"', () => {
        expect(ROLE_SPECS.find(spec => spec.key === 'simEventIdentifier')?.placeholder).toBe('name (default)');
    });
});

describe('messages', () => {
    it('incomplete configuration names the metamodel and the labels, comma-separated (GO wording)', () => {
        expect(incompleteConfigurationMessage('Smoke', ['Next state']))
            .toBe('Simulation not configured. Missing on Smoke: Next state.');
        expect(incompleteConfigurationMessage('Smoke', missingEngineRoles({})))
            .toBe('Simulation not configured. Missing on Smoke: Initial or Initial marking, Owned transitions or Source, Next state.');
    });

    it('incomplete configuration falls back to "the metamodel" when the name is empty', () => {
        expect(incompleteConfigurationMessage('', ['Initial']))
            .toBe('Simulation not configured. Missing on the metamodel: Initial.');
    });

    it('the event warning names the metamodel on the model face only (null is the metamodel face)', () => {
        expect(eventRoleWarning(['Trigger'], 'Smoke')).toBe('Events disabled. Missing on Smoke: Trigger.');
        expect(eventRoleWarning(['Event'], null)).toBe('Events disabled. Missing: Event.');
        expect(eventRoleWarning(['Trigger'], '')).toBe('Events disabled. Missing on the metamodel: Trigger.');
    });
});
