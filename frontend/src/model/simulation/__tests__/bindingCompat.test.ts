/**
 * bindingCompat — which elements of a metamodel a profile's role can bind
 * (S11a, P-2026-09-27-1646; backlog report 2026-09-27 §4.2).
 *
 * Two sketches built to hit every rule: SM, a control-flow metamodel with an
 * abstract root, a superclass of the node class, node and transition
 * subclasses, and a reference or attribute on each side of every rule; PETRI,
 * a Petri metamodel with an abstract arc end, a one-sided arc end and features
 * of every numeric kind. The maps below list every candidate, so a rule that
 * moves one verdict breaks a test. Each test name says which break of the rules
 * kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { bindingVerdicts, currentVerdicts } from '../bindingCompat';
import type { BindingVerdicts, RoleCompatibility } from '../bindingCompat';
import { SKETCH_TYPE } from '../profileBinder';
import type { MetamodelSketch, SketchAttribute, SketchClass, SketchReference } from '../profileBinder';
import { checkability, systemProfile } from '../simProfiles';
import type { BindingVerdict, SimProfile } from '../simProfiles';
import type { RoleId } from '../roleCatalog';

const { int: EINT, string: ESTRING, boolean: EBOOL, expression: EXPR, action: ACT } = SKETCH_TYPE;
const ELONG = 'Pointer_ELONG';
const EDOUBLE = 'Pointer_EDOUBLE';

const C = (id: string, supers: string[] = [], abstract = false): SketchClass => ({ id, name: id, abstract, supers });
const A = (owner: string, name: string, type: string): SketchAttribute => ({ id: `${owner}.${name}`, name, owner, type });
const R = (owner: string, name: string, type: string, composition = false, aggregation = false): SketchReference => (
    { id: `${owner}.${name}`, name, owner, type, composition, aggregation }
);

const profile = (id: string): SimProfile => systemProfile(id) as SimProfile;

const ok: BindingVerdict = 'ok';
const warn: BindingVerdict = 'warn';
const bad: BindingVerdict = 'incompatible';

/** Candidate id → verdict, for one role. */
function mapOf(v: BindingVerdicts, role: RoleId): Record<string, BindingVerdict> {
    const out: Record<string, BindingVerdict> = {};
    for (const c of (v[role] as RoleCompatibility).candidates) out[c.id] = c.verdict;
    return out;
}

