/**
 * profileBinder — a preset bound to a metamodel sketch, never by a guess
 * (R-SIM-77, P-2026-09-27-0225).
 *
 * The fixtures are the sketches of the discovery report §6.5
 * (docs/discovery/discovery_2026-09-27_sim_profiles_panel.md), plus b2net, a
 * metamodel with two Initial subclasses and one whose only event-like
 * reference is outside the transition lineage. The PEST SM sketch is a
 * reconstruction: the real PEST SM lives in the localStorage of another tree.
 * Each test name says which break of the rules kills it; the mutation bench is
 * in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { bindProfile, SKETCH_TYPE } from '../profileBinder';
import type { MetamodelSketch, ProfileBindings, RoleBinding, SketchAttribute, SketchClass, SketchReference } from '../profileBinder';
import { checkability, systemProfile } from '../simProfiles';
import type { SimProfile } from '../simProfiles';
import { roleDescriptor } from '../roleCatalog';
import type { RoleId } from '../roleCatalog';

const { int: EINT, string: ESTRING, boolean: EBOOL, expression: EXPR, action: ACT } = SKETCH_TYPE;

const C = (id: string, supers: string[] = [], abstract = false): SketchClass => ({ id, name: id, abstract, supers });
const A = (owner: string, name: string, type: string): SketchAttribute => ({ id: `${owner}.${name}`, name, owner, type });
const R = (owner: string, name: string, type: string, composition = false): SketchReference => (
    { id: `${owner}.${name}`, name, owner, type, composition, aggregation: false }
);

const profile = (id: string): SimProfile => systemProfile(id) as SimProfile;

/** The bag the bound values give: what Apply would write on an empty bag. */
function bagOf(bindings: ProfileBindings): Record<string, string> {
    const bag: Record<string, string> = {};
    for (const [role, b] of Object.entries(bindings) as Array<[RoleId, RoleBinding]>) {
        if (b.status === 'bound') bag[roleDescriptor(role).key as string] = b.value;
    }
    return bag;
}

function statuses(bindings: ProfileBindings): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [role, b] of Object.entries(bindings) as Array<[RoleId, RoleBinding]>) {
        out[role] = b.status === 'bound' ? b.value : b.status === 'candidates' ? `[${b.values.join('|')}]` : '-';
    }
    return out;
}

function counts(bindings: ProfileBindings): { bound: number; candidates: number; none: number } {
    const c = { bound: 0, candidates: 0, none: 0 };
    for (const b of Object.values(bindings) as RoleBinding[]) c[b.status === 'none' ? 'none' : b.status]++;
    return c;
}

// ---------------------------------------------------------------------------
// Fixtures (report §6.5)
// ---------------------------------------------------------------------------

const TURNSTILE: MetamodelSketch = {
    classes: [C('TNamed', [], true), C('TState', ['TNamed']), C('TInit', ['TState']), C('TEvent', ['TNamed']), C('TTrans')],
    attributes: [A('TNamed', 'label', ESTRING)],
    references: [R('TState', 'out', 'TTrans', true), R('TTrans', 'next', 'TState'), R('TTrans', 'trigger', 'TEvent')],
};

/** PEST SM, reconstructed from the report: not the real metamodel. */
const PEST_SM_RECONSTRUCTED: MetamodelSketch = {
    classes: [C('State'), C('Initial', ['State']), C('Final', ['State']), C('Transition'), C('Event')],
    attributes: [A('Transition', 'guard', EXPR)],
    references: [R('State', 'transitions', 'Transition', true), R('Transition', 'nextState', 'State'), R('Transition', 'event', 'Event')],
};

const ESM_ACTIONS: MetamodelSketch = {
    classes: PEST_SM_RECONSTRUCTED.classes,
    attributes: [
        A('Transition', 'guard', EXPR), A('Transition', 'effect', ACT), A('State', 'entry', ACT), A('State', 'exit', ACT),
    ],
    references: PEST_SM_RECONSTRUCTED.references,
};

const FLOW: MetamodelSketch = {
    classes: [C('FNode'), C('FStart', ['FNode']), C('FEnd', ['FNode']), C('FEdge')],
    attributes: [A('FEdge', 'guard', ESTRING)],
    references: [R('FNode', 'out', 'FEdge', true), R('FEdge', 'next', 'FNode')],
};

