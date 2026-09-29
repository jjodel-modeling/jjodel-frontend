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
    hasSemanticType,
    incompleteConfigurationMessage,
    invalidEngineRoles,
    missingEngineRoles,
    PANEL_PROFILE_IDS,
    profileBindings,
    profilePatch,
    profileSummary,
    profileSummaryText,
    profileVerdict,
    ROLE_SPECS,
    SEMANTIC_TYPE_OPTIONS,
    semanticTypeCurrent,
    semanticTypePatch,
    simPillVisible,
    staleEventWarning,
    storedProfile,
    VERDICT_LABEL,
} from '../simRoleStatus';
import type { ProfileSummary, Roles } from '../simRoleStatus';
import { draftPatch, draftProposals, draftStatus, isFirstOpen, matchLine, withProfileName, withRoleMode } from '../simRolesDraft';
import type { DraftInput } from '../simRolesDraft';
import { largestInitialMarking } from '../modelMarkings';
import type { BoundEstimate } from '../modelMarkings';
import { netStcFromRoles } from '../../../../model/simulation/netCompile';
import { encodeStateAttributes } from '../../../../model/simulation/stateAttributesCodec';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import { roleDescriptor } from '../../../../model/simulation/roleCatalog';
import { encodeProfile } from '../../../../model/simulation/profileCodec';
import { SKETCH_TYPE } from '../../../../model/simulation/profileBinder';
import { overlapVerdict } from '../../../../model/simulation/stcFromRoles';
import type { SimProfile } from '../../../../model/simulation/simProfiles';
import type { MetamodelSketch, ProfileBindings, RoleBinding, SketchAttribute, SketchClass, SketchReference } from '../../../../model/simulation/profileBinder';

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