function why(v: BindingVerdicts, role: RoleId, id: string): string {
    return ((v[role] as RoleCompatibility).candidates.find(c => c.id === id) as { why: string }).why;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Node = State, Transition = Transition in the bags below. */
const SM: MetamodelSketch = {
    classes: [
        C('Element', [], true), C('Vertex', ['Element']), C('State', ['Vertex']),
        C('Initial', ['State']), C('Final', ['State']), C('Composite', ['State']), C('Hidden', ['State'], true),
        C('Transition', ['Element']), C('Timed', ['Transition']), C('Event', ['Element']), C('Signal'), C('Other'),
    ],
    attributes: [
        A('Element', 'name', ESTRING),
        A('State', 'label', ESTRING), A('State', 'entry', ACT), A('State', 'inv', EXPR), A('Composite', 'exit', ACT),
        A('Transition', 'guard', EXPR), A('Transition', 'cond', ESTRING), A('Transition', 'priority', EINT), A('Transition', 'effect', ACT),
        A('Timed', 'delay', EINT), A('Timed', 'when', EXPR),
        A('Event', 'code', ESTRING), A('Signal', 'id', ESTRING), A('Other', 'flag', EBOOL),
    ],
    references: [
        R('State', 'out', 'Transition', true), R('Element', 'owned', 'Transition', true), R('Composite', 'subs', 'Transition', true),
        R('Composite', 'kids', 'State', true), R('Other', 'edges', 'Transition', true), R('Other', 'hold', 'State', true),
        R('Vertex', 'links', 'Element', true), R('State', 'plain', 'Transition'),
        R('Transition', 'next', 'State'), R('Transition', 'to', 'Initial'), R('Transition', 'src', 'Vertex'),
        R('Transition', 'loop', 'Transition'), R('Transition', 'back', 'State', false, true),
        R('Transition', 'trigger', 'Event'), R('Transition', 'fires', 'Signal'), R('Transition', 'text', ESTRING),
        R('Element', 'tags', 'Signal'), R('Timed', 'clock', 'Signal'), R('Other', 'next2', 'State'),
    ],
};

const SM_BAG = { simNode: 'State', simTransition: 'Transition' };

/** Node = Place, Transition = PTrans, Arc = Arc in the bags below. */
const PETRI: MetamodelSketch = {
    classes: [
        C('PNode', [], true), C('Place', ['PNode']), C('Sub', ['Place']), C('PTrans', ['PNode']),
        C('Arc'), C('Inhibitor', ['Arc']), C('Weird'),
    ],
    attributes: [
        A('Place', 'tokens', EINT), A('Place', 'count', ELONG), A('Place', 'level', EDOUBLE), A('Place', 'label', ESTRING),
        A('PNode', 'start', EINT), A('Sub', 'extra', EINT),
        A('Arc', 'weight', EINT), A('Arc', 'w', ESTRING), A('Inhibitor', 'w3', EINT), A('PTrans', 'guard', EXPR),
    ],
    references: [
        R('Arc', 'src', 'PNode'), R('Arc', 'tgt', 'PNode'), R('Arc', 'fromPlace', 'Place'), R('Arc', 'x', 'Weird'),
        R('Weird', 'src2', 'PNode'), R('Arc', 'cont', 'PNode', true),
    ],
};

const PETRI_BAG = { simNode: 'Place', simTransition: 'PTrans', simArc: 'Arc' };

/**
 * A mixin owner (R-SIM-89): Node and ActionElement (abstract) are unrelated,
 * ProcessNode extends both and is concrete — a common concrete subclass.
 * Lonely's feature has no common subclass with Node at all. AbstractCommon
 * extends Node and MixinBase but is itself abstract, with no concrete
 * descendant, so MixinBase's feature stays incompatible against Node.
 */
const MIXIN: MetamodelSketch = {
    classes: [
        C('Node'), C('ActionElement', [], true), C('ProcessNode', ['Node', 'ActionElement']),
        C('Lonely'), C('MixinBase', [], true), C('AbstractCommon', ['Node', 'MixinBase'], true),
    ],
    attributes: [
        A('ActionElement', 'action', ACT),
        A('Lonely', 'flag', ACT),
        A('MixinBase', 'thing', ACT),
    ],
    references: [],
};

const MIXIN_BAG = { simNode: 'Node' };

// ---------------------------------------------------------------------------

describe('output shape', () => {
    it('one entry per edit role whose kind binds an element, in catalog order; derived, off, Bound and the declarations are absent (killed by dropping the edit filter or the kind filter)', () => {
        expect(Object.keys(bindingVerdicts(profile('stateMachine'), {}, SM))).toEqual([
            'node', 'initial', 'terminal', 'transition', 'ownedTransitions', 'source', 'nextState', 'trigger', 'eventIdentifier', 'guard',
        ]);
        expect(Object.keys(bindingVerdicts(profile('petri'), {}, PETRI))).toEqual([
            'node', 'initialMarking', 'terminal', 'transition', 'arc', 'arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc', 'guard',
        ]);
        const esm = Object.keys(bindingVerdicts(profile('extendedStateMachine'), {}, SM));
        expect(esm).toEqual(expect.arrayContaining(['action', 'entry', 'exit']));
        expect(esm).not.toContain('stateAttributes');
        expect(esm).not.toContain('event');
        expect(esm).not.toContain('initialMarking');
    });

    it('the candidates of a role are every element of its sort, in sketch order (killed by a wrong sort pool)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        expect(v.node?.candidates.map(c => c.id)).toEqual(SM.classes.map(c => c.id));
        expect(v.nextState?.candidates.map(c => c.id)).toEqual(SM.references.map(r => r.id));
        expect(v.guard?.candidates.map(c => c.id)).toEqual(SM.attributes.map(a => a.id));
    });

    it('current is null for an unset, empty or non-string key, and the bag value judged by the candidate rules otherwise', () => {
        const sm = profile('stateMachine');
        expect(bindingVerdicts(sm, {}, SM).node?.current).toBeNull();
        expect(bindingVerdicts(sm, { simNode: '' }, SM).node?.current).toBeNull();
        expect(bindingVerdicts(sm, { simNode: 42 }, SM).node?.current).toBeNull();
        const v = bindingVerdicts(sm, { ...SM_BAG, simNextState: 'Transition.src' }, SM);
        expect(v.node?.current).toEqual({ id: 'State', verdict: ok, why: '' });
        expect(v.nextState?.current).toEqual(v.nextState?.candidates.find(c => c.id === 'Transition.src'));
        expect(v.nextState?.current?.verdict).toBe(warn);
    });

    it('a value not in the sketch, or of another sort, is incompatible and says so (killed by skipping the sort check)', () => {
        const v = bindingVerdicts(profile('stateMachine'), { simNode: 'Nope', simInitial: 'Transition.next', simGuard: 'State' }, SM);
        expect(v.node?.current).toEqual({ id: 'Nope', verdict: bad, why: 'Not in this metamodel' });
        expect(v.initial?.current?.verdict).toBe(bad);
        expect(v.initial?.current?.why).toContain('is a reference, not a class');
        expect(v.guard?.current?.verdict).toBe(bad);
        expect(v.guard?.current?.why).toContain('is a class, not an attribute');
    });

    it('ok has an empty why; warn and incompatible always say why', () => {
        for (const id of ['stateMachine', 'extendedStateMachine', 'flowchart', 'moore', 'mealy']) {
            for (const r of Object.values(bindingVerdicts(profile(id), SM_BAG, SM)) as RoleCompatibility[]) {
                for (const c of r.candidates) expect(c.verdict === ok).toBe(c.why === '');
            }
        }
        for (const r of Object.values(bindingVerdicts(profile('petri'), PETRI_BAG, PETRI)) as RoleCompatibility[]) {
            for (const c of r.candidates) expect(c.verdict === ok).toBe(c.why === '');
        }
    });
});

