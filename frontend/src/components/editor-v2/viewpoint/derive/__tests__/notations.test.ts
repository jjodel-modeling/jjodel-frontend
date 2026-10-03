/**
 * notations — the «Derive viewpoint» dialog's notations, prefill, binding and provenance
 * (slice D, P-2026-09-30-0255, R-VP-21).
 *
 * The module is pure, so the tests run it directly. The four demo metamodels are the ones
 * `viewpointDerivation.test.ts` transcribes from the exports (`~/jjodel-demo-exports/scene_*.json`,
 * readable ids); their exported bags are empty, and the demo configures them through the
 * Simulation roles dialog, whose Apply writes `simProfile` and the binder's bound proposals:
 * `appliedBag` below is that bag.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
    DERIVED_NOTATIONS, DERIVED_ROLE_PREFIX, canDerive, defaultChoice, derivedDocuments, derivedViewpointState, dialogPrefill,
    initialNotation, notationRoles, roleLabel,
} from '../notations';
import type { ClassRoles, DeriveChoice, DerivedNotationId } from '../notations';
import { deriveGenericViewpointIRs } from '../viewpointDerivation';
import type { AnyDerivedView } from '../viewpointDerivation';
import { validateIR } from '../../ir/irValidate';
import { getIRIndex, resolveObjectAsEdgeView } from '../../ir/irResolveCore';
import { makeDrawReadCtx } from '../../ir/irReadCtx';
import { structuralHash } from '../../ir/irDefaults';
import { sketchOfMetamodel } from '../../../sim/metamodelSketch';
import { bindProfile } from '../../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../../model/simulation/simProfiles';
import { encodeProfile } from '../../../../../model/simulation/profileCodec';
import { ROLE_CATALOG } from '../../../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures (the builder and the four demos of viewpointDerivation.test.ts)
// ---------------------------------------------------------------------------

type Lookup = Record<string, any>;

const EINT = 'Pointer_EINT';
const ESTRING = 'Pointer_ESTRING';
const EXPRESSION = 'Pointer_EXPRESSION';
const ACTION = 'Pointer_ACTION';

interface AttrDef { name: string; type: string; upper: number }
interface RefDef { name: string; type: string; composition: boolean; upper: number }
interface ClsDef { name: string; abstract?: boolean; supers?: string[]; attrs?: AttrDef[]; refs?: RefDef[] }
interface Fixture { id: string; lookup: Lookup; classId(name: string): string }

const attr = (name: string, type: string, upper = 1): AttrDef => ({ name, type, upper });
const ref = (name: string, type: string, opts: { composition?: boolean; upper?: number } = {}): RefDef =>
    ({ name, type, composition: !!opts.composition, upper: opts.upper ?? 1 });
const cls = (name: string, def: Omit<ClsDef, 'name'> = {}): ClsDef => ({ name, ...def });

function metamodel(tag: string, name: string, classes: ClsDef[]): Fixture {
    const lookup: Lookup = {};
    const classId = (n: string) => `${tag}.${n}`;
    lookup[tag] = { className: 'DModel', name, isMetamodel: true, packages: [`${tag}.pkg`], classes: [] };
    lookup[`${tag}.pkg`] = { className: 'DPackage', name: 'default', classes: classes.map(c => classId(c.name)), subpackages: [] };
    for (const c of classes) {
        const id = classId(c.name);
        lookup[id] = {
            className: 'DClass', name: c.name, abstract: !!c.abstract, extends: (c.supers ?? []).map(classId),
            attributes: (c.attrs ?? []).map(a => `${id}.${a.name}`), references: (c.refs ?? []).map(r => `${id}.${r.name}`),
        };
        for (const a of c.attrs ?? []) lookup[`${id}.${a.name}`] = { className: 'DAttribute', name: a.name, type: a.type, upperBound: a.upper };
        for (const r of c.refs ?? []) {
            lookup[`${id}.${r.name}`] = {
                className: 'DReference', name: r.name, type: classId(r.type), composition: r.composition, aggregation: false, upperBound: r.upper,
            };
        }
    }
    return { id: tag, lookup, classId };
}

const PEST = () => metamodel('PEST', 'DemoPEST', [
    cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event'),
]);
const PETRI = () => metamodel('PETRI', 'DemoPetri', [
    cls('PNode', { abstract: true }),
    cls('Place', { supers: ['PNode'], attrs: [attr('tokens', EINT)] }),
    cls('Transition', { supers: ['PNode'], attrs: [attr('guard', EXPRESSION)] }),
    cls('Arc', { attrs: [attr('weight', EINT)], refs: [ref('src', 'PNode'), ref('tgt', 'PNode')] }),
    cls('InhibitorArc', { supers: ['Arc'] }),
]);
const ESM = () => metamodel('ESM', 'DemoESM', [
    cls('State', { attrs: [attr('entry', ACTION, -1)], refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event', { attrs: [attr('name', ESTRING)] }),
]);
const FLOWB = () => metamodel('FLOWB', 'DemoFlowB', [
    cls('ActivityNode'),
    cls('InitialNode', { supers: ['ActivityNode'] }),
    cls('Activity', { supers: ['ActivityNode'] }),
    cls('Decision', { supers: ['ActivityNode'] }),
    cls('Fork', { supers: ['ActivityNode'] }),
    cls('Join', { supers: ['ActivityNode'] }),
    cls('FinalNode', { supers: ['ActivityNode'] }),
    cls('ControlFlow', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('source', 'ActivityNode'), ref('target', 'ActivityNode')] }),
]);

/** The bag the Simulation roles dialog's Apply writes: `simProfile` and the binder's bound proposals. */
function appliedBag(mm: Fixture, profileId: string): Record<string, unknown> {
    const bindings = bindProfile(systemProfile(profileId)!, sketchOfMetamodel(mm.lookup, mm.id));
    const bag: Record<string, unknown> = { simProfile: profileId };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    return bag;
}

/** The demo with its binding applied, as the demo configures it. */
function configured(make: () => Fixture, profileId: string): Fixture {
    const mm = make();
    mm.lookup[mm.id]._state = appliedBag(mm, profileId);
    return mm;
}

/** [name, fixture with its binding applied, the stored profile, the notation it opens on] */
const DEMOS: [string, () => Fixture, string, DerivedNotationId][] = [
    // P-2026-09-30-1552 (R-VP-26): a stored State machine binding opens on Statechart (UML).
    ['DemoPEST', PEST, 'stateMachine', 'statechart'],
    // A2 (P-2026-09-30-1521, R-VP-24): a stored Petri binding opens on Petri net (classic).
    ['DemoPetri', PETRI, 'petri', 'petriClassic'],
    // P-2026-10-03-1300 (amends R-VP-22): State machine is hidden and drawn as Statechart (UML); the dialog opens on its twin.
    ['DemoESM', ESM, 'extendedStateMachine', 'statechart'],
    // P-2026-09-30-1552 (R-VP-26): a stored Flowchart binding opens on Activity (UML).
    ['DemoFlowB', FLOWB, 'flowchart', 'activityUml'],
];

/** The first notation of the list on the same profile: the binder's own table, with no notation's signals on it. */
const sibling = (notation: DerivedNotationId): DerivedNotationId => {
    const profile = DERIVED_NOTATIONS.find(n => n.id === notation)!.profile;
    return DERIVED_NOTATIONS.find(n => n.profile === profile)!.id;
};

/** The class roles of `bindProfile`'s output, per class: catalog order, the first role a class takes. */
function inverted(bindings: ReturnType<typeof bindProfile>): Record<string, RoleId> {
    const out: Record<string, RoleId> = {};
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.kind === 'class' && b?.status === 'bound' && !(b.value in out)) out[b.value] = d.id;
    }
    return out;
}

/** The roles by class name, for reading. */
const byName = (mm: Fixture, roles: ClassRoles) =>
    Object.fromEntries(Object.entries(roles).map(([id, r]) => [mm.lookup[id]?.name ?? id, r]).sort(([a], [b]) => a.localeCompare(b)));

function deepFreeze<T>(x: T): T {
    if (x && typeof x === 'object' && !Object.isFrozen(x)) {
        Object.freeze(x);
        for (const v of Object.values(x as object)) deepFreeze(v);
    }
    return x;
}

