/**
 * simLabels — the words of the simulation UI that follow its state (P-2026-10-03-1630).
 *
 * Executes the module the panel, the run inspector and the roles dialog read (P11):
 * the three import the joiner and do not load under this bench. Each test name says
 * which break kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { assignedRoles, headedStateLine, stateHeading } from '../simLabels';
import { draftProposals, withRoleMode } from '../simRolesDraft';
import type { DraftInput } from '../simRolesDraft';
import { storedProfile } from '../simRoleStatus';
import { markingLine } from '../simBridge';
import { SYSTEM_PROFILES } from '../../../../model/simulation/simProfiles';
import type { SimProfile } from '../../../../model/simulation/simProfiles';
import type { ProfileBindings, RoleBinding } from '../../../../model/simulation/profileBinder';
import type { SimState } from '../../../../model/simulation/netTypes';

// ---------------------------------------------------------------------------
// The heading of the run's state (R-SIM-21..26; the spec's configuration)
// ---------------------------------------------------------------------------

describe('stateHeading: Marking for a Petri profile, Configuration for every control-flow one', () => {
    const EXPECTED: Record<string, string> = {
        petri: 'Marking',
        flowchart: 'Configuration',
        stateMachine: 'Configuration',
        extendedStateMachine: 'Configuration',
        dfa: 'Configuration',
        nfa: 'Configuration',
        moore: 'Configuration',
        mealy: 'Configuration',
    };

    it('every system profile, the eight of R-SIM-54 (mutants: always Marking, always Configuration, the test inverted)', () => {
        expect(SYSTEM_PROFILES.map(p => p.id).sort()).toEqual(Object.keys(EXPECTED).sort());
        for (const p of SYSTEM_PROFILES) expect([p.id, stateHeading(p)]).toEqual([p.id, EXPECTED[p.id]]);
    });

    it('a user copy and «Custom» follow their shape, not their id (mutant: the id compared to petri)', () => {
        const PETRI = SYSTEM_PROFILES.find(p => p.id === 'petri') as SimProfile;
        const copy = withRoleMode(PETRI, 'arcWeight', false);
        expect(copy.id).not.toBe('petri');
        expect(stateHeading(copy)).toBe('Marking');
        expect(stateHeading(storedProfile({ simArc: 'C_Arc' }).profile)).toBe('Marking');
        expect(stateHeading(storedProfile({}).profile)).toBe('Configuration');
    });
});

describe('headedStateLine: the marking line under the heading of the profile', () => {
    const state: SimState = {
        marking: new Map([['S1', 1]]), attrs: new Map([['M', new Map([['coins', 2]])]]), presentation: new Map(),
    };
    const line = markingLine(state, { modelId: 'M' }, { M: { name: 'demo' }, S1: { name: 'Idle' } }).title;

    it('Configuration replaces the head, the rest kept (mutant: the line returned as it is)', () => {
        expect(line).toBe('Marking: Idle · coins = 2');
        expect(headedStateLine(line, 'Configuration')).toBe('Configuration: Idle · coins = 2');
    });

    it('Marking leaves it as the bridge wrote it; a line without the head is left alone (mutant: the head added twice)', () => {
        expect(headedStateLine(line, 'Marking')).toBe(line);
        expect(headedStateLine('Idle', 'Configuration')).toBe('Idle');
    });
});

// ---------------------------------------------------------------------------
// The roles line of the Simulation roles dialog
// ---------------------------------------------------------------------------

const bound = (value: string): RoleBinding => ({ status: 'bound', value, why: 'test' });
const none: RoleBinding = { status: 'none', why: 'test' };
const SM = SYSTEM_PROFILES.find(p => p.id === 'stateMachine') as SimProfile;

/** The turnstile under State machine, as the binder gives it (simRolesDraft.test.ts): 6 bound of 10. */
const TURN: ProfileBindings = {
    node: bound('C_State'), initial: bound('C_Init'), terminal: none, transition: bound('C_Trans'),
    ownedTransitions: bound('R_out'), source: none, nextState: bound('R_next'), trigger: bound('R_trigger'),
    eventIdentifier: none, guard: none,
};

const input = (over: Partial<DraftInput>): DraftInput => ({
    profile: SM, bag: {}, bindings: TURN, edits: {}, declarations: null, matchOff: false, writeProfile: true, ...over,
});
const count = (i: DraftInput) => assignedRoles(i, draftProposals(i));

describe('assignedRoles: the roles that hold a value now, whatever set it', () => {
    it('the proposals alone: the six the binder bound, of the ten it judged', () => {
        expect(count(input({}))).toEqual({ assigned: 6, total: 10 });
    });

    it('a manual assign counts at once (mutant: the binder\'s bound roles counted)', () => {
        expect(count(input({ edits: { simTerminal: 'C_Final' } }))).toEqual({ assigned: 7, total: 10 });
    });

    it('a manual clear of a proposed role takes it out (mutant: a cleared edit counted as set)', () => {
        expect(count(input({ edits: { simNode: null } }))).toEqual({ assigned: 5, total: 10 });
        expect(count(input({ edits: { simNode: '' } }))).toEqual({ assigned: 5, total: 10 });
    });

    it('a stored value counts, and its clear takes it out (mutant: the stored bag not read)', () => {
        expect(count(input({ bag: { simGuard: 'A_guard' } }))).toEqual({ assigned: 7, total: 10 });
        expect(count(input({ bag: { simGuard: 'A_guard' }, edits: { simGuard: null } }))).toEqual({ assigned: 6, total: 10 });
    });

    it('with the proposals withdrawn only the stored and the edited count (mutant: the binder read instead of the rows)', () => {
        expect(count(input({ matchOff: true, bag: { simNode: 'C_State' }, edits: { simTransition: 'C_Trans' } }))).toEqual({ assigned: 2, total: 10 });
    });

    it('a role outside the bindings never counts; «Custom» has no line (mutant: every set key counted)', () => {
        expect(count(input({ bag: { simArc: 'C_Arc', simBound: '2' } }))).toEqual({ assigned: 6, total: 10 });
        expect(count(input({ bindings: null }))).toBeNull();
    });
});