describe('class roles', () => {
    it('Node and Transition may be abstract in control flow (R-SIM-81), not under Petri (killed by dropping the control-flow exception, or by extending it to Petri)', () => {
        const cf = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        expect(Object.values(mapOf(cf, 'node'))).toEqual(SM.classes.map(() => ok));
        expect(Object.values(mapOf(cf, 'transition'))).toEqual(SM.classes.map(() => ok));
        const pn = bindingVerdicts(profile('petri'), PETRI_BAG, PETRI);
        expect(mapOf(pn, 'node')).toEqual({ PNode: bad, Place: ok, Sub: ok, PTrans: ok, Arc: ok, Inhibitor: ok, Weird: ok });
        expect(mapOf(pn, 'transition').PNode).toBe(bad);
        expect(mapOf(pn, 'arc')).toEqual({ PNode: bad, Place: ok, Sub: ok, PTrans: ok, Arc: ok, Inhibitor: ok, Weird: ok });
        expect(why(pn, 'node', 'PNode')).toContain('abstract');
    });

    it('Initial and Terminal are a proper subclass of Node: Node itself or a superclass warns, anything else is incompatible, an abstract class too (killed by accepting Node itself, a superclass passing, an unrelated class warning, or dropping the concrete rule)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        const expected = {
            Element: bad, Vertex: warn, State: warn, Initial: ok, Final: ok, Composite: ok, Hidden: bad,
            Transition: bad, Timed: bad, Event: bad, Signal: bad, Other: bad,
        };
        expect(mapOf(v, 'initial')).toEqual(expected);
        expect(mapOf(v, 'terminal')).toEqual(expected);
        expect(why(v, 'initial', 'Hidden')).toContain('abstract');
        expect(why(v, 'initial', 'State')).toContain('every State');
    });

    it('Fork, Join and Activity final follow the same rule under Flowchart', () => {
        const v = bindingVerdicts(profile('flowchart'), SM_BAG, SM);
        for (const role of ['fork', 'join', 'activityFinal'] as RoleId[]) {
            expect(mapOf(v, role)).toMatchObject({ State: warn, Initial: ok, Hidden: bad, Transition: bad });
        }
    });

    it('Inhibitor arc is a proper subclass of Arc; Arc itself warns (killed by accepting the context class itself)', () => {
        const v = bindingVerdicts(profile('petri'), PETRI_BAG, PETRI);
        expect(mapOf(v, 'inhibitorArc')).toEqual({ PNode: bad, Place: bad, Sub: bad, PTrans: bad, Arc: warn, Inhibitor: ok, Weird: bad });
        expect(mapOf(v, 'terminal')).toEqual({ PNode: bad, Place: warn, Sub: ok, PTrans: bad, Arc: bad, Inhibitor: bad, Weird: bad });
    });
});