const FSM_BOOLEANS: MetamodelSketch = {
    classes: [C('FSM'), C('State'), C('Transition')],
    attributes: [A('State', 'isInitial', EBOOL), A('State', 'isFinal', EBOOL), A('Transition', 'symbol', ESTRING)],
    references: [
        R('FSM', 'states', 'State', true), R('FSM', 'transitions', 'Transition', true),
        R('Transition', 'source', 'State'), R('Transition', 'target', 'State'),
    ],
};

const MOORE: MetamodelSketch = {
    classes: [C('State'), C('Start', ['State']), C('Transition'), C('Input')],
    attributes: [A('State', 'output', ESTRING)],
    references: [R('State', 'outgoing', 'Transition', true), R('Transition', 'target', 'State'), R('Transition', 'input', 'Input')],
};

const PETRI_3B: MetamodelSketch = {
    classes: [C('PNode', [], true), C('Place', ['PNode']), C('PTrans', ['PNode']), C('Arc'), C('Inhibitor', ['Arc'])],
    attributes: [A('Place', 'tokens', EINT), A('Arc', 'weight', EINT)],
    references: [R('Arc', 'src', 'PNode'), R('Arc', 'tgt', 'PNode')],
};

const PETRI_C1: MetamodelSketch = {
    classes: [C('PNode', [], true), C('Place', ['PNode']), C('PTrans', ['PNode']), C('Arc')],
    attributes: [A('Place', 'tokens', EINT), A('PTrans', 'guard', EXPR), A('PTrans', 'actions', ACT), A('Place', 'entry', ACT)],
    references: [R('Arc', 'src', 'PNode'), R('Arc', 'tgt', 'PNode')],
};

/** b2net's metamodel SimPetriGuard (lane B2): a guard on the Petri transition. */
const B2NET: MetamodelSketch = {
    classes: [C('PNode', [], true), C('Place', ['PNode']), C('PTrans', ['PNode']), C('Arc')],
    attributes: [A('Place', 'tokens', EINT), A('PTrans', 'guard', EXPR)],
    references: [R('Arc', 'src', 'PNode'), R('Arc', 'tgt', 'PNode')],
};

const TWO_INITIALS: MetamodelSketch = {
    ...TURNSTILE,
    classes: [...TURNSTILE.classes, C('TStart', ['TState'])],
};

// ---------------------------------------------------------------------------

