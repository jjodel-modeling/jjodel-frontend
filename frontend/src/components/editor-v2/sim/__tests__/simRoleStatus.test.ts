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
    boundProposalBag,
    boundProposalInputs,
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
import type { ProfileSummary, Roles } from '../simRoleStatus';
import { largestInitialMarking } from '../modelMarkings';
import type { BoundEstimate } from '../modelMarkings';
import { netStcFromRoles } from '../../../../model/simulation/netCompile';
import { encodeStateAttributes } from '../../../../model/simulation/stateAttributesCodec';
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

    it('b2net under Petri net: Checkable, nothing pending, Guard in edit and nothing set but off (§8 A3, R-SIM-54 amended; killed by Guard off in the Petri row)', () => {
        const s = profileSummary(PETRI_PROFILE, B2NET_BAG, B2NET_BINDINGS);
        expect(s).toMatchObject({ name: 'Petri net (P/T)', status: 'checkable', proposals: [], pending: false });
        expect(s.setButOff).toEqual([]);
        expect(s.kept).toEqual([]);
        const text = profileSummaryText(s, nameOf);
        expect(text.setButOff).toBeNull();
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
        const r = profilePatch(PETRI_PROFILE, {}, { ...B2NET_BINDINGS, action: bound('A_actions') }, {}, []);
        expect(Object.keys((r as { patch: Record<string, string> }).patch)).not.toContain('simAction');
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

// ---------------------------------------------------------------------------
// Apply completes the natural shapes (R-SIM-81, P-2026-09-27-1110)
// ---------------------------------------------------------------------------

/** A Petri model of the metamodel MM whose places hold `markings`, as the raw lookup has it. */
function petriLookup(markings: readonly number[]): Record<string, any> {
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM' },
        C_Place: { className: 'DClass', id: 'C_Place', extends: [] },
        M1: { className: 'DModel', id: 'M1', instanceof: 'MM' },
    };
    markings.forEach((m, i) => {
        lookup[`p${i}`] = { className: 'DObject', id: `p${i}`, instanceof: 'C_Place', father: 'M1', features: [`v${i}`] };
        lookup[`v${i}`] = { className: 'DValue', id: `v${i}`, instanceof: 'A_tokens', father: `p${i}`, values: [m] };
    });
    return lookup;
}

/** The b2net bag before Apply: nothing set. */
const PETRI_EMPTY_BAG: Record<string, string> = {};
const B2NET_UNBOUNDED: Record<string, string> = { ...B2NET_BAG };
delete B2NET_UNBOUNDED.simBound;

describe('Bound from the models (R-SIM-81, G2)', () => {
    it('markings 2 and 3 give the proposal Bound → 3, listed in catalog order and written by the same patch', () => {
        const largest = largestInitialMarking(petriLookup([2, 3, 1]), 'MM', 'C_Place', 'A_tokens');
        expect(largest).toBe(3);
        const s = profileSummary(PETRI_PROFILE, PETRI_EMPTY_BAG, B2NET_BINDINGS, largest);
        expect(s.proposals.map(p => p.key)).toEqual([
            'simNode', 'simInitialMarking', 'simBound', 'simTransition', 'simArc', 'simArcSource', 'simArcTarget',
        ]);
        expect(s.proposals.find(p => p.key === 'simBound')).toMatchObject({ role: 'bound', label: 'Bound', value: '3' });
        expect(s.proposals.find(p => p.key === 'simBound')?.why).toMatch(/\S/);
        expect(profileSummaryText(s, () => 'not a name').proposals).toContain('Bound → 3');
        const r = profilePatch(PETRI_PROFILE, PETRI_EMPTY_BAG, B2NET_BINDINGS, {}, [], largest);
        expect((r as { patch: Record<string, string> }).patch).toMatchObject({ simBound: '3', simNode: 'C_Place', simProfile: 'petri' });
    });

    it('a Petri bag complete but for the bound is pending on Bound alone', () => {
        const s = profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, 2);
        expect(s.proposals.map(p => [p.key, p.value])).toEqual([['simBound', '2']]);
        expect(s.pending).toBe(true);
    });

    it('not proposed when every marking is at or below 1 (killed by proposing from 1)', () => {
        const largest = largestInitialMarking(petriLookup([1, 1, 0]), 'MM', 'C_Place', 'A_tokens');
        expect(largest).toBe(1);
        const s = profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, largest);
        expect(s.proposals).toEqual([]);
        expect(s.pending).toBe(false);
        const r = profilePatch(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, {}, [], largest);
        expect(Object.keys((r as { patch: Record<string, string> }).patch)).not.toContain('simBound');
        // no model, or no marking read: nothing either
        expect(profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, null).proposals).toEqual([]);
        expect(profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS).proposals).toEqual([]);
    });

    it('never over a Bound the user set, in the summary and in the patch (killed by writing simBound over a set key)', () => {
        const bag = { ...B2NET_UNBOUNDED, simBound: '4' };
        expect(profileSummary(PETRI_PROFILE, bag, B2NET_BINDINGS, 3).proposals).toEqual([]);
        const r = profilePatch(PETRI_PROFILE, bag, B2NET_BINDINGS, {}, [], 3);
        expect(Object.keys((r as { patch: Record<string, string> }).patch)).not.toContain('simBound');
    });

    it('not proposed where Bound is not edit: the control-flow presets derive k = 1', () => {
        const s = profileSummary(SM, {}, TURN, 3);
        expect(s.proposals.map(p => p.key)).not.toContain('simBound');
    });

    it('boundProposalInputs: the Place class and the Initial marking attribute, the bag\'s value first, null when there is nothing to measure', () => {
        expect(boundProposalInputs(PETRI_PROFILE, {}, B2NET_BINDINGS)).toEqual({ node: 'C_Place', initialMarking: 'A_tokens' });
        expect(boundProposalInputs(PETRI_PROFILE, { simNode: 'C_Mine' }, B2NET_BINDINGS)).toEqual({ node: 'C_Mine', initialMarking: 'A_tokens' });
        expect(boundProposalInputs(PETRI_PROFILE, { simBound: '2' }, B2NET_BINDINGS)).toBeNull();
        expect(boundProposalInputs(PETRI_PROFILE, {}, { ...B2NET_BINDINGS, initialMarking: none })).toBeNull();
        expect(boundProposalInputs(SM, {}, TURN)).toBeNull();
    });
});