describe('reference roles', () => {
    it('Next state and Source: on the transition lineage, leading to Node; a wider type or a containment warns (killed by a wider type passing, an unrelated type warning, or dropping the containment rule)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        const expected = {
            'State.out': bad, 'Element.owned': bad, 'Composite.subs': bad, 'Composite.kids': bad, 'Other.edges': bad,
            'Other.hold': bad, 'Vertex.links': bad, 'State.plain': bad,
            'Transition.next': ok, 'Transition.to': ok, 'Transition.src': warn, 'Transition.loop': bad, 'Transition.back': warn,
            'Transition.trigger': bad, 'Transition.fires': bad, 'Transition.text': bad,
            'Element.tags': bad, 'Timed.clock': bad, 'Other.next2': bad,
        };
        expect(mapOf(v, 'nextState')).toEqual(expected);
        expect(mapOf(v, 'source')).toEqual(expected);
        expect(why(v, 'nextState', 'Transition.back')).toContain('containment');
        expect(why(v, 'nextState', 'Transition.src')).toContain('wider than State');
    });

    it('Owned transitions: a composition on the node lineage leading to Transition; an owner subclass, a wider type or a plain reference warns (killed by an owner subclass passing, or dropping the composition rule)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        expect(mapOf(v, 'ownedTransitions')).toEqual({
            'State.out': ok, 'Element.owned': ok, 'Composite.subs': warn, 'Composite.kids': bad, 'Other.edges': bad,
            'Other.hold': bad, 'Vertex.links': warn, 'State.plain': warn,
            'Transition.next': bad, 'Transition.to': bad, 'Transition.src': bad, 'Transition.loop': bad, 'Transition.back': bad,
            'Transition.trigger': bad, 'Transition.fires': bad, 'Transition.text': bad,
            'Element.tags': bad, 'Timed.clock': bad, 'Other.next2': bad,
        });
        expect(why(v, 'ownedTransitions', 'State.plain')).toContain('not a composition');
        expect(why(v, 'ownedTransitions', 'Composite.subs')).toContain('a subclass of State');
    });

    it('Trigger: on the transition lineage, to a class unrelated to Node and Transition (S10; killed by dropping the overlap rule, or the lineage restriction)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        expect(mapOf(v, 'trigger')).toEqual({
            'State.out': bad, 'Element.owned': bad, 'Composite.subs': bad, 'Composite.kids': bad, 'Other.edges': bad,
            'Other.hold': bad, 'Vertex.links': bad, 'State.plain': bad,
            'Transition.next': bad, 'Transition.to': bad, 'Transition.src': bad, 'Transition.loop': bad, 'Transition.back': bad,
            'Transition.trigger': ok, 'Transition.fires': ok, 'Transition.text': bad,
            'Element.tags': ok, 'Timed.clock': warn, 'Other.next2': bad,
        });
        expect(why(v, 'trigger', 'Transition.text')).toContain('no event role');
        expect(why(v, 'trigger', 'Transition.src')).toContain('R-SIM-16');
    });

    it('the worst rule decides and every failed rule is named (killed by the first or the last failed rule deciding)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        // Owner a subclass (warn), then a type that leads elsewhere (incompatible).
        expect(mapOf(v, 'ownedTransitions')['Composite.kids']).toBe(bad);
        expect(why(v, 'ownedTransitions', 'Composite.kids')).toContain('a subclass of State');
        expect(why(v, 'ownedTransitions', 'Composite.kids')).toContain('does not lead to Transition');
        // An owner elsewhere (incompatible), then a containment (warn), then a type that passes.
        expect(mapOf(v, 'nextState')['Other.hold']).toBe(bad);
        expect(why(v, 'nextState', 'Other.hold')).toContain('containment');
        expect(why(v, 'nextState', 'Other.hold')).toContain('not a feature of Transition');
    });

    it('Arc source and Arc target: on the arc lineage, leading to both Place and Transition; one side only warns (killed by accepting a one-sided end)', () => {
        const v = bindingVerdicts(profile('petri'), PETRI_BAG, PETRI);
        const expected = { 'Arc.src': ok, 'Arc.tgt': ok, 'Arc.fromPlace': warn, 'Arc.x': bad, 'Weird.src2': bad, 'Arc.cont': warn };
        expect(mapOf(v, 'arcSource')).toEqual(expected);
        expect(mapOf(v, 'arcTarget')).toEqual(expected);
        // With Transition unset, only Place is judged: the one-sided end covers it.
        const placeOnly = bindingVerdicts(profile('petri'), { simNode: 'Place', simArc: 'Arc' }, PETRI);
        expect(mapOf(placeOnly, 'arcSource')).toMatchObject({ 'Arc.fromPlace': ok, 'Arc.x': bad });
    });
});