describe('bindProfile on the report fixtures (§6.5)', () => {
    it('turnstile x State machine: every required item bound, six bound, no candidate (killed by a lost Node/Transition/Next state rule)', () => {
        const b = bindProfile(profile('stateMachine'), TURNSTILE);
        expect(statuses(b)).toEqual({
            node: 'TState', initial: 'TInit', terminal: '-', transition: 'TTrans', ownedTransitions: 'TState.out', source: '-',
            nextState: 'TTrans.next', trigger: 'TTrans.trigger', eventIdentifier: '-', guard: '-',
        });
        expect(counts(b)).toEqual({ bound: 6, candidates: 0, none: 4 });
        expect(checkability(profile('stateMachine'), bagOf(b))).toEqual({ status: 'checkable', missing: [] });
    });

    it('PEST SM (reconstructed) x State machine and x Extended SM: Final is Terminal, the Expression attribute is Guard', () => {
        const sm = bindProfile(profile('stateMachine'), PEST_SM_RECONSTRUCTED);
        expect(statuses(sm)).toMatchObject({
            node: 'State', initial: 'Initial', terminal: 'Final', transition: 'Transition', ownedTransitions: 'State.transitions',
            nextState: 'Transition.nextState', trigger: 'Transition.event', guard: 'Transition.guard', source: '-',
        });
        expect(counts(sm)).toEqual({ bound: 8, candidates: 0, none: 2 });
        const esm = bindProfile(profile('extendedStateMachine'), PEST_SM_RECONSTRUCTED);
        expect(counts(esm)).toEqual({ bound: 8, candidates: 0, none: 5 });
        expect(checkability(profile('extendedStateMachine'), bagOf(esm)).status).toBe('checkable');
    });

    it('Extended SM with effect, entry, exit: the Action attributes go to their sites', () => {
        const b = bindProfile(profile('extendedStateMachine'), ESM_ACTIONS);
        expect(statuses(b)).toMatchObject({ action: 'Transition.effect', entry: 'State.entry', exit: 'State.exit' });
        expect(counts(b)).toEqual({ bound: 11, candidates: 0, none: 2 });
    });

    it('flow (3b) x Flowchart: an EString named guard is Guard when no Expression attribute exists', () => {
        const b = bindProfile(profile('flowchart'), FLOW);
        expect(statuses(b)).toMatchObject({
            node: 'FNode', initial: 'FStart', terminal: 'FEnd', transition: 'FEdge', ownedTransitions: 'FNode.out',
            nextState: 'FEdge.next', guard: 'FEdge.guard', activityFinal: '-', fork: '-', join: '-', action: '-', entry: '-', source: '-',
        });
        expect(counts(b)).toEqual({ bound: 7, candidates: 0, none: 6 });
        expect(checkability(profile('flowchart'), bagOf(b)).status).toBe('checkable');
    });

    it('textbook FSM with boolean flags: Initial is none and says why, Source is bound by name', () => {
        const b = bindProfile(profile('stateMachine'), FSM_BOOLEANS);
        expect(statuses(b)).toMatchObject({
            node: 'State', transition: 'Transition', nextState: 'Transition.target', source: 'Transition.source',
            initial: '-', terminal: '-', ownedTransitions: '-', trigger: '-',
        });
        expect(counts(b)).toEqual({ bound: 4, candidates: 0, none: 6 });
        const initial = b.initial as RoleBinding;
        expect(initial.status).toBe('none');
        expect(initial.why).toContain('isInitial');
        expect(checkability(profile('stateMachine'), bagOf(b))).toEqual({
            status: 'notCheckable', missing: [{ anyOf: ['initial', 'initialMarking'] }],
        });
    });

    it('Moore sketch x Moore: Start is Initial, output is State output', () => {
        const b = bindProfile(profile('moore'), MOORE);
        expect(statuses(b)).toMatchObject({ initial: 'Start', trigger: 'Transition.input', stateOutput: 'State.output' });
        expect(counts(b).bound).toBe(7);
        expect(checkability(profile('moore'), bagOf(b)).status).toBe('checkable');
    });

    it('Petri (3b) x Petri net: the arc and its two references, the place by its tokens, the inhibitor subclass', () => {
        const b = bindProfile(profile('petri'), PETRI_3B);
        expect(statuses(b)).toEqual({
            node: 'Place', initialMarking: 'Place.tokens', terminal: '-', transition: 'PTrans',
            arc: 'Arc', arcSource: 'Arc.src', arcTarget: 'Arc.tgt', arcWeight: 'Arc.weight', inhibitorArc: 'Inhibitor',
        });
        expect(counts(b)).toEqual({ bound: 8, candidates: 0, none: 1 });
        expect(checkability(profile('petri'), bagOf(b))).toEqual({ status: 'checkable', missing: [] });
    });

    it('Petri C1 x Petri net: six bound; the Data attributes are not proposed, their roles are off', () => {
        const b = bindProfile(profile('petri'), PETRI_C1);
        expect(counts(b)).toEqual({ bound: 6, candidates: 0, none: 3 });
        expect(b.guard).toBeUndefined();
        expect(b.action).toBeUndefined();
        expect(b.entry).toBeUndefined();
    });

    it('b2net x Petri net: bound and checkable; Guard is off, so the binder does not touch it', () => {
        const b = bindProfile(profile('petri'), B2NET);
        expect(statuses(b)).toMatchObject({
            node: 'Place', transition: 'PTrans', arc: 'Arc', arcSource: 'Arc.src', arcTarget: 'Arc.tgt', initialMarking: 'Place.tokens',
        });
        expect(b.guard).toBeUndefined();
        expect(checkability(profile('petri'), bagOf(b)).status).toBe('checkable');
    });
});