describe('the Bound from the reachable markings (G12(b), R-SIM-81(1) as amended by Alfonso 2026-09-27)', () => {
    const closed = (max: number, largestInitial: number | null = 2, markings = 9): BoundEstimate => ({
        largestInitial, exploration: { max, end: 'closed', markings },
    });
    const boundOf = (s: ProfileSummary) => s.proposals.find(p => p.key === 'simBound');
    const FALLBACK = 'The largest initial marking on the models of this metamodel';

    it('a closed exploration proposes its maximum, 4 on the demo net, and the title says so (killed by proposing the largest initial marking, 2)', () => {
        const s = profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, closed(4));
        expect(boundOf(s)).toMatchObject({ role: 'bound', value: '4' });
        expect(boundOf(s)?.why).toBe('The most tokens a place holds over the 9 reachable markings of the models, guards aside');
        expect(profileSummaryText(s, nameOf).proposals).toEqual(['Bound → 4']);
        const r = profilePatch(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, {}, [], closed(4));
        expect((r as { patch: Record<string, string> }).patch).toMatchObject({ simBound: '4' });
    });

    it('an exploration that does not close proposes the largest initial marking, and the title says why (killed by proposing the partial maximum)', () => {
        const cases: Array<[BoundEstimate, string]> = [
            [{ largestInitial: 2, exploration: { max: 3, end: 'unbounded', markings: 5 } },
                `${FALLBACK}: a reachable marking covers an earlier one with more tokens, so no bound was found`],
            [{ largestInitial: 2, exploration: { max: 7, end: 'cap', markings: 2000 } },
                `${FALLBACK}: more than 2000 reachable markings, not all explored`],
            [{ largestInitial: 2, exploration: null }, `${FALLBACK}: the roles after Apply make no net to explore`],
        ];
        for (const [estimate, why] of cases) {
            const s = profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, estimate);
            expect(boundOf(s)).toMatchObject({ value: '2', why });
            const r = profilePatch(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, {}, [], estimate);
            expect((r as { patch: Record<string, string> }).patch).toMatchObject({ simBound: '2' });
        }
    });

    it('nothing at or below 1 on either path, and never over a set Bound or where Bound is not edit (R-SIM-81 as before)', () => {
        expect(profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, closed(1, 1)).proposals).toEqual([]);
        expect(profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, { largestInitial: 1, exploration: null }).proposals).toEqual([]);
        expect(profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, { largestInitial: null, exploration: null }).proposals).toEqual([]);
        expect(profileSummary(PETRI_PROFILE, { ...B2NET_UNBOUNDED, simBound: '3' }, B2NET_BINDINGS, closed(4)).proposals).toEqual([]);
        expect(profileSummary(SM, {}, TURN, closed(4)).proposals.map(p => p.key)).not.toContain('simBound');
        // control: the same closed 4 is proposed on the unbounded bag
        expect(profileSummary(PETRI_PROFILE, B2NET_UNBOUNDED, B2NET_BINDINGS, closed(4)).proposals).toHaveLength(1);
    });

    it('boundProposalBag: the bag as Apply leaves it with the Bound aside, null exactly when boundProposalInputs is', () => {
        expect(boundProposalBag(PETRI_PROFILE, {}, B2NET_BINDINGS)).toEqual({
            simNode: 'C_Place', simInitialMarking: 'A_tokens', simTransition: 'C_PTrans', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
        });
        // a set key is kept over the binder's value
        expect(boundProposalBag(PETRI_PROFILE, { simNode: 'C_Mine' }, B2NET_BINDINGS)).toMatchObject({ simNode: 'C_Mine' });
        expect(boundProposalBag(PETRI_PROFILE, { simBound: '2' }, B2NET_BINDINGS)).toBeNull();
        expect(boundProposalBag(PETRI_PROFILE, {}, { ...B2NET_BINDINGS, initialMarking: none })).toBeNull();
        expect(boundProposalBag(SM, {}, TURN)).toBeNull();
    });
});