/** 16 hex of the sha256 of the list, as JSON, the digest of viewpointDerivation.test.ts. */
const digest = (views: AnyDerivedView[]) => createHash('sha256').update(JSON.stringify(views)).digest('hex').slice(0, 16);

/** The documents without their provenance, as the derivation returns them. */
const withoutProvenance = (views: AnyDerivedView[]): AnyDerivedView[] =>
    views.map(v => {
        const { generated: _g, ...ir } = v.ir as unknown as Record<string, unknown>;
        return { ...v, ir } as unknown as AnyDerivedView;
    });

/** A derived viewpoint as the store holds one, with its `_state`. */
function derivedVp(id: string, state: Record<string, unknown>) {
    return { className: 'DViewPoint', id, name: `${id} (derived)`, _state: state };
}

// ---------------------------------------------------------------------------
// The notation list
// ---------------------------------------------------------------------------

describe('the notations offered in slice D', () => {
    it('Generic first, then State machine, Statechart (UML), Petri net, Petri net (classic), Flowchart, Flowchart (ISO 5807), Activity (UML), each on its system profile, and ER (Chen)', () => {
        // A1 and A3 (P-2026-09-30-0355, R-VP-22): the two new notations beside their siblings, which stay.
        expect(DERIVED_NOTATIONS.map(n => [n.id, n.label, n.profile])).toEqual([
            ['generic', 'Generic', null],
            ['stateMachine', 'State machine', 'stateMachine'],
            ['statechart', 'State machine (UML statechart)', 'stateMachine'],
            ['petri', 'Petri net', 'petri'],
            // A2 (P-2026-09-30-1521, R-VP-24): beside Petri net, which stays.
            ['petriClassic', 'Petri net (classic)', 'petri'],
            ['flowchart', 'Flowchart', 'flowchart'],
            ['flowchartIso', 'Flowchart (ISO 5807)', 'flowchart'],
            // P-2026-09-30-1552 (R-VP-26): Activity (UML), on the flowchart profile (activityUml.test.ts).
            ['activityUml', 'Activity (UML)', 'flowchart'],
            // A4 (P-2026-09-30-0440, R-VP-23): ER (Chen), no profile (erChen.test.ts).
            ['erChen', 'ER (Chen)', null],
        ]);
    });

    it('the roles of a table: the class roles the profile edits and the derivation draws, in catalog order', () => {
        expect(notationRoles('generic')).toEqual([]);
        expect(notationRoles('stateMachine')).toEqual(['node', 'initial', 'terminal', 'transition']);
        expect(notationRoles('flowchart')).toEqual(['node', 'initial', 'terminal', 'activityFinal', 'transition', 'fork', 'join']);
        expect(notationRoles('petri')).toEqual(['node', 'terminal', 'transition', 'arc', 'inhibitorArc']);
    });

    it('the Node role reads as the notation calls it; the others as the catalog does', () => {
        expect(roleLabel('stateMachine', 'node')).toBe('State');
        expect(roleLabel('petri', 'node')).toBe('Place');
        expect(roleLabel('flowchart', 'node')).toBe('Node');
        expect(roleLabel('petri', 'inhibitorArc')).toBe('Inhibitor arc');
        expect(roleLabel('flowchart', 'activityFinal')).toBe('Activity final');
    });
});

// ---------------------------------------------------------------------------
// Prefill (COSA 2)
// ---------------------------------------------------------------------------

describe('dialogPrefill — the binder with the stored binding as bag, inverted per class', () => {
    it('on each demo equals bindProfile\'s output for the notation\'s profile, inverted', () => {
        // The first notation of each profile: Activity (UML) adds its name signals on top (activityUml.test.ts).
        for (const [name, make, stored, opens] of DEMOS) {
            const notation = sibling(opens);
            const mm = configured(make, stored);
            const profile = systemProfile(DERIVED_NOTATIONS.find(n => n.id === notation)!.profile!)!;
            const expected = inverted(bindProfile(profile, sketchOfMetamodel(mm.lookup, mm.id), mm.lookup[mm.id]._state));
            const got = dialogPrefill(mm.lookup, mm.id, notation, []);
            expect(got.roles, name).toEqual(expected);
            expect(got.from, name).toBe('binding');
        }
    });

    it('on each demo, the tables by name', () => {
        const got = Object.fromEntries(DEMOS.map(([name, make, stored, notation]) => {
            const mm = configured(make, stored);
            return [name, byName(mm, dialogPrefill(mm.lookup, mm.id, notation, []).roles)];
        }));
        expect(got).toEqual({
            DemoPEST: { Initial: 'initial', State: 'node', Terminal: 'terminal', Transition: 'transition' },
            DemoPetri: { Arc: 'arc', InhibitorArc: 'inhibitorArc', Place: 'node', Transition: 'transition' },
            DemoESM: { Initial: 'initial', State: 'node', Terminal: 'terminal', Transition: 'transition' },
            // P-2026-09-30-1552 (R-VP-26): Activity (UML)'s signal names Decision a decision.
            DemoFlowB: {
                ActivityNode: 'node', ControlFlow: 'transition', Decision: 'decision', FinalNode: 'terminal', Fork: 'fork', InitialNode: 'initial', Join: 'join',
            },
        });
    });

    it('with no stored binding the binder proposes from the names and the structure alone', () => {
        const mm = PEST();
        const got = dialogPrefill(mm.lookup, mm.id, 'stateMachine', []);
        expect(byName(mm, got.roles)).toEqual({ Initial: 'initial', State: 'node', Terminal: 'terminal', Transition: 'transition' });
        expect(got.from).toBe('signals');
    });

    it('the stored Node and Transition are the ones the other roles derive from (the binder\'s S6)', () => {
        // A bag that keeps Initial as Node: the subclass roles are looked for under it, so none binds;
        // Node and Transition themselves keep the binder's own guess (profileBinder.ts, bindProfile).
        const mm = PEST();
        mm.lookup[mm.id]._state = { simProfile: 'stateMachine', simNode: mm.classId('Initial'), simTransition: mm.classId('Transition') };
        expect(byName(mm, dialogPrefill(mm.lookup, mm.id, 'stateMachine', []).roles)).toEqual({ State: 'node', Transition: 'transition' });
    });

    it('a class two roles bind keeps the first in catalog order (Initial before Terminal)', () => {
        // `StartEnd` is named like an Initial and like a Terminal: the binder binds it to both.
        const mm = metamodel('SE', 'StartEnd', [
            cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
            cls('StartEnd', { supers: ['State'] }),
            cls('Transition', { refs: [ref('nextState', 'State')] }),
        ]);
        const bindings = bindProfile(systemProfile('stateMachine')!, sketchOfMetamodel(mm.lookup, mm.id));
        expect([bindings.initial, bindings.terminal].map(b => (b?.status === 'bound' ? b.value : null))).toEqual(['SE.StartEnd', 'SE.StartEnd']);
        expect(byName(mm, dialogPrefill(mm.lookup, mm.id, 'stateMachine', []).roles)).toEqual({ StartEnd: 'initial', State: 'node', Transition: 'transition' });
    });

    it('Generic has no table: no roles, whatever the binding', () => {
        const mm = configured(PEST, 'stateMachine');
        expect(dialogPrefill(mm.lookup, mm.id, 'generic', [])).toEqual({ roles: {}, from: 'none' });
    });

    it('another notation on a bound metamodel: that notation\'s profile, the stored binding still the bag', () => {
        const mm = configured(PEST, 'stateMachine');
        const got = dialogPrefill(mm.lookup, mm.id, 'flowchart', []);
        const expected = inverted(bindProfile(systemProfile('flowchart')!, sketchOfMetamodel(mm.lookup, mm.id), mm.lookup[mm.id]._state));
        expect(got.roles).toEqual(expected);
    });
});