describe('ties are never resolved (R-SIM-77, D3)', () => {
    it('two Initial subclasses: candidates in sketch order, nothing bound (killed by a tie resolved by name order)', () => {
        const b = bindProfile(profile('stateMachine'), TWO_INITIALS);
        expect(b.initial).toMatchObject({ status: 'candidates', values: ['TInit', 'TStart'] });
        expect(bagOf(b).simInitial).toBeUndefined();
        expect(checkability(profile('stateMachine'), bagOf(b)).status).toBe('notCheckable');
        // control: the rest of the turnstile is still bound
        expect(statuses(b)).toMatchObject({ node: 'TState', nextState: 'TTrans.next', trigger: 'TTrans.trigger' });
    });

    it('two references with the same score: Next state and Transition are candidates, the shared Node is bound', () => {
        const opaque: MetamodelSketch = {
            classes: [C('A'), C('B'), C('X')],
            attributes: [],
            references: [R('A', 'r1', 'X'), R('B', 'r2', 'X')],
        };
        const b = bindProfile(profile('stateMachine'), opaque);
        expect(b.nextState).toMatchObject({ status: 'candidates', values: ['A.r1', 'B.r2'] });
        expect(b.transition).toMatchObject({ status: 'candidates', values: ['A', 'B'] });
        expect(b.node).toMatchObject({ status: 'bound', value: 'X' });
        // a role that needs the transition is not guessed from the first candidate
        expect(b.ownedTransitions?.status).toBe('none');
        expect(b.trigger?.status).toBe('none');
    });

    it('two Expression attributes on the transition: Guard is candidates', () => {
        const twoGuards: MetamodelSketch = {
            ...PEST_SM_RECONSTRUCTED,
            attributes: [A('Transition', 'guard', EXPR), A('Transition', 'when', EXPR)],
        };
        expect(bindProfile(profile('stateMachine'), twoGuards).guard)
            .toMatchObject({ status: 'candidates', values: ['Transition.guard', 'Transition.when'] });
    });

    it('a name that does not narrow leaves the structure to decide: a sole structural candidate binds, two do not', () => {
        const oneAction: MetamodelSketch = { ...PEST_SM_RECONSTRUCTED, attributes: [A('Transition', 'run', ACT)] };
        expect(bindProfile(profile('extendedStateMachine'), oneAction).action).toMatchObject({ status: 'bound', value: 'Transition.run' });
        const twoActions: MetamodelSketch = { ...PEST_SM_RECONSTRUCTED, attributes: [A('Transition', 'run', ACT), A('Transition', 'log', ACT)] };
        expect(bindProfile(profile('extendedStateMachine'), twoActions).action).toMatchObject({ status: 'candidates' });
    });
});

describe('Trigger is bound only within the transition lineage (report §3.1)', () => {
    it('a reference to an event-like class owned outside the transition lineage is never Trigger (killed by dropping the lineage restriction)', () => {
        const outside: MetamodelSketch = {
            ...FSM_BOOLEANS,
            classes: [...FSM_BOOLEANS.classes, C('Symbol')],
            references: [...FSM_BOOLEANS.references, R('FSM', 'input', 'Symbol')],
        };
        const b = bindProfile(profile('stateMachine'), outside);
        expect(b.trigger?.status).toBe('none');
        // control: the same reference owned by the transition is Trigger
        const inside: MetamodelSketch = { ...outside, references: [...FSM_BOOLEANS.references, R('Transition', 'input', 'Symbol')] };
        expect(bindProfile(profile('stateMachine'), inside).trigger).toMatchObject({ status: 'bound', value: 'Transition.input' });
    });

    it('an inherited reference of the transition counts: the lineage, not the class alone', () => {
        const inherited: MetamodelSketch = {
            classes: [C('State'), C('Init', ['State']), C('Base', [], true), C('Transition', ['Base']), C('Event')],
            attributes: [],
            references: [R('State', 'out', 'Transition', true), R('Transition', 'next', 'State'), R('Base', 'on', 'Event')],
        };
        expect(bindProfile(profile('stateMachine'), inherited).trigger).toMatchObject({ status: 'bound', value: 'Base.on' });
    });
});

describe('output shape', () => {
    it('one binding per edit role with a binding kind; derived, off, parameters and tables are absent', () => {
        const b = bindProfile(profile('extendedStateMachine'), ESM_ACTIONS);
        expect(b.bound).toBeUndefined();          // derived k = 1
        expect(b.initialMarking).toBeUndefined(); // derived from Initial
        expect(b.event).toBeUndefined();          // derived from Trigger
        expect(b.stateAttributes).toBeUndefined(); // a table, not a binding
        expect(b.arc).toBeUndefined();            // off in control flow
        expect(bindProfile(profile('petri'), PETRI_3B).bound).toBeUndefined(); // a parameter
    });

    it('every binding says why; a bound value is always a non-empty string', () => {
        for (const [sk, id] of [[TURNSTILE, 'stateMachine'], [PETRI_3B, 'petri'], [FSM_BOOLEANS, 'stateMachine']] as const) {
            for (const b of Object.values(bindProfile(profile(id), sk)) as RoleBinding[]) {
                expect(b.why).toMatch(/\S/);
                if (b.status === 'bound') expect(b.value).toMatch(/\S/);
            }
        }
    });

    it('an empty sketch binds nothing and throws nothing', () => {
        const empty: MetamodelSketch = { classes: [], attributes: [], references: [] };
        for (const id of ['petri', 'flowchart', 'stateMachine', 'extendedStateMachine']) {
            const b = bindProfile(profile(id), empty);
            expect(counts(b).bound).toBe(0);
        }
    });
});
