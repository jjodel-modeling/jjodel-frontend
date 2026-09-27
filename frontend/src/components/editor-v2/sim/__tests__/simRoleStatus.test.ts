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
    PANEL_PROFILE_IDS,
    profilePatch,
    profileSummary,
    profileSummaryText,
    ROLE_SPECS,
    storedProfile,
} from '../simRoleStatus';
import type { Roles } from '../simRoleStatus';
import { netStcFromRoles } from '../../../../model/simulation/netCompile';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import type { SimProfile } from '../../../../model/simulation/simProfiles';
import type { ProfileBindings, RoleBinding } from '../../../../model/simulation/profileBinder';

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

// ---------------------------------------------------------------------------
// The profile row of the M2 face (R-SIM-77..79, P-2026-09-27-0225)
// ---------------------------------------------------------------------------

const bound = (value: string): RoleBinding => ({ status: 'bound', value, why: 'test' });
const none: RoleBinding = { status: 'none', why: 'test' };
const SM = systemProfile('stateMachine') as SimProfile;
const PETRI_PROFILE = systemProfile('petri') as SimProfile;

/** The turnstile under State machine, as the binder gives it. */
const TURN: ProfileBindings = {
    node: bound('C_State'), initial: bound('C_Init'), terminal: none, transition: bound('C_Trans'),
    ownedTransitions: bound('R_out'), source: none, nextState: bound('R_next'), trigger: bound('R_trigger'),
    eventIdentifier: none, guard: none,
};
const TWO_INITIALS: ProfileBindings = { ...TURN, initial: { status: 'candidates', values: ['C_Init', 'C_Start'], why: 'test' } };
const NAMES: Record<string, string> = {
    C_State: 'State', C_Init: 'Init', C_Start: 'Start', C_Trans: 'Trans', C_Other: 'Other',
    R_out: 'State.out', R_next: 'Trans.next', R_trigger: 'Trans.trigger',
};
const nameOf = (id: string) => NAMES[id] ?? id;
/** The event class the Trigger is typed to, and the classes the overlap check walks. */
const TURN_LOOKUP: Record<string, any> = {
    R_trigger: { className: 'DReference', type: 'C_Event' },
    C_Event: { className: 'DClass', isPrimitive: false, extends: [] },
    C_State: { className: 'DClass', extends: [] }, C_Init: { className: 'DClass', extends: ['C_State'] },
    C_Trans: { className: 'DClass', extends: [] }, C_Other: { className: 'DClass', extends: [] },
};
const TURN_CLASSES = ['C_State', 'C_Init', 'C_Trans', 'C_Event', 'C_Other'];
const B2NET_BAG: Record<string, string> = {
    simNode: 'C_Place', simTransition: 'C_PTrans', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
    simInitialMarking: 'A_tokens', simBound: '3', simGuard: 'A_guard', simProfile: 'petri',
};
const B2NET_BINDINGS: ProfileBindings = {
    node: bound('C_Place'), initialMarking: bound('A_tokens'), terminal: none, transition: bound('C_PTrans'),
    arc: bound('C_Arc'), arcSource: bound('R_src'), arcTarget: bound('R_tgt'), arcWeight: none, inhibitorArc: none,
};

describe('the panel presets (R-SIM-79, A2)', () => {
    it('lists Petri net, Flowchart / Activity, State machine, Extended state machine; DFA, NFA, Moore, Mealy wait for R-SIM-50/51', () => {
        expect(PANEL_PROFILE_IDS).toEqual(['petri', 'flowchart', 'stateMachine', 'extendedStateMachine']);
    });
});