describe('initialNotation — the select opens on the stored binding\'s notation, else Generic', () => {
    it('on each demo with its binding applied, the matching notation', () => {
        for (const [name, make, stored, notation] of DEMOS) {
            const mm = configured(make, stored);
            expect(initialNotation(mm.lookup, mm.id, []), name).toBe(notation);
        }
    });

    it('on the exported demos (empty bags), Generic', () => {
        for (const [name, make] of DEMOS) {
            const mm = make();
            mm.lookup[mm.id]._state = {};
            expect(initialNotation(mm.lookup, mm.id, []), name).toBe('generic');
        }
    });

    it('a bag with only simProfile or simEnabled binds nothing: Generic', () => {
        const mm = PEST();
        mm.lookup[mm.id]._state = { simProfile: 'stateMachine', simEnabled: true };
        expect(initialNotation(mm.lookup, mm.id, [])).toBe('generic');
    });

    it('a Custom bag (no simProfile): Petri by its arc, control flow by its Trigger', () => {
        const petri = PETRI();
        const petriBag = appliedBag(petri, 'petri');
        delete petriBag.simProfile;
        petri.lookup[petri.id]._state = petriBag;
        expect(initialNotation(petri.lookup, petri.id, [])).toBe('petriClassic');

        const sm = PEST();
        const smBag = appliedBag(sm, 'stateMachine');
        delete smBag.simProfile;
        sm.lookup[sm.id]._state = smBag;
        // A Trigger binding is a state machine, and State machine is hidden: the dialog opens on its twin (P-2026-10-03-1300).
        expect(initialNotation(sm.lookup, sm.id, [])).toBe('statechart');

        const flow = FLOWB();
        const flowBag = appliedBag(flow, 'flowchart');
        delete flowBag.simProfile;
        flow.lookup[flow.id]._state = flowBag;
        // P-2026-09-30-1552 (R-VP-26): an activity opens on Activity (UML).
        expect(initialNotation(flow.lookup, flow.id, [])).toBe('activityUml');
    });

    it('a user profile opens on the notation of the system profile it is based on', () => {
        // Based on State machine, and no Trigger bound: by shape and Trigger alone it would read as a flowchart.
        const mm = PEST();
        const mine = { ...systemProfile('stateMachine')!, id: 'mine', name: 'Mine', system: false, basedOn: 'stateMachine' as const };
        mm.lookup[mm.id]._state = { simProfile: encodeProfile(mine), simNode: mm.classId('State'), simTransition: mm.classId('Transition') };
        // P-2026-09-30-1552 (R-VP-26): State machine's bindings open on Statechart (UML).
        expect(initialNotation(mm.lookup, mm.id, [])).toBe('statechart');
    });

    it('every system profile names one notation', () => {
        const mm = PEST();
        // P-2026-09-30-1552 (R-VP-26): flowchart opens on Activity (UML), stateMachine on Statechart (UML); the others as before.
        // P-2026-10-03-1300: State machine is hidden, so the four machines that opened on it open on its twin, Statechart (UML).
        const want: Record<string, DerivedNotationId> = {
            petri: 'petriClassic', flowchart: 'activityUml', stateMachine: 'statechart', extendedStateMachine: 'statechart',
            dfa: 'statechart', nfa: 'statechart', moore: 'statechart', mealy: 'statechart',
        };
        for (const [profile, notation] of Object.entries(want)) {
            mm.lookup[mm.id]._state = { simProfile: profile, simNode: mm.classId('State') };
            expect(initialNotation(mm.lookup, mm.id, []), profile).toBe(notation);
        }
    });
});

// ---------------------------------------------------------------------------
// Regeneration (COSA 5): the latest derived viewpoint's `_state`
// ---------------------------------------------------------------------------

describe('regeneration — the dialog opens on the latest derived viewpoint of the metamodel', () => {
    const roleKey = (mm: Fixture, name: string) => `${DERIVED_ROLE_PREFIX}${mm.classId(name)}`;

    it('its notation and its table, over the stored binding', () => {
        const mm = configured(PEST, 'stateMachine');
        mm.lookup.vp1 = derivedVp('vp1', {
            derivedFrom: mm.id, derivedNotation: 'stateMachine',
            [roleKey(mm, 'State')]: 'node', [roleKey(mm, 'Initial')]: 'terminal', [roleKey(mm, 'Transition')]: 'transition',
        });
        // The saved viewpoint names the hidden id; the dialog opens on its twin with the saved table (P-2026-10-03-1300).
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('statechart');
        const got = dialogPrefill(mm.lookup, mm.id, 'stateMachine', ['vp1']);
        expect(byName(mm, got.roles)).toEqual({ Initial: 'terminal', State: 'node', Transition: 'transition' });
        expect(got.from).toBe('derived');
    });

    it('the latest is the last in the project\'s viewpoint order; another metamodel\'s is ignored', () => {
        const mm = PEST();
        mm.lookup.vpA = derivedVp('vpA', { derivedFrom: mm.id, derivedNotation: 'petri', [roleKey(mm, 'State')]: 'node' });
        mm.lookup.vpB = derivedVp('vpB', { derivedFrom: mm.id, derivedNotation: 'flowchart', [roleKey(mm, 'State')]: 'node' });
        mm.lookup.vpX = derivedVp('vpX', { derivedFrom: 'OTHER', derivedNotation: 'stateMachine' });
        mm.lookup.vpPlain = { className: 'DViewPoint', id: 'vpPlain', name: 'hand made', _state: {} };
        expect(initialNotation(mm.lookup, mm.id, ['vpA', 'vpB', 'vpX', 'vpPlain'])).toBe('flowchart');
        expect(initialNotation(mm.lookup, mm.id, ['vpB', 'vpA', 'vpX'])).toBe('petri');
        // A deleted viewpoint (in the list, gone from the lookup) is skipped.
        expect(initialNotation(mm.lookup, mm.id, ['vpA', 'vpGone'])).toBe('petri');
    });

    it('a Generic latest opens on Generic, over a stored binding', () => {
        const mm = configured(PEST, 'stateMachine');
        mm.lookup.vp1 = derivedVp('vp1', { derivedFrom: mm.id, derivedNotation: 'generic' });
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('generic');
    });

    it('its table serves its own notation only; another notation is prefilled by the binder', () => {
        const mm = configured(PEST, 'stateMachine');
        mm.lookup.vp1 = derivedVp('vp1', { derivedFrom: mm.id, derivedNotation: 'stateMachine', [roleKey(mm, 'Event')]: 'node' });
        expect(dialogPrefill(mm.lookup, mm.id, 'flowchart', ['vp1']).from).toBe('binding');
    });

    it('a class gone from the metamodel, a role the notation does not offer and a non-role value are dropped', () => {
        const mm = PEST();
        mm.lookup.vp1 = derivedVp('vp1', {
            derivedFrom: mm.id, derivedNotation: 'stateMachine',
            [roleKey(mm, 'State')]: 'node', [`${DERIVED_ROLE_PREFIX}PEST.Gone`]: 'initial',
            [roleKey(mm, 'Transition')]: 'arc', [roleKey(mm, 'Event')]: 42,
        });
        expect(byName(mm, dialogPrefill(mm.lookup, mm.id, 'stateMachine', ['vp1']).roles)).toEqual({ State: 'node' });
    });

    it('an unknown notation in the latest is not a notation: the stored binding decides', () => {
        const mm = configured(PETRI, 'petri');
        mm.lookup.vp1 = derivedVp('vp1', { derivedFrom: mm.id, derivedNotation: 'er' });
        // A2 (R-VP-24): the stored Petri binding opens on Petri net (classic).
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('petriClassic');
    });
});

// ---------------------------------------------------------------------------
// The derived viewpoint's `_state` (COSA 3) and canDerive
// ---------------------------------------------------------------------------

describe('derivedViewpointState — the keys stored with the derived viewpoint', () => {
    it('derivedFrom, derivedNotation and one derivedRole_<classId> per bound class, nothing else', () => {
        const mm = PEST();
        const choice: DeriveChoice = {
            notation: 'stateMachine',
            classRoles: { [mm.classId('State')]: 'node', [mm.classId('Initial')]: 'initial', [mm.classId('Transition')]: 'transition' },
        };
        expect(derivedViewpointState(mm.lookup, mm.id, choice)).toEqual({
            derivedFrom: 'PEST',
            derivedNotation: 'stateMachine',
            'derivedRole_PEST.State': 'node',
            'derivedRole_PEST.Initial': 'initial',
            'derivedRole_PEST.Transition': 'transition',
        });
    });

    it('Generic stores the two keys only, whatever the table holds', () => {
        expect(derivedViewpointState(PEST().lookup, 'PEST', { notation: 'generic', classRoles: { 'PEST.State': 'node' } }))
            .toEqual({ derivedFrom: 'PEST', derivedNotation: 'generic' });
    });

    it('the keys read back: a viewpoint holding them prefills the same table', () => {
        const mm = configured(FLOWB, 'flowchart');
        const choice = defaultChoice(mm.lookup, mm.id, []);
        mm.lookup.vp1 = derivedVp('vp1', derivedViewpointState(mm.lookup, mm.id, choice));
        const back = dialogPrefill(mm.lookup, mm.id, choice.notation, ['vp1']);
        expect(back.from).toBe('derived');
        expect(back.roles).toEqual(choice.classRoles);
    });
});