describe('attribute roles', () => {
    it('Initial marking and Arc weight read integers: EInt and ELong pass, a decimal type warns, anything else is incompatible (killed by accepting an EString: the engine reads numbers only)', () => {
        const v = bindingVerdicts(profile('petri'), PETRI_BAG, PETRI);
        expect(mapOf(v, 'initialMarking')).toEqual({
            'Place.tokens': ok, 'Place.count': ok, 'Place.level': warn, 'Place.label': bad, 'PNode.start': ok, 'Sub.extra': warn,
            'Arc.weight': bad, 'Arc.w': bad, 'Inhibitor.w3': bad, 'PTrans.guard': bad,
        });
        expect(mapOf(v, 'arcWeight')).toEqual({
            'Place.tokens': bad, 'Place.count': bad, 'Place.level': bad, 'Place.label': bad, 'PNode.start': bad, 'Sub.extra': bad,
            'Arc.weight': ok, 'Arc.w': bad, 'Inhibitor.w3': warn, 'PTrans.guard': bad,
        });
    });

    it('Guard reads an Expression or an EString (R-SIM-44) on the transition lineage (killed by dropping EString, or accepting any type)', () => {
        const v = bindingVerdicts(profile('stateMachine'), SM_BAG, SM);
        expect(mapOf(v, 'guard')).toEqual({
            'Element.name': ok, 'State.label': bad, 'State.entry': bad, 'State.inv': bad, 'Composite.exit': bad,
            'Transition.guard': ok, 'Transition.cond': ok, 'Transition.priority': bad, 'Transition.effect': bad,
            'Timed.delay': bad, 'Timed.when': warn, 'Event.code': bad, 'Signal.id': bad, 'Other.flag': bad,
        });
    });

    it('Action reads an Action or an EString on the transition lineage; Entry and Exit on the node lineage (Extended SM)', () => {
        const v = bindingVerdicts(profile('extendedStateMachine'), SM_BAG, SM);
        expect(mapOf(v, 'action')).toEqual({
            'Element.name': ok, 'State.label': bad, 'State.entry': bad, 'State.inv': bad, 'Composite.exit': bad,
            'Transition.guard': bad, 'Transition.cond': ok, 'Transition.priority': bad, 'Transition.effect': ok,
            'Timed.delay': bad, 'Timed.when': bad, 'Event.code': bad, 'Signal.id': bad, 'Other.flag': bad,
        });
        const onNode = {
            'Element.name': ok, 'State.label': ok, 'State.entry': ok, 'State.inv': bad, 'Composite.exit': warn,
            'Transition.guard': bad, 'Transition.cond': bad, 'Transition.priority': bad, 'Transition.effect': bad,
            'Timed.delay': bad, 'Timed.when': bad, 'Event.code': bad, 'Signal.id': bad, 'Other.flag': bad,
        };
        expect(mapOf(v, 'entry')).toEqual(onNode);
        expect(mapOf(v, 'exit')).toEqual(onNode);
    });

    it('Event identifier is judged against the type of the bag\'s Trigger; with no event class only its sort counts (killed by judging it against Transition)', () => {
        const sm = profile('stateMachine');
        const onEvent = mapOf(bindingVerdicts(sm, { ...SM_BAG, simTrigger: 'Transition.trigger' }, SM), 'eventIdentifier');
        expect(onEvent).toMatchObject({ 'Event.code': ok, 'Element.name': ok, 'Signal.id': bad, 'Transition.guard': bad });
        const onSignal = mapOf(bindingVerdicts(sm, { ...SM_BAG, simTrigger: 'Transition.fires' }, SM), 'eventIdentifier');
        expect(onSignal).toMatchObject({ 'Signal.id': ok, 'Event.code': bad, 'Element.name': bad });
        for (const bag of [SM_BAG, { ...SM_BAG, simTrigger: 'Transition.text' }]) {
            expect(new Set(Object.values(mapOf(bindingVerdicts(sm, bag, SM), 'eventIdentifier')))).toEqual(new Set([ok]));
        }
    });

    it('State output and Transition output take any type, on their lineage (Moore, Mealy)', () => {
        expect(mapOf(bindingVerdicts(profile('moore'), SM_BAG, SM), 'stateOutput')).toEqual({
            'Element.name': ok, 'State.label': ok, 'State.entry': ok, 'State.inv': ok, 'Composite.exit': warn,
            'Transition.guard': bad, 'Transition.cond': bad, 'Transition.priority': bad, 'Transition.effect': bad,
            'Timed.delay': bad, 'Timed.when': bad, 'Event.code': bad, 'Signal.id': bad, 'Other.flag': bad,
        });
        expect(mapOf(bindingVerdicts(profile('mealy'), SM_BAG, SM), 'transitionOutput')).toEqual({
            'Element.name': ok, 'State.label': bad, 'State.entry': bad, 'State.inv': bad, 'Composite.exit': bad,
            'Transition.guard': ok, 'Transition.cond': ok, 'Transition.priority': ok, 'Transition.effect': ok,
            'Timed.delay': warn, 'Timed.when': warn, 'Event.code': bad, 'Signal.id': bad, 'Other.flag': bad,
        });
    });
});

