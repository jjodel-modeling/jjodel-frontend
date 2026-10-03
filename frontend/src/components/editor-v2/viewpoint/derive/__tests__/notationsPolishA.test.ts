/**
 * Derived notations polish, pass 1 (P-2026-10-03-1300, docs/discovery/discovery_2026-10-03_derived_notations_polish_a.md):
 * six fixes in the notation definitions, read as data on the documents `derivedDocuments` returns, the way the
 * notation tests do. Every test name says the mutation that kills it.
 *
 * Fixtures: the demos' shapes with an identity slot (`name`) added where the item needs one, and an unroled
 * class of each kind (a `name` and one more slot, the `name` alone, an integer `name`).
 */

import { describe, expect, it } from 'vitest';
import { DERIVED_NOTATIONS, defaultChoice, derivedDocuments, derivedViewpointState, dialogPrefill, initialNotation, notationRoles, roleLabel } from '../notations';
import type { ClassRoles, DerivedNotationId } from '../notations';
import { PETRI_BAR_LONG, PETRI_BAR_SHORT, deriveViewpointIRs } from '../viewpointDerivation';
import type { AnyDerivedView, DerivationRoles } from '../viewpointDerivation';
import { isNotationGlyph } from '../../../../../view/viewPoint/metaclassPalette';
import { sketchOfMetamodel } from '../../../sim/metamodelSketch';
import { bindProfile } from '../../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures
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

/** The three unroled classes every fixture adds: `name` + a slot, `name` alone, and an integer `name` (not the identity slot). */
const UNROLED = [
    cls('Note', { attrs: [attr('name', ESTRING), attr('text', ESTRING)] }),
    cls('Tag', { attrs: [attr('name', ESTRING)] }),
    cls('Count', { attrs: [attr('name', EINT), attr('total', EINT)] }),
];

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

