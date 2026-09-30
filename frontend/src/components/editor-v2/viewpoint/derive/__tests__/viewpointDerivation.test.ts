/**
 * viewpointDerivation — a viewpoint derived from a metamodel (P-2026-09-29-0135, Phase 2
 * of the discovery P-2026-09-29-0111).
 *
 * The module is pure, so the tests run it directly, without store or mocks. The four demo
 * metamodels and the ERD one are transcribed by a program from the exports (read only:
 * `~/jjodel-demo-exports/scene_*.json` and `MDE _ ERD (1).jjodel`), with readable ids in
 * place of the `Pointer…` ones. The role bags are the ones Apply writes from the binder's
 * proposals (`bindProfile`, the bound roles only), which is how the demo configures them.
 *
 * Families, Person and a composite State are negative controls: classes that hold two
 * references into one hierarchy, or sit inside their own container, and are nodes.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { deriveGenericViewpointIRs, deriveViewpointForBinding, deriveViewpointIRs, isDerivableMetamodel, rolesFromTable } from '../viewpointDerivation';
import type { AnyDerivedView, DerivationRoles, DerivedView } from '../viewpointDerivation';
import { validateIR } from '../../ir/irValidate';
import { recognizeSymbol } from '../../ir/symbolRecognition';
import { compileView, compileEdgeView, compileRowView, clearCompileCache } from '../../ir/irCompile';
import { rowRenderedChildren } from '../../ir/irContainment';
import { makeDrawReadCtx } from '../../ir/irReadCtx';
import { BAR_SIZE, boxForContent, getShapeDescriptor, hasSizeSupplement } from '../../ir/shapeRegistry';
import type { EdgeViewIR, RowViewIR, VertexViewIR } from '../../ir/irTypes';
import { sketchOfMetamodel } from '../../../sim/metamodelSketch';
import { bindProfile } from '../../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixture builder
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

/** A metamodel with one package, as the exports hold them: ids `<tag>`, `<tag>.pkg`, `<tag>.<Class>`, `<tag>.<Class>.<feature>`. */
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

// ---------------------------------------------------------------------------
// The five exported metamodels (transcribed by _tmp_viewgen2_fixtures.mjs)
// ---------------------------------------------------------------------------