describe('owner roles: a mixin owner (R-SIM-89)', () => {
    it('a feature owned by an unrelated class warns when a common concrete subclass exists, with the exact text (killed by leaving it incompatible, or dropping the concrete check)', () => {
        const v = bindingVerdicts(profile('extendedStateMachine'), MIXIN_BAG, MIXIN);
        expect(mapOf(v, 'entry')).toMatchObject({ 'ActionElement.action': warn, 'Lonely.flag': bad, 'MixinBase.thing': bad });
        expect(why(v, 'entry', 'ActionElement.action'))
            .toBe('ActionElement.action is declared on ActionElement: only Node instances that are also ActionElement carry it');
    });

    it('no common subclass at all stays incompatible (killed by warning on any unrelated owner)', () => {
        const v = bindingVerdicts(profile('extendedStateMachine'), MIXIN_BAG, MIXIN);
        expect(why(v, 'entry', 'Lonely.flag')).toContain('is not a feature of Node');
    });

    it('an abstract common subclass with no concrete descendant does not count: still incompatible (killed by counting an abstract common subclass)', () => {
        const v = bindingVerdicts(profile('extendedStateMachine'), MIXIN_BAG, MIXIN);
        expect(why(v, 'entry', 'MixinBase.thing')).toContain('is not a feature of Node');
    });
});