describe('the activity-final row (G6, R-SIM-53)', () => {
    it('Activity final follows Terminal in ROLE_SPECS, a class select with the catalog\'s label (killed by dropping the row)', () => {
        const keys = ROLE_SPECS.map(spec => spec.key);
        expect(keys.indexOf('simActivityFinal')).toBe(keys.indexOf('simTerminal') + 1);
        expect(ROLE_SPECS.find(spec => spec.key === 'simActivityFinal')).toEqual({
            key: 'simActivityFinal', label: roleDescriptor('activityFinal').label, kind: 'class', placeholder: 'Select a metaclass',
        });
        // control: the label is the catalog's, as Terminal's is
        expect(ROLE_SPECS.find(spec => spec.key === 'simTerminal')?.label).toBe(roleDescriptor('terminal').label);
    });

    it('the key is never required: missing and invalid roles are the same with and without it (R-SIM-28 as for Terminal)', () => {
        for (const bag of [{}, CF, PETRI, { ...CF, simInitial: undefined }]) {
            const withFinal = { ...bag, simActivityFinal: 'C_ActFinal' };
            expect(missingEngineRoles(withFinal)).toEqual(missingEngineRoles(bag));
            expect(invalidEngineRoles(withFinal)).toEqual(invalidEngineRoles(bag));
        }
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

    it('a stale simEvent warns, naming both classes (S7); equal, absent or no Trigger bound warns of nothing', () => {
        const names: Record<string, string> = { C_Old: 'Old', C_New: 'New' };
        const of = (id: string) => names[id] ?? id;
        expect(staleEventWarning('C_Old', 'C_New', of)).toBe("Stored event class Old is ignored: the run uses New, the Trigger's type.");
        expect(staleEventWarning('C_Old', 'C_Old', of)).toBeNull();
        expect(staleEventWarning(undefined, 'C_New', of)).toBeNull();
        expect(staleEventWarning('C_Old', undefined, of)).toBeNull();
        expect(staleEventWarning(undefined, undefined, of)).toBeNull();
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

describe('the panel presets (R-SIM-79, A2; R-SIM-95)', () => {
    it('lists the eight system presets, DFA, NFA, Moore and Mealy after Extended state machine (killed by dropping the four ids)', () => {
        // The panel's Profile select and the dialog's header select both map this list.
        expect(PANEL_PROFILE_IDS).toEqual(['petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'dfa', 'nfa', 'moore', 'mealy']);
        expect(PANEL_PROFILE_IDS.map(id => systemProfile(id)?.name)).toEqual([
            'Petri net (P/T)', 'Flowchart / Activity', 'State machine', 'Extended state machine', 'DFA', 'NFA', 'Moore machine', 'Mealy machine',
        ]);
    });
});

describe('the Accepting and output rows (R-SIM-91, R-SIM-92; P-2026-09-29-0300)', () => {
    const spec = (key: string) => ROLE_SPECS.find(s => s.key === key);

    it('Accepting is a class row, State output and Transition output attribute rows closing the list, labels from the catalog (killed by dropping a row)', () => {
        expect(spec('simAccepting')).toEqual({
            key: 'simAccepting', label: roleDescriptor('accepting').label, kind: 'class', placeholder: 'Select a metaclass',
        });
        expect(spec('simStateOutput')).toEqual({
            key: 'simStateOutput', label: roleDescriptor('stateOutput').label, kind: 'attribute', placeholder: 'Select an attribute',
        });
        expect(spec('simTransitionOutput')).toEqual({
            key: 'simTransitionOutput', label: roleDescriptor('transitionOutput').label, kind: 'attribute', placeholder: 'Select an attribute',
        });
        expect(ROLE_SPECS.slice(-2).map(s => s.key)).toEqual(['simStateOutput', 'simTransitionOutput']);
        // control: Activity final still follows Terminal (the G6 test above), Accepting comes after it
        const keys = ROLE_SPECS.map(s => s.key);
        expect(keys.indexOf('simAccepting')).toBe(keys.indexOf('simActivityFinal') + 1);
    });

    it('the Reset overlap check sees Accepting: the roles the panel copies by ROLE_SPECS key carry it (killed by dropping the row)', () => {
        const lookup: Record<string, any> = {
            C_State: { className: 'DClass', extends: [] }, C_Init: { className: 'DClass', extends: ['C_State'] },
            C_Trans: { className: 'DClass', extends: [] }, C_Event: { className: 'DClass', extends: [] },
        };
        const bag: Record<string, string> = {
            simNode: 'C_State', simInitial: 'C_Init', simTransition: 'C_Trans', simTrigger: 'R_trigger', simEvent: 'C_Event', simAccepting: 'C_Trans',
        };
        // mapStateToProps (SimulationPanel.tsx): one role per ROLE_SPECS key, the set ones only
        const roles = Object.fromEntries(ROLE_SPECS.filter(s => bag[s.key]).map(s => [s.key, bag[s.key]]));
        expect(overlapVerdict(lookup, roles, ['C_State', 'C_Init', 'C_Trans', 'C_Event']))
            .toEqual({ overlap: { classId: 'C_Trans', sorts: ['node', 'transition'] }, refuse: true });
        // control: Accepting on a subclass of State is no overlap
        expect(overlapVerdict(lookup, { ...roles, simAccepting: 'C_Init' }, ['C_State', 'C_Init', 'C_Trans', 'C_Event'])).toBeNull();
    });

    it('none of the three is an engine role: missing and invalid are the same with and without them (R-SIM-28 as for Terminal)', () => {
        for (const bag of [{}, CF, PETRI, { ...CF, simInitial: undefined }]) {
            const withThree = { ...bag, simAccepting: 'C_Acc', simStateOutput: 'A_out', simTransitionOutput: 'A_tout' };
            expect(missingEngineRoles(withThree)).toEqual(missingEngineRoles(bag));
            expect(invalidEngineRoles(withThree)).toEqual(invalidEngineRoles(bag));
        }
    });
});

describe('DFA, NFA, Moore and Mealy on a plain metamodel (P-2026-09-29-0300, discovery §3.6, §3.8)', () => {
    const { string: ESTRING } = SKETCH_TYPE;
    const C = (id: string, supers: string[] = []): SketchClass => ({ id, name: id, abstract: false, supers });
    const A = (owner: string, name: string, type: string): SketchAttribute => ({ id: `${owner}.${name}`, name, owner, type });
    const R = (owner: string, name: string, type: string, composition = false): SketchReference => (
        { id: `${owner}.${name}`, name, owner, type, composition, aggregation: false }
    );
    const CONTROL = [R('State', 'transitions', 'Transition', true), R('Transition', 'nextState', 'State'), R('Transition', 'event', 'Symbol')];
    /** DemoDFA, its accepting class named `accepting` (the binder's /accept|final/) or `Good` (no match). */
    const dfaSketch = (accepting: string): MetamodelSketch => ({
        classes: [C('State'), C('Initial', ['State']), C(accepting, ['State']), C('Transition'), C('Symbol')],
        attributes: [],
        references: CONTROL,
    });
    /** The turnstile with one EString on State and one on Transition, named `name` (the binder's /^out/ or not). */
    const turnSketch = (name: string): MetamodelSketch => ({
        classes: [C('State'), C('Initial', ['State']), C('Transition'), C('Symbol')],
        attributes: [A('State', name, ESTRING), A('Transition', name, ESTRING)],
        references: CONTROL,
    });
    const text = (id: string, bag: Record<string, unknown>, sketch: MetamodelSketch) => {
        const p = systemProfile(id) as SimProfile;
        return profileSummaryText(profileSummary(p, bag, profileBindings(p, sketch, bag), null, sketch), x => x);
    };

    it('DFA and NFA: «Missing: Accepting.» while no class is named like one; the class picked in the row makes it Checkable (probe C)', () => {
        for (const [id, name] of [['dfa', 'DFA'], ['nfa', 'NFA']]) {
            const before = text(id, {}, dfaSketch('Good'));
            expect(before).toMatchObject({ status: `${name} · Not checkable after Apply`, missing: 'Missing: Accepting.' });
            const picked = text(id, { simAccepting: 'Good' }, dfaSketch('Good'));
            expect(picked).toMatchObject({ status: `${name} · Checkable after Apply`, missing: null });
            // control: a class named like one is proposed by Apply
            expect(text(id, {}, dfaSketch('Accepting')).proposals).toContain('Accepting → Accepting');
        }
    });

    it('Moore and Mealy: «Missing: State output.» / «Missing: Transition output.» on an attribute not named out…; picked, Checkable', () => {
        const cases: Array<[string, string, string, string]> = [
            ['moore', 'Moore machine', 'State output', 'simStateOutput'],
            ['mealy', 'Mealy machine', 'Transition output', 'simTransitionOutput'],
        ];
        for (const [id, name, label, key] of cases) {
            expect(text(id, {}, turnSketch('lamp'))).toMatchObject({ status: `${name} · Not checkable after Apply`, missing: `Missing: ${label}.` });
            const owner = id === 'moore' ? 'State' : 'Transition';
            expect(text(id, { [key]: `${owner}.lamp` }, turnSketch('lamp'))).toMatchObject({ status: `${name} · Checkable after Apply`, missing: null });
            // control: an attribute named out… is proposed by Apply
            expect(text(id, {}, turnSketch('output')).proposals).toContain(`${label} → ${owner}.output`);
        }
    });

    it('the four demo presets propose none of the three keys on a metamodel that offers them all; DFA, Moore and Mealy propose theirs', () => {
        const sketch: MetamodelSketch = {
            // `End` for Terminal: a class named Final would match Accepting's /accept|final/ too
            classes: [C('State'), C('Initial', ['State']), C('End', ['State']), C('Accepting', ['State']), C('Transition'), C('Symbol')],
            attributes: [A('State', 'output', ESTRING), A('Transition', 'output', ESTRING)],
            references: CONTROL,
        };
        const keysOf = (id: string) => {
            const p = systemProfile(id) as SimProfile;
            return profileSummary(p, {}, profileBindings(p, sketch, {}), null, sketch).proposals.map(x => x.key);
        };
        const three = ['simAccepting', 'simStateOutput', 'simTransitionOutput'];
        for (const id of ['petri', 'flowchart', 'stateMachine', 'extendedStateMachine']) {
            for (const k of three) expect({ id, k, has: keysOf(id).includes(k) }).toEqual({ id, k, has: false });
        }
        expect(keysOf('stateMachine')).toContain('simNode');
        expect(keysOf('dfa')).toContain('simAccepting');
        expect(keysOf('moore')).toContain('simStateOutput');
        expect(keysOf('mealy')).toContain('simTransitionOutput');
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

describe('the gate of the Simulation pill (P-2026-09-29-1106, R-SIM-97)', () => {
    // The lookup the panel reads: a metamodel, an M1 of it, and an M1 with no metamodel.
    const lookupWith = (mmState: Record<string, unknown>, m1State: Record<string, unknown> = {}) => ({
        mm: { id: 'mm', _state: mmState },
        m1: { id: 'm1', instanceof: 'mm', _state: m1State },
        orphan: { id: 'orphan', _state: { simProfile: 'stateMachine' } },
    });
    const TYPED = { simProfile: 'stateMachine', simNode: 'State' };

    it('Basic mode hides the pill on M2 and on an M1, whatever the bag (killed by dropping the advanced term)', () => {
        const lookup = lookupWith(TYPED);
        expect(simPillVisible(false, lookup, 'mm', false)).toBe(false);
        expect(simPillVisible(false, lookup, 'm1', true)).toBe(false);
        // control: the same lookup in Advanced shows it
        expect(simPillVisible(true, lookup, 'mm', false)).toBe(true);
    });

    it('Advanced without a Semantic type hides it, role keys set or not (killed by dropping the bag term)', () => {
        for (const bag of [{}, { simNode: 'State', simTransition: 'Transition' }, { simProfile: '' }, { simProfile: null }]) {
            const lookup = lookupWith(bag);
            expect(simPillVisible(true, lookup, 'mm', false)).toBe(false);
            expect(simPillVisible(true, lookup, 'm1', true)).toBe(false);
        }
    });

    it('Advanced with a Semantic type shows it on the M2 and on an M1 of it, by the metamodel\'s bag (killed by reading the M1\'s own bag)', () => {
        expect(simPillVisible(true, lookupWith(TYPED), 'mm', false)).toBe(true);
        expect(simPillVisible(true, lookupWith(TYPED), 'm1', true)).toBe(true);
        // an M1 bag naming a profile while its metamodel names none: hidden
        expect(simPillVisible(true, lookupWith({}, { simProfile: 'stateMachine' }), 'm1', true)).toBe(false);
    });

    it('an M1 with no metamodel, or an unknown id, shows nothing', () => {
        const lookup = lookupWith(TYPED);
        expect(simPillVisible(true, lookup, 'orphan', true)).toBe(false);
        expect(simPillVisible(true, lookup, 'nope', false)).toBe(false);
        expect(simPillVisible(true, lookup, 'nope', true)).toBe(false);
    });

    it('\'\' is no Semantic type; an unreadable value and a user profile are (killed by treating \'\' as set)', () => {
        expect(hasSemanticType({ simProfile: '' })).toBe(false);
        expect(hasSemanticType({ simProfile: null })).toBe(false);
        expect(hasSemanticType({ simProfile: undefined })).toBe(false);
        expect(hasSemanticType({})).toBe(false);
        expect(hasSemanticType(undefined)).toBe(false);
        // D6: the panel's «not readable» line stays reachable
        expect(hasSemanticType({ simProfile: '{not json' })).toBe(true);
        expect(hasSemanticType({ simProfile: encodeProfile(withProfileName(SM, 'Mine')) })).toBe(true);
        expect(hasSemanticType({ simProfile: 'petri' })).toBe(true);
    });
});

describe('the Semantic type field of the metamodel\'s Properties (P-2026-09-29-1106, R-SIM-97)', () => {
    /** The merge of `set_state` (joiner/classes.ts): a key given as undefined is removed, the others merged. */
    const setState = (bag: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> => {
        const out: Record<string, unknown> = { ...bag };
        for (const [k, v] of Object.entries(patch)) {
            if (v === undefined) delete out[k];
            else out[k] = v;
        }
        return out;
    };
    const ROLES = { simNode: 'State', simInitial: 'Initial', simTransition: 'Transition', simNextState: 'Transition.nextState' };

    it('lists the eight presets of the panel\'s Profile select, in its order and with its names', () => {
        expect(SEMANTIC_TYPE_OPTIONS.map(o => o.value)).toEqual([...PANEL_PROFILE_IDS]);
        expect(SEMANTIC_TYPE_OPTIONS.map(o => o.label)).toEqual(PANEL_PROFILE_IDS.map(id => systemProfile(id)?.name));
    });

    it('a preset writes simProfile alone, in one state assignment, the value the panel\'s Apply writes', () => {
        const patch = semanticTypePatch('stateMachine');
        expect(patch).toEqual({ simProfile: 'stateMachine' });
        expect(patch.simProfile).toBe(encodeProfile(systemProfile('stateMachine') as SimProfile));
        expect(setState(ROLES, patch)).toEqual({ ...ROLES, simProfile: 'stateMachine' });
    });

    it('None removes simProfile only and keeps the role bag (D3; killed by clearing every sim* key)', () => {
        const patch = semanticTypePatch(null);
        expect(Object.keys(patch)).toEqual(['simProfile']);
        expect(patch.simProfile).toBeUndefined();
        const typed = { ...ROLES, simProfile: 'stateMachine' };
        const none = setState(typed, patch);
        expect(none).toEqual(ROLES);
        expect(hasSemanticType(none)).toBe(false);
        // choosing the preset again restores the bag
        expect(setState(none, semanticTypePatch('stateMachine'))).toEqual(typed);
    });

    it('shows None, a listed preset, or the panel\'s name of a value off the list (a user profile, an unreadable one)', () => {
        expect(semanticTypeCurrent(undefined)).toBeNull();
        expect(semanticTypeCurrent('')).toBeNull();
        expect(semanticTypeCurrent('petri')).toEqual({ value: 'petri', label: 'Petri net (P/T)', listed: true });
        expect(semanticTypeCurrent(encodeProfile(withProfileName(SM, 'Mine')))).toMatchObject({ label: 'Mine', listed: false });
        expect(semanticTypeCurrent('{not json')).toMatchObject({ label: 'Custom', listed: false });
    });
});

describe('the dialog opened on a Semantic type proposes what the picker path proposes (discovery 2026-09-29 §5)', () => {
    // The four demo metamodels (demo script §2), as the discovery's probe sketched them.
    const C = (id: string, supers: string[] = [], abstract = false): SketchClass => ({ id, name: id, abstract, supers });
    const A = (owner: string, name: string, type: string): SketchAttribute => ({ id: `${owner}.${name}`, name, owner, type });
    const R = (owner: string, name: string, type: string, composition = false): SketchReference => (
        { id: `${owner}.${name}`, name, owner, type, composition, aggregation: false }
    );
    const PEST: MetamodelSketch = {
        classes: [C('State'), C('Initial', ['State']), C('Terminal', ['State']), C('Transition'), C('Event')],
        attributes: [],
        references: [R('State', 'transitions', 'Transition', true), R('Transition', 'nextState', 'State'), R('Transition', 'event', 'Event')],
    };
    const PETRI_NET: MetamodelSketch = {
        classes: [C('PNode', [], true), C('Place', ['PNode']), C('Transition', ['PNode']), C('Arc'), C('InhibitorArc', ['Arc'])],
        attributes: [A('Place', 'tokens', SKETCH_TYPE.int), A('Transition', 'guard', SKETCH_TYPE.expression), A('Arc', 'weight', SKETCH_TYPE.int)],
        references: [R('Arc', 'src', 'PNode'), R('Arc', 'tgt', 'PNode')],
    };
    const ESM_MM: MetamodelSketch = {
        classes: PEST.classes,
        attributes: [A('Event', 'name', SKETCH_TYPE.string), A('Transition', 'guard', SKETCH_TYPE.expression),
            A('Transition', 'effect', SKETCH_TYPE.action), A('State', 'entry', SKETCH_TYPE.action)],
        references: PEST.references,
    };
    const FLOW_B: MetamodelSketch = {
        classes: [C('ActivityNode'), ...['InitialNode', 'Activity', 'Decision', 'Fork', 'Join', 'FinalNode'].map(n => C(n, ['ActivityNode'])), C('ControlFlow')],
        attributes: [A('ControlFlow', 'guard', SKETCH_TYPE.expression), A('ControlFlow', 'effect', SKETCH_TYPE.action)],
        references: [R('ControlFlow', 'source', 'ActivityNode'), R('ControlFlow', 'target', 'ActivityNode')],
    };
    const SCENES: Array<[string, 'stateMachine' | 'petri' | 'extendedStateMachine' | 'flowchart', MetamodelSketch, string]> = [
        ['2.1 PEST', 'stateMachine', PEST, '7 of 10'],
        ['2.2 Petri', 'petri', PETRI_NET, '9 of 10'],
        ['2.3 ESM', 'extendedStateMachine', ESM_MM, '10 of 13'],
        ['2.4 Flow B', 'flowchart', FLOW_B, '10 of 13'],
    ];
    // The dialog's input (SimRolesModal.tsx): today the picker sets the preset; after Properties, the stored profile.
    const input = (profile: SimProfile, bag: Record<string, unknown>, sketch: MetamodelSketch, writeProfile: boolean): DraftInput => ({
        profile, bag, bindings: profileBindings(profile, sketch, bag), edits: {}, declarations: null, matchOff: false, writeProfile,
    });
    const line = (i: DraftInput) => { const m = matchLine(i.bindings); return m ? `${m.matched} of ${m.total}` : null; };

    for (const [label, id, sketch, match] of SCENES) {
        it(`${label}: ${match}, the same proposals and the same patch but for simProfile, no picker`, () => {
            const today = input(systemProfile(id) as SimProfile, {}, sketch, true);
            const bag = semanticTypePatch(id);
            const stored = storedProfile(bag);
            const next = input(stored.profile, bag, sketch, !stored.custom);
            expect(isFirstOpen({})).toBe(true);
            expect(isFirstOpen(bag)).toBe(false);
            expect(line(today)).toBe(match);
            expect(line(next)).toBe(match);
            expect(draftProposals(next)).toEqual(draftProposals(today));
            expect(draftStatus(next, sketch).status).toBe('checkable');
            const { simProfile, ...rest } = draftPatch(today);
            expect(simProfile).toBe(id);
            expect(draftPatch(next)).toEqual(rest);
            // the M2 face before Apply: the preset, pending, not «Custom · Not checkable»
            const summary = profileSummary(stored.profile, bag, next.bindings, null, sketch);
            expect(summary).toMatchObject({ name: systemProfile(id)?.name, status: 'checkable', pending: true });
        });
    }
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
    // R-SIM-94: the metamodel cannot see its models' declarations, so the hint says where a global goes.
    const HINT = "Declare the state attributes the actions write (a model's globals go in its Data…):";

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

    it('an unreadable declarations value shows nothing, not the hint for an empty one (S8; killed by treating unreadable as empty)', () => {
        const s = profileSummary(ESM, { simAction: 'A_effect', simStateAttributes: 'not json' }, TURN);
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

// ---------------------------------------------------------------------------
// One verdict for the panel's badge and the dialog's pill (P-2026-09-28-0140,
// docs/discovery/discovery_2026-09-28_sim_badge_pill.md §4)
// ---------------------------------------------------------------------------

describe('the panel badge and the dialog pill read one verdict (P-2026-09-28-0140)', () => {
    const { string: ESTRING, expression: EXPR } = SKETCH_TYPE;
    const C = (id: string, supers: string[] = []): SketchClass => ({ id, name: id, abstract: false, supers });
    const A = (owner: string, name: string, type: string): SketchAttribute => ({ id: `${owner}.${name}`, name, owner, type });
    const R = (owner: string, name: string, type: string, composition = false): SketchReference => (
        { id: `${owner}.${name}`, name, owner, type, composition, aggregation: false }
    );
    /** PEST SM as profileBinder.test.ts reconstructs it, plus Timed ⊂ Transition with its own guard, and an unrelated class. */
    const SKETCH: MetamodelSketch = {
        classes: [C('State'), C('Initial', ['State']), C('Final', ['State']), C('Transition'), C('Timed', ['Transition']), C('Event'), C('Other')],
        attributes: [A('Transition', 'guard', EXPR), A('Timed', 'when', EXPR), A('Other', 'label', ESTRING)],
        references: [R('State', 'transitions', 'Transition', true), R('Transition', 'nextState', 'State'), R('Transition', 'event', 'Event')],
    };
    /** What Apply of State machine leaves on this sketch (the binder's bag, report §4). */
    const APPLIED = {
        simNode: 'State', simInitial: 'Initial', simTerminal: 'Final', simTransition: 'Transition', simOwnedTransitions: 'State.transitions',
        simNextState: 'Transition.nextState', simTrigger: 'Transition.event', simGuard: 'Transition.guard', simProfile: 'stateMachine',
    };
    const MINE = withProfileName(withRoleMode(SM, 'terminal', false), 'Mine');
    const { simProfile: _stored, ...CUSTOM_BAG } = APPLIED;
    const { simNextState: _next, ...NO_NEXT } = APPLIED;

    /** The panel, SimulationPanel.tsx: the stored profile, its bindings, the summary with the sketch, the badge's word. */
    function panel(bag: Record<string, unknown>, sketch: MetamodelSketch | null = SKETCH) {
        const selected = storedProfile(bag).profile;
        const summary = profileSummary(selected, bag, profileBindings(selected, sketch, bag), null, sketch);
        return { word: profileSummaryText(summary, nameOf).badge, status: summary.status, pending: summary.pending };
    }

    /** The dialog opened on the stored profile, SimRolesModal.tsx: a pristine draft, the pill's word. */
    function dialog(bag: Record<string, unknown>, sketch: MetamodelSketch | null = SKETCH) {
        const stored = storedProfile(bag);
        const input: DraftInput = {
            profile: stored.profile, bag, bindings: profileBindings(stored.profile, sketch, bag), edits: {},
            declarations: null, matchOff: false, writeProfile: !stored.custom, estimate: null,
        };
        const status = draftStatus(input, sketch).status;
        return { word: VERDICT_LABEL[status], status, pending: Object.keys(draftPatch(input)).length > 0 };
    }

    it('the words of the three verdicts are one table (killed by a label written twice and changed once)', () => {
        expect(VERDICT_LABEL).toEqual({ checkable: 'Checkable', warnings: 'Checkable with warnings', notCheckable: 'Not checkable' });
    });

    it('controls: the applied bag, an empty State machine bag and a Custom bag read the same on both sides', () => {
        expect(panel(APPLIED)).toEqual({ word: 'Checkable', status: 'checkable', pending: false });
        expect(dialog(APPLIED)).toEqual({ word: 'Checkable', status: 'checkable', pending: false });
        expect(panel({ simProfile: 'stateMachine' })).toMatchObject({ word: 'Checkable', pending: true });
        expect(dialog({ simProfile: 'stateMachine' })).toMatchObject({ word: 'Checkable', pending: true });
        expect(panel(CUSTOM_BAG).word).toBe('Checkable');
        expect(dialog(CUSTOM_BAG).word).toBe('Checkable');
    });

    it('a warning binding reads «Checkable with warnings» on both sides, a system profile and Custom (killed by a summary that drops the sketch)', () => {
        const warn = { ...APPLIED, simGuard: 'Timed.when' };
        expect(panel(warn)).toMatchObject({ word: 'Checkable with warnings', status: 'warnings' });
        expect(dialog(warn)).toMatchObject({ word: 'Checkable with warnings', status: 'warnings' });
        expect(profileSummaryText(profileSummary(SM, warn, profileBindings(SM, SKETCH), null, SKETCH), nameOf).status)
            .toBe('State machine · Checkable with warnings');
        const custom = { ...CUSTOM_BAG, simGuard: 'Timed.when' };
        expect(panel(custom).word).toBe('Checkable with warnings');
        expect(dialog(custom).word).toBe('Checkable with warnings');
    });

    it('an incompatible binding, or the id of a deleted class, reads «Not checkable» on both sides (killed by a verdict that ignores incompatible)', () => {
        for (const bag of [{ ...APPLIED, simInitial: 'Other' }, { ...APPLIED, simInitial: 'C_gone' }]) {
            expect(panel(bag)).toMatchObject({ word: 'Not checkable', status: 'notCheckable' });
            expect(dialog(bag)).toMatchObject({ word: 'Not checkable', status: 'notCheckable' });
            // nothing is missing: the verdict alone decides
            expect(profileVerdict(SM, bag, SKETCH).missing).toEqual([]);
        }
    });

    it('a user profile is bound on both sides: a required key left unset is proposed, Checkable after Apply (killed by binding system profiles only)', () => {
        const bag = { ...NO_NEXT, simProfile: encodeProfile(MINE) };
        expect(panel(bag)).toEqual({ word: 'Checkable', status: 'checkable', pending: true });
        expect(dialog(bag)).toEqual({ word: 'Checkable', status: 'checkable', pending: true });
    });

    it('a user profile once applied is pending on neither side (killed by a decoded derived mode that re-encodes in another order)', () => {
        const bag = { ...APPLIED, simProfile: encodeProfile(MINE) };
        expect(panel(bag)).toEqual({ word: 'Checkable', status: 'checkable', pending: false });
        expect(dialog(bag)).toEqual({ word: 'Checkable', status: 'checkable', pending: false });
    });

    it('profileBindings: Custom and a missing sketch bind nothing; a system and a user profile are bound', () => {
        expect(profileBindings(storedProfile(CUSTOM_BAG).profile, SKETCH)).toBeNull();
        expect(profileBindings(SM, null)).toBeNull();
        expect(profileBindings(SM, SKETCH)?.node).toEqual(expect.objectContaining({ status: 'bound', value: 'State' }));
        expect(profileBindings(MINE, SKETCH)?.nextState).toEqual(expect.objectContaining({ status: 'bound', value: 'Transition.nextState' }));
    });

    it('a kept Node reaches the dependent proposals through profileBindings, the panel\'s and the dialog\'s call site (S6; killed by dropping the bag argument)', () => {
        const bag = { simNode: 'Other', simProfile: 'stateMachine' };
        const b = profileBindings(SM, SKETCH, bag);
        // Node keeps its own guess: what makes the bag's Other a "kept" value in the first place.
        expect(b?.node).toEqual(expect.objectContaining({ status: 'bound', value: 'State' }));
        expect(b?.initial?.status).toBe('none');
        expect(b?.ownedTransitions?.status).toBe('none');
        const s = profileSummary(SM, bag, b, null, SKETCH);
        expect(s.kept).toEqual([{ role: 'node', key: 'simNode', label: 'Node', value: 'Other', proposed: 'State' }]);
        expect(s.proposals.map(p => p.key)).not.toContain('simInitial');
        expect(s.proposals.map(p => p.key)).not.toContain('simOwnedTransitions');
    });

    it('a kept Transition reaches Guard and Trigger the same way (S6; killed by deriving them from the binder\'s own Transition)', () => {
        const bag = { simTransition: 'Other', simProfile: 'stateMachine' };
        const b = profileBindings(SM, SKETCH, bag);
        expect(b?.transition).toEqual(expect.objectContaining({ status: 'bound', value: 'Transition' }));
        expect(b?.guard?.status).toBe('none');
        expect(b?.trigger?.status).toBe('none');
    });

    it('without a sketch the summary keeps the reading before the verdicts: no «with warnings» (the callers that pass none)', () => {
        const warn = { ...APPLIED, simGuard: 'Timed.when' };
        expect(profileSummary(SM, warn, profileBindings(SM, SKETCH)).status).toBe('checkable');
        expect(panel(warn, null).word).toBe('Checkable');
        expect(dialog(warn, null).word).toBe('Checkable');
    });
});

describe('R-SIM-90: the summary of a list of attributes (P-2026-09-29-0010)', () => {
    const ESM = systemProfile('extendedStateMachine') as SimProfile;
    const WITH_GUARD: ProfileBindings = { ...TURN, guard: bound('A_g') };
    const names: Record<string, string> = { A_g: 'Trans.guard', A_h: 'Trans.cond' };
    const named = (id: string) => names[id] ?? nameOf(id);

    it('a list is kept over the binder\'s one attribute, and the line names each attribute (mutant: the list printed raw)', () => {
        const s = profileSummary(ESM, { simGuard: '["A_g","A_h"]' }, WITH_GUARD);
        expect(s.kept.map(k => [k.key, k.value, k.proposed])).toEqual([['simGuard', '["A_g","A_h"]', 'A_g']]);
        expect(profileSummaryText(s, named).kept).toBe('Kept: Guard (Trans.guard, Trans.cond).');
        // control: the binder's attribute stored as the plain id is not «kept»
        expect(profileSummary(ESM, { simGuard: 'A_g' }, WITH_GUARD).kept).toEqual([]);
    });

    it('the declarations hint reads a list of Action attributes as bound', () => {
        expect(profileSummary(ESM, { simAction: '["A_effect","A_more"]' }, TURN).declareHint).toBe(true);
    });

    it('the verdict of the badge and the pill: one incompatible attribute of a list is Not checkable, one warning «with warnings» (mutant: the first element\'s verdict)', () => {
        const { string: ESTRING, expression: EXPR } = SKETCH_TYPE;
        const C = (id: string, supers: string[] = []): SketchClass => ({ id, name: id, abstract: false, supers });
        const A = (owner: string, name: string, type: string): SketchAttribute => ({ id: `${owner}.${name}`, name, owner, type });
        const R = (owner: string, name: string, type: string, composition = false): SketchReference => (
            { id: `${owner}.${name}`, name, owner, type, composition, aggregation: false }
        );
        const SKETCH: MetamodelSketch = {
            classes: [C('State'), C('Initial', ['State']), C('Transition'), C('Timed', ['Transition']), C('Other')],
            attributes: [A('Transition', 'guard', EXPR), A('Transition', 'cond', ESTRING), A('Timed', 'when', EXPR), A('Other', 'label', ESTRING)],
            references: [R('State', 'transitions', 'Transition', true), R('Transition', 'nextState', 'State')],
        };
        const bag = {
            simNode: 'State', simInitial: 'Initial', simTransition: 'Transition', simOwnedTransitions: 'State.transitions',
            simNextState: 'Transition.nextState',
        };
        const status = (guard: string) => profileVerdict(SM, { ...bag, simGuard: guard }, SKETCH).status;
        expect(status('["Transition.guard","Transition.cond"]')).toBe('checkable');
        expect(status('["Transition.guard","Timed.when"]')).toBe('warnings');
        expect(status('["Transition.guard","Other.label"]')).toBe('notCheckable');
        // control: the incompatible attribute alone
        expect(status('Other.label')).toBe('notCheckable');
    });
});