const PEST = metamodel('PEST', 'DemoPEST', [
    cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event'),
]);
const PETRI = metamodel('PETRI', 'DemoPetri', [
    cls('PNode', { abstract: true }),
    cls('Place', { supers: ['PNode'], attrs: [attr('tokens', EINT)] }),
    cls('Transition', { supers: ['PNode'], attrs: [attr('guard', EXPRESSION)] }),
    cls('Arc', { attrs: [attr('weight', EINT)], refs: [ref('src', 'PNode'), ref('tgt', 'PNode')] }),
    cls('InhibitorArc', { supers: ['Arc'] }),
]);
const ESM = metamodel('ESM', 'DemoESM', [
    cls('State', { attrs: [attr('entry', ACTION, -1)], refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event', { attrs: [attr('name', ESTRING)] }),
]);
const FLOWB = metamodel('FLOWB', 'DemoFlowB', [
    cls('ActivityNode'),
    cls('InitialNode', { supers: ['ActivityNode'] }),
    cls('Activity', { supers: ['ActivityNode'] }),
    cls('Decision', { supers: ['ActivityNode'] }),
    cls('Fork', { supers: ['ActivityNode'] }),
    cls('Join', { supers: ['ActivityNode'] }),
    cls('FinalNode', { supers: ['ActivityNode'] }),
    cls('ControlFlow', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('source', 'ActivityNode'), ref('target', 'ActivityNode')] }),
]);
const ERD = metamodel('ERD', 'ERD MM', [
    cls('Entity', { supers: ['namedElement'], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
    cls('Attribute', { supers: ['namedElement'], attrs: [attr('type', 'ERD.EnumType')] }),
    cls('namedElement', { attrs: [attr('name', ESTRING)] }),
    cls('Relation', { supers: ['namedElement'], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
]);

/**
 * The hand-written «Logical Syntax v1» viewpoint of the ERD export, its three views as
 * saved (pins mapped to the fixture ids). It sits in the lookup the derivation reads.
 */
const ERD_LOGICAL_RELATION: EdgeViewIR = {
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Relation'],
    edge: {
        source: '$left.value', target: '$right.value',
        labels: { center: { from: 'intrinsic', prop: 'name' } },
        terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
        routing: 'curved', line: { style: 'dotted', color: '#153af4', width: 2 },
    },
    authoringMetaclassPins: { Relation: 'ERD.Relation' }, label: 'View for Relation',
};
Object.assign(ERD.lookup, {
    'ERD.vp': { className: 'DViewPoint', id: 'ERD.vp', name: 'Logical Syntax v1', subViews: ['ERD.vp.entity', 'ERD.vp.attribute', 'ERD.vp.relation'] },
    'ERD.vp.entity': {
        className: 'DViewElement', id: 'ERD.vp.entity', name: 'View for Entity', viewpoint: 'ERD.vp', father: 'ERD.vp',
        ir: {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Entity'], priority: 0, exclusive: true, label: 'View for Entity',
            shape: {
                form: 'rect', cornerRadius: 8, border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
                labels: [{ position: 'top', source: { from: 'intrinsic', prop: 'qualifiedName' }, style: { fontSize: 14, color: 'var(--color-inode-name)', underline: true } }],
            },
            fieldCompartments: [{ id: 'attributes', source: { from: 'children' }, rowFormat: { segments: [] }, separator: true }],
            authoringMetaclassPins: { Entity: 'ERD.Entity' },
        },
    },
    'ERD.vp.attribute': {
        className: 'DViewElement', id: 'ERD.vp.attribute', name: 'View for Attribute', viewpoint: 'ERD.vp', father: 'ERD.vp',
        ir: {
            irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Attribute'],
            template: [{ from: 'intrinsic', prop: 'name' }, { from: 'literal', text: ':' }, { from: 'path', expr: '$type.value' }],
            authoringMetaclassPins: { Attribute: 'ERD.Attribute' }, label: 'View for Attribute',
        },
    },
    'ERD.vp.relation': {
        className: 'DViewElement', id: 'ERD.vp.relation', name: 'View for Relation', viewpoint: 'ERD.vp', father: 'ERD.vp',
        ir: ERD_LOGICAL_RELATION,
    },
});

// ---------------------------------------------------------------------------
// Negative controls
// ---------------------------------------------------------------------------

/** Families (the ATL Families2Persons metamodel): a Member holds four references back to its Family. */
const FAMILIES = metamodel('FAM', 'Families', [
    cls('Family', {
        attrs: [attr('lastName', ESTRING)],
        refs: [
            ref('father', 'Member', { composition: true }), ref('mother', 'Member', { composition: true }),
            ref('sons', 'Member', { composition: true, upper: -1 }), ref('daughters', 'Member', { composition: true, upper: -1 }),
        ],
    }),
    cls('Member', {
        attrs: [attr('firstName', ESTRING)],
        refs: [ref('familyFather', 'Family'), ref('familyMother', 'Family'), ref('familySon', 'Family'), ref('familyDaughter', 'Family')],
    }),
]);
/** A Person with a father and a mother: two references into its own hierarchy. */
const PERSONS = metamodel('PER', 'Persons', [
    cls('Person', { attrs: [attr('name', ESTRING)], refs: [ref('father', 'Person'), ref('mother', 'Person')] }),
]);
/**
 * Composite states: a State holds substates and points to its parent; a Composite, held by
 * a State as any state is, points to its initial Simple state, a sibling class.
 */
const COMPOSITE = metamodel('CMP', 'Composite', [
    cls('State', { refs: [ref('substates', 'State', { composition: true, upper: -1 }), ref('parent', 'State')] }),
    cls('Simple', { supers: ['State'] }),
    cls('Composite', { supers: ['State'], refs: [ref('initial', 'Simple')] }),
]);
/** A Car holds one Engine, which points back to it: the opposite of a containment. */
const CARS = metamodel('CAR', 'Cars', [
    cls('Car', { refs: [ref('engine', 'Engine', { composition: true })] }),
    cls('Engine', { refs: [ref('car', 'Car')] }),
]);
/** A graph whose nodes list their edges: Node holds two multi-valued references, Edge two single ones. */
const GRAPH = metamodel('GR', 'Graph', [
    cls('Node', { refs: [ref('incoming', 'Edge', { upper: -1 }), ref('outgoing', 'Edge', { upper: -1 })] }),
    cls('Edge', { refs: [ref('from', 'Node'), ref('to', 'Node')] }),
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The bag Apply writes from the binder's proposals: the bound roles only, as the demo does. */
function boundRoles(mm: Fixture, profileId: string): DerivationRoles {
    const profile = systemProfile(profileId)!;
    const bindings = bindProfile(profile, sketchOfMetamodel(mm.lookup, mm.id));
    const bag: Record<string, unknown> = {};
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    return { bag, shape: profile.shape };
}

const DEMOS: [string, Fixture, string][] = [
    ['DemoPEST', PEST, 'stateMachine'],
    ['DemoPetri', PETRI, 'petri'],
    ['DemoESM', ESM, 'extendedStateMachine'],
    ['DemoFlowB', FLOWB, 'flowchart'],
];

const byClass = <V extends AnyDerivedView>(views: V[], name: string): V => {
    const v = views.find(x => x.className === name);
    if (!v) throw new Error(`no view for ${name}: ${views.map(x => x.className).join(', ')}`);
    return v;
};
const vertex = (v: AnyDerivedView) => v.ir as VertexViewIR;
const edge = (v: AnyDerivedView) => v.ir as EdgeViewIR;
const edgeClasses = (views: AnyDerivedView[]) => views.filter(v => v.ir.kind === 'edge').map(v => v.className).sort();

/** Longest `extends` chain to a root, the order the derivation promises. */
function depthOf(lookup: Lookup, id: string, seen: string[] = []): number {
    if (seen.includes(id)) return 0;
    const sup: string[] = lookup[id]?.extends ?? [];
    return sup.length ? 1 + Math.max(...sup.map(s => depthOf(lookup, s, [...seen, id]))) : 0;
}

function deepFreeze<T>(x: T): T {
    if (x && typeof x === 'object' && !Object.isFrozen(x)) {
        Object.freeze(x);
        for (const v of Object.values(x as object)) deepFreeze(v);
    }
    return x;
}

/** Every colour string in a document, with its path. */
function colours(node: unknown, path = ''): [string, string][] {
    if (!node || typeof node !== 'object') return [];
    const out: [string, string][] = [];
    for (const [k, v] of Object.entries(node as object)) {
        const p = path ? `${path}.${k}` : k;
        if ((k === 'fill' || k === 'color') && typeof v === 'string') out.push([p, v]);
        else out.push(...colours(v, p));
    }
    return out;
}

const INK = '#334155';
const SOLID_PRESETS = ['uml-initial-state', 'uml-fork-join', 'petri-transition'];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deriveViewpointIRs — every document passes the IR validator', () => {
    for (const [name, mm, profile] of DEMOS) {
        it(`${name}, structure only and with the roles bound`, () => {
            for (const roles of [null, boundRoles(mm, profile)]) {
                const views = deriveViewpointIRs(mm.lookup, mm.id, roles);
                expect(views.length).toBeGreaterThan(0);
                for (const v of views) expect(validateIR(`derived:${v.className}`, v.ir)).toEqual({ ok: true });
            }
        });
    }
    it('ERD, structure only', () => {
        const views = deriveViewpointIRs(ERD.lookup, ERD.id, null);
        expect(views.map(v => v.className).sort()).toEqual(['Attribute', 'Entity', 'Relation', 'namedElement']);
        for (const v of views) expect(validateIR(`derived:${v.className}`, v.ir)).toEqual({ ok: true });
    });
});

describe('deriveViewpointIRs — one view per concrete class, pinned to it', () => {
    it('abstract classes get no view (Petri PNode)', () => {
        const views = deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri'));
        expect(views.map(v => v.className).sort()).toEqual(['Arc', 'InhibitorArc', 'Place', 'Transition']);
    });

    for (const [name, mm, profile] of DEMOS) {
        it(`${name}: metaclasses and pins are the class name and the class id`, () => {
            const views = deriveViewpointIRs(mm.lookup, mm.id, boundRoles(mm, profile));
            for (const v of views) {
                expect(v.classId).toBe(mm.classId(v.className));
                expect(v.ir.metaclasses).toEqual([v.className]);
                expect(v.ir.authoringMetaclassPins).toEqual({ [v.className]: v.classId });
                expect(v.ir.exclusive).toBe(true);
                // Decision 1 of the prompt: no priority, the order does the work.
                expect(v.ir.priority).toBeUndefined();
            }
        });
    }

    it('two classes of the same name in two metamodels are pinned apart (R-MCID-1)', () => {
        const pest = byClass(deriveViewpointIRs(PEST.lookup, PEST.id, null), 'State');
        const esm = byClass(deriveViewpointIRs(ESM.lookup, ESM.id, null), 'State');
        expect(pest.ir.metaclasses).toEqual(esm.ir.metaclasses);
        expect(pest.ir.authoringMetaclassPins).toEqual({ State: 'PEST.State' });
        expect(esm.ir.authoringMetaclassPins).toEqual({ State: 'ESM.State' });
    });
});

describe('deriveViewpointIRs — the order is deepest class first', () => {
    for (const [name, mm, profile] of [...DEMOS, ['ERD', ERD, ''] as [string, Fixture, string]]) {
        it(`${name}: depth never grows along the list`, () => {
            const views = deriveViewpointIRs(mm.lookup, mm.id, profile ? boundRoles(mm, profile) : null);
            const depths = views.map(v => depthOf(mm.lookup, v.classId));
            expect(depths).toEqual([...depths].sort((a, b) => b - a));
            expect(depths[0]).toBeGreaterThan(depths[depths.length - 1]);
        });
    }

    it('ties keep the declaration order (DemoPEST, DemoPetri)', () => {
        expect(deriveViewpointIRs(PEST.lookup, PEST.id, null).map(v => v.className))
            .toEqual(['Initial', 'Terminal', 'State', 'Transition', 'Event']);
        expect(deriveViewpointIRs(PETRI.lookup, PETRI.id, null).map(v => v.className))
            .toEqual(['Place', 'Transition', 'InhibitorArc', 'Arc']);
    });
});

describe('deriveViewpointIRs — the edge classes are edges with source and target', () => {
    it('DemoPEST: Transition from its container to nextState, by structure and by roles', () => {
        for (const roles of [null, boundRoles(PEST, 'stateMachine')]) {
            const views = deriveViewpointIRs(PEST.lookup, PEST.id, roles);
            expect(edgeClasses(views)).toEqual(['Transition']);
            const t = edge(byClass(views, 'Transition'));
            expect(t.edge.source).toBe('container');
            expect(t.edge.target).toBe('$nextState.value');
        }
    });

    it('DemoESM: Transition from its container to nextState', () => {
        const views = deriveViewpointIRs(ESM.lookup, ESM.id, boundRoles(ESM, 'extendedStateMachine'));
        expect(edgeClasses(views)).toEqual(['Transition']);
        expect(byClass(views, 'Transition').rule).toBe('role:transition');
        expect(edge(byClass(views, 'Transition')).edge).toMatchObject({ source: 'container', target: '$nextState.value' });
    });

    it('DemoPetri: Arc and InhibitorArc from src to tgt; the Petri Transition is a vertex', () => {
        for (const roles of [null, boundRoles(PETRI, 'petri')]) {
            const views = deriveViewpointIRs(PETRI.lookup, PETRI.id, roles);
            expect(edgeClasses(views)).toEqual(['Arc', 'InhibitorArc']);
            for (const n of ['Arc', 'InhibitorArc']) {
                expect(edge(byClass(views, n)).edge).toMatchObject({ source: '$src.value', target: '$tgt.value' });
            }
            expect(byClass(views, 'Transition').ir.kind).toBe('vertex');
        }
        const roles = deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri'));
        expect(byClass(roles, 'Arc').rule).toBe('role:arc');
        expect(byClass(roles, 'InhibitorArc').rule).toBe('role:inhibitorArc');
    });

    it('DemoFlowB: ControlFlow from source to target, by structure and by roles', () => {
        for (const roles of [null, boundRoles(FLOWB, 'flowchart')]) {
            const views = deriveViewpointIRs(FLOWB.lookup, FLOWB.id, roles);
            expect(edgeClasses(views)).toEqual(['ControlFlow']);
            expect(edge(byClass(views, 'ControlFlow')).edge).toMatchObject({ source: '$source.value', target: '$target.value' });
        }
    });

    it('a direction named against the declaration order follows the names', () => {
        const swapped = metamodel('SW', 'Swapped', [
            cls('Node'),
            cls('Link', { refs: [ref('target', 'Node'), ref('source', 'Node')] }),
        ]);
        const link = edge(byClass(deriveViewpointIRs(swapped.lookup, swapped.id, null), 'Link'));
        expect(link.edge).toMatchObject({ source: '$source.value', target: '$target.value' });
    });

    it('without roles every edge is directed and carries no line colour of its own', () => {
        // With the roles bound the Petri arcs (P-2026-09-29-0939) and the control-flow
        // transitions (V1, P-2026-09-29-1331) carry the notation's ink, pinned below.
        for (const [, mm] of DEMOS) {
            for (const v of deriveViewpointIRs(mm.lookup, mm.id, null)) {
                if (v.ir.kind !== 'edge') continue;
                expect(edge(v).edge.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'openArrow' });
                expect(edge(v).edge.line).toBeUndefined();
            }
        }
    });

    it('ERD: Relation matches the hand-written «Logical Syntax v1» on source, target and terminations', () => {
        const relation = edge(byClass(deriveViewpointIRs(ERD.lookup, ERD.id, null), 'Relation'));
        expect(relation.edge.source).toBe(ERD_LOGICAL_RELATION.edge.source);
        expect(relation.edge.target).toBe(ERD_LOGICAL_RELATION.edge.target);
        expect(relation.edge.terminations).toEqual(ERD_LOGICAL_RELATION.edge.terminations);
        // The label is the first string attribute, the inherited `name`.
        expect(relation.edge.labels).toEqual({ center: { from: 'path', expr: '$name.value' } });
    });

    it('negative controls: Families, Person, composite states and a Car engine have no edge', () => {
        for (const mm of [FAMILIES, PERSONS, COMPOSITE, CARS]) {
            const views = deriveViewpointIRs(mm.lookup, mm.id, null);
            expect(views.length).toBeGreaterThan(0);
            expect(edgeClasses(views)).toEqual([]);
        }
    });

    it('a node listing its edges stays a node; the edge runs from `from` to `to`', () => {
        const views = deriveViewpointIRs(GRAPH.lookup, GRAPH.id, null);
        expect(edgeClasses(views)).toEqual(['Edge']);
        expect(edge(byClass(views, 'Edge')).edge).toMatchObject({ source: '$from.value', target: '$to.value' });
    });
});

describe('deriveViewpointIRs — forms from the roles, colours from the tokens', () => {
    it('DemoPEST with roles: the initial pseudostate, as a whole document', () => {
        const initial = byClass(deriveViewpointIRs(PEST.lookup, PEST.id, boundRoles(PEST, 'stateMachine')), 'Initial');
        expect(initial.rule).toBe('role:initial');
        expect(initial.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Initial'], authoringMetaclassPins: { Initial: 'PEST.Initial' },
            exclusive: true, label: 'View for Initial',
            shape: {
                form: 'circle', fill: INK,
                border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
                labels: [{ position: 'bottom', source: { from: 'intrinsic', prop: 'name' }, style: { color: 'var(--color-text-inverse)' } }],
            },
        });
    });

    it('DemoPEST with roles: the transition, as a whole document', () => {
        const t = byClass(deriveViewpointIRs(PEST.lookup, PEST.id, boundRoles(PEST, 'stateMachine')), 'Transition');
        expect(t.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'], authoringMetaclassPins: { Transition: 'PEST.Transition' },
            exclusive: true, label: 'View for Transition',
            edge: {
                source: 'container', target: '$nextState.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
                // V1 (P-2026-09-29-1331): the event from the Trigger role, the line in the name ink.
                labels: { center: { from: 'path', expr: '$event.value' } },
                line: { color: 'var(--color-inode-name)', width: 1 },
            },
        });
    });

    it('the state machine initial keeps the catalogue ink, its catalogue match, and its name in the text-on-dark token', () => {
        // V1 leaves the state machine Initial as it was (R-VP-17); the activity's solid symbols
        // lose their name and the fork and join become bars, pinned in the control-flow block below.
        const solids: DerivedView[] = [
            byClass(deriveViewpointIRs(PEST.lookup, PEST.id, boundRoles(PEST, 'stateMachine')), 'Initial'),
            byClass(deriveViewpointIRs(ESM.lookup, ESM.id, boundRoles(ESM, 'extendedStateMachine')), 'Initial'),
        ];
        for (const v of solids) {
            const preset = 'uml-initial-state';
            expect(vertex(v).shape.fill).toBe(INK);
            expect(recognizeSymbol(vertex(v).shape).map(p => p.id)).toContain(preset);
            expect(vertex(v).shape.labels).toEqual([{ position: 'bottom', source: { from: 'intrinsic', prop: 'name' }, style: { color: 'var(--color-text-inverse)' } }]);
            expect(vertex(v).fieldCompartments).toBeUndefined();
        }
    });

    it('the other role forms: final state, Petri place, state', () => {
        const flow = deriveViewpointIRs(FLOWB.lookup, FLOWB.id, boundRoles(FLOWB, 'flowchart'));
        const petri = deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri'));
        expect(recognizeSymbol(vertex(byClass(flow, 'FinalNode')).shape).map(p => p.id)).toContain('uml-final-state');
        expect(vertex(byClass(flow, 'FinalNode')).shape.marker).toBe('dot');
        // The activity's final node is a nameless bull's-eye (V1), pinned in the control-flow block below.
        expect(vertex(byClass(flow, 'FinalNode')).shape.labels).toEqual([]);
        // The Petri place draws no token marks (R-VP-16), so it is the catalogue's Place again.
        expect(recognizeSymbol(vertex(byClass(petri, 'Place')).shape).map(p => p.id)).toContain('petri-place');
        expect(vertex(byClass(petri, 'Place')).shape.form).toBe('circle');
        // A circle holds no compartment, even when the class has attributes (Place.tokens).
        expect(vertex(byClass(petri, 'Place')).fieldCompartments).toBeUndefined();
        for (const n of ['ActivityNode', 'Activity', 'Decision']) {
            expect(byClass(flow, n).rule).toBe('role:node');
            expect(vertex(byClass(flow, n)).shape.form).toBe('rounded');
        }
    });

    it('without roles every vertex is a rounded box, attributes in a compartment', () => {
        const views = deriveViewpointIRs(PETRI.lookup, PETRI.id, null);
        const place = vertex(byClass(views, 'Place'));
        expect(byClass(views, 'Place').rule).toBe('structure:default');
        expect(place.shape.form).toBe('rounded');
        expect(place.shape.fill).toBe('var(--color-inode-surface)');
        expect(place.shape.labels).toEqual([{ position: 'top', source: { from: 'intrinsic', prop: 'name' } }]);
        expect(place.fieldCompartments).toEqual([{
            id: 'attributes', source: { from: 'attributes' },
            rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] }, separator: true,
        }]);
        // A class with no attribute has no compartment (DemoPEST State).
        expect(vertex(byClass(deriveViewpointIRs(PEST.lookup, PEST.id, null), 'State')).fieldCompartments).toBeUndefined();
    });

    it('every colour is a CSS token, except the ink of a solid symbol', () => {
        for (const [, mm, profile] of [...DEMOS, ['ERD', ERD, ''] as [string, Fixture, string]]) {
            for (const roles of [null, profile ? boundRoles(mm, profile) : null]) {
                for (const v of deriveViewpointIRs(mm.lookup, mm.id, roles)) {
                    for (const [path, value] of colours(v.ir)) {
                        // The Petri bar (R-VP-16) keeps the catalogue ink and matches no preset.
                        const solid = v.ir.kind === 'vertex' && (vertex(v).shape.form === 'bar'
                            || SOLID_PRESETS.some(p => recognizeSymbol(vertex(v).shape).some(r => r.id === p)));
                        if (path === 'shape.fill' && solid) expect(value).toBe(INK);
                        else expect(value, `${v.className} ${path}`).toMatch(/^var\(--[a-z0-9-]+\)$/);
                    }
                }
            }
        }
    });
});