describe('a context role unset', () => {
    it('skips the rules that need it: the missing role is checkability\'s to report (killed by judging against a missing context)', () => {
        const v = bindingVerdicts(profile('stateMachine'), {}, SM);
        expect(mapOf(v, 'initial')).toMatchObject({ Transition: ok, Signal: ok, State: ok, Hidden: bad, Element: bad });
        expect(mapOf(v, 'nextState')).toMatchObject({
            'Transition.loop': ok, 'Transition.text': ok, 'Other.next2': ok, 'Transition.back': warn, 'State.out': warn,
        });
        expect(mapOf(v, 'trigger')).toMatchObject({ 'Transition.loop': ok, 'Transition.text': bad });
        expect(mapOf(v, 'guard')).toMatchObject({ 'Other.flag': bad, 'State.inv': ok });
    });

    it('a context set to something that is not a class of the sketch is unset for the rules', () => {
        const v = bindingVerdicts(profile('stateMachine'), { simNode: 'Nope', simTransition: 'Transition.next' }, SM);
        expect(v.node?.current?.verdict).toBe(bad);
        expect(v.transition?.current?.verdict).toBe(bad);
        expect(mapOf(v, 'initial')).toMatchObject({ Transition: ok, State: ok });
        expect(mapOf(v, 'nextState')).toMatchObject({ 'Transition.loop': ok, 'Other.next2': ok });
    });
});

describe('the verdicts checkability reads', () => {
    const sm = profile('stateMachine');
    const complete = {
        simNode: 'State', simTransition: 'Transition', simNextState: 'Transition.next', simInitial: 'Initial', simOwnedTransitions: 'State.out',
    };
    const statusOf = (bag: Record<string, unknown>) => checkability(sm, bag, currentVerdicts(bindingVerdicts(sm, bag, SM)));

    it('currentVerdicts keeps exactly the roles whose key is set, with their verdict (killed by an unset role read as ok)', () => {
        expect(currentVerdicts(bindingVerdicts(sm, { simNode: 'State', simGuard: 'Transition.priority' }, SM)))
            .toEqual({ node: ok, guard: bad });
        expect(currentVerdicts(bindingVerdicts(sm, {}, SM))).toEqual({});
    });

    it('all ok is checkable, a warning gives «with warnings», an incompatible binding is not checkable though nothing is missing', () => {
        expect(statusOf(complete)).toEqual({ status: 'checkable', missing: [] });
        expect(statusOf({ ...complete, simNextState: 'Transition.src' })).toEqual({ status: 'warnings', missing: [] });
        expect(statusOf({ ...complete, simNextState: 'Transition.loop' })).toEqual({ status: 'notCheckable', missing: [] });
    });

    it('a set key of an off role gives no verdict (killed by judging off roles)', () => {
        expect(statusOf({ ...complete, simArc: 'Nope', simAccepting: 'Transition' }).status).toBe('checkable');
    });
});

describe('purity', () => {
    it('reads a frozen bag and sketch, and gives the same verdicts twice', () => {
        const freeze = <T>(o: T): T => {
            if (o && typeof o === 'object') {
                for (const v of Object.values(o as object)) freeze(v);
                Object.freeze(o);
            }
            return o;
        };
        const sketch = freeze(structuredClone(SM));
        const bag = freeze({ ...SM_BAG, simTrigger: 'Transition.trigger' });
        const once = bindingVerdicts(profile('extendedStateMachine'), bag, sketch);
        expect(bindingVerdicts(profile('extendedStateMachine'), bag, sketch)).toEqual(once);
    });
});