describe('the declarations hint (R-SIM-81, G9)', () => {
    const ESM = systemProfile('extendedStateMachine') as SimProfile;
    const WITH_ACTION: ProfileBindings = { ...TURN, action: bound('A_effect') };
    const DECLS = encodeStateAttributes([
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
    ]);
    const HINT = 'Declare the state attributes the actions write:';

    it('Action bound and no declarations: the hint, whether Action is set or only proposed', () => {
        const proposed = profileSummary(ESM, {}, WITH_ACTION);
        expect(proposed.declareHint).toBe(true);
        expect(profileSummaryText(proposed, nameOf).declare).toBe(HINT);
        expect(profileSummary(ESM, { simAction: 'A_effect' }, TURN).declareHint).toBe(true);
    });

    it('Entry or Exit alone is enough; an empty declarations table counts as none', () => {
        expect(profileSummary(ESM, { simEntry: 'A_entry' }, TURN).declareHint).toBe(true);
        expect(profileSummary(ESM, { simExit: 'A_exit' }, TURN).declareHint).toBe(true);
        expect(profileSummary(ESM, { simAction: 'A_effect', simStateAttributes: encodeStateAttributes([]) }, TURN).declareHint).toBe(true);
    });

    it('no hint once a declaration exists', () => {
        const s = profileSummary(ESM, { simAction: 'A_effect', simStateAttributes: DECLS }, TURN);
        expect(s.declareHint).toBe(false);
        expect(profileSummaryText(s, nameOf).declare).toBeNull();
    });

    it('no hint with no action role bound (killed by showing the hint without Action, Entry or Exit)', () => {
        const s = profileSummary(ESM, {}, TURN);
        expect(s.declareHint).toBe(false);
        expect(profileSummaryText(s, nameOf).declare).toBeNull();
        expect(profileSummary(SM, {}, TURN).declareHint).toBe(false);
    });
});
