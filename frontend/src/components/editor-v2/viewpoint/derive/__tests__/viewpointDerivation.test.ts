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
import { deriveViewpointIRs, isDerivableMetamodel } from '../viewpointDerivation';
import type { DerivationRoles, DerivedView } from '../viewpointDerivation';
import { validateIR } from '../../ir/irValidate';
import { recognizeSymbol } from '../../ir/symbolRecognition';
import { compileView, compileEdgeView, clearCompileCache } from '../../ir/irCompile';
import { makeDrawReadCtx } from '../../ir/irReadCtx';
import { BAR_SIZE, boxForContent, getShapeDescriptor, hasSizeSupplement } from '../../ir/shapeRegistry';
import type { EdgeViewIR, VertexViewIR } from '../../ir/irTypes';
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

const byClass = (views: DerivedView[], name: string): DerivedView => {
    const v = views.find(x => x.className === name);
    if (!v) throw new Error(`no view for ${name}: ${views.map(x => x.className).join(', ')}`);
    return v;
};
const vertex = (v: DerivedView) => v.ir as VertexViewIR;
const edge = (v: DerivedView) => v.ir as EdgeViewIR;
const edgeClasses = (views: DerivedView[]) => views.filter(v => v.ir.kind === 'edge').map(v => v.className).sort();

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

    it('every edge outside the Petri notation is directed and carries no line colour of its own', () => {
        // The Petri arcs with their roles bound are the notation's (P-2026-09-29-0939), pinned below.
        for (const [, mm, profile] of DEMOS) {
            if (profile === 'petri') continue;
            for (const v of deriveViewpointIRs(mm.lookup, mm.id, boundRoles(mm, profile))) {
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
            edge: { source: 'container', target: '$nextState.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' } },
        });
    });

    it('the solid symbols get the catalogue ink, keep their catalogue match, and name in the text-on-dark token', () => {
        const flow = deriveViewpointIRs(FLOWB.lookup, FLOWB.id, boundRoles(FLOWB, 'flowchart'));
        // The Petri transition is the bar of R-VP-16, pinned in the Petri notation block below.
        const solids: [DerivedView, string][] = [
            [byClass(flow, 'InitialNode'), 'uml-initial-state'],
            [byClass(flow, 'Fork'), 'uml-fork-join'],
            [byClass(flow, 'Join'), 'uml-fork-join'],
        ];
        for (const [v, preset] of solids) {
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
        // A hollow symbol keeps the default text colour: no style on its label.
        expect(vertex(byClass(flow, 'FinalNode')).shape.labels).toEqual([{ position: 'bottom', source: { from: 'intrinsic', prop: 'name' } }]);
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
const digest = (views: DerivedView[]) => createHash('sha256').update(JSON.stringify(views)).digest('hex').slice(0, 16);

describe('deriveViewpointIRs — outside the Petri profile the documents are byte-equal to before the notation', () => {
    // Measured on the derivation of e5010856c, before lane 1 of the Petri notation touched it.
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
        'DemoPEST, roles bound': '259677ee57d18668',
        'DemoESM, roles bound': 'a023d74e549f3482',
        'DemoFlowB, roles bound': '7ddbc5153f8c905a',
    };

    it('structure only on every metamodel, and the control-flow demos with their roles', () => {
        const got: Record<string, string> = {};
        for (const [name, mm] of [
            ['DemoPEST', PEST], ['DemoPetri', PETRI], ['DemoESM', ESM], ['DemoFlowB', FLOWB], ['ERD', ERD],
            ['Families', FAMILIES], ['Persons', PERSONS], ['Composite', COMPOSITE], ['Cars', CARS], ['Graph', GRAPH],
        ] as [string, Fixture][]) {
            got[`${name}, structure only`] = digest(deriveViewpointIRs(mm.lookup, mm.id, null));
        }
        for (const [name, mm, profile] of DEMOS) {
            if (profile === 'petri') continue;
            got[`${name}, roles bound`] = digest(deriveViewpointIRs(mm.lookup, mm.id, boundRoles(mm, profile)));
        }
        expect(got).toEqual(BEFORE);
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

    it('Arc: a 1 px ink line ending in the filled arrowhead, no routing (the orthogonal router)', () => {
        expect(edge(byClass(views(), 'Arc')).edge).toEqual({
            source: '$src.value', target: '$tgt.value',
            terminations: { sourceEnd: 'none', targetEnd: 'closedArrow' },
            line: { color: NAME_INK, width: 1 },
        });
    });

    it('InhibitorArc: the same line, no routing, the open arrowhead kept until the circle termination (lane 3)', () => {
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