describe('deriveViewpointIRs — pure: nothing it reads is touched', () => {
    it('the ERD lookup, hand-written viewpoint included, is read frozen and left identical', () => {
        const before = JSON.stringify(ERD.lookup);
        const frozen = deepFreeze(JSON.parse(before));
        const views = deriveViewpointIRs(frozen, ERD.id, null);
        expect(JSON.stringify(frozen)).toBe(before);
        // The derived documents are new objects: none is a saved view, none aliases one.
        for (const v of views) {
            expect(Object.keys(v.ir)).not.toContain('id');
            expect(v.ir).not.toBe(frozen['ERD.vp.relation'].ir);
            expect(Object.isFrozen(v.ir)).toBe(false);
        }
    });

    it('the role bag is read, not written', () => {
        const roles = boundRoles(FLOWB, 'flowchart');
        const before = JSON.stringify(roles);
        deriveViewpointIRs(deepFreeze(JSON.parse(JSON.stringify(FLOWB.lookup))), FLOWB.id, deepFreeze(roles));
        expect(JSON.stringify(roles)).toBe(before);
    });

    it('no object is shared between two documents', () => {
        for (const [, mm, profile] of DEMOS) {
            // With the roles too: the Petri token rules are built per document, never shared.
            for (const roles of [null, boundRoles(mm, profile)]) {
                const owner = new Map<object, string>();
                const walk = (node: unknown, doc: string) => {
                    if (!node || typeof node !== 'object') return;
                    const seen = owner.get(node);
                    expect(seen === undefined || seen === doc, `${doc} shares an object with ${seen}`).toBe(true);
                    owner.set(node, doc);
                    for (const v of Object.values(node as object)) walk(v, doc);
                };
                for (const v of deriveViewpointIRs(mm.lookup, mm.id, roles)) walk(v.ir, v.className);
            }
        }
    });

    it('deterministic: two runs give the same documents', () => {
        const roles = boundRoles(ESM, 'extendedStateMachine');
        expect(deriveViewpointIRs(ESM.lookup, ESM.id, roles)).toEqual(deriveViewpointIRs(ESM.lookup, ESM.id, roles));
    });

    it('an unknown metamodel id gives no view', () => {
        expect(deriveViewpointIRs(PEST.lookup, 'nope', null)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// What the Petri notation leaves alone (P-2026-09-29-0939)
// ---------------------------------------------------------------------------

/** 16 hex of the sha256 of the list, as JSON: documents, rules and ids, in derivation order. */
const digest = (views: AnyDerivedView[]) => createHash('sha256').update(JSON.stringify(views)).digest('hex').slice(0, 16);

describe('deriveViewpointIRs — without roles the documents are byte-equal to before the notations', () => {
    // Measured on the derivation of e5010856c, before lane 1 of the Petri notation touched it.
    // The three control-flow demos with their roles were pinned here too, until V1 drew their
    // notation (P-2026-09-29-1331); their documents are pinned in the control-flow block below.
    const BEFORE: Record<string, string> = {
        'DemoPEST, structure only': '8e32f9410c28c283',
        'DemoPetri, structure only': 'efca0aebb7252be6',
        'DemoESM, structure only': 'ed94b7c91af53994',
        'DemoFlowB, structure only': 'aced3058b1d1d8e7',
        'ERD, structure only': '12424010412fddd8',
        'Families, structure only': 'b2e49ba38211ad25',
        'Persons, structure only': 'c149f74b4ff3fbc6',
        'Composite, structure only': '6a6854ef45e31b7c',
        'Cars, structure only': 'e4c9e39d921875d2',
        'Graph, structure only': 'ddc40a8c323eb1e1',
    };

    it('structure only on every metamodel', () => {
        const got: Record<string, string> = {};
        for (const [name, mm] of [
            ['DemoPEST', PEST], ['DemoPetri', PETRI], ['DemoESM', ESM], ['DemoFlowB', FLOWB], ['ERD', ERD],
            ['Families', FAMILIES], ['Persons', PERSONS], ['Composite', COMPOSITE], ['Cars', CARS], ['Graph', GRAPH],
        ] as [string, Fixture][]) {
            got[`${name}, structure only`] = digest(deriveViewpointIRs(mm.lookup, mm.id, null));
        }
        expect(got).toEqual(BEFORE);
    });

    it('the Petri documents with their roles are byte-equal to before V1', () => {
        // Measured on the derivation of f8e041498, before V1 (P-2026-09-29-1331) touched it (R-VP-16).
        // R-VP-25 (P-2026-09-30-1521): DemoPetri moved with the open arrowhead of its Arc, to the digest predicted on
        // 2cde09984, before any A2 edit, as the tip's documents with every closedArrow an openArrow.
        expect(digest(deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri')))).toBe('997f12afe5b58db0');
    });

    it('a control-flow shape with no role bound keeps the boxes: the notation is keyed on the roles, not the shape', () => {
        for (const mm of [PEST, ESM, FLOWB]) {
            expect(deriveViewpointIRs(mm.lookup, mm.id, { bag: {}, shape: 'controlFlow' }))
                .toEqual(deriveViewpointIRs(mm.lookup, mm.id, null));
        }
    });

    it('the Petri profile with no role bound keeps the boxes: the notation is keyed on the roles, not the profile', () => {
        expect(deriveViewpointIRs(PETRI.lookup, PETRI.id, { bag: {}, shape: 'petri' }))
            .toEqual(deriveViewpointIRs(PETRI.lookup, PETRI.id, null));
    });

    it('the Petri roles on a control-flow shape draw no Petri notation', () => {
        const petri = boundRoles(PETRI, 'petri');
        const views = deriveViewpointIRs(PETRI.lookup, PETRI.id, { bag: petri.bag, shape: 'controlFlow' });
        for (const v of views) {
            if (v.ir.kind === 'edge') {
                expect(edge(v).edge.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'openArrow' });
                expect(edge(v).edge.line).toBeUndefined();
                expect(edge(v).edge.routing).toBeUndefined();
            } else {
                expect(vertex(v).shape.border?.color).toBe('var(--color-inode-border)');
                expect(vertex(v).shape.marker).toBeUndefined();
                expect(vertex(v).shape.form).not.toBe('bar');
            }
        }
    });
});

// ---------------------------------------------------------------------------
// The Petri notation (lane 1, P-2026-09-29-0939, R-VP-15; amended by R-VP-16, P-2026-09-29-1021)
// ---------------------------------------------------------------------------

const NAME_INK = 'var(--color-inode-name)';
const NAME = { from: 'intrinsic', prop: 'name' } as const;

/**
 * DemoPetri's objects in the draw backend's shape: one place per marking 0..7, one place whose
 * `tokens` slot holds no value, a transition and one arc of each kind.
 */
function petriWorld() {
    const lookup: Lookup = { ...PETRI.lookup };
    const object = (id: string, cls: string, slots: Record<string, unknown[]>) => {
        lookup[id] = { id, name: id, className: 'DObject', instanceof: PETRI.classId(cls), features: Object.keys(slots).map(f => `${id}.${f}`) };
        for (const [f, values] of Object.entries(slots)) {
            const owner = f === 'tokens' ? 'Place' : f === 'guard' ? 'Transition' : 'Arc';
            lookup[`${id}.${f}`] = { id: `${id}.${f}`, className: 'DValue', instanceof: `${PETRI.classId(owner)}.${f}`, values };
        }
    };
    for (let n = 0; n <= 7; n++) object(`p${n}`, 'Place', { tokens: [n] });
    object('pEmpty', 'Place', { tokens: [] });
    object('t1', 'Transition', { guard: [] });
    object('a1', 'Arc', { src: ['p1'], tgt: ['t1'], weight: [1] });
    object('i1', 'InhibitorArc', { src: ['p2'], tgt: ['t1'], weight: [1] });
    return { lookup, ctx: makeDrawReadCtx(lookup) };
}

describe('deriveViewpointIRs — the Petri notation with the roles bound (R-VP-15 as amended by R-VP-16)', () => {
    const views = () => deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri'));

    it('Place, as a whole document: ink border, the name centred in italic, no token marks', () => {
        const place = byClass(views(), 'Place');
        expect(place.rule).toBe('role:node');
        expect(place.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Place'], authoringMetaclassPins: { Place: 'PETRI.Place' },
            exclusive: true, label: 'View for Place',
            shape: {
                form: 'circle', fill: 'var(--color-inode-surface)',
                border: { color: NAME_INK, width: 1, style: 'solid' },
                labels: [{ position: 'center', source: NAME, style: { fontStyle: 'italic', fontWeight: 'normal' } }],
            },
        });
    });

    it('Transition, as a whole document: a bar in the catalogue ink, the name centred in the name ink', () => {
        const t = byClass(views(), 'Transition');
        expect(t.rule).toBe('role:transition');
        expect(t.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Transition'], authoringMetaclassPins: { Transition: 'PETRI.Transition' },
            exclusive: true, label: 'View for Transition',
            shape: {
                form: 'bar', fill: INK,
                border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
                labels: [{ position: 'center', source: NAME, style: { color: NAME_INK, fontWeight: 'normal' } }],
            },
        });
    });

    it('Arc: a 1 px ink line ending in the open arrowhead (R-VP-25), no routing (the orthogonal router)', () => {
        expect(edge(byClass(views(), 'Arc')).edge).toEqual({
            source: '$src.value', target: '$tgt.value',
            terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            line: { color: NAME_INK, width: 1 },
        });
    });

    it('InhibitorArc: the same line, no routing, the open arrowhead as the arc (the circle is the classic notation\'s, R-VP-24)', () => {
        expect(edge(byClass(views(), 'InhibitorArc')).edge).toEqual({
            source: '$src.value', target: '$tgt.value',
            terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            line: { color: NAME_INK, width: 1 },
        });
    });

    it('no derived edge of any demo carries a routing, with or without roles', () => {
        for (const [name, mm, profile] of DEMOS) {
            for (const roles of [null, boundRoles(mm, profile)]) {
                for (const v of deriveViewpointIRs(mm.lookup, mm.id, roles)) {
                    if (v.ir.kind === 'edge') expect(Object.keys(edge(v).edge), `${name} ${v.className}`).not.toContain('routing');
                }
            }
        }
    });

    it('no token marks on the objects: no marker and one label, the name, for every marking 0..7 and none', () => {
        clearCompileCache();
        const { lookup, ctx } = petriWorld();
        const cv = compileView('derived:Place', vertex(byClass(views(), 'Place')));
        expect(cv.marker).toBeNull();
        expect(cv.labels.map(l => l.position)).toEqual(['center']);
        for (const id of ['pEmpty', 'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']) {
            const shown = cv.labels.filter(l => l.visible(ctx, id)).map(l => String(l.text(ctx, id)));
            expect(shown, id).toEqual([lookup[id].name]);
        }
    });

    it('the ink and the routing on the compiled views; the bar keeps the catalogue hex', () => {
        clearCompileCache();
        const { ctx } = petriWorld();
        const all = views();
        const place = compileView('derived:Place', vertex(byClass(all, 'Place')));
        expect(place.borderColor!(ctx, 'p1')).toBe(NAME_INK);
        expect(place.borderWidth!(ctx, 'p1')).toBe(1);
        expect(place.labels[0].style!.fontStyle!(ctx, 'p1')).toBe('italic');
        for (const [n, id] of [['Arc', 'a1'], ['InhibitorArc', 'i1']]) {
            const ce = compileEdgeView(`derived:${n}`, edge(byClass(all, n)));
            // UnifiedEdge paints the arrowhead with the authored line colour (irMarkerFillStyle).
            expect(ce.lineColor!(ctx, id), n).toBe(NAME_INK);
            expect(ce.lineWidth!(ctx, id), n).toBe(1);
            // null is the orthogonal router (UnifiedEdge, irTypes.ts routing: absent = 'orthogonal').
            expect(ce.routing, n).toBeNull();
        }
        const bar = compileView('derived:Transition', vertex(byClass(all, 'Transition')));
        expect(bar.fill!(ctx, 't1')).toBe(INK);
        expect(bar.form(ctx, 't1')).toBe('bar');
        expect(bar.labels.map(l => l.position)).toEqual(['center']);
        expect(bar.labels[0].style!.color!(ctx, 't1')).toBe(NAME_INK);
    });

    it('the bar is a thin box of about 4:1 at a fixed size, much smaller than the smallest place', () => {
        const bar = getShapeDescriptor('bar');
        const circle = getShapeDescriptor('circle');
        // Not sized after its content: the content-driven sizing (useContentSize.ts) stays off.
        expect(hasSizeSupplement(bar)).toBe(false);
        expect(bar.defaultResizable).toBe(false);
        expect(BAR_SIZE.w / BAR_SIZE.h).toBeGreaterThanOrEqual(3.5);
        expect(BAR_SIZE.w / BAR_SIZE.h).toBeLessThanOrEqual(4.5);
        // The smallest place is the circle's box for no content at all.
        const place = boxForContent(circle, 0, 0);
        expect(place.w).toBeGreaterThanOrEqual(64);
        expect(BAR_SIZE.w).toBeLessThan(place.w);
        expect(BAR_SIZE.h).toBeLessThanOrEqual(place.h / 4);
        expect(BAR_SIZE.w * BAR_SIZE.h).toBeLessThanOrEqual((place.w * place.h) / 4);
    });

    it('the marking role, bound, unbound or bound elsewhere, changes nothing: tokens are not drawn', () => {
        const roles = boundRoles(PETRI, 'petri');
        const unbound = { ...roles.bag };
        delete unbound.simInitialMarking;
        const elsewhere = { ...roles.bag, simInitialMarking: PETRI.classId('Arc') + '.weight' };
        const bound = deriveViewpointIRs(PETRI.lookup, PETRI.id, roles);
        expect(roles.bag.simInitialMarking).toBeTruthy();
        expect(deriveViewpointIRs(PETRI.lookup, PETRI.id, { bag: unbound, shape: 'petri' })).toEqual(bound);
        expect(deriveViewpointIRs(PETRI.lookup, PETRI.id, { bag: elsewhere, shape: 'petri' })).toEqual(bound);
        // The place is the catalogue's Place for the Symbol Editor.
        expect(recognizeSymbol(vertex(byClass(bound, 'Place')).shape).map(p => p.id)).toContain('petri-place');
    });
});

// ---------------------------------------------------------------------------
// Petri net (classic), slice A2 (P-2026-09-30-1521, R-VP-24, mockup petri-A.svg)
// ---------------------------------------------------------------------------

describe('deriveViewpointForBinding — Petri net (classic), over the Petri documents (R-VP-24)', () => {
    const roles = (): DerivationRoles => ({ ...boundRoles(PETRI, 'petri'), notation: 'petriClassic' });
    const views = () => deriveViewpointForBinding(PETRI.lookup, PETRI.id, roles()) as DerivedView[];
    const all = (name: string) => views().filter(v => v.className === name);
    const WEIGHT_LABEL = { center: { from: 'path', expr: '$weight.value' }, style: { fontSize: 12, fontWeight: 'medium', color: 'var(--color-inode-quiet)' } };
    const ABOVE_ONE = { op: 'gt', left: '$weight.value', right: { kind: 'number', value: 1 } };

    it('Place, as a whole document: a 44 px circle in the ink, the name outside below, the marking as dots up to 4 and a number from 5', () => {
        const place = byClass(views(), 'Place');
        expect(place.rule).toBe('role:node');
        const eqTokens = (n: number) => ({ op: 'eq', left: '$tokens.value', right: { kind: 'number', value: n } });
        expect(place.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Place'], authoringMetaclassPins: { Place: 'PETRI.Place' },
            exclusive: true, label: 'View for Place', defaultSize: { width: 44, height: 44 },
            shape: {
                form: 'circle', fill: 'var(--color-inode-surface)',
                border: { color: NAME_INK, width: 1, style: 'solid' },
                labels: [
                    { position: 'outside', anchor: 's', source: NAME, style: { fontSize: 13, fontWeight: 'medium', color: NAME_INK } },
                    {
                        position: 'center', source: { from: 'path', expr: '$tokens.value' }, style: { fontSize: 15, fontWeight: 'semibold', color: NAME_INK },
                        visible: { when: { op: 'gt', left: '$tokens.value', right: { kind: 'number', value: 4 } }, then: true, else: false },
                    },
                ],
                marker: {
                    rules: [
                        { when: eqTokens(1), then: 'dot' }, { when: eqTokens(2), then: 'dots-2' },
                        { when: eqTokens(3), then: 'dots-3' }, { when: eqTokens(4), then: 'dots-4' },
                    ],
                    default: '',
                },
            },
        });
    });

    it('Transition, as a whole document: an upright bar 10×44 in the catalogue ink, its name outside to the right', () => {
        const t = byClass(views(), 'Transition');
        expect(t.rule).toBe('role:transition');
        expect(t.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Transition'], authoringMetaclassPins: { Transition: 'PETRI.Transition' },
            exclusive: true, label: 'View for Transition', defaultSize: { width: 10, height: 44 },
            shape: {
                form: 'bar', fill: INK,
                border: { color: INK, width: 1, style: 'solid' },
                labels: [{ position: 'outside', anchor: 'e', source: NAME, style: { fontSize: 12, fontWeight: 'medium', color: 'var(--color-inode-quiet)' } }],
            },
        });
    });

    it('Arc: an arc in the ink ending in the open arrowhead; a second document labels a weight above 1', () => {
        const [plain, weighted] = all('Arc').map(edge);
        const line = { source: '$src.value', target: '$tgt.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, line: { color: NAME_INK, width: 1 }, curve: 'arc' };
        expect(all('Arc')).toHaveLength(2);
        expect(plain.edge).toEqual(line);
        expect(plain.predicate).toBeUndefined();
        expect(plain.priority).toBeUndefined();
        expect(weighted.edge).toEqual({ ...line, labels: WEIGHT_LABEL });
        expect(weighted.predicate).toEqual(ABOVE_ONE);
        expect(weighted.priority).toBe(1);
        expect(weighted.label).toBe('View for Arc (weight)');
    });

    it('InhibitorArc: the same two documents, ending in the hollow circle', () => {
        const [plain, weighted] = all('InhibitorArc').map(edge);
        const line = { source: '$src.value', target: '$tgt.value', terminations: { sourceEnd: 'none', targetEnd: 'hollowCircle' }, line: { color: NAME_INK, width: 1 }, curve: 'arc' };
        expect(all('InhibitorArc').map(v => v.rule)).toEqual(['role:inhibitorArc', 'role:inhibitorArc']);
        expect(plain.edge).toEqual(line);
        expect(weighted.edge).toEqual({ ...line, labels: WEIGHT_LABEL });
        expect(weighted.predicate).toEqual(ABOVE_ONE);
        expect(weighted.priority).toBe(1);
    });

    it('the tokens on the objects: one to four dots, the number from five, nothing at zero or unset; the name always', () => {
        clearCompileCache();
        const { lookup, ctx } = petriWorld();
        const cv = compileView('derived:PlaceClassic', vertex(byClass(views(), 'Place')));
        const seen = ['pEmpty', 'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map(id => [
            id, String(cv.marker!(ctx, id) ?? ''), cv.labels.filter(l => l.visible(ctx, id)).map(l => String(l.text(ctx, id))),
        ]);
        expect(seen).toEqual([
            ['pEmpty', '', [lookup.pEmpty.name]], ['p0', '', [lookup.p0.name]],
            ['p1', 'dot', [lookup.p1.name]], ['p2', 'dots-2', [lookup.p2.name]], ['p3', 'dots-3', [lookup.p3.name]], ['p4', 'dots-4', [lookup.p4.name]],
            ['p5', '', [lookup.p5.name, '5']], ['p6', '', [lookup.p6.name, '6']], ['p7', '', [lookup.p7.name, '7']],
        ]);
        expect(cv.labels.map(l => [l.position, l.anchor ?? null])).toEqual([['outside', 's'], ['center', null]]);
    });

    it('the compiled arcs: the ink, 1 px, the arc, the ends; the bar keeps the catalogue hex', () => {
        clearCompileCache();
        const { ctx } = petriWorld();
        for (const [n, id, end] of [['Arc', 'a1', 'openArrow'], ['InhibitorArc', 'i1', 'hollowCircle']]) {
            const ce = compileEdgeView(`derived:${n}Classic`, edge(all(n)[0]));
            expect(ce.lineColor!(ctx, id), n).toBe(NAME_INK);
            expect(ce.lineWidth!(ctx, id), n).toBe(1);
            expect(ce.curve, n).toBe('arc');
            expect(ce.terminations, n).toEqual({ sourceEnd: 'none', targetEnd: end });
        }
        const bar = compileView('derived:TransitionClassic', vertex(byClass(views(), 'Transition')));
        expect(bar.fill!(ctx, 't1')).toBe(INK);
        expect(bar.form(ctx, 't1')).toBe('bar');
    });

    it('the order and the rules are the Petri net\'s, each weighted document right after its plain one', () => {
        const petri = deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri'));
        const expected = petri.flatMap(v => (v.ir.kind === 'edge' ? [[v.className, v.rule], [v.className, v.rule]] : [[v.className, v.rule]]));
        expect(views().map(v => [v.className, v.rule])).toEqual(expected);
    });

    it('with no marking bound, no marks; with no weight bound, one document per arc class', () => {
        const r = roles();
        const bag = { ...r.bag };
        delete bag.simInitialMarking;
        delete bag.simArcWeight;
        const bare = deriveViewpointForBinding(PETRI.lookup, PETRI.id, { ...r, bag });
        const place = vertex(byClass(bare, 'Place'));
        expect(place.shape.marker).toBeUndefined();
        expect(place.shape.labels!.map(l => l.position)).toEqual(['outside']);
        expect(bare.filter(v => v.ir.kind === 'edge').map(v => v.className)).toEqual(['InhibitorArc', 'Arc']);
        expect(bare.filter(v => v.ir.kind === 'edge').every(v => edge(v).edge.labels === undefined)).toBe(true);
    });

    it('a class with no role, and the Terminal, keep the Petri drawing', () => {
        const mm = metamodel('PX', 'PetriExtra', [
            cls('PNode', { abstract: true }),
            cls('Place', { supers: ['PNode'], attrs: [attr('tokens', EINT)] }),
            cls('Sink', { supers: ['Place'] }),
            cls('Transition', { supers: ['PNode'] }),
            cls('Arc', { attrs: [attr('weight', EINT)], refs: [ref('src', 'PNode'), ref('tgt', 'PNode')] }),
            cls('Note', { attrs: [attr('text', ESTRING)] }),
        ]);
        const base = boundRoles(mm, 'petri');
        const table = { 'PX.Place': 'node', 'PX.Sink': 'terminal', 'PX.Transition': 'transition', 'PX.Arc': 'arc' };
        const petri = deriveViewpointForBinding(mm.lookup, mm.id, { ...base, classRoles: table });
        const classic = deriveViewpointForBinding(mm.lookup, mm.id, { ...base, classRoles: table, notation: 'petriClassic' });
        expect(byClass(classic, 'Note')).toEqual(byClass(petri, 'Note'));
        expect(byClass(classic, 'Sink')).toEqual(byClass(petri, 'Sink'));
        expect(vertex(byClass(classic, 'Place')).shape.labels![0].position).toBe('outside');
    });

    it('every document passes the IR validator', () => {
        for (const v of views()) expect(validateIR(`derived:${v.className}`, v.ir), v.className).toEqual({ ok: true });
    });

    it('Petri net itself is untouched by the classic notation: the same documents without it', () => {
        const { notation: _n, ...plain } = roles();
        expect(deriveViewpointForBinding(PETRI.lookup, PETRI.id, plain)).toEqual(deriveViewpointIRs(PETRI.lookup, PETRI.id, boundRoles(PETRI, 'petri')));
    });
});

// ---------------------------------------------------------------------------
// The control-flow notation (V1, P-2026-09-29-1331, R-VP-17)
// ---------------------------------------------------------------------------

const SURFACE = 'var(--color-inode-surface)';
const BORDER = 'var(--color-inode-border)';
const INK_LINE = { color: NAME_INK, width: 1 };
const CENTRED = [{ position: 'center', source: NAME }];

describe('deriveViewpointIRs — the state machine notation with the roles bound (DemoPEST, DemoESM)', () => {
    const pest = () => deriveViewpointIRs(PEST.lookup, PEST.id, boundRoles(PEST, 'stateMachine'));
    const esm = () => deriveViewpointIRs(ESM.lookup, ESM.id, boundRoles(ESM, 'extendedStateMachine'));

    it('Terminal, as a whole document: a named state box with the double border in the name ink', () => {
        const t = byClass(pest(), 'Terminal');
        expect(t.rule).toBe('role:terminal');
        expect(t.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Terminal'], authoringMetaclassPins: { Terminal: 'PEST.Terminal' },
            exclusive: true, label: 'View for Terminal',
            shape: { form: 'rounded', fill: SURFACE, border: { color: NAME_INK, width: 3, style: 'double' }, labels: CENTRED },
        });
    });

    it('the ESM Terminal is the same box, with no compartment though it inherits entry (a final state has no behaviour)', () => {
        const t = vertex(byClass(esm(), 'Terminal'));
        expect(t.shape).toEqual({ form: 'rounded', fill: SURFACE, border: { color: NAME_INK, width: 3, style: 'double' }, labels: CENTRED });
        expect(t.fieldCompartments).toBeUndefined();
    });

    it('Initial is unchanged: the same document with and without V1, in both demos', () => {
        // The dot badge on a named box needs an IR change (V4); V1 keeps today's disc.
        for (const views of [pest(), esm()]) {
            expect(vertex(byClass(views, 'Initial')).shape).toEqual({
                form: 'circle', fill: INK, border: { color: BORDER, width: 1, style: 'solid' },
                labels: [{ position: 'bottom', source: NAME, style: { color: 'var(--color-text-inverse)' } }],
            });
        }
    });

    it('the transition is labelled with its event (the Trigger role), not its guard, on a line in the name ink', () => {
        for (const views of [pest(), esm()]) {
            expect(edge(byClass(views, 'Transition')).edge).toEqual({
                source: 'container', target: '$nextState.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
                labels: { center: { from: 'path', expr: '$event.value' } }, line: INK_LINE,
            });
        }
    });

    it('a box with no compartment has its name centred; a box with one keeps the name on top', () => {
        // DemoPEST: State and Event hold no attribute.
        for (const n of ['State', 'Event']) {
            expect(vertex(byClass(pest(), n)).shape.labels, n).toEqual(CENTRED);
            expect(vertex(byClass(pest(), n)).fieldCompartments, n).toBeUndefined();
        }
        // DemoESM: State holds entry, Event holds name.
        for (const n of ['State', 'Event']) {
            expect(vertex(byClass(esm(), n)).shape.labels, n).toEqual([{ position: 'top', source: NAME }]);
            expect(vertex(byClass(esm(), n)).fieldCompartments, n).toHaveLength(1);
        }
    });
});

describe('deriveViewpointIRs — the activity notation with the roles bound (DemoFlowB)', () => {
    const flow = () => deriveViewpointIRs(FLOWB.lookup, FLOWB.id, boundRoles(FLOWB, 'flowchart'));

    it('InitialNode: the nameless solid disc, still the catalogue initial', () => {
        const v = vertex(byClass(flow(), 'InitialNode'));
        expect(v.shape).toEqual({ form: 'circle', fill: INK, border: { color: BORDER, width: 1, style: 'solid' }, labels: [] });
        expect(recognizeSymbol(v.shape).map(p => p.id)).toContain('uml-initial-state');
    });

    it('FinalNode: the nameless bull\'s-eye, ring and dot in the name ink, still the catalogue final state', () => {
        const v = vertex(byClass(flow(), 'FinalNode'));
        expect(byClass(flow(), 'FinalNode').rule).toBe('role:terminal');
        expect(v.shape).toEqual({ form: 'circle', fill: SURFACE, border: { color: NAME_INK, width: 1, style: 'solid' }, marker: 'dot', labels: [] });
        expect(recognizeSymbol(v.shape).map(p => p.id)).toContain('uml-final-state');
    });

    it('Fork and Join: nameless bars in the catalogue ink', () => {
        for (const n of ['Fork', 'Join']) {
            expect(byClass(flow(), n).rule, n).toBe(`role:${n.toLowerCase()}`);
            expect(vertex(byClass(flow(), n)).shape, n).toEqual({ form: 'bar', fill: INK, border: { color: BORDER, width: 1, style: 'solid' }, labels: [] });
            expect(vertex(byClass(flow(), n)).fieldCompartments, n).toBeUndefined();
        }
    });

    it('the activity boxes have their name centred', () => {
        for (const n of ['ActivityNode', 'Activity', 'Decision']) {
            expect(vertex(byClass(flow(), n)).shape, n).toEqual({ form: 'rounded', fill: SURFACE, border: { color: BORDER, width: 1, style: 'solid' }, labels: CENTRED });
        }
    });

    it('ControlFlow is labelled with its guard as raw text, on a line in the name ink', () => {
        expect(edge(byClass(flow(), 'ControlFlow')).edge).toEqual({
            source: '$source.value', target: '$target.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            labels: { center: { from: 'path', expr: '$guard.value' } }, line: INK_LINE,
        });
    });
});

describe('deriveViewpointIRs — the control-flow notation reads the roles', () => {
    it('without the Trigger a state machine binding draws the activity\'s nameless symbols', () => {
        const roles = boundRoles(PEST, 'stateMachine');
        const bag = { ...roles.bag };
        delete bag.simTrigger;
        const views = deriveViewpointIRs(PEST.lookup, PEST.id, { bag, shape: 'controlFlow' });
        expect(vertex(byClass(views, 'Initial')).shape.labels).toEqual([]);
        expect(vertex(byClass(views, 'Terminal')).shape).toMatchObject({ form: 'circle', marker: 'dot', border: { color: NAME_INK }, labels: [] });
        // No trigger and no guard: the transition has no label, and keeps the ink.
        expect(edge(byClass(views, 'Transition')).edge.labels).toBeUndefined();
        expect(edge(byClass(views, 'Transition')).edge.line).toEqual(INK_LINE);
    });

    it('with a Trigger bound an activity binding keeps its names and draws the state machine\'s terminal box', () => {
        const roles = boundRoles(FLOWB, 'flowchart');
        // Any reference of the flow class stands in for the trigger: the rule reads the role, not the profile.
        const bag = { ...roles.bag, simTrigger: FLOWB.classId('ControlFlow') + '.source' };
        const views = deriveViewpointIRs(FLOWB.lookup, FLOWB.id, { bag, shape: 'controlFlow' });
        expect(vertex(byClass(views, 'InitialNode')).shape.labels).toHaveLength(1);
        expect(vertex(byClass(views, 'FinalNode')).shape).toMatchObject({ form: 'rounded', border: { style: 'double' } });
        expect(edge(byClass(views, 'ControlFlow')).edge.labels).toEqual({ center: { from: 'path', expr: '$source.value' } });
        // The fork and join are bars whatever the binding.
        expect(vertex(byClass(views, 'Fork')).shape.form).toBe('bar');
    });

    it('an Activity final is the nameless bull\'s-eye in the ink, in an activity and in a state machine', () => {
        const roles = boundRoles(FLOWB, 'flowchart');
        const bag: Record<string, unknown> = { ...roles.bag, simActivityFinal: FLOWB.classId('FinalNode') };
        delete bag.simTerminal;
        for (const b of [bag, { ...bag, simTrigger: FLOWB.classId('ControlFlow') + '.source' }]) {
            const fin = byClass(deriveViewpointIRs(FLOWB.lookup, FLOWB.id, { bag: b, shape: 'controlFlow' }), 'FinalNode');
            expect(fin.rule).toBe('role:activityFinal');
            expect(vertex(fin).shape).toEqual({ form: 'circle', fill: SURFACE, border: { color: NAME_INK, width: 1, style: 'solid' }, marker: 'dot', labels: [] });
        }
    });

    it('a bound role on a class that does not hold it labels nothing', () => {
        const roles = boundRoles(FLOWB, 'flowchart');
        const bag = { ...roles.bag, simGuard: ESM.classId('Transition') + '.guard' };
        const views = deriveViewpointIRs(FLOWB.lookup, FLOWB.id, { bag, shape: 'controlFlow' });
        expect(edge(byClass(views, 'ControlFlow')).edge.labels).toBeUndefined();
    });

    it('the compiled views: the bull\'s-eye takes the ink the marker is drawn in, the guard reads as its raw text', () => {
        clearCompileCache();
        const lookup: Lookup = { ...FLOWB.lookup };
        const object = (id: string, c: string, slots: Record<string, unknown[]>) => {
            lookup[id] = { id, name: id, className: 'DObject', instanceof: FLOWB.classId(c), features: Object.keys(slots).map(f => `${id}.${f}`) };
            for (const [f, values] of Object.entries(slots)) {
                lookup[`${id}.${f}`] = { id: `${id}.${f}`, className: 'DValue', instanceof: `${FLOWB.classId('ControlFlow')}.${f}`, values };
            }
        };
        object('a1', 'Activity', {});
        object('f1', 'FinalNode', {});
        object('c1', 'ControlFlow', { source: ['a1'], target: ['f1'], guard: ['x > 0'], effect: [] });
        const ctx = makeDrawReadCtx(lookup);
        const views = deriveViewpointIRs(FLOWB.lookup, FLOWB.id, boundRoles(FLOWB, 'flowchart'));
        const fin = compileView('derived:FinalNode', vertex(byClass(views, 'FinalNode')));
        // IRNodeContent draws the marker in the border colour (markerColor = borderColorV).
        expect(fin.borderColor!(ctx, 'f1')).toBe(NAME_INK);
        expect(fin.labels).toEqual([]);
        const cf = compileEdgeView('derived:ControlFlow', edge(byClass(views, 'ControlFlow')));
        expect(String(cf.labelText!(ctx, 'c1'))).toBe('x > 0');
        expect(cf.lineColor!(ctx, 'c1')).toBe(NAME_INK);
    });
});

// ---------------------------------------------------------------------------
// The generic structural notation, variant C (P-2026-09-29-2350, R-VP-19)
// ---------------------------------------------------------------------------

const EBOOLEAN = 'Pointer_EBOOLEAN';
const EDATE = 'Pointer_EDATE';
const QUIET = 'var(--color-inode-quiet)';

/** ERDLanguage.jjodel, metamodel ERD: `ownedAttributes` is a plain reference, so its Attribute stays a node. */
const ERDL = metamodel('ERDL', 'ERD', [
    cls('NamedElement', { abstract: true, attrs: [attr('name', ESTRING)] }),
    cls('Entity', { supers: ['NamedElement'], refs: [ref('ownedAttributes', 'Attribute', { upper: -1 })] }),
    cls('Attribute', { supers: ['NamedElement'], attrs: [attr('type', 'ERDL.Type'), attr('isKey', EBOOLEAN)] }),
    cls('Relationship', { supers: ['NamedElement'], attrs: [attr('cardinality', 'ERDL.Cardinality')], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
]);
/** ERDLanguage.jjodel, metamodel Relational. */
const RELATIONAL = metamodel('REL', 'Relational', [
    cls('Table', { attrs: [attr('name', ESTRING)], refs: [ref('columns', 'Column', { composition: true, upper: -1 })] }),
    cls('Column', { attrs: [attr('name', ESTRING), attr('type', 'REL.SqlType'), attr('isPrimaryKey', EBOOLEAN)] }),
    cls('ForeignKey', { attrs: [attr('name', ESTRING)], refs: [ref('source', 'Table'), ref('target', 'Table')] }),
]);
/** ERDLanguage.jjodel, metamodel Library (no M1 object). */
const LIBRARY = metamodel('LIB', 'Library', [
    cls('Catalogue', { refs: [ref('books', 'Book', { composition: true, upper: -1 }), ref('members', 'Member', { composition: true, upper: -1 })] }),
    cls('Book', { attrs: [attr('title', ESTRING), attr('isbn', ESTRING), attr('year', EINT)] }),
    cls('Member', { attrs: [attr('name', ESTRING), attr('memberId', ESTRING)] }),
    cls('Loan', { attrs: [attr('dueDate', EDATE)] }),
]);
/** MDE _ ERD.jjodel: the `ERD` fixture above (MDE _ ERD (1)) with namedElement abstract. */
const MDE_ERD = metamodel('MERD', 'ERD MM', [
    cls('Entity', { supers: ['namedElement'], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
    cls('Attribute', { supers: ['namedElement'], attrs: [attr('type', 'MERD.EnumType')] }),
    cls('namedElement', { abstract: true, attrs: [attr('name', ESTRING)] }),
    cls('Relation', { supers: ['namedElement'], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
]);

/** The nine metamodels of the seven exports the discovery measured (report §4). */
const CORPUS: [string, Fixture][] = [
    ['DemoPEST', PEST], ['DemoPetri', PETRI], ['DemoESM', ESM], ['DemoFlowB', FLOWB],
    ['ERDLanguage ERD', ERDL], ['ERDLanguage Relational', RELATIONAL], ['ERDLanguage Library', LIBRARY],
    ['MDE ERD (1)', ERD], ['MDE ERD', MDE_ERD],
];
/** The M1 objects per class of each export, as the discovery's probe counted them. */
const M1_OBJECTS: Record<string, Record<string, number>> = {
    DemoPEST: { Initial: 1, State: 1, Terminal: 1, Event: 3, Transition: 5 },
    DemoPetri: { Place: 4, Transition: 3, Arc: 5, InhibitorArc: 1 },
    DemoESM: { Initial: 1, State: 1, Terminal: 1, Event: 3, Transition: 4 },
    DemoFlowB: { InitialNode: 1, Activity: 3, Decision: 1, Fork: 1, Join: 1, FinalNode: 1, ControlFlow: 9 },
    'ERDLanguage ERD': { Entity: 3, Attribute: 7, Relationship: 2 },
    'ERDLanguage Relational': { Table: 24, ForeignKey: 12 },
    'ERDLanguage Library': {},
    'MDE ERD (1)': { Entity: 3, Attribute: 7, Relation: 2 },
    'MDE ERD': { Entity: 2, Attribute: 6, Relation: 1 },
};

/** The attributes of a class, its own and inherited, read from the fixture's lookup. */
function attributesOfClass(mm: Fixture, classId: string, seen: string[] = []): { name: string; type: string }[] {
    if (seen.includes(classId)) return [];
    const c = mm.lookup[classId];
    const own = (c?.attributes ?? []).map((id: string) => ({ name: mm.lookup[id].name, type: mm.lookup[id].type }));
    return [...own, ...(c?.extends ?? []).flatMap((s: string) => attributesOfClass(mm, s, [...seen, classId]))];
}

/** The report's §4 measures, taken on the derived documents, M1 weighted by the objects per class. */
function corpusCounts() {
    const t = {
        views: 0, vertex: 0, edge: 0, row: 0, eyebrows: 0, marks: 0, labelled: 0,
        eyebrowsM1: 0, edgesM1: 0, childRowsM1: 0, slotRowsM1: 0, identityRowsM1: 0,
    };
    for (const [name, mm] of CORPUS) {
        for (const v of deriveGenericViewpointIRs(mm.lookup, mm.id)) {
            const objects = M1_OBJECTS[name][v.className] ?? 0;
            t.views++;
            if (v.ir.kind === 'edge') {
                t.edge++;
                t.edgesM1 += objects;
                if (edge(v).edge.labels) t.labelled++;
            } else if (v.ir.kind === 'row') {
                t.row++;
                t.childRowsM1 += objects;
            } else {
                t.vertex++;
                const shape = vertex(v).shape;
                const top = shape.labels?.[0];
                if (top?.source.from === 'literal' && top.source.text === v.className) {
                    t.eyebrows++;
                    t.eyebrowsM1 += objects;
                }
                if (shape.border?.color === NAME_INK) t.marks++;
                const slots = vertex(v).fieldCompartments?.find(fc => fc.source.from === 'attributes');
                if (slots) {
                    const excluded = (slots.source as { exclude?: string[] }).exclude ?? [];
                    for (const a of attributesOfClass(mm, v.classId)) {
                        if (excluded.includes(a.name)) continue;
                        if (a.name === 'name' && a.type === ESTRING) t.identityRowsM1 += objects;
                        else t.slotRowsM1 += objects;
                    }
                }
            }
        }
    }
    return t;
}

const row = (v: AnyDerivedView) => v.ir as RowViewIR;
const eyebrow = (text: string) => ({
    position: 'top', source: { from: 'literal', text },
    style: { fontSize: 10, fontWeight: 'semibold', color: QUIET, letterSpacing: 0.08, textTransform: 'uppercase' },
});
/** The halo label of every labelled C edge (R-VP-20 (5)): 12 px, 500, the quiet ink. */
const EDGE_LABEL_STYLE = { fontSize: 12, fontWeight: 'medium', color: QUIET };
/** A slot as `name = value` in a label template (R-VP-20 (4)). */
const slotRow = (name: string, lead = '') => [{ from: 'literal', text: `${lead}${name} = ` }, { from: 'path', expr: `$${name}.value` }];
const NAME_LABEL = { position: 'top', source: NAME, style: { fontSize: 14, fontWeight: 'semibold', color: NAME_INK } };
const MONO = { fontFamily: 'mono', fontSize: 11 };
const PLAIN_BORDER = { color: BORDER, width: 1, style: 'solid' };
const INITIAL_BORDER = { color: NAME_INK, width: 2, style: 'solid' };
const FINAL_BORDER = { color: NAME_INK, width: 3, style: 'double' };
// R-VP-25 (P-2026-09-30-1521): the generic edges end in the open arrowhead.
const C_ARROW = { sourceEnd: 'none', targetEnd: 'openArrow' };
const genericOf = (mm: Fixture) => deriveGenericViewpointIRs(mm.lookup, mm.id);
const kindsOf = (views: AnyDerivedView[], kind: string) => views.filter(v => v.ir.kind === kind).map(v => v.className).sort();

/** A Column held by a Table and also the type of a plain reference: it stays a node (rule 3's guard). */
const KEYED = metamodel('KEY', 'Keyed', [
    cls('Table', { refs: [ref('columns', 'Column', { composition: true, upper: -1 })] }),
    cls('Column', { attrs: [attr('name', ESTRING)] }),
    cls('Index', { refs: [ref('column', 'Column')] }),
]);
/** Three levels: a Table is a row of its Schema, so a Column, held by a row and not by a node, stays a node. */
const NESTED = metamodel('NST', 'Nested', [
    cls('Schema', { refs: [ref('tables', 'Table', { composition: true, upper: -1 })] }),
    cls('Table', { refs: [ref('columns', 'Column', { composition: true, upper: -1 })] }),
    cls('Column'),
]);
/**
 * A state hierarchy: a State holds Vertices and is one, so the composition runs into the holder's
 * own hierarchy and its Pseudostates are nodes inside it, not rows.
 */
const TREE = metamodel('TRE', 'Tree', [
    cls('Vertex', { abstract: true }),
    cls('State', { supers: ['Vertex'], refs: [ref('subvertices', 'Vertex', { composition: true, upper: -1 })] }),
    cls('Pseudostate', { supers: ['Vertex'] }),
    cls('FinalState', { supers: ['State'] }),
]);
/** A SubPackage is a Package and an Element: a class that is a kind of its holder stays a node. */
const PACKAGES = metamodel('PKG', 'Packages', [
    cls('Element'),
    cls('Package', { refs: [ref('elements', 'Element', { composition: true, upper: -1 })] }),
    cls('SubPackage', { supers: ['Package', 'Element'] }),
    cls('Leaf', { supers: ['Element'] }),
]);
/**
 * A Node holds its Actions (rows) and its outgoing Flows (edges, from the container); a Flow
 * holds Notes, which an edge cannot show as rows, so they stay nodes.
 */
const EDGE_HOLDER = metamodel('EH', 'EdgeHolder', [
    cls('Node', { refs: [ref('actions', 'Action', { composition: true, upper: -1 }), ref('out', 'Flow', { composition: true, upper: -1 })] }),
    cls('Flow', { refs: [ref('target', 'Node'), ref('notes', 'Note', { composition: true, upper: -1 })] }),
    cls('Action', { attrs: [attr('name', ESTRING)] }),
    cls('Note'),
]);
/** Subclass marks read the words of the name, and only on a subclass (rule 5). */
const NAMES = metamodel('NAM', 'Names', [
    cls('Node', { abstract: true }),
    cls('InitialNode', { supers: ['Node'] }),
    cls('StartEvent', { supers: ['Node'] }),
    cls('EndEvent', { supers: ['Node'] }),
    cls('AcceptState', { supers: ['Node'] }),
    cls('final_state', { supers: ['Node'] }),
    cls('Legend', { supers: ['Node'] }),
    cls('Calendar', { supers: ['Node'] }),
    cls('Restart', { supers: ['Node'] }),
    cls('Endpoint', { supers: ['Node'] }),
    cls('Initializer', { supers: ['Node'] }),
    cls('Start'),
    cls('Terminal'),
]);
/** A sub-edge with nothing of its own to print is labelled by its stereotype alone. */
const LINKS = metamodel('LNK', 'Links', [
    cls('Node'),
    cls('Link', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
    cls('Dependency', { supers: ['Link'] }),
    cls('Usage', { supers: ['Link'], attrs: [attr('kind', ESTRING)] }),
    cls('Trace', { supers: ['Link'], refs: [ref('owner', 'Owner')] }),
    cls('Owner'),
]);

const ALL_FIXTURES: [string, Fixture][] = [
    ...CORPUS,
    ['Families', FAMILIES], ['Persons', PERSONS], ['Composite', COMPOSITE], ['Cars', CARS], ['Graph', GRAPH],
    ['Keyed', KEYED], ['Nested', NESTED], ['Tree', TREE], ['Packages', PACKAGES], ['EdgeHolder', EDGE_HOLDER],
    ['Names', NAMES], ['Links', LINKS],
];

describe('deriveGenericViewpointIRs — the report\'s §4 counts on the corpus', () => {
    it('39 views, 25 vertex, 9 edge, 5 row; 25 eyebrows, 6 marks, 9 labelled edges (5 as in C1, 4 by a template)', () => {
        expect(corpusCounts()).toMatchObject({ views: 39, vertex: 25, edge: 9, row: 5, eyebrows: 25, marks: 6, labelled: 9 });
    });

    it('M1: 66 eyebrows, 41 edges, 13 contained objects as rows, 24 slot rows, no name row (the exclude of C2)', () => {
        // C1 drew 7 name rows: the 7 ERDLanguage Attributes repeated their name. The exclude keeps it out.
        expect(corpusCounts()).toMatchObject({ eyebrowsM1: 66, edgesM1: 41, childRowsM1: 13, slotRowsM1: 24, identityRowsM1: 0 });
    });

    it('per metamodel: vertex, edge and row views', () => {
        const KINDS: Record<string, [string[], string[], string[]]> = {
            DemoPEST: [['Event', 'Initial', 'State', 'Terminal'], ['Transition'], []],
            DemoPetri: [['Place', 'Transition'], ['Arc', 'InhibitorArc'], []],
            DemoESM: [['Event', 'Initial', 'State', 'Terminal'], ['Transition'], []],
            DemoFlowB: [['Activity', 'ActivityNode', 'Decision', 'FinalNode', 'Fork', 'InitialNode', 'Join'], ['ControlFlow'], []],
            'ERDLanguage ERD': [['Attribute', 'Entity'], ['Relationship'], []],
            'ERDLanguage Relational': [['Table'], ['ForeignKey'], ['Column']],
            'ERDLanguage Library': [['Catalogue', 'Loan'], [], ['Book', 'Member']],
            'MDE ERD (1)': [['Entity', 'namedElement'], ['Relation'], ['Attribute']],
            'MDE ERD': [['Entity'], ['Relation'], ['Attribute']],
        };
        for (const [name, mm] of CORPUS) {
            const views = genericOf(mm);
            expect([kindsOf(views, 'vertex'), kindsOf(views, 'edge'), kindsOf(views, 'row')], name).toEqual(KINDS[name]);
        }
    });

    it('the six marks: the Initial and Terminal of both state machines, the InitialNode and FinalNode of the flow', () => {
        const marks: string[] = [];
        for (const [name, mm] of CORPUS) {
            for (const v of genericOf(mm)) {
                if (v.ir.kind !== 'vertex') continue;
                const b = vertex(v).shape.border;
                if (b?.color === NAME_INK) marks.push(`${name}.${v.className}:${b.style}`);
            }
        }
        expect(marks).toEqual([
            'DemoPEST.Initial:solid', 'DemoPEST.Terminal:double', 'DemoESM.Initial:solid', 'DemoESM.Terminal:double',
            'DemoFlowB.InitialNode:solid', 'DemoFlowB.FinalNode:double',
        ]);
    });

    it('every document of every fixture passes the IR validator', () => {
        for (const [name, mm] of ALL_FIXTURES) {
            const views = genericOf(mm);
            expect(views.length, name).toBeGreaterThan(0);
            for (const v of views) expect(validateIR(`generic:${name}:${v.className}`, v.ir), `${name} ${v.className}`).toEqual({ ok: true });
        }
    });
});

describe('deriveGenericViewpointIRs — whole documents', () => {
    it('DemoPEST State: the white box, the eyebrow over the name, no compartment', () => {
        const v = byClass(genericOf(PEST), 'State');
        expect(v.rule).toBe('generic:node');
        expect(v.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'], authoringMetaclassPins: { State: 'PEST.State' },
            exclusive: true, label: 'View for State',
            shape: { form: 'rounded', fill: SURFACE, border: PLAIN_BORDER, labels: [eyebrow('State'), NAME_LABEL] },
        });
    });

    it('DemoPEST Initial and Terminal: the same box with the 2 px ink border and the double border', () => {
        const views = genericOf(PEST);
        expect(byClass(views, 'Initial').rule).toBe('generic:initial');
        expect(vertex(byClass(views, 'Initial')).shape).toEqual({ form: 'rounded', fill: SURFACE, border: INITIAL_BORDER, labels: [eyebrow('Initial'), NAME_LABEL] });
        expect(byClass(views, 'Terminal').rule).toBe('generic:final');
        expect(vertex(byClass(views, 'Terminal')).shape).toEqual({ form: 'rounded', fill: SURFACE, border: FINAL_BORDER, labels: [eyebrow('Terminal'), NAME_LABEL] });
    });

    it('DemoPEST Transition: from the container to nextState, the open arrowhead (R-VP-25), the ink line, the event', () => {
        const v = byClass(genericOf(PEST), 'Transition');
        expect(v.rule).toBe('structure:contained-ref');
        expect(v.ir).toEqual({
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'], authoringMetaclassPins: { Transition: 'PEST.Transition' },
            exclusive: true, label: 'View for Transition',
            edge: {
                source: 'container', target: '$nextState.value', terminations: C_ARROW,
                labels: { center: { from: 'path', expr: '$event.value' }, style: EDGE_LABEL_STYLE }, line: INK_LINE,
            },
        });
    });

    it('DemoPetri Place: the slot rows in mono 11 px in the quiet ink', () => {
        const v = vertex(byClass(genericOf(PETRI), 'Place'));
        expect(v.shape.labels).toEqual([eyebrow('Place'), NAME_LABEL]);
        expect(v.fieldCompartments).toEqual([{
            id: 'attributes', source: { from: 'attributes' },
            rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }], style: { ...MONO, color: QUIET } },
            separator: true,
        }]);
    });

    it('MDE ERD Entity: its Attributes as rows, filtered to the row class; no slot rows for the name alone', () => {
        const v = vertex(byClass(genericOf(ERD), 'Entity'));
        expect(v.shape.labels).toEqual([eyebrow('Entity'), NAME_LABEL]);
        expect(v.fieldCompartments).toEqual([{
            id: 'children', source: { from: 'children', filter: { op: 'isKind', class: 'Attribute' } },
            rowFormat: { segments: [{ kind: 'name' }], style: MONO }, separator: true,
        }]);
    });

    it('MDE ERD Attribute: a row `name : type`', () => {
        const v = byClass(genericOf(ERD), 'Attribute');
        expect(v.rule).toBe('generic:row');
        expect(v.ir).toEqual({
            irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Attribute'], authoringMetaclassPins: { Attribute: 'ERD.Attribute' },
            label: 'View for Attribute',
            template: [NAME, { from: 'literal', text: ' : ' }, { from: 'path', expr: '$type.value' }],
        });
    });

    it('ERDLanguage Attribute: a node, its slot rows with the name slot excluded (R-VP-20 (2))', () => {
        const v = vertex(byClass(genericOf(ERDL), 'Attribute'));
        expect(v.fieldCompartments).toEqual([{
            id: 'attributes', source: { from: 'attributes', exclude: ['name'] },
            rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }], style: { ...MONO, color: QUIET } },
            separator: true,
        }]);
    });

    it('a class with no identity slot excludes nothing: the source is bare (DemoPetri Place, Library Loan)', () => {
        expect(vertex(byClass(genericOf(PETRI), 'Place')).fieldCompartments?.[0].source).toEqual({ from: 'attributes' });
        expect(vertex(byClass(genericOf(LIBRARY), 'Loan')).fieldCompartments?.[0].source).toEqual({ from: 'attributes' });
    });

    it('Library: the Catalogue lists Books and Members; a row with no type feature is the name alone', () => {
        const views = genericOf(LIBRARY);
        expect(vertex(byClass(views, 'Catalogue')).fieldCompartments).toEqual([{
            id: 'children',
            source: { from: 'children', filter: { op: 'or', args: [{ op: 'isKind', class: 'Book' }, { op: 'isKind', class: 'Member' }] } },
            rowFormat: { segments: [{ kind: 'name' }], style: MONO }, separator: true,
        }]);
        for (const n of ['Book', 'Member']) expect(row(byClass(views, n)).template, n).toEqual([NAME]);
        // Loan is held by nothing: a node, with its one slot row.
        expect(vertex(byClass(views, 'Loan')).fieldCompartments?.map(fc => fc.id)).toEqual(['attributes']);
    });
});

describe('deriveGenericViewpointIRs — rule 2, edges: today\'s recognition, a label only where one source says it', () => {
    it('the edge classes and their endpoints are today\'s, on every fixture', () => {
        for (const [name, mm] of ALL_FIXTURES) {
            const ends = (views: AnyDerivedView[]) => views.filter(v => v.ir.kind === 'edge')
                .map(v => `${v.className}:${edge(v).edge.source}->${edge(v).edge.target}:${v.rule}`).sort();
            expect(ends(genericOf(mm)), name).toEqual(ends(deriveViewpointIRs(mm.lookup, mm.id, null)));
        }
    });

    it('every edge: the ink line at 1 px, the open arrowhead (R-VP-25), no routing', () => {
        for (const [name, mm] of ALL_FIXTURES) {
            for (const v of genericOf(mm)) {
                if (v.ir.kind !== 'edge') continue;
                expect(edge(v).edge.line, `${name} ${v.className}`).toEqual(INK_LINE);
                expect(edge(v).edge.terminations, `${name} ${v.className}`).toEqual(C_ARROW);
                expect(Object.keys(edge(v).edge), `${name} ${v.className}`).not.toContain('routing');
            }
        }
    });

    it('the labels on the corpus: the event, the name as in C1; a template where C1 had none (weight, guard, cardinality); every one with the halo style', () => {
        const labels: Record<string, unknown> = {};
        for (const [name, mm] of CORPUS) {
            for (const v of genericOf(mm)) if (v.ir.kind === 'edge') labels[`${name}.${v.className}`] = edge(v).edge.labels ?? null;
        }
        const S = EDGE_LABEL_STYLE;
        expect(labels).toEqual({
            'DemoPEST.Transition': { center: { from: 'path', expr: '$event.value' }, style: S },
            'DemoPetri.Arc': { template: slotRow('weight'), style: S },
            'DemoPetri.InhibitorArc': { template: [{ from: 'literal', text: '«InhibitorArc»' }, ...slotRow('weight', ' ')], style: S },
            'DemoESM.Transition': { center: { from: 'path', expr: '$event.value' }, style: S },
            'DemoFlowB.ControlFlow': { template: slotRow('guard'), style: S },
            'ERDLanguage ERD.Relationship': { template: slotRow('cardinality'), style: S },
            'ERDLanguage Relational.ForeignKey': { center: NAME, style: S },
            'MDE ERD (1).Relation': { center: NAME, style: S },
            'MDE ERD.Relation': { center: NAME, style: S },
        });
    });

    it('the four templates are the edges C1 left unlabelled: the centre sources of C1 are unchanged', () => {
        const templated: string[] = [];
        for (const [name, mm] of CORPUS) {
            for (const v of genericOf(mm)) if (v.ir.kind === 'edge' && edge(v).edge.labels?.template) templated.push(`${name}.${v.className}`);
        }
        expect(templated).toEqual(['DemoPetri.InhibitorArc', 'DemoPetri.Arc', 'DemoFlowB.ControlFlow', 'ERDLanguage ERD.Relationship']);
        for (const [name, mm] of CORPUS) {
            for (const v of genericOf(mm)) {
                const l = v.ir.kind === 'edge' ? edge(v).edge.labels : undefined;
                if (l) expect(!!l.center !== !!l.template, `${name}.${v.className}: one text source or one template`).toBe(true);
            }
        }
    });

    it('a sub-edge: its stereotype alone when it adds nothing, the stereotype before its slot or reference otherwise', () => {
        const views = genericOf(LINKS);
        const S = EDGE_LABEL_STYLE;
        expect(edge(byClass(views, 'Dependency')).edge.labels).toEqual({ center: { from: 'literal', text: '«Dependency»' }, style: S });
        expect(edge(byClass(views, 'Usage')).edge.labels).toEqual({ template: [{ from: 'literal', text: '«Usage»' }, ...slotRow('kind', ' ')], style: S });
        expect(edge(byClass(views, 'Trace')).edge.labels).toEqual({ template: [{ from: 'literal', text: '«Trace»' }, { from: 'literal', text: ' ' }, { from: 'path', expr: '$owner.value' }], style: S });
        // The base edge has nothing to print, and no name: unlabelled, no style either.
        expect(edge(byClass(views, 'Link')).edge.labels).toBeUndefined();
    });

    it('a reference wins over a slot, as in C1: the centre of a base edge, the tail of a sub-edge\'s template', () => {
        const both = metamodel('BTH', 'Both', [
            cls('Node'), cls('Owner'),
            cls('Link', { attrs: [attr('note', ESTRING)], refs: [ref('source', 'Node'), ref('target', 'Node'), ref('owner', 'Owner')] }),
            cls('Traced', { supers: ['Link'] }),
        ]);
        const views = genericOf(both);
        expect(edge(byClass(views, 'Link')).edge.labels).toEqual({ center: { from: 'path', expr: '$owner.value' }, style: EDGE_LABEL_STYLE });
        expect(edge(byClass(views, 'Traced')).edge.labels).toEqual({
            template: [{ from: 'literal', text: '«Traced»' }, { from: 'literal', text: ' ' }, { from: 'path', expr: '$owner.value' }], style: EDGE_LABEL_STYLE,
        });
    });

    it('executed: the templates print `weight = 2`, `«InhibitorArc» weight = 3`, `guard = …`; unset, no label, and the stereotype alone', () => {
        clearCompileCache();
        const lookup: Lookup = { ...PETRI.lookup, ...FLOWB.lookup };
        const obj = (id: string, cls: string, mm: Fixture, slots: Record<string, unknown[]>) => {
            lookup[id] = { id, name: id, className: 'DObject', instanceof: mm.classId(cls), features: Object.keys(slots).map(f => `${id}.${f}`) };
            const owner = cls === 'InhibitorArc' ? 'Arc' : cls;
            for (const [f, values] of Object.entries(slots)) lookup[`${id}.${f}`] = { id: `${id}.${f}`, className: 'DValue', instanceof: `${mm.classId(owner)}.${f}`, values };
        };
        obj('a1', 'Arc', PETRI, { weight: [2] });
        obj('i1', 'InhibitorArc', PETRI, { weight: [3] });
        obj('f1', 'ControlFlow', FLOWB, { guard: ['model.[count] < 2'] });
        obj('f2', 'ControlFlow', FLOWB, { guard: [] });
        obj('a2', 'Arc', PETRI, { weight: [] });
        obj('i2', 'InhibitorArc', PETRI, { weight: [] });
        const ctx = makeDrawReadCtx(lookup);
        const text = (mm: Fixture, cls: string, id: string) => String(compileEdgeView(`c2:${cls}`, edge(byClass(genericOf(mm), cls))).labelText!(ctx, id));
        expect(text(PETRI, 'Arc', 'a1')).toBe('weight = 2');
        expect(text(PETRI, 'InhibitorArc', 'i1')).toBe('«InhibitorArc» weight = 3');
        expect(text(FLOWB, 'ControlFlow', 'f1')).toBe('guard = model.[count] < 2');
        expect(text(FLOWB, 'ControlFlow', 'f2')).toBe('');
        expect(text(PETRI, 'Arc', 'a2')).toBe('');
        expect(text(PETRI, 'InhibitorArc', 'i2')).toBe('«InhibitorArc»');
    });

    it('an edge with no name, no slot and no extra reference has no label (Graph)', () => {
        expect(edge(byClass(genericOf(GRAPH), 'Edge')).edge.labels).toBeUndefined();
    });
});

describe('deriveGenericViewpointIRs — rule 3, rows', () => {
    it('a class held by a composition but typing a plain reference stays a node (Keyed)', () => {
        const views = genericOf(KEYED);
        expect(kindsOf(views, 'row')).toEqual([]);
        expect(byClass(views, 'Column').ir.kind).toBe('vertex');
        expect(vertex(byClass(views, 'Table')).fieldCompartments).toBeUndefined();
    });

    it('a single-valued composition makes no row (Cars); a multi-valued one does, even beside single ones (Families)', () => {
        expect(kindsOf(genericOf(CARS), 'row')).toEqual([]);
        const fam = genericOf(FAMILIES);
        expect(kindsOf(fam, 'row')).toEqual(['Member']);
        expect(vertex(byClass(fam, 'Family')).fieldCompartments?.map(fc => fc.id)).toEqual(['attributes', 'children']);
    });

    it('a plain multi-valued reference makes no row (Graph, ERDLanguage ownedAttributes)', () => {
        expect(kindsOf(genericOf(GRAPH), 'row')).toEqual([]);
        expect(byClass(genericOf(ERDL), 'Attribute').ir.kind).toBe('vertex');
    });

    it('a composition into the holder\'s own hierarchy makes no row (Tree, Composite)', () => {
        for (const mm of [TREE, COMPOSITE]) {
            expect(kindsOf(genericOf(mm), 'row'), mm.id).toEqual([]);
            for (const v of genericOf(mm)) expect(vertex(v).fieldCompartments, `${mm.id} ${v.className}`).toBeUndefined();
        }
    });

    it('a class that is a kind of its holder stays a node (Packages)', () => {
        const views = genericOf(PACKAGES);
        expect(kindsOf(views, 'row')).toEqual(['Element', 'Leaf']);
        expect(byClass(views, 'SubPackage').ir.kind).toBe('vertex');
    });

    it('executed: a Package draws its Leaf as a row and leaves its SubPackage, an Element too, a node', () => {
        clearCompileCache();
        const lookup: Lookup = { ...PACKAGES.lookup };
        lookup.p1 = { id: 'p1', name: 'p1', className: 'DObject', instanceof: PACKAGES.classId('Package'), features: ['p1.elements'] };
        lookup['p1.elements'] = { id: 'p1.elements', className: 'DValue', instanceof: `${PACKAGES.classId('Package')}.elements`, values: ['leaf1', 'sub1', 'el1'] };
        lookup.leaf1 = { id: 'leaf1', name: 'leaf1', className: 'DObject', instanceof: PACKAGES.classId('Leaf'), features: [] };
        lookup.sub1 = { id: 'sub1', name: 'sub1', className: 'DObject', instanceof: PACKAGES.classId('SubPackage'), features: [] };
        lookup.el1 = { id: 'el1', name: 'el1', className: 'DObject', instanceof: PACKAGES.classId('Element'), features: [] };
        const ctx = makeDrawReadCtx(lookup);
        const cv = compileView('generic:Package', vertex(byClass(genericOf(PACKAGES), 'Package')));
        expect(rowRenderedChildren(cv, ctx, 'p1', lookup)).toEqual(['leaf1', 'el1']);
    });

    it('a class held only by a row, not by a node, stays a node (Nested)', () => {
        const views = genericOf(NESTED);
        expect(kindsOf(views, 'row')).toEqual(['Table']);
        expect(byClass(views, 'Column').ir.kind).toBe('vertex');
        expect(vertex(byClass(views, 'Schema')).fieldCompartments?.[0].source).toEqual({ from: 'children', filter: { op: 'isKind', class: 'Table' } });
    });

    it('a class held by an edge stays a node; the holder lists its rows and not its edges (EdgeHolder)', () => {
        const views = genericOf(EDGE_HOLDER);
        expect(kindsOf(views, 'edge')).toEqual(['Flow']);
        expect(kindsOf(views, 'row')).toEqual(['Action']);
        expect(byClass(views, 'Note').ir.kind).toBe('vertex');
        expect(vertex(byClass(views, 'Node')).fieldCompartments?.[0].source).toEqual({ from: 'children', filter: { op: 'isKind', class: 'Action' } });
    });

    it('executed: the Node draws its Action as a row and leaves its Flow to the edge', () => {
        clearCompileCache();
        const lookup: Lookup = { ...EDGE_HOLDER.lookup };
        const object = (id: string, c: string, slots: Record<string, [string, unknown[]]>) => {
            lookup[id] = { id, name: id, className: 'DObject', instanceof: EDGE_HOLDER.classId(c), features: Object.keys(slots).map(f => `${id}.${f}`) };
            for (const [f, [owner, values]] of Object.entries(slots)) {
                lookup[`${id}.${f}`] = { id: `${id}.${f}`, className: 'DValue', instanceof: `${EDGE_HOLDER.classId(owner)}.${f}`, values };
            }
        };
        object('n1', 'Node', { actions: ['Node', ['act1']], out: ['Node', ['f1']] });
        object('n2', 'Node', { actions: ['Node', []], out: ['Node', []] });
        object('act1', 'Action', { name: ['Action', ['open']] });
        object('f1', 'Flow', { target: ['Flow', ['n2']], notes: ['Flow', []] });
        const ctx = makeDrawReadCtx(lookup);
        const cv = compileView('generic:Node', vertex(byClass(genericOf(EDGE_HOLDER), 'Node')));
        expect(rowRenderedChildren(cv, ctx, 'n1', lookup)).toEqual(['act1']);
    });

    it('executed: an MDE ERD Entity draws its Attribute as `id : String`', () => {
        clearCompileCache();
        const lookup: Lookup = { ...ERD.lookup };
        lookup.e1 = { id: 'e1', name: 'Student', className: 'DObject', instanceof: ERD.classId('Entity'), features: ['e1.attributes'] };
        lookup['e1.attributes'] = { id: 'e1.attributes', className: 'DValue', instanceof: `${ERD.classId('Entity')}.attributes`, values: ['a1'] };
        lookup.a1 = { id: 'a1', name: 'id', className: 'DObject', instanceof: ERD.classId('Attribute'), features: ['a1.type'] };
        lookup['a1.type'] = { id: 'a1.type', className: 'DValue', instanceof: `${ERD.classId('Attribute')}.type`, values: ['String'] };
        const ctx = makeDrawReadCtx(lookup);
        const views = genericOf(ERD);
        expect(rowRenderedChildren(compileView('generic:Entity', vertex(byClass(views, 'Entity'))), ctx, 'e1', lookup)).toEqual(['a1']);
        const r = compileRowView('generic:Attribute', row(byClass(views, 'Attribute')));
        expect(r.template.map(t => String(t(ctx, 'a1'))).join('')).toBe('id : String');
    });
});

describe('deriveGenericViewpointIRs — rule 4, the eyebrow', () => {
    it('every vertex: the metaclass name as written, uppercased by textTransform, 0.08 em, 10 px, 600, the quiet ink, above the name', () => {
        for (const [name, mm] of ALL_FIXTURES) {
            for (const v of genericOf(mm)) {
                if (v.ir.kind !== 'vertex') continue;
                expect(vertex(v).shape.labels, `${name} ${v.className}`).toEqual([eyebrow(v.className), NAME_LABEL]);
            }
        }
        expect(vertex(byClass(genericOf(NAMES), 'final_state')).shape.labels?.[0].source).toEqual({ from: 'literal', text: 'final_state' });
    });

    it('compiled: two top labels, the eyebrow first, its text and size', () => {
        clearCompileCache();
        const lookup: Lookup = { ...PEST.lookup, s1: { id: 's1', name: 'locked', className: 'DObject', instanceof: PEST.classId('State'), features: [] } };
        const ctx = makeDrawReadCtx(lookup);
        const cv = compileView('generic:State', vertex(byClass(genericOf(PEST), 'State')));
        expect(cv.labels.map(l => l.position)).toEqual(['top', 'top']);
        expect(cv.labels.map(l => String(l.text(ctx, 's1')))).toEqual(['State', 'locked']);
        expect(cv.labels[0].style!.fontSize!(ctx, 's1')).toBe(10);
        expect(cv.labels[0].style!.letterSpacing!(ctx, 's1')).toBe(0.08);
        expect(cv.labels[0].style!.textTransform!(ctx, 's1')).toBe('uppercase');
        expect(cv.labels[1].style!.fontSize!(ctx, 's1')).toBe(14);
        expect(cv.labels[1].style!.textTransform).toBeUndefined();
    });
});

describe('deriveGenericViewpointIRs — rule 5, the subclass mark reads the words of the name', () => {
    it('initial or start: 2 px ink; final, terminal, end or accept: double; a word inside a word or a root class: none', () => {
        const borders: Record<string, unknown> = {};
        for (const v of genericOf(NAMES)) borders[v.className] = vertex(v).shape.border;
        expect(borders).toEqual({
            InitialNode: INITIAL_BORDER, StartEvent: INITIAL_BORDER,
            EndEvent: FINAL_BORDER, AcceptState: FINAL_BORDER, final_state: FINAL_BORDER,
            Legend: PLAIN_BORDER, Calendar: PLAIN_BORDER, Restart: PLAIN_BORDER, Endpoint: PLAIN_BORDER, Initializer: PLAIN_BORDER,
            Start: PLAIN_BORDER, Terminal: PLAIN_BORDER,
        });
    });
});

describe('deriveGenericViewpointIRs — rule 6, the look', () => {
    it('every vertex: a rounded white box, content-sized, radius from the form; every colour a token', () => {
        for (const [name, mm] of ALL_FIXTURES) {
            for (const v of genericOf(mm)) {
                for (const [p, value] of colours(v.ir)) expect(value, `${name} ${v.className} ${p}`).toMatch(/^var\(--[a-z0-9-]+\)$/);
                if (v.ir.kind !== 'vertex') continue;
                const ir = vertex(v);
                expect(ir.shape.form, `${name} ${v.className}`).toBe('rounded');
                expect(ir.shape.fill, `${name} ${v.className}`).toBe(SURFACE);
                expect(Object.keys(ir.shape).sort(), `${name} ${v.className}`).toEqual(['border', 'fill', 'form', 'labels']);
                expect(ir.defaultSize, `${name} ${v.className}`).toBeUndefined();
                expect(ir.priority, `${name} ${v.className}`).toBeUndefined();
            }
        }
    });
});

describe('deriveGenericViewpointIRs — pure', () => {
    it('reads a frozen lookup and leaves it identical', () => {
        const before = JSON.stringify(ERD.lookup);
        const frozen = deepFreeze(JSON.parse(before));
        const views = deriveGenericViewpointIRs(frozen, ERD.id);
        expect(JSON.stringify(frozen)).toBe(before);
        for (const v of views) expect(Object.isFrozen(v.ir)).toBe(false);
    });

    it('no object is shared between two documents', () => {
        for (const [, mm] of ALL_FIXTURES) {
            const owner = new Map<object, string>();
            const walk = (node: unknown, doc: string) => {
                if (!node || typeof node !== 'object') return;
                const seen = owner.get(node);
                expect(seen === undefined || seen === doc, `${doc} shares an object with ${seen}`).toBe(true);
                owner.set(node, doc);
                for (const v of Object.values(node as object)) walk(v, doc);
            };
            for (const v of genericOf(mm)) walk(v.ir, v.className);
        }
    });

    it('deterministic, deepest class first, and an unknown metamodel gives no view', () => {
        expect(genericOf(LIBRARY)).toEqual(genericOf(LIBRARY));
        expect(genericOf(PEST).map(v => v.className)).toEqual(['Initial', 'Terminal', 'State', 'Transition', 'Event']);
        expect(deriveGenericViewpointIRs(PEST.lookup, 'nope')).toEqual([]);
    });
});

describe('deriveViewpointForBinding — rule 1: the generic notation with no role bound, the role-keyed ones with a binding', () => {
    it('no binding: the generic documents', () => {
        for (const [name, mm] of CORPUS) expect(deriveViewpointForBinding(mm.lookup, mm.id, null), name).toEqual(genericOf(mm));
    });

    it('a binding: the role-keyed documents', () => {
        for (const [name, mm, profile] of DEMOS) {
            const roles = boundRoles(mm, profile);
            expect(deriveViewpointForBinding(mm.lookup, mm.id, roles), name).toEqual(deriveViewpointIRs(mm.lookup, mm.id, roles));
        }
    });

    it('the role-keyed documents are byte-equal to before the generic notation', () => {
        // Measured on the derivation of 58aa78ba9, before P-2026-09-29-2350 touched it.
        // R-VP-25 (P-2026-09-30-1521): DemoPetri moved with the open arrowhead of its Arc, to the digest predicted on
        // 2cde09984, before any A2 edit, as the tip's documents with every closedArrow an openArrow.
        const got: Record<string, string> = {};
        for (const [name, mm, profile] of DEMOS) got[name] = digest(deriveViewpointIRs(mm.lookup, mm.id, boundRoles(mm, profile)));
        expect(got).toEqual({
            DemoPEST: '99e03cfb52856542', DemoPetri: '997f12afe5b58db0', DemoESM: 'a9bd2541f1f94b09', DemoFlowB: '58aeb562c91a731f',
        });
    });
});

// ---------------------------------------------------------------------------
// The dialog's table as input (slice D, P-2026-09-30-0255)
// ---------------------------------------------------------------------------

/** The class keys of a bag as a metaclass → role table: the class each class role binds. */
function tableOf(roles: DerivationRoles): Record<string, string> {
    const out: Record<string, string> = {};
    for (const d of ROLE_CATALOG) {
        const v = roles.bag[d.key ?? ''];
        if (d.kind === 'class' && typeof v === 'string' && !(v in out)) out[v] = d.id;
    }
    return out;
}

describe('deriveViewpointIRs — classRoles, the dialog\'s metaclass → role table', () => {
    it('the table of the bag\'s own classes derives the bag\'s documents on every demo', () => {
        for (const [name, mm, profile] of DEMOS) {
            const roles = boundRoles(mm, profile);
            expect(deriveViewpointIRs(mm.lookup, mm.id, { ...roles, classRoles: tableOf(roles) }), name)
                .toEqual(deriveViewpointIRs(mm.lookup, mm.id, roles));
        }
    });

    it('the table is read, not the class keys of the bag: an empty table draws no role', () => {
        for (const [name, mm, profile] of DEMOS) {
            const roles = boundRoles(mm, profile);
            expect(deriveViewpointIRs(mm.lookup, mm.id, { ...roles, classRoles: {} }), name)
                .toEqual(deriveViewpointIRs(mm.lookup, mm.id, { bag: {}, shape: roles.shape }));
        }
    });

    it('a role on a second class draws that class with it too, which a bag cannot say', () => {
        const roles = boundRoles(PEST, 'stateMachine');
        const table = { ...tableOf(roles), [PEST.classId('Terminal')]: 'initial' };
        const views = deriveViewpointIRs(PEST.lookup, PEST.id, { ...roles, classRoles: table });
        expect(byClass(views, 'Terminal').rule).toBe('role:initial');
        expect(vertex(byClass(views, 'Terminal')).shape).toEqual(vertex(byClass(views, 'Initial')).shape);
    });
});

describe('rolesFromTable — a class\'s own entry, else its nearest superclass\'s', () => {
    it('own entry first, then the superclasses breadth first; a class with neither has none', () => {
        const got = rolesFromTable(FLOWB.lookup, FLOWB.id, { [FLOWB.classId('ActivityNode')]: 'node', [FLOWB.classId('InitialNode')]: 'initial' });
        const named = Object.fromEntries([...got].map(([id, r]) => [FLOWB.lookup[id].name, r]));
        expect(named).toEqual({ ActivityNode: 'node', InitialNode: 'initial', Activity: 'node', Decision: 'node', Fork: 'node', Join: 'node', FinalNode: 'node' });
    });

    it('the nearest superclass wins over a farther one', () => {
        const chain = metamodel('CH', 'Chain', [cls('A'), cls('B', { supers: ['A'] }), cls('C', { supers: ['B'] })]);
        const got = rolesFromTable(chain.lookup, chain.id, { 'CH.A': 'node', 'CH.B': 'terminal' });
        expect(got.get('CH.C')).toBe('terminal');
        expect(got.get('CH.A')).toBe('node');
    });

    it('breadth first: a nearer superclass on the second branch wins over a farther one on the first', () => {
        // D extends X and Y; X extends Z. Y is one step away, Z two.
        const mi = metamodel('MI', 'Multi', [cls('Z'), cls('X', { supers: ['Z'] }), cls('Y'), cls('D', { supers: ['X', 'Y'] })]);
        expect(rolesFromTable(mi.lookup, mi.id, { 'MI.Y': 'terminal', 'MI.Z': 'node' }).get('MI.D')).toBe('terminal');
    });

    it('ignores ids that are not classes of the metamodel, and survives an extends cycle', () => {
        const cyc = metamodel('CY', 'Cycle', [cls('A', { supers: ['B'] }), cls('B', { supers: ['A'] }), cls('C')]);
        const got = rolesFromTable(cyc.lookup, cyc.id, { 'CY.B': 'node', 'ELSEWHERE.X': 'initial' });
        expect([...got]).toEqual([['CY.A', 'node'], ['CY.B', 'node']]);
    });
});

// ---------------------------------------------------------------------------
// The metamodel test shared by createDerivedViewpoint and the tree's menu
// ---------------------------------------------------------------------------
//
// createDerivedViewpoint (utils/deriveViewpoint.ts) does not import in this bench (monaco
// dereferences `window` through the joiner barrel), so its guard is executed here, in the pure
// predicate it and the tree row both call. That they call it is read from the two files, not run.

describe('isDerivableMetamodel: the entity a derivation may start from', () => {
    it('is true on a metamodel', () => {
        expect(isDerivableMetamodel({ className: 'DModel', isMetamodel: true })).toBe(true);
        expect(isDerivableMetamodel(PEST.lookup[PEST.id])).toBe(true);
    });

    it('is false on a model: the isMetamodel flag is read', () => {
        expect(isDerivableMetamodel({ className: 'DModel', isMetamodel: false })).toBe(false);
        expect(isDerivableMetamodel({ className: 'DModel' })).toBe(false);
    });

    it('is false on an entity that is not a DModel: the className is read', () => {
        expect(isDerivableMetamodel({ className: 'DClass', isMetamodel: true })).toBe(false);
        expect(isDerivableMetamodel({ className: 'DPackage', isMetamodel: true })).toBe(false);
    });

    it('is false on a missing entity', () => {
        expect(isDerivableMetamodel(undefined)).toBe(false);
        expect(isDerivableMetamodel(null)).toBe(false);
    });
});