/** DemoESM with the identity slot on its states, and the unroled classes. */
const ESM_NAMED = () => metamodel('ESMN', 'EsmNamed', [
    cls('State', { attrs: [attr('name', ESTRING), attr('entry', ACTION, -1)], refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { attrs: [attr('guard', EXPRESSION)], refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event', { attrs: [attr('name', ESTRING)] }),
    ...UNROLED,
]);
/** DemoFlowB with the identity slot on its nodes and a detail slot on the activities. */
const FLOW_NAMED = () => metamodel('FLOWN', 'FlowNamed', [
    cls('ActivityNode', { attrs: [attr('name', ESTRING)] }),
    cls('InitialNode', { supers: ['ActivityNode'] }),
    cls('Activity', { supers: ['ActivityNode'], attrs: [attr('detail', ESTRING)] }),
    cls('Decision', { supers: ['ActivityNode'] }),
    cls('Fork', { supers: ['ActivityNode'] }),
    cls('Join', { supers: ['ActivityNode'] }),
    cls('FinalNode', { supers: ['ActivityNode'] }),
    cls('ControlFlow', { attrs: [attr('guard', EXPRESSION)], refs: [ref('source', 'ActivityNode'), ref('target', 'ActivityNode')] }),
    ...UNROLED,
]);
/** DemoPetri with the unroled classes. */
const PETRI_NAMED = () => metamodel('PETN', 'PetriNamed', [
    cls('PNode', { abstract: true }),
    cls('Place', { supers: ['PNode'], attrs: [attr('tokens', EINT)] }),
    cls('Transition', { supers: ['PNode'] }),
    cls('Arc', { attrs: [attr('weight', EINT)], refs: [ref('src', 'PNode'), ref('tgt', 'PNode')] }),
    ...UNROLED,
]);
/** A state machine with no event: the guard is the transition's label. */
const GUARDED = () => metamodel('GRD', 'Guarded', [
    cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { attrs: [attr('guard', EXPRESSION)], refs: [ref('nextState', 'State')] }),
]);

const derivedWith = (mm: Fixture, notation: DerivedNotationId) =>
    derivedDocuments(mm.lookup, mm.id, { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles });
const irOf = (views: AnyDerivedView[], name: string, n = 0) => views.filter(v => v.className === name)[n]?.ir as any;
const bare = (ir: any) => { const { generated: _g, ...rest } = ir; return rest; };
const boundRoles = (mm: Fixture, profileId: string): DerivationRoles => {
    const profile = systemProfile(profileId)!;
    const bindings = bindProfile(profile, sketchOfMetamodel(mm.lookup, mm.id));
    const bag: Record<string, unknown> = {};
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    return { bag, shape: profile.shape };
};

const INK = 'var(--color-inode-name)';
const QUIET = 'var(--color-inode-quiet)';
const LABEL_STYLE = { fontSize: 12, fontWeight: 'medium', color: QUIET };
/** Activity (UML)'s guard, P-2026-09-30-1935: mono 11.5 px, normal, slate-700. */
const GUARD_STYLE = { fontFamily: 'mono', fontSize: 11.5, fontWeight: 'normal', color: 'var(--color-text-secondary)' };
const ROW_STYLE = { fontFamily: 'mono', fontSize: 11, color: QUIET };
const BARE = { from: 'attributes' };
const WITHOUT_NAME = { from: 'attributes', exclude: ['name'] };
const sourceOf = (ir: any) => ir.fieldCompartments?.[0]?.source;

// ---------------------------------------------------------------------------
// Item 1: the `name` row
// ---------------------------------------------------------------------------

describe('item 1: the attributes compartment leaves out `name` when the title shows it', () => {
    const CASES: [string, () => Fixture, DerivedNotationId[]][] = [
        ['a state machine', ESM_NAMED, ['stateMachine', 'statechart']],
        ['a flowchart', FLOW_NAMED, ['flowchart', 'flowchartIso', 'activityUml']],
        ['a Petri net', PETRI_NAMED, ['petri', 'petriClassic']],
    ];

    for (const [what, make, notations] of CASES) {
        for (const notation of notations) {
            it(`${notation} on ${what}: an unroled class holding \`name\` and a slot excludes the name (mutation: the exclusion dropped in deriveViewpointIRs)`, () => {
                const mm = make();
                const views = derivedWith(mm, notation);
                expect(sourceOf(irOf(views, 'Note'))).toEqual(WITHOUT_NAME);
                // Positive control: the same class is an unroled document, with its title and its compartment.
                expect(irOf(views, 'Note').shape.labels[0].source).toEqual({ from: 'intrinsic', prop: 'name' });
                expect(irOf(views, 'Note').fieldCompartments).toHaveLength(1);
            });

            it(`${notation} on ${what}: a class whose only slot is \`name\` has no compartment (mutation: the empty compartment kept)`, () => {
                const mm = make();
                expect(irOf(derivedWith(mm, notation), 'Tag').fieldCompartments).toBeUndefined();
            });

            it(`${notation} on ${what}: an integer \`name\` is not the identity slot, its row stays (mutation: the exclusion tested on the name alone)`, () => {
                const mm = make();
                expect(sourceOf(irOf(derivedWith(mm, notation), 'Count'))).toEqual(BARE);
            });
        }
    }

    it('statechart: a state holding `name` and `entry` excludes the name, the Initial too (mutation: the exclusion dropped in the Statechart node)', () => {
        const views = derivedWith(ESM_NAMED(), 'statechart');
        expect(sourceOf(irOf(views, 'State'))).toEqual(WITHOUT_NAME);
        expect(sourceOf(irOf(views, 'Initial'))).toEqual(WITHOUT_NAME);
        expect(irOf(views, 'State').shape.labels[0].position).toBe('top');
    });

    it('state machine and statechart: a state with no `name` slot keeps the bare source (DemoESM)', () => {
        for (const notation of ['stateMachine', 'statechart'] as const) {
            expect(sourceOf(irOf(derivedWith(ESM(), notation), 'State')), notation).toEqual(BARE);
        }
    });

    it('state machine and statechart: the Event instances of DemoESM draw no `name = coin` row, their title centred (the turnstile)', () => {
        for (const notation of ['stateMachine', 'statechart'] as const) {
            const event = irOf(derivedWith(ESM(), notation), 'Event');
            expect(event.fieldCompartments, notation).toBeUndefined();
            expect(event.shape.labels[0].position, notation).toBe('center');
        }
    });

    it('generic keeps excluding the name (it already did)', () => {
        const views = derivedWith(ESM_NAMED(), 'generic');
        expect(sourceOf(irOf(views, 'Note'))).toEqual(WITHOUT_NAME);
        expect(irOf(views, 'Tag').fieldCompartments).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Item 2: State machine draws as Statechart
// ---------------------------------------------------------------------------

describe('item 2: State machine converges on Statechart, the id stays valid', () => {
    const table = (mm: Fixture, notation: DerivedNotationId): ClassRoles => dialogPrefill(mm.lookup, mm.id, notation, []).roles;

    for (const [name, make] of [['DemoPEST', PEST], ['DemoESM', ESM], ['EsmNamed', ESM_NAMED], ['Guarded', GUARDED]] as [string, () => Fixture][]) {
        it(`${name}: the stateMachine documents are the statechart's, byte for byte, but for the provenance (mutation: notation not mapped in derivationRolesOf)`, () => {
            const mm = make();
            const sm = derivedDocuments(mm.lookup, mm.id, { notation: 'stateMachine', classRoles: table(mm, 'stateMachine') });
            const sc = derivedDocuments(mm.lookup, mm.id, { notation: 'statechart', classRoles: table(mm, 'statechart') });
            expect(sm.length).toBeGreaterThan(0);
            expect(sm.map(v => [v.className, v.rule, bare(v.ir)])).toEqual(sc.map(v => [v.className, v.rule, bare(v.ir)]));
            // The provenance names the id picked (R-B9: persisted names are never renamed).
            expect(sm.every(v => (v.ir as any).generated.notation === 'stateMachine')).toBe(true);
            expect(sc.every(v => (v.ir as any).generated.notation === 'statechart')).toBe(true);
        });
    }

    it('the transition is an arc and the Initial the box with the entry mark, under the id stateMachine (mutation: the legacy documents kept)', () => {
        const views = derivedWith(PEST(), 'stateMachine');
        expect(irOf(views, 'Transition').edge.curve).toBe('arc');
        expect(irOf(views, 'Initial').shape.entry).toBe('dot');
        expect(irOf(views, 'Initial').shape.form).toBe('rounded');
    });

    it('exactly one entry is hidden, stateMachine, and a lookup by id still finds it with its table and its labels', () => {
        expect(DERIVED_NOTATIONS.filter(n => n.hidden).map(n => n.id)).toEqual(['stateMachine']);
        expect(notationRoles('stateMachine')).toEqual(notationRoles('statechart'));
        expect(roleLabel('stateMachine', 'node')).toBe('State');
        const mm = PEST();
        expect(Object.keys(dialogPrefill(mm.lookup, mm.id, 'stateMachine', []).roles).length).toBeGreaterThan(0);
    });

    it('a viewpoint derived under the id keeps it in its state, with no layout profile (R-B9)', () => {
        const mm = PEST();
        const state = derivedViewpointState(mm.lookup, mm.id, { notation: 'stateMachine', classRoles: table(mm, 'stateMachine') });
        expect(state.derivedNotation).toBe('stateMachine');
        expect(state.derivedLayout).toBeUndefined();
    });

    it('the dialog opens on the visible twin: a stored dfa-like binding and a saved stateMachine viewpoint both say statechart (mutation: initialNotation returns the hidden id)', () => {
        const esm = ESM();
        esm.lookup[esm.id]._state = { simProfile: 'extendedStateMachine', ...boundRoles(esm, 'extendedStateMachine').bag };
        expect(initialNotation(esm.lookup, esm.id, [])).toBe('statechart');
        expect(defaultChoice(esm.lookup, esm.id, []).notation).toBe('statechart');

        const mm = PEST();
        const roles = table(mm, 'stateMachine');
        const saved: Record<string, string> = { derivedFrom: mm.id, derivedNotation: 'stateMachine' };
        for (const [id, role] of Object.entries(roles)) saved[`derivedRole_${id}`] = role;
        mm.lookup.vp1 = { className: 'DViewPoint', _state: saved };
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('statechart');
        const prefill = dialogPrefill(mm.lookup, mm.id, 'statechart', ['vp1']);
        expect(prefill.from).toBe('derived');
        expect(prefill.roles).toEqual(roles);
    });
});

// ---------------------------------------------------------------------------
// Item 3: Petri bars
// ---------------------------------------------------------------------------

describe('item 3: Petri transitions are 56 by 12 and the name sits outside', () => {
    it('the two constants (mutation: a length changed)', () => {
        expect(PETRI_BAR_LONG).toBe(56);
        expect(PETRI_BAR_SHORT).toBe(12);
    });

    // Q3 (P-2026-10-03-1304): both bars are turned by their neighbours, a square box of the long length and the short
    // one as the drawn thickness (ShapeSpec.barThickness); before, Petri net declared 56 by 12 and classic 12 by 56.
    it('Petri net: a 56 by 56 box, 12 thick (mutation: the size not declared, the old flat box kept, or the thickness dropped)', () => {
        const t = irOf(derivedWith(PETRI(), 'petri'), 'Transition');
        expect(t.defaultSize).toEqual({ width: PETRI_BAR_LONG, height: PETRI_BAR_LONG });
        expect(t.shape.barThickness).toBe(PETRI_BAR_SHORT);
        expect(t.shape.form).toBe('bar');
    });

    it('Petri net (classic): the same box and thickness, the two constants (mutation: the classic bar kept upright 12 by 56)', () => {
        const t = irOf(derivedWith(PETRI(), 'petriClassic'), 'Transition');
        expect(t.defaultSize).toEqual({ width: PETRI_BAR_LONG, height: PETRI_BAR_LONG });
        expect(t.shape.barThickness).toBe(PETRI_BAR_SHORT);
        expect(t.shape.form).toBe('bar');
    });

    it('Petri net: the name is outside, below the flat bar, in the label style classic uses (mutation: the name left centred inside)', () => {
        const t = irOf(derivedWith(PETRI(), 'petri'), 'Transition');
        expect(t.shape.labels).toEqual([{ position: 'outside', anchor: 's', source: { from: 'intrinsic', prop: 'name' }, style: LABEL_STYLE }]);
    });

    it('Petri net (classic): the name stays outside, above the upright bar since P-2026-10-03-1415 (R-VP-53)', () => {
        const t = irOf(derivedWith(PETRI(), 'petriClassic'), 'Transition');
        expect(t.shape.labels).toEqual([{ position: 'outside', anchor: 'n', source: { from: 'intrinsic', prop: 'name' }, style: LABEL_STYLE }]);
    });

    it('both bars stay notation glyphs, kept out of Color by metaclass (R-VP-50)', () => {
        for (const notation of ['petri', 'petriClassic'] as const) {
            expect(isNotationGlyph(irOf(derivedWith(PETRI(), notation), 'Transition')), notation).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// Item 4: Flow Initial and Terminal
// ---------------------------------------------------------------------------

describe('item 4: the flowchart Initial is 20 by 20 and the Terminal 24 by 24', () => {
    const flowchart = () => derivedWith(FLOWB(), 'flowchart');
    const activity = () => derivedWith(FLOWB(), 'activityUml');

    it('Initial and Terminal declare the sizes Activity (UML) declares (mutation: a size not declared)', () => {
        expect(irOf(flowchart(), 'InitialNode').defaultSize).toEqual({ width: 20, height: 20 });
        expect(irOf(flowchart(), 'FinalNode').defaultSize).toEqual({ width: 24, height: 24 });
        expect(irOf(flowchart(), 'InitialNode').defaultSize).toEqual(irOf(activity(), 'InitialNode').defaultSize);
        expect(irOf(flowchart(), 'FinalNode').defaultSize).toEqual(irOf(activity(), 'FinalNode').defaultSize);
    });

    it('the fill and the marker are the derivation\'s, untouched; both stay glyphs', () => {
        const initial = irOf(flowchart(), 'InitialNode');
        const terminal = irOf(flowchart(), 'FinalNode');
        expect(initial.shape.form).toBe('circle');
        expect(initial.shape.fill).toBe('#334155');
        expect(terminal.shape.marker).toBe('dot');
        expect(terminal.shape.fill).toBe('var(--color-inode-surface)');
        expect(isNotationGlyph(initial) && isNotationGlyph(terminal)).toBe(true);
    });

    it('a class that is not an Initial or a Terminal declares no size (mutation: the size applied to every document)', () => {
        for (const name of ['Activity', 'Decision', 'ActivityNode']) expect(irOf(flowchart(), name).defaultSize, name).toBeUndefined();
    });

    it('the state machine\'s named Initial, read through the role-keyed base, declares no size (mutation: the size applied to the named Initial)', () => {
        const esm = ESM();
        const views = deriveViewpointIRs(esm.lookup, esm.id, boundRoles(esm, 'extendedStateMachine'));
        const initial = views.find(v => v.className === 'Initial')!.ir as any;
        expect(initial.shape.labels).toHaveLength(1);
        expect(initial.defaultSize).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Item 5: guards in mono
// ---------------------------------------------------------------------------

describe('item 5: a guard label is mono 11.5 px in every flow notation, an event label keeps the label style', () => {
    it('Flowchart: the control flow\'s guard (mutation: the style dropped at the source)', () => {
        const flow = irOf(derivedWith(FLOWB(), 'flowchart'), 'ControlFlow');
        expect(flow.edge.labels).toEqual({ center: { from: 'path', expr: '$guard.value' }, style: GUARD_STYLE });
    });

    it('Flowchart (ISO 5807): the plain guard label is mono, the yes and no words keep the label style (mutation: the style applied to the words)', () => {
        const views = derivedWith(FLOWB(), 'flowchartIso');
        expect(irOf(views, 'ControlFlow', 0).edge.labels).toEqual({ template: [{ from: 'path', expr: '$guard.value' }], style: GUARD_STYLE });
        expect(irOf(views, 'ControlFlow', 1).edge.labels).toEqual({ center: { from: 'literal', text: 'yes' }, style: LABEL_STYLE });
        expect(irOf(views, 'ControlFlow', 2).edge.labels).toEqual({ center: { from: 'literal', text: 'no' }, style: LABEL_STYLE });
    });

    it('Statechart, State machine: a transition with no event shows its guard in mono (mutation: the Statechart restyles the label)', () => {
        for (const notation of ['statechart', 'stateMachine'] as const) {
            const label = irOf(derivedWith(GUARDED(), notation), 'Transition').edge.labels;
            expect(label, notation).toEqual({ center: { from: 'path', expr: '$guard.value' }, style: GUARD_STYLE });
        }
    });

    it('Statechart: a transition with an event shows the event in the label style (mutation: the guard style applied to every label)', () => {
        const label = irOf(derivedWith(ESM(), 'statechart'), 'Transition').edge.labels;
        expect(label).toEqual({ center: { from: 'path', expr: '$event.value' }, style: LABEL_STYLE });
    });

    it('Activity (UML): its bracketed guard keeps the same style (the reference)', () => {
        const views = derivedWith(FLOWB(), 'activityUml');
        expect(irOf(views, 'ControlFlow', 1).edge.labels.style).toEqual(GUARD_STYLE);
    });
});

describe('item 5, the rows: a role-keyed compartment takes Generic\'s mono row style', () => {
    it('Statechart and State machine rows are mono 11 px quiet, as Generic\'s (mutation: the style left off attributesCompartment)', () => {
        for (const notation of ['statechart', 'stateMachine', 'generic'] as const) {
            const state = irOf(derivedWith(ESM(), notation), 'State');
            expect(state.fieldCompartments[0].rowFormat.style, notation).toEqual(ROW_STYLE);
        }
    });

    it('an unroled class under Flowchart and Petri net has the same row style', () => {
        expect(irOf(derivedWith(FLOW_NAMED(), 'flowchart'), 'Note').fieldCompartments[0].rowFormat.style).toEqual(ROW_STYLE);
        expect(irOf(derivedWith(PETRI_NAMED(), 'petri'), 'Note').fieldCompartments[0].rowFormat.style).toEqual(ROW_STYLE);
    });
});

// ---------------------------------------------------------------------------
// Item 6: fork and join
// ---------------------------------------------------------------------------

describe('item 6: fork and join are the same solid ink bar as Activity (UML)', () => {
    const flowchart = () => derivedWith(FLOWB(), 'flowchart');
    const activity = () => derivedWith(FLOWB(), 'activityUml');

    it('Fork and Join: bar, fill and border in the name ink, nameless (mutation: the catalogue ink kept)', () => {
        for (const name of ['Fork', 'Join']) {
            expect(irOf(flowchart(), name).shape, name).toEqual({
                form: 'bar', fill: INK, border: { color: INK, width: 1, style: 'solid' }, labels: [],
            });
        }
    });

    it('Fork and Join declare the bar size of Activity (UML), thickness 7, and the two are identical (mutation: the size not declared)', () => {
        for (const name of ['Fork', 'Join']) {
            expect(irOf(flowchart(), name).defaultSize, name).toEqual(irOf(activity(), name).defaultSize);
        }
        expect(irOf(flowchart(), 'Fork').defaultSize.height).toBe(7);
        expect(bare(irOf(flowchart(), 'Fork')).shape).toEqual(bare(irOf(flowchart(), 'Join')).shape);
        expect(irOf(flowchart(), 'Fork').defaultSize).toEqual(irOf(flowchart(), 'Join').defaultSize);
    });

    it('both stay notation glyphs, so Color by metaclass leaves them alone (R-VP-50)', () => {
        for (const name of ['Fork', 'Join']) expect(isNotationGlyph(irOf(flowchart(), name)), name).toBe(true);
    });
});