describe('canDerive — Generic always; a role notation once a class has a role', () => {
    it('reads the table', () => {
        expect(canDerive({ notation: 'generic', classRoles: {} })).toBe(true);
        expect(canDerive({ notation: 'stateMachine', classRoles: {} })).toBe(false);
        expect(canDerive({ notation: 'petri', classRoles: { a: 'node' } })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// The documents: the binding as input (COSA 1), provenance (COSA 4)
// ---------------------------------------------------------------------------

describe('derivedDocuments — the role-keyed renderings, unchanged, now applied when picked', () => {
    // The digests of viewpointDerivation.test.ts («the role-keyed documents are byte-equal to before the
    // generic notation»), measured on 58aa78ba9: today's role-keyed documents from the Apply bag.
    // R-VP-25 (P-2026-09-30-1521): DemoPetri moved with the open arrowhead of its Arc, to the digest predicted on
    // 2cde09984, before any A2 edit, as the tip's documents with every closedArrow an openArrow.
    // P-2026-10-03-1304 (Q9a): the Statechart (UML) documents that keep a compartment (and State machine, drawn as
    // Statechart since P-2026-10-03-1300) carry structure.emptyBehavior 'hide'; with the key alone set to undefined
    // every digest below was the one before, measured on the lane.
    // P-2026-10-03-1304 (Q7): the Event document of Statechart (UML) and State machine carries visible: false; with the
    // key alone set to undefined every digest below was the one before, measured on the lane.
    // P-2026-10-03-1304 (Q6): DemoESM's Statechart and State machine lists gain the guarded transition document; with it
    // suppressed every digest below was the one before, measured on the lane.
    // P-2026-10-03-1304 (Q3): the bars of Petri net and of Flowchart's fork and join take a square box and a barThickness;
    // with the old box and no thickness every digest below was the one before, measured on the lane.
    const PINNED: Record<string, string> = {
        DemoPEST: '0e123f6496e06e3a', DemoPetri: '023be3c14750b11d', DemoESM: 'a8bbf693f25c8f14', DemoFlowB: 'a796eb253ccbeb20',
    };

    it('the dialog\'s default on each configured demo derives the pinned documents, provenance aside', () => {
        const got: Record<string, string> = {};
        for (const [name, make, stored] of DEMOS) {
            const mm = configured(make, stored);
            // A2 (R-VP-24): DemoPetri opens on Petri net (classic); its sibling, on the same table, is the pinned one.
            // P-2026-09-30-1552 (R-VP-26): DemoPEST and DemoFlowB open on Statechart (UML) and Activity (UML), the same.
            const choice = defaultChoice(mm.lookup, mm.id, []);
            const role = { ...choice, notation: sibling(choice.notation) };
            got[name] = digest(withoutProvenance(derivedDocuments(mm.lookup, mm.id, role)));
        }
        expect(got).toEqual(PINNED);
    });

    it('Generic derives the generic notation of C1 and C2, provenance aside, even over a stored binding', () => {
        for (const [name, make, stored] of DEMOS) {
            const mm = configured(make, stored);
            expect(withoutProvenance(derivedDocuments(mm.lookup, mm.id, { notation: 'generic', classRoles: {} })), name)
                .toEqual(deriveGenericViewpointIRs(mm.lookup, mm.id));
        }
    });

    it('the stored binding no longer decides: the same table without any stored bag gives the same documents', () => {
        for (const [name, make, stored] of DEMOS) {
            const bound = configured(make, stored);
            const choice = defaultChoice(bound.lookup, bound.id, []);
            const bare = make();
            bare.lookup[bare.id]._state = {};
            expect(digest(withoutProvenance(derivedDocuments(bare.lookup, bare.id, choice))), name)
                .toBe(digest(withoutProvenance(derivedDocuments(bound.lookup, bound.id, choice))));
        }
    });

    it('the table is read per class: two classes with the same role are both drawn with it', () => {
        const mm = PEST();
        const one = derivedDocuments(mm.lookup, mm.id, {
            notation: 'stateMachine',
            classRoles: { [mm.classId('State')]: 'node', [mm.classId('Initial')]: 'initial', [mm.classId('Transition')]: 'transition' },
        });
        const two = derivedDocuments(mm.lookup, mm.id, {
            notation: 'stateMachine',
            classRoles: {
                [mm.classId('State')]: 'node', [mm.classId('Initial')]: 'initial', [mm.classId('Terminal')]: 'initial',
                [mm.classId('Transition')]: 'transition',
            },
        });
        const shapeOf = (views: AnyDerivedView[], name: string) => JSON.stringify((views.find(v => v.className === name)!.ir as any).shape);
        expect(shapeOf(two, 'Terminal')).toBe(shapeOf(one, 'Initial'));
        expect(shapeOf(one, 'Terminal')).not.toBe(shapeOf(one, 'Initial'));
    });

    it('the table\'s Transition is the one the other roles derive from, not the binder\'s own guess', () => {
        // The binder guesses Step (a `nextState` reference, a transition-like name) and finds no Trigger
        // on it; the table says Move, whose `event` is the Trigger: a state machine, so the Terminal is
        // the named state box with the double border (R-VP-17), not the activity's bull's-eye.
        const mm = metamodel('MV', 'Moves', [
            cls('State'),
            cls('Initial', { supers: ['State'] }),
            cls('Terminal', { supers: ['State'] }),
            cls('Step', { refs: [ref('nextState', 'State')] }),
            cls('Move', { refs: [ref('to', 'State'), ref('event', 'Event')] }),
            cls('Event'),
        ]);
        const guess = bindProfile(systemProfile('stateMachine')!, sketchOfMetamodel(mm.lookup, mm.id));
        expect(guess.transition?.status === 'bound' && guess.transition.value).toBe('MV.Step');
        const views = derivedDocuments(mm.lookup, mm.id, {
            notation: 'stateMachine',
            classRoles: { 'MV.State': 'node', 'MV.Initial': 'initial', 'MV.Terminal': 'terminal', 'MV.Move': 'transition' },
        });
        const terminal = views.find(v => v.className === 'Terminal')!.ir as any;
        expect(terminal.shape.border).toEqual({ color: 'var(--color-inode-name)', width: 3, style: 'double' });
        expect(terminal.shape.form).toBe('rounded');
    });

    it('a role the notation does not offer, or an id that is no class of the metamodel, never reaches the derivation', () => {
        const mm = PEST();
        const clean = { [mm.classId('State')]: 'node', [mm.classId('Transition')]: 'transition' } as ClassRoles;
        const dirty = { ...clean, [mm.classId('Event')]: 'arc', 'ELSEWHERE.X': 'initial' } as ClassRoles;
        const a = derivedDocuments(mm.lookup, mm.id, { notation: 'stateMachine', classRoles: clean });
        const b = derivedDocuments(mm.lookup, mm.id, { notation: 'stateMachine', classRoles: dirty });
        expect(b).toEqual(a);
        expect((b.find(v => v.className === 'Event')!.ir as any).generated.role).toBeUndefined();
    });

    it('a class with no entry takes its nearest superclass\'s role (Activity and Decision are FlowB nodes)', () => {
        const mm = configured(FLOWB, 'flowchart');
        // Flowchart's table (P-2026-09-30-1552: the dialog's default is now Activity (UML), which names Decision).
        const views = derivedDocuments(mm.lookup, mm.id, { notation: 'flowchart', classRoles: dialogPrefill(mm.lookup, mm.id, 'flowchart', []).roles });
        const g = (name: string) => (views.find(v => v.className === name)!.ir as any).generated;
        expect(g('Activity').role).toBe('node');
        expect(g('Decision').role).toBe('node');
        expect(g('InitialNode').role).toBe('initial');
    });
});

describe('derivedDocuments — ir.generated on every view (R-VP-21)', () => {
    const cases = (): [string, Fixture, DeriveChoice][] => DEMOS.flatMap(([name, make, stored]) => {
        const mm = configured(make, stored);
        return [
            [`${name} default`, mm, defaultChoice(mm.lookup, mm.id, [])],
            [`${name} generic`, mm, { notation: 'generic', classRoles: {} }],
        ] as [string, Fixture, DeriveChoice][];
    });

    it('by, notation, the class\'s role when the table gives one, and the structural hash of the view', () => {
        for (const [name, mm, choice] of cases()) {
            const views = derivedDocuments(mm.lookup, mm.id, choice);
            expect(views.length, name).toBeGreaterThan(0);
            for (const v of views) {
                const g = (v.ir as any).generated;
                expect(g, `${name} ${v.className}`).toBeDefined();
                expect(g.by).toBe('derive-2');
                expect(g.notation).toBe(choice.notation);
                const { generated: _g, ...bare } = v.ir as any;
                expect(g.hash, `${name} ${v.className}`).toBe(structuralHash(bare));
                if (choice.notation === 'generic') expect('role' in g, `${name} ${v.className}`).toBe(false);
            }
        }
    });

    it('the role is written exactly where the table gives the class one', () => {
        const mm = configured(PEST, 'stateMachine');
        const views = derivedDocuments(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
        const roles = Object.fromEntries(views.map(v => [v.className, (v.ir as any).generated.role ?? null]));
        expect(roles).toEqual({ Initial: 'initial', Terminal: 'terminal', State: 'node', Transition: 'transition', Event: null });
    });

    it('the stamp is ignored by the hash it records: hashing the stamped view gives the stamp', () => {
        const mm = configured(PETRI, 'petri');
        for (const v of derivedDocuments(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []))) {
            expect(structuralHash(v.ir)).toBe((v.ir as any).generated.hash);
        }
    });

    it('every document still passes the IR validator', () => {
        for (const [name, mm, choice] of cases()) {
            for (const v of derivedDocuments(mm.lookup, mm.id, choice)) {
                expect(validateIR(`derived:${v.className}`, v.ir), `${name} ${v.className}`).toEqual({ ok: true });
            }
        }
    });

    it('survives a save and a reload: plain JSON, byte for byte', () => {
        const mm = configured(ESM, 'extendedStateMachine');
        const views = derivedDocuments(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
        const state = derivedViewpointState(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
        expect(JSON.parse(JSON.stringify(views))).toEqual(views);
        expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    });
});

// ---------------------------------------------------------------------------
// The simulation binding is read, never written (COSA 3)
// ---------------------------------------------------------------------------

describe('the simulation binding is byte-identical before and after', () => {
    it('prefill, default choice, state and documents read a frozen lookup and leave the metamodel\'s bag as it was', () => {
        for (const [name, make, stored] of DEMOS) {
            const mm = configured(make, stored);
            mm.lookup.vp1 = derivedVp('vp1', { derivedFrom: mm.id, derivedNotation: 'generic' });
            const before = JSON.stringify(mm.lookup[mm.id]._state);
            const whole = JSON.stringify(mm.lookup);
            deepFreeze(mm.lookup);
            for (const n of DERIVED_NOTATIONS) {
                const p = dialogPrefill(mm.lookup, mm.id, n.id, ['vp1']);
                derivedDocuments(mm.lookup, mm.id, { notation: n.id, classRoles: p.roles });
                derivedViewpointState(mm.lookup, mm.id, { notation: n.id, classRoles: p.roles });
            }
            initialNotation(mm.lookup, mm.id, ['vp1']);
            defaultChoice(mm.lookup, mm.id, ['vp1']);
            expect(JSON.stringify(mm.lookup[mm.id]._state), name).toBe(before);
            expect(JSON.stringify(mm.lookup), name).toBe(whole);
        }
    });
});

// ---------------------------------------------------------------------------
// Slices A1 and A3 (P-2026-09-30-0355, R-VP-22): Statechart (UML) and Flowchart (ISO 5807)
// ---------------------------------------------------------------------------

const INK = 'var(--color-inode-name)';
const QUIET = 'var(--color-inode-quiet)';
const SURFACE = 'var(--color-inode-surface)';
const LABEL_STYLE = { fontSize: 12, fontWeight: 'medium', color: QUIET };
/** A guard (P-2026-10-03-1300): mono 11.5 px, normal, slate-700, as Activity (UML)'s. */
const GUARD_STYLE = { fontFamily: 'mono', fontSize: 11.5, fontWeight: 'normal', color: 'var(--color-text-secondary)' };

/** Each demo with its binding applied, derived with `notation` and that notation's prefill. */
function derivedWith(make: () => Fixture, stored: string, notation: DerivedNotationId) {
    const mm = configured(make, stored);
    const views = derivedDocuments(mm.lookup, mm.id, { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles });
    return { mm, views };
}
const irOf = (views: AnyDerivedView[], name: string, n = 0) => views.filter(v => v.className === name)[n]?.ir as any;

describe('A1 and A3 leave the notations of slice D as they were', () => {
    // Measured on the D tip (c676fc6f6) before any A1 or A3 edit: the documents WITH their provenance.
    // R-VP-25 (P-2026-09-30-1521): Generic ×4, DemoPetri petri and DemoFlowB petri moved with the open arrowhead,
    // each to the digest predicted on 2cde09984's code, before any A2 edit: every closedArrow an openArrow and
    // the provenance hash recomputed.
    // P-2026-10-03-1304 (Q9a): the Statechart (UML) documents that keep a compartment (and State machine, drawn as
    // Statechart since P-2026-10-03-1300) carry structure.emptyBehavior 'hide'; with the key alone set to undefined
    // every digest below was the one before, measured on the lane.
    // P-2026-10-03-1304 (Q7): the Event document of Statechart (UML) and State machine carries visible: false; with the
    // key alone set to undefined every digest below was the one before, measured on the lane.
    // P-2026-10-03-1304 (Q6): DemoESM's Statechart and State machine lists gain the guarded transition document; with it
    // suppressed every digest below was the one before, measured on the lane.
    // P-2026-10-03-1304 (Q3): the bars of Petri net and of Flowchart's fork and join take a square box and a barThickness;
    // with the old box and no thickness every digest below was the one before, measured on the lane.
    const PINNED_D: Record<string, string> = {
        'DemoPEST generic': '6d66ed919a80875b', 'DemoPEST stateMachine': 'f0ba4426cae26d2f', 'DemoPEST petri': '0d845ed009b85a0a', 'DemoPEST flowchart': 'd2ba7ef28c065754',
        'DemoPetri generic': 'dab0b1ddf3a00c38', 'DemoPetri stateMachine': 'fcc0009cc695e6b4', 'DemoPetri petri': '4ea473651a70adc7', 'DemoPetri flowchart': 'd2b745a44e81558d',
        'DemoESM generic': 'f5b415d0f3a7512c', 'DemoESM stateMachine': '95040925ad077303', 'DemoESM petri': 'a9967d96094069ab', 'DemoESM flowchart': '7e215bccf0811354',
        'DemoFlowB generic': '1ebd123804dc75a1', 'DemoFlowB stateMachine': '404822a92420400a', 'DemoFlowB petri': 'b8415f0e187edacc', 'DemoFlowB flowchart': 'c3934a5c797c9561',
    };

    it('Generic, State machine, Petri net and Flowchart derive the D tip\'s documents, byte for byte, provenance included', () => {
        const got: Record<string, string> = {};
        for (const [name, make, stored] of DEMOS) {
            for (const notation of ['generic', 'stateMachine', 'petri', 'flowchart'] as DerivedNotationId[]) {
                got[`${name} ${notation}`] = digest(derivedWith(make, stored, notation).views);
            }
        }
        expect(got).toEqual(PINNED_D);
    });

    it('the two new notations take their sibling\'s profile, roles and prefill', () => {
        expect(notationRoles('statechart')).toEqual(notationRoles('stateMachine'));
        expect(notationRoles('flowchartIso')).toEqual(notationRoles('flowchart'));
        expect(roleLabel('statechart', 'node')).toBe('State');
        expect(roleLabel('flowchartIso', 'node')).toBe('Node');
        for (const [name, make, stored] of DEMOS) {
            const mm = configured(make, stored);
            expect(dialogPrefill(mm.lookup, mm.id, 'statechart', []), name).toEqual(dialogPrefill(mm.lookup, mm.id, 'stateMachine', []));
            expect(dialogPrefill(mm.lookup, mm.id, 'flowchartIso', []), name).toEqual(dialogPrefill(mm.lookup, mm.id, 'flowchart', []));
        }
    });

    it('a stored binding opens the dialog on Statechart (UML) (R-VP-26); the latest derived viewpoint on its own notation', () => {
        const mm = configured(PEST, 'stateMachine');
        // P-2026-09-30-1552 (R-VP-26, amending R-VP-22): State machine's binding opens on Statechart (UML).
        expect(initialNotation(mm.lookup, mm.id, [])).toBe('statechart');
        mm.lookup.vp0 = derivedVp('vp0', { derivedFrom: mm.id, derivedNotation: 'stateMachine' });
        // A viewpoint saved under the hidden id opens on its twin (P-2026-10-03-1300).
        expect(initialNotation(mm.lookup, mm.id, ['vp0'])).toBe('statechart');
        mm.lookup.vp1 = derivedVp('vp1', { derivedFrom: mm.id, derivedNotation: 'statechart' });
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('statechart');
        const flow = configured(FLOWB, 'flowchart');
        flow.lookup.vp2 = derivedVp('vp2', { derivedFrom: flow.id, derivedNotation: 'flowchartIso' });
        expect(initialNotation(flow.lookup, flow.id, ['vp2'])).toBe('flowchartIso');
    });

    it('every document of the new notations passes the IR validator and carries its provenance', () => {
        for (const [name, make, stored] of DEMOS) {
            for (const notation of ['statechart', 'flowchartIso'] as DerivedNotationId[]) {
                for (const v of derivedWith(make, stored, notation).views) {
                    expect(validateIR(`derived:${v.className}`, v.ir), `${name} ${notation} ${v.className}`).toEqual({ ok: true });
                    const { generated, ...bare } = v.ir as any;
                    expect(generated.notation).toBe(notation);
                    expect(generated.hash).toBe(structuralHash(bare));
                }
            }
        }
    });
});

describe('Statechart (UML) — A1 on DemoPEST, the turnstile', () => {
    const { views } = derivedWith(PEST, 'stateMachine', 'statechart');
    const box = { form: 'rounded', fill: SURFACE, labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' }, style: { fontSize: 14, fontWeight: 'semibold', color: INK } }] };

    it('a state is a rounded white box, 1 px in the ink, its name centred 14 px 600 in the ink', () => {
        expect(irOf(views, 'State').shape).toEqual({ ...box, border: { color: INK, width: 1, style: 'solid' } });
        expect(irOf(views, 'State').fieldCompartments).toBeUndefined();
    });

    it('the Initial is the same box with the entry dot; no solid disc', () => {
        expect(irOf(views, 'Initial').shape).toEqual({ ...box, border: { color: INK, width: 1, style: 'solid' }, entry: 'dot' });
    });

    it('the Terminal is the same box with the double border (as R-VP-17)', () => {
        expect(irOf(views, 'Terminal').shape).toEqual({ ...box, border: { color: INK, width: 3, style: 'double' } });
    });

    it('a transition is an arc in the ink, the open arrowhead (R-VP-25), labelled by its event in the C2 label style', () => {
        expect(irOf(views, 'Transition').edge).toEqual({
            source: 'container', target: '$nextState.value',
            terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            line: { color: INK, width: 1 }, curve: 'arc',
            labels: { center: { from: 'path', expr: '$event.value' }, style: LABEL_STYLE },
        });
    });

    it('a class with no role keeps the State machine drawing (the Event)', () => {
        const sm = derivedWith(PEST, 'stateMachine', 'stateMachine').views;
        const { generated: _a, ...a } = irOf(views, 'Event');
        const { generated: _b, ...b } = irOf(sm, 'Event');
        expect(a).toEqual(b);
    });

    it('the order and the endpoints are the State machine\'s', () => {
        const sm = derivedWith(PEST, 'stateMachine', 'stateMachine').views;
        expect(views.map(v => [v.className, v.rule])).toEqual(sm.map(v => [v.className, v.rule]));
    });

    it('the drawing follows the notation picked, not the presence of a Trigger (D, question 1)', () => {
        // No event anywhere: State machine drew the activity look (a nameless disc for the Initial) until P-2026-10-03-1300;
        // it is drawn as Statechart (UML) now, whatever the binding says about a Trigger.
        const mm = metamodel('NT', 'NoTrigger', [
            cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
            cls('Initial', { supers: ['State'] }),
            cls('Terminal', { supers: ['State'] }),
            cls('Transition', { attrs: [attr('guard', EXPRESSION)], refs: [ref('nextState', 'State')] }),
        ]);
        const table = { 'NT.State': 'node', 'NT.Initial': 'initial', 'NT.Terminal': 'terminal', 'NT.Transition': 'transition' } as ClassRoles;
        const sm = derivedDocuments(mm.lookup, mm.id, { notation: 'stateMachine', classRoles: table });
        const sc = derivedDocuments(mm.lookup, mm.id, { notation: 'statechart', classRoles: table });
        expect(irOf(sm, 'Initial').shape).toEqual(irOf(sc, 'Initial').shape);
        expect(irOf(sc, 'Initial').shape).toEqual({ ...box, border: { color: INK, width: 1, style: 'solid' }, entry: 'dot' });
        expect(irOf(sc, 'Terminal').shape.border).toEqual({ color: INK, width: 3, style: 'double' });
        // No event: the guard labels the transition (R-VP-17 (2)).
        expect(irOf(sc, 'Transition').edge.labels).toEqual({ center: { from: 'path', expr: '$guard.value' }, style: GUARD_STYLE });
    });

    it('a state with slots other than the name keeps a compartment, its name then on top (DemoESM)', () => {
        const esm = derivedWith(ESM, 'extendedStateMachine', 'statechart').views;
        expect(irOf(esm, 'State').shape.labels[0].position).toBe('top');
        expect(irOf(esm, 'State').fieldCompartments.map((c: any) => c.source)).toEqual([{ from: 'attributes' }]);
        expect(irOf(esm, 'Initial').shape.entry).toBe('dot');
        expect(irOf(esm, 'Terminal').fieldCompartments).toBeUndefined();
    });

    it('a transition with an event and a guard reads `event [guard]` where the guard is set (P-2026-10-03-1304, Q6, amends R-VP-22 (2))', () => {
        const esm = derivedWith(ESM, 'extendedStateMachine', 'statechart').views;
        const docs = esm.filter((v: any) => v.className === 'Transition').map((v: any) => v.ir);
        expect(docs).toHaveLength(2);
        const [plain, guarded] = docs;
        // The plain one as before: the event, in the C2 label style, for a transition whose guard is unset.
        expect(plain.edge.labels).toEqual({ center: { from: 'path', expr: '$event.value' }, style: LABEL_STYLE });
        expect(plain.priority).toBeUndefined();
        // The second: the same line, the UML label, chosen where the guard is set.
        expect(guarded.edge.labels).toEqual({
            template: [{ from: 'path', expr: '$event.value' }, { from: 'literal', text: ' [' }, { from: 'path', expr: '$guard.value' }, { from: 'literal', text: ']' }],
            style: LABEL_STYLE,
        });
        expect(guarded.priority).toBe(1);
        expect(guarded.predicate).toEqual({ op: 'exists', path: '$guard.value' });
        expect({ ...guarded.edge, labels: undefined }).toEqual({ ...plain.edge, labels: undefined });
        expect(guarded.label).toBe('View for Transition (guard)');
        // DemoPEST's transitions have no guard slot: one document, as before.
        expect(derivedWith(PEST, 'stateMachine', 'statechart').views.filter((v: any) => v.className === 'Transition')).toHaveLength(1);
    });

    it('the class the Trigger is typed by is not drawn; nothing else changes visibility (P-2026-10-03-1304, Q7)', () => {
        for (const [make, stored] of [[PEST, 'stateMachine'], [ESM, 'extendedStateMachine']] as const) {
            const views = derivedWith(make, stored, 'statechart').views;
            expect(irOf(views, 'Event').visible, stored).toBe(false);
            for (const name of ['State', 'Initial', 'Terminal']) expect(irOf(views, name).visible, name).toBeUndefined();
            // State machine is drawn as Statechart (UML) since P-2026-10-03-1300: the same.
            expect(irOf(derivedWith(make, stored, 'stateMachine').views, 'Event').visible).toBe(false);
        }
        // Generic draws every class.
        expect(derivedWith(PEST, 'stateMachine', 'generic').views.some((v: any) => 'visible' in v.ir)).toBe(false);
        // A subclass of the event class is an event too.
        const PEST_SUB = () => metamodel('PESTS', 'DemoPEST', [
            cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
            cls('Initial', { supers: ['State'] }), cls('Terminal', { supers: ['State'] }),
            cls('Transition', { refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
            cls('Event'), cls('TimeEvent', { supers: ['Event'] }),
        ]);
        const sub = derivedWith(PEST_SUB, 'stateMachine', 'statechart').views;
        expect([irOf(sub, 'Event').visible, irOf(sub, 'TimeEvent').visible]).toEqual([false, false]);
    });

    it('a state with a compartment hides the rows with no value; one without carries no structure (P-2026-10-03-1304, Q9a)', () => {
        const esm = derivedWith(ESM, 'extendedStateMachine', 'statechart').views;
        expect(irOf(esm, 'State').structure).toEqual({ emptyBehavior: 'hide' });
        expect(irOf(esm, 'Initial').structure).toEqual({ emptyBehavior: 'hide' });
        expect(irOf(esm, 'Terminal').structure).toBeUndefined();
        // State machine is drawn as Statechart (UML) since P-2026-10-03-1300: it carries the key too.
        expect(irOf(derivedWith(ESM, 'extendedStateMachine', 'stateMachine').views, 'State').structure).toEqual({ emptyBehavior: 'hide' });
        // DemoPEST's states hold no slot but the name: no compartment, no key.
        expect(irOf(derivedWith(PEST, 'stateMachine', 'statechart').views, 'State').structure).toBeUndefined();
    });
});

describe('Flowchart (ISO 5807) — A3', () => {
    const labelled = (fontSize: number) => [{ position: 'center', source: { from: 'intrinsic', prop: 'name' }, style: { fontSize, fontWeight: 'medium', color: INK } }];
    const formsOf = (views: AnyDerivedView[]) => Object.fromEntries(views.filter(v => v.ir.kind === 'vertex').map(v => [v.className, (v.ir as any).shape.form]));

    it('DemoFlowB: forms by role, then by name', () => {
        const { views } = derivedWith(FLOWB, 'flowchart', 'flowchartIso');
        expect(formsOf(views)).toEqual({
            InitialNode: 'stadium', Activity: 'rect', Decision: 'diamond', Fork: 'rect', Join: 'rect', FinalNode: 'stadium', ActivityNode: 'rect',
        });
    });

    it('every node white, 1 px in the ink, its name centred 13 px 500 in the ink, no compartment', () => {
        const { views } = derivedWith(FLOWB, 'flowchart', 'flowchartIso');
        for (const v of views.filter(x => x.ir.kind === 'vertex')) {
            const ir = v.ir as any;
            expect(ir.shape.fill, v.className).toBe(SURFACE);
            expect(ir.shape.border, v.className).toEqual({ color: INK, width: 1, style: 'solid' });
            expect(ir.shape.labels, v.className).toEqual(labelled(13));
            expect(ir.fieldCompartments, v.className).toBeUndefined();
        }
    });

    it('a flow is orthogonal (today\'s router), in the ink, the open arrowhead (R-VP-25), its guard the label through the template', () => {
        const { views } = derivedWith(FLOWB, 'flowchart', 'flowchartIso');
        const flows = views.filter(v => v.className === 'ControlFlow');
        expect(flows.map(v => v.ir.label)).toEqual(['View for ControlFlow', 'View for ControlFlow (yes)', 'View for ControlFlow (no)']);
        const base = { source: '$source.value', target: '$target.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, line: { color: INK, width: 1 } };
        expect(irOf(views, 'ControlFlow', 0).edge).toEqual({ ...base, labels: { template: [{ from: 'path', expr: '$guard.value' }], style: GUARD_STYLE } });
        expect(irOf(views, 'ControlFlow', 0).predicate).toBeUndefined();
        for (const [n, word] of [[1, 'yes'], [2, 'no']] as const) {
            const ir = irOf(views, 'ControlFlow', n);
            expect(ir.edge).toEqual({ ...base, labels: { center: { from: 'literal', text: word }, style: LABEL_STYLE } });
            expect(ir.predicate).toEqual({ op: 'eq', left: '$guard.value', right: { kind: 'string', value: word === 'yes' ? 'true' : 'false' } });
            expect(ir.priority).toBe(1);
        }
        for (const v of flows) {
            expect('routing' in (v.ir as any).edge).toBe(false);
            expect('curve' in (v.ir as any).edge).toBe(false);
        }
    });

    it('resolved on objects: a literal true reads yes, a literal false no, any other guard itself, none nothing', () => {
        const mm = configured(FLOWB, 'flowchart');
        const { views } = derivedWith(FLOWB, 'flowchart', 'flowchartIso');
        const lookup: Record<string, any> = { ...mm.lookup };
        const guards: [string, unknown[]][] = [['f_t', ['true']], ['f_f', ['false']], ['f_b', [true]], ['f_x', ['i < n']], ['f_0', []]];
        for (const [id, values] of guards) {
            lookup[id] = { id, className: 'DObject', name: id, instanceof: mm.classId('ControlFlow'), features: [`${id}.g`] };
            lookup[`${id}.g`] = { id: `${id}.g`, className: 'DValue', instanceof: `${mm.classId('ControlFlow')}.guard`, values };
        }
        const ids = views.map((_, i) => `V${i}`);
        views.forEach((v, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: 'VP', ir: v.ir }; });
        const index = getIRIndex({ viewpoint: 'VP', viewelements: ids, idlookup: lookup }, 'a3_yes_no')!;
        const ctx = makeDrawReadCtx(lookup);
        const label = (id: string) => {
            const cv = resolveObjectAsEdgeView(id, mm.classId('ControlFlow'), index, ctx, lookup);
            return cv?.labelText ? String(cv.labelText(ctx, id) ?? '') : null;
        };
        expect(guards.map(([id]) => label(id))).toEqual(['yes', 'no', 'yes', 'i < n', '']);
    });

    it('the name signals, on a fixture with one class per signal', () => {
        const names = [
            'Start', 'End', 'InitialStep', 'FinalStep', 'Terminal',
            'ReadInput', 'Output', 'Write', 'Print', 'IO',
            'Decision', 'Choice', 'IfThen', 'Branch',
            'Task', 'Process',
        ];
        const mm = metamodel('SIG', 'Signals', [
            cls('Node'),
            ...names.map(n => cls(n, { supers: ['Node'] })),
            cls('Flow', { attrs: [attr('guard', EXPRESSION)], refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const table = { 'SIG.Node': 'node', 'SIG.Flow': 'transition' } as ClassRoles;
        const forms = formsOf(derivedDocuments(mm.lookup, mm.id, { notation: 'flowchartIso', classRoles: table }));
        expect(forms).toEqual({
            Start: 'stadium', End: 'stadium', InitialStep: 'stadium', FinalStep: 'stadium', Terminal: 'stadium',
            ReadInput: 'parallelogram', Output: 'parallelogram', Write: 'parallelogram', Print: 'parallelogram', IO: 'parallelogram',
            Decision: 'diamond', Choice: 'diamond', IfThen: 'diamond', Branch: 'diamond',
            Task: 'rect', Process: 'rect', Node: 'rect',
        });
    });

    it('the role comes before the name: Task bound as the Initial is a stadium, Decision bound as the Terminal too', () => {
        const mm = metamodel('RB', 'RoleFirst', [
            cls('Node'), cls('Task', { supers: ['Node'] }), cls('Decision', { supers: ['Node'] }),
            cls('Flow', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const table = { 'RB.Node': 'node', 'RB.Task': 'initial', 'RB.Decision': 'terminal', 'RB.Flow': 'transition' } as ClassRoles;
        const forms = formsOf(derivedDocuments(mm.lookup, mm.id, { notation: 'flowchartIso', classRoles: table }));
        expect(forms).toMatchObject({ Task: 'stadium', Decision: 'stadium', Node: 'rect' });
    });

    it('a class with no role keeps the Flowchart drawing', () => {
        const mm = metamodel('NR', 'NoRole', [
            cls('Node'), cls('Note'), cls('Flow', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const table = { 'NR.Node': 'node', 'NR.Flow': 'transition' } as ClassRoles;
        const iso = derivedDocuments(mm.lookup, mm.id, { notation: 'flowchartIso', classRoles: table });
        const flow = derivedDocuments(mm.lookup, mm.id, { notation: 'flowchart', classRoles: table });
        const { generated: _a, ...a } = irOf(iso, 'Note');
        const { generated: _b, ...b } = irOf(flow, 'Note');
        expect(a).toEqual(b);
        expect(irOf(iso, 'Node').shape.form).toBe('rect');
    });

    it('a flow class with no guard gets one document, unlabelled', () => {
        const mm = metamodel('NG', 'NoGuard', [
            cls('Node'), cls('Flow', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const views = derivedDocuments(mm.lookup, mm.id, { notation: 'flowchartIso', classRoles: { 'NG.Node': 'node', 'NG.Flow': 'transition' } });
        const flows = views.filter(v => v.className === 'Flow');
        expect(flows.length).toBe(1);
        expect((flows[0].ir as any).edge.labels).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Slice A2 (P-2026-09-30-1521, R-VP-24, R-VP-25): Petri net (classic), and the open arrowheads
// ---------------------------------------------------------------------------

/** A Petri object for the resolver: its slots by feature, each on the class that declares it. */
function petriObject(mm: Fixture, lookup: Record<string, any>, id: string, cls: string, slots: Record<string, unknown[]>) {
    lookup[id] = { id, name: id, className: 'DObject', instanceof: mm.classId(cls), features: Object.keys(slots).map(f => `${id}.${f}`) };
    for (const [f, values] of Object.entries(slots)) {
        const owner = f === 'tokens' ? 'Place' : f === 'guard' ? 'Transition' : 'Arc';
        lookup[`${id}.${f}`] = { id: `${id}.${f}`, className: 'DValue', instanceof: `${mm.classId(owner)}.${f}`, values };
    }
}

describe('Petri net (classic) in the list and the dialog (R-VP-24)', () => {
    it('after Petri net, on the petri profile, with the same roles, labels and prefill', () => {
        const ids = DERIVED_NOTATIONS.map(n => n.id);
        expect(ids.indexOf('petriClassic')).toBe(ids.indexOf('petri') + 1);
        expect(notationRoles('petriClassic')).toEqual(notationRoles('petri'));
        expect(roleLabel('petriClassic', 'node')).toBe('Place');
        expect(roleLabel('petriClassic', 'inhibitorArc')).toBe('Inhibitor arc');
        for (const [name, make, stored] of DEMOS) {
            const mm = configured(make, stored);
            expect(dialogPrefill(mm.lookup, mm.id, 'petriClassic', []), name).toEqual(dialogPrefill(mm.lookup, mm.id, 'petri', []));
        }
    });

    it('DemoPetri preselects it; the latest derived viewpoint still decides, Petri net included', () => {
        const mm = configured(PETRI, 'petri');
        expect(initialNotation(mm.lookup, mm.id, [])).toBe('petriClassic');
        expect(defaultChoice(mm.lookup, mm.id, []).notation).toBe('petriClassic');
        mm.lookup.vp1 = derivedVp('vp1', { derivedFrom: mm.id, derivedNotation: 'petri' });
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('petri');
        mm.lookup.vp2 = derivedVp('vp2', { derivedFrom: mm.id, derivedNotation: 'petriClassic', [`derivedRole_${mm.classId('Place')}`]: 'node' });
        expect(initialNotation(mm.lookup, mm.id, ['vp1', 'vp2'])).toBe('petriClassic');
        expect(dialogPrefill(mm.lookup, mm.id, 'petriClassic', ['vp1', 'vp2'])).toEqual({ roles: { [mm.classId('Place')]: 'node' }, from: 'derived' });
    });

    it('DemoPEST opens on Statechart (UML) and DemoFlowB on Activity (UML) (R-VP-26, amending R-VP-22); DemoESM too, State machine being hidden', () => {
        expect(initialNotation(configured(PEST, 'stateMachine').lookup, 'PEST', [])).toBe('statechart');
        expect(initialNotation(configured(FLOWB, 'flowchart').lookup, 'FLOWB', [])).toBe('activityUml');
        expect(initialNotation(configured(ESM, 'extendedStateMachine').lookup, 'ESM', [])).toBe('statechart');
    });

    it('stores its id as the notation, and stamps every document with it; every document is valid', () => {
        const mm = configured(PETRI, 'petri');
        const choice = defaultChoice(mm.lookup, mm.id, []);
        expect(derivedViewpointState(mm.lookup, mm.id, choice).derivedNotation).toBe('petriClassic');
        const views = derivedDocuments(mm.lookup, mm.id, choice);
        for (const v of views) {
            expect((v.ir as any).generated.notation, v.className).toBe('petriClassic');
            expect(validateIR(`derived:${v.className}`, v.ir), v.className).toEqual({ ok: true });
        }
        expect(views.map(v => v.className)).toEqual(['Place', 'Transition', 'InhibitorArc', 'InhibitorArc', 'Arc', 'Arc']);
    });

    it('resolved on objects: the weight labels an arc above 1 only, the inhibitor ends in the hollow circle', () => {
        const mm = configured(PETRI, 'petri');
        const views = derivedDocuments(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
        const lookup: Record<string, any> = { ...mm.lookup };
        petriObject(mm, lookup, 'p', 'Place', { tokens: [1] });
        petriObject(mm, lookup, 't', 'Transition', { guard: [] });
        const arcs: [string, string, unknown[]][] = [
            ['a1', 'Arc', [1]], ['a2', 'Arc', [2]], ['a0', 'Arc', []], ['i1', 'InhibitorArc', [1]], ['i3', 'InhibitorArc', [3]],
        ];
        for (const [id, cls, weight] of arcs) petriObject(mm, lookup, id, cls, { src: ['p'], tgt: ['t'], weight });
        const ids = views.map((_, i) => `V${i}`);
        views.forEach((v, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: 'VP', ir: v.ir }; });
        const index = getIRIndex({ viewpoint: 'VP', viewelements: ids, idlookup: lookup }, 'a2_weights')!;
        const ctx = makeDrawReadCtx(lookup);
        const seen = arcs.map(([id, cls]) => {
            const cv = resolveObjectAsEdgeView(id, mm.classId(cls), index, ctx, lookup)!;
            return [id, cv.labelText ? String(cv.labelText(ctx, id) ?? '') : null, cv.terminations.targetEnd, cv.curve ?? null];
        });
        expect(seen).toEqual([
            // No curve since P-2026-10-03-1304 (Q1): the classic arcs take the orthogonal router.
            ['a1', null, 'openArrow', null], ['a2', '2', 'openArrow', null], ['a0', null, 'openArrow', null],
            ['i1', null, 'hollowCircle', null], ['i3', '3', 'hollowCircle', null],
        ]);
    });
});

describe('open arrowheads in every derived notation that draws one (R-VP-25)', () => {
    /** Every termination the notation's documents write, over the four configured demos. */
    const ends = (notation: DerivedNotationId) => {
        const out = new Set<string>();
        for (const [, make, stored] of DEMOS) {
            const mm = configured(make, stored);
            const choice = { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles };
            if (!canDerive(choice)) continue;
            for (const v of derivedDocuments(mm.lookup, mm.id, choice)) {
                const t = (v.ir as any).edge?.terminations;
                if (t) out.add(`${t.sourceEnd}>${t.targetEnd}`);
            }
        }
        return [...out].sort();
    };

    it('Generic, State machine, Statechart (UML), Petri net, Flowchart, Flowchart (ISO 5807) and Activity (UML): the open arrowhead only', () => {
        for (const n of ['generic', 'stateMachine', 'statechart', 'petri', 'flowchart', 'flowchartIso', 'activityUml'] as DerivedNotationId[]) {
            expect(ends(n), n).toEqual(['none>openArrow']);
        }
    });

    it('Petri net (classic): the open arrowhead, the hollow circle on the inhibitor arc; no filled arrowhead anywhere', () => {
        expect(ends('petriClassic')).toEqual(['none>hollowCircle', 'none>openArrow']);
        for (const n of DERIVED_NOTATIONS.map(x => x.id)) expect(ends(n).some(e => e.includes('closedArrow')), n).toBe(false);
    });
});
