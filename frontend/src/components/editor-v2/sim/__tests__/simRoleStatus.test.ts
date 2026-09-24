/**
 * simRoleStatus — what the simulation panel says is missing (P-2026-09-24-1005).
 *
 * Executes the pure module the panel reads (P11); the panel itself imports the
 * joiner and does not load under this bench. Each test name says which break
 * of the rule kills it; the mutation bench is in the commit message.
 *
 * `stcFromRoles` is the engine's own completeness rule: the parity tests run it
 * on the same bags, so the panel's gate and the engine cannot drift apart.
 */

import { describe, it, expect } from 'vitest';
import {
    ENGINE_ROLE_KEYS,
    eventRoleWarning,
    incompleteConfigurationMessage,
    missingEngineRoles,
    missingEventRoles,
} from '../simRoleStatus';
import type { Roles } from '../simRoleStatus';
import { stcFromRoles } from '../../../../model/simulation/stcFromRoles';

const ENGINE: Roles = { simInitial: 'C_Initial', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next' };
const DECLARATIVE: Roles = { simNode: 'C_Node', simTransition: 'C_Trans', simEvent: 'C_Event', simTrigger: 'R_trigger', simEventIdentifier: 'A_name' };

describe('missingEngineRoles', () => {
    it('lists only the four engine roles, in ROLE_SPECS order, whatever else is set (engine filter, order)', () => {
        const all = ['Initial', 'Terminal', 'Owned transitions', 'Next state'];
        expect(missingEngineRoles({})).toEqual(all);
        expect(missingEngineRoles(DECLARATIVE)).toEqual(all);
    });

    it('names exactly the one engine role left unset, Terminal included (the four keys)', () => {
        const labels: Record<string, string> = {
            simInitial: 'Initial', simTerminal: 'Terminal', simOwnedTransitions: 'Owned transitions', simNextState: 'Next state',
        };
        for (const key of ENGINE_ROLE_KEYS) {
            expect(missingEngineRoles({ ...ENGINE, ...DECLARATIVE, [key]: undefined })).toEqual([labels[key]]);
        }
        // control: the same bag with every engine role set misses nothing
        expect(missingEngineRoles({ ...ENGINE, ...DECLARATIVE })).toEqual([]);
    });

    it('counts an empty string as unset (non-empty rule, not "defined")', () => {
        expect(missingEngineRoles({ ...ENGINE, simNextState: '' })).toEqual(['Next state']);
    });

    it('is empty exactly when stcFromRoles builds a descriptor, over the 16 subsets of the engine keys (parity)', () => {
        for (let mask = 0; mask < 16; mask++) {
            const bag: Roles = { ...DECLARATIVE };
            ENGINE_ROLE_KEYS.forEach((key, i) => { if (mask & (1 << i)) bag[key] = ENGINE[key]; });
            expect(missingEngineRoles(bag).length === 0).toBe(stcFromRoles(bag) !== null);
        }
    });
});

describe('missingEventRoles', () => {
    it('Event without Trigger misses Trigger, Trigger without Event misses Event (labels not swapped)', () => {
        expect(missingEventRoles({ ...ENGINE, simEvent: 'C_Event' })).toEqual(['Trigger']);
        expect(missingEventRoles({ ...ENGINE, simTrigger: 'R_trigger' })).toEqual(['Event']);
    });

    it('both set or neither set: nothing missing (exclusive or, not "any one set")', () => {
        expect(missingEventRoles({ ...ENGINE, simEvent: 'C_Event', simTrigger: 'R_trigger' })).toEqual([]);
        expect(missingEventRoles(ENGINE)).toEqual([]);
        // control: one of the two makes it non-empty
        expect(missingEventRoles({ ...ENGINE, simEvent: 'C_Event' })).not.toEqual([]);
    });

    it('the identifier alone is not a half-set role (only Event and Trigger count)', () => {
        expect(missingEventRoles({ ...ENGINE, simEventIdentifier: 'A_name' })).toEqual([]);
        expect(missingEventRoles({ ...ENGINE, simEvent: 'C_Event', simEventIdentifier: 'A_name' })).toEqual(['Trigger']);
    });

    it('an empty string counts as unset', () => {
        expect(missingEventRoles({ ...ENGINE, simEvent: '', simTrigger: 'R_trigger' })).toEqual(['Event']);
    });

    it('a half-set role still runs, without events: stcFromRoles builds the descriptor and drops the event role (R-SIM-16)', () => {
        for (const half of [{ simEvent: 'C_Event' }, { simTrigger: 'R_trigger' }]) {
            const bag: Roles = { ...ENGINE, ...half, simEventIdentifier: 'A_name' };
            expect(missingEventRoles(bag)).toHaveLength(1);
            const stc = stcFromRoles(bag);
            expect(stc).not.toBeNull();
            expect(stc?.roles.event).toBeUndefined();
            expect(stc?.roles.trigger).toBeUndefined();
        }
        // control: both set, the descriptor carries the event role
        expect(stcFromRoles({ ...ENGINE, simEvent: 'C_Event', simTrigger: 'R_trigger' })?.roles.event).toBe('C_Event');
    });
});

describe('messages', () => {
    it('incomplete configuration names the metamodel and the labels, comma-separated (GO wording)', () => {
        expect(incompleteConfigurationMessage('Smoke', ['Terminal']))
            .toBe('Simulation not configured. Missing on Smoke: Terminal.');
        expect(incompleteConfigurationMessage('Smoke', missingEngineRoles({})))
            .toBe('Simulation not configured. Missing on Smoke: Initial, Terminal, Owned transitions, Next state.');
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