describe('storedProfile (R-SIM-55, D6)', () => {
    it('no simProfile, or an empty one, is Custom rebuilt from the bag, readable', () => {
        for (const bag of [{}, { simProfile: '' }, { ...B2NET_BAG, simProfile: undefined }]) {
            const s = storedProfile(bag);
            expect(s).toMatchObject({ custom: true, readable: true });
            expect(s.profile.name).toBe('Custom');
        }
        // control: the Custom of a Petri bag has the Petri shape
        expect(storedProfile({ ...B2NET_BAG, simProfile: undefined }).profile.shape).toBe('petri');
    });

    it('a system id decodes to its profile, a hidden preset included', () => {
        expect(storedProfile({ simProfile: 'stateMachine' })).toMatchObject({ custom: false, readable: true, profile: { id: 'stateMachine' } });
        expect(storedProfile({ simProfile: 'dfa' }).profile.id).toBe('dfa');
    });

    it('an unreadable value is Custom with readable false, never a throw (killed by treating it as absent)', () => {
        for (const raw of ['{not json', 'custom', 42]) {
            const s = storedProfile({ simProfile: raw });
            expect(s).toMatchObject({ custom: true, readable: false });
            expect(s.profile.name).toBe('Custom');
        }
    });
});

describe('profileSummary and its text (R-SIM-77, R-SIM-79)', () => {
    it('an empty bag under Custom: Not checkable, every closure item missing, nothing pending', () => {
        const s = profileSummary(storedProfile({}).profile, {}, null);
        expect(s).toMatchObject({ name: 'Custom', status: 'notCheckable', proposals: [], choices: [], kept: [], setButOff: [], pending: false });
        expect(s.missing).toEqual(['Node', 'Transition', 'Next state', 'Initial or Initial marking', 'Source or Owned transitions']);
        const text = profileSummaryText(s, nameOf);
        expect(text.status).toBe('Custom · Not checkable');
        expect(text.badge).toBe('Not checkable');
        expect(text.missing).toBe('Missing: Node, Transition, Next state, Initial or Initial marking, Source or Owned transitions.');
    });

    it('State machine on an empty bag: the six proposals in catalog order, Checkable after Apply', () => {
        const s = profileSummary(SM, {}, TURN);
        expect(s.proposals.map(p => [p.key, p.value])).toEqual([
            ['simNode', 'C_State'], ['simInitial', 'C_Init'], ['simTransition', 'C_Trans'],
            ['simOwnedTransitions', 'R_out'], ['simNextState', 'R_next'], ['simTrigger', 'R_trigger'],
        ]);
        expect(s).toMatchObject({ status: 'checkable', missing: [], pending: true });
        const text = profileSummaryText(s, nameOf);
        expect(text.status).toBe('State machine · Checkable after Apply');
        expect(text.proposals[0]).toBe('Node → State');
        expect(text.proposals).toContain('Next state → Trans.next');
    });

    it('a candidates role is not checkable and not proposed: «choose» names it (killed by reporting candidates as bound)', () => {
        const s = profileSummary(SM, {}, TWO_INITIALS);
        expect(s.status).toBe('notCheckable');
        expect(s.missing).toEqual(['Initial or Initial marking']);
        expect(s.proposals.map(p => p.key)).not.toContain('simInitial');
        expect(s.choices).toEqual([{ role: 'initial', key: 'simInitial', label: 'Initial', values: ['C_Init', 'C_Start'] }]);
        const text = profileSummaryText(s, nameOf);
        expect(text.status).toBe('State machine · Not checkable after Apply');
        expect(text.choose).toBe('Choose Initial: 2 candidates (Init, Start).');
        // control: once the user has chosen, the choice and the verdict follow the bag
        const chosen = profileSummary(SM, { simInitial: 'C_Start' }, TWO_INITIALS);
        expect(chosen.choices).toEqual([]);
        expect(chosen.status).toBe('checkable');
    });

    it('a set key is kept and named when the binder proposes another value; an equal one is not «kept»', () => {
        const s = profileSummary(SM, { simNode: 'C_Other' }, TURN);
        expect(s.proposals.map(p => p.key)).not.toContain('simNode');
        expect(s.kept).toEqual([{ role: 'node', key: 'simNode', label: 'Node', value: 'C_Other', proposed: 'C_State' }]);
        expect(profileSummaryText(s, nameOf).kept).toBe('Kept: Node (Other).');
        const same = profileSummary(SM, { simNode: 'C_State' }, TURN);
        expect(same.kept).toEqual([]);
        expect(same.proposals.map(p => p.key)).not.toContain('simNode');
    });

    it('b2net under Petri net: Checkable, nothing pending, Guard set but off (D8, §8 A3 not adopted)', () => {
        const s = profileSummary(PETRI_PROFILE, B2NET_BAG, B2NET_BINDINGS);
        expect(s).toMatchObject({ name: 'Petri net (P/T)', status: 'checkable', proposals: [], pending: false });
        expect(s.setButOff).toEqual(['Guard']);
        const text = profileSummaryText(s, nameOf);
        expect(text.setButOff).toBe('Set but off: Guard.');
        expect(text.status).toBe('Petri net (P/T) · Checkable');
    });

    it('another preset with nothing to bind is still pending: Apply writes simProfile', () => {
        const esm = systemProfile('extendedStateMachine') as SimProfile;
        const bag = { simNode: 'C_State', simInitial: 'C_Init', simTransition: 'C_Trans', simOwnedTransitions: 'R_out', simNextState: 'R_next', simProfile: 'stateMachine' };
        expect(profileSummary(esm, bag, {}).pending).toBe(true);
        expect(profileSummary(SM, bag, {}).pending).toBe(false);
        expect(profileSummaryText(profileSummary(SM, bag, {}), nameOf).status).toBe('State machine · Checkable');
    });
});

describe('profilePatch (R-SIM-78)', () => {
    it('writes the bound values of the unset keys and simProfile, nothing else (killed by overwriting a set key)', () => {
        const r = profilePatch(SM, { simNode: 'C_Other' }, TURN, TURN_LOOKUP, TURN_CLASSES);
        expect(r.kind).toBe('write');
        const patch = (r as { patch: Record<string, string> }).patch;
        expect(patch).toEqual({
            simInitial: 'C_Init', simTransition: 'C_Trans', simOwnedTransitions: 'R_out', simNextState: 'R_next',
            simTrigger: 'R_trigger', simProfile: 'stateMachine',
        });
    });

    it('never writes undefined: none and candidates roles have no key (killed by writing a none role)', () => {
        const r = profilePatch(SM, {}, TWO_INITIALS, TURN_LOOKUP, TURN_CLASSES);
        const patch = (r as { patch: Record<string, string> }).patch;
        expect(Object.keys(patch)).not.toContain('simInitial');
        expect(Object.keys(patch)).not.toContain('simTerminal');
        expect(Object.keys(patch)).not.toContain('simGuard');
        for (const v of Object.values(patch)) expect(typeof v === 'string' && v !== '').toBe(true);
    });

    it('writes only edit roles: a bound value for a role the profile turns off is dropped', () => {
        const r = profilePatch(PETRI_PROFILE, {}, { ...B2NET_BINDINGS, guard: bound('A_guard') }, {}, []);
        expect(Object.keys((r as { patch: Record<string, string> }).patch)).not.toContain('simGuard');
    });

    it('refuses, writing nothing, when the roles after Apply overlap under the Petri shape (killed by skipping the check)', () => {
        const lookup = { C_Place: { className: 'DClass', extends: [] } };
        const r = profilePatch(PETRI_PROFILE, { simArc: 'C_Place' }, { node: bound('C_Place') }, lookup, ['C_Place']);
        expect(r).toEqual({ kind: 'refused', overlap: { classId: 'C_Place', sorts: ['node', 'arc'] } });
        // control: the same patch without the overlap is written
        expect(profilePatch(PETRI_PROFILE, { simArc: 'C_Arc' }, { node: bound('C_Place') }, lookup, ['C_Place']).kind).toBe('write');
    });

    it('a control-flow overlap without the event role writes, with the overlap as a warning (the rule of writeRole)', () => {
        const r = profilePatch(SM, {}, { node: bound('C_State'), transition: bound('C_State') }, TURN_LOOKUP, TURN_CLASSES);
        expect(r).toMatchObject({ kind: 'write', overlap: { classId: 'C_State', sorts: ['node', 'transition'] } });
    });
});
