/**
 * Activity (UML), P-2026-09-30-1552 (R-VP-26, docs/discovery/discovery_2026-09-30_activity_uml_notation.md): the
 * notation beside Flowchart and Flowchart (ISO 5807), on the flowchart profile, its table with a notation-own
 * Decision role prefilled by the name signals, and its documents over the Flowchart's.
 *
 * The four demos are notations.test.ts's, their binding applied as the demo configures it (the Simulation roles
 * dialog's Apply). The documents are read as data and, for the edge labels, resolved on objects with the draw
 * backend, as A3's yes/no and A2's weight are.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
    DERIVED_NOTATIONS, DERIVED_ROLE_PREFIX, canDerive, defaultChoice, derivedDocuments, derivedViewpointState, dialogPrefill,
    initialNotation, notationRoles, roleLabel,
} from '../notations';
import type { ClassRoles, DeriveChoice, DerivedNotationId } from '../notations';
import { activitySignalRole } from '../viewpointDerivation';
import type { AnyDerivedView } from '../viewpointDerivation';
import { validateIR } from '../../ir/irValidate';
import { getIRIndex, resolveObjectAsEdgeView } from '../../ir/irResolveCore';
import { makeDrawReadCtx } from '../../ir/irReadCtx';
import { structuralHash } from '../../ir/irDefaults';
import { sketchOfMetamodel } from '../../../sim/metamodelSketch';
import { bindProfile } from '../../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures (the builder and the four demos of notations.test.ts)
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

/** The demo with the bag the Simulation roles dialog's Apply writes: `simProfile` and the binder's bound proposals. */
function configured(make: () => Fixture, profileId: string): Fixture {
    const mm = make();
    const bindings = bindProfile(systemProfile(profileId)!, sketchOfMetamodel(mm.lookup, mm.id));
    const bag: Record<string, unknown> = { simProfile: profileId };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    mm.lookup[mm.id]._state = bag;
    return mm;
}

const byName = (mm: Fixture, roles: ClassRoles) =>
    Object.fromEntries(Object.entries(roles).map(([id, r]) => [mm.lookup[id]?.name ?? id, r]).sort(([a], [b]) => a.localeCompare(b)));
const digest = (views: AnyDerivedView[]) => createHash('sha256').update(JSON.stringify(views)).digest('hex').slice(0, 16);
const bare = (ir: any) => { const { generated: _g, ...rest } = ir; return rest; };
const irOf = (views: AnyDerivedView[], name: string, n = 0) => views.filter(v => v.className === name)[n]?.ir as any;
/** The documents of `notation` with its own prefill. */
const derivedWith = (mm: Fixture, notation: DerivedNotationId) =>
    derivedDocuments(mm.lookup, mm.id, { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles });

const INK = 'var(--color-inode-name)';
const QUIET = 'var(--color-inode-quiet)';
const SURFACE = 'var(--color-inode-surface)';
const INK_BORDER = { color: INK, width: 1, style: 'solid' };
/** The guard of Activity (UML), P-2026-09-30-1935: mono 11.5 px, normal, slate-700. */
const GUARD_STYLE = { fontFamily: 'mono', fontSize: 11.5, fontWeight: 'normal', color: 'var(--color-text-secondary)' };

// ---------------------------------------------------------------------------
// The notation and its table
// ---------------------------------------------------------------------------

describe('Activity (UML) in the list', () => {
    it('after Flowchart (ISO 5807), on the flowchart profile, Node read as Action', () => {
        const ids = DERIVED_NOTATIONS.map(n => n.id);
        expect(ids.indexOf('activityUml')).toBe(ids.indexOf('flowchartIso') + 1);
        const n = DERIVED_NOTATIONS.find(x => x.id === 'activityUml')!;
        expect([n.label, n.profile, n.nodeLabel]).toEqual(['Activity (UML)', 'flowchart', 'Action']);
    });

    it('its table: the flowchart roles, then Decision / merge', () => {
        expect(notationRoles('activityUml')).toEqual([...notationRoles('flowchart'), 'decision']);
        expect(notationRoles('activityUml').map(r => roleLabel('activityUml', r))).toEqual([
            'Action', 'Initial', 'Terminal', 'Activity final', 'Transition', 'Fork', 'Join', 'Decision / merge',
        ]);
        // The other notations offer no decision.
        for (const n of DERIVED_NOTATIONS.filter(x => x.id !== 'activityUml')) expect(notationRoles(n.id), n.id).not.toContain('decision');
    });

    it('a table with no role derives nothing; a decision alone is a role', () => {
        expect(canDerive({ notation: 'activityUml', classRoles: {} })).toBe(false);
        expect(canDerive({ notation: 'activityUml', classRoles: { x: 'decision' } })).toBe(true);
    });
});

describe('the name signals (activitySignalRole)', () => {
    it('the words of the class name, as the prompt lists them, merge added to the diamond', () => {
        const got = Object.fromEntries([
            'Start', 'InitialStep', 'initial_node', 'End', 'FinalNode', 'final_state',
            'Decision', 'Choice', 'BranchPoint', 'MergeNode', 'Fork', 'ForkNode', 'Join', 'JoinBar',
            'Activity', 'Task', 'Legend', 'Endpoint', 'Restart', 'Joiner', 'Forking', 'Decisions',
        ].map(n => [n, activitySignalRole(n) ?? null]));
        expect(got).toEqual({
            Start: 'initial', InitialStep: 'initial', initial_node: 'initial', End: 'activityFinal', FinalNode: 'activityFinal', final_state: 'activityFinal',
            Decision: 'decision', Choice: 'decision', BranchPoint: 'decision', MergeNode: 'decision', Fork: 'fork', ForkNode: 'fork', Join: 'join', JoinBar: 'join',
            // Whole words only: no role for these.
            Activity: null, Task: null, Legend: null, Endpoint: null, Restart: null, Joiner: null, Forking: null, Decisions: null,
        });
    });
});

describe('dialogPrefill — the binder, then the name signals on the classes that take Node by inheritance', () => {
    it('DemoFlowB with its binding applied: the binder\'s table and Decision a decision', () => {
        const mm = configured(FLOWB, 'flowchart');
        const got = dialogPrefill(mm.lookup, mm.id, 'activityUml', []);
        expect(got.from).toBe('binding');
        expect(byName(mm, got.roles)).toEqual({
            ActivityNode: 'node', ControlFlow: 'transition', Decision: 'decision', FinalNode: 'terminal', Fork: 'fork', InitialNode: 'initial', Join: 'join',
        });
    });

    it('DemoFlowB with no stored binding: the same table, from the names and the structure', () => {
        const mm = FLOWB();
        const got = dialogPrefill(mm.lookup, mm.id, 'activityUml', []);
        expect(got.from).toBe('signals');
        expect(got.roles).toEqual(dialogPrefill(configured(FLOWB, 'flowchart').lookup, 'FLOWB', 'activityUml', []).roles);
    });

    it('the binder\'s own roles are kept; a signal fills only a class with no entry of its own, under the Node class', () => {
        const mm = metamodel('SG', 'Signals', [
            cls('Node'),
            cls('Start', { supers: ['Node'] }), cls('EndNode', { supers: ['Node'] }), cls('Branch', { supers: ['Node'] }),
            cls('Merge', { supers: ['Node'] }), cls('ForkBar', { supers: ['Node'] }), cls('JoinBar', { supers: ['Node'] }),
            cls('Task', { supers: ['Node'] }),
            // Not a kind of the Node class: no signal, whatever its name.
            cls('DecisionLog'),
            cls('Flow', { attrs: [attr('guard', EXPRESSION)], refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const flowchart = dialogPrefill(mm.lookup, mm.id, 'flowchart', []).roles;
        const activity = dialogPrefill(mm.lookup, mm.id, 'activityUml', []).roles;
        for (const [id, role] of Object.entries(flowchart)) expect(activity[id], mm.lookup[id].name).toBe(role);
        const added = byName(mm, Object.fromEntries(Object.entries(activity).filter(([id]) => !(id in flowchart))) as ClassRoles);
        expect(added).toEqual({ Branch: 'decision', Merge: 'decision', ...Object.fromEntries(Object.entries({
            Start: 'initial', EndNode: 'activityFinal', ForkBar: 'fork', JoinBar: 'join',
        }).filter(([name]) => !(mm.classId(name) in flowchart))) });
        expect(activity[mm.classId('Task')]).toBeUndefined();
        expect(activity[mm.classId('DecisionLog')]).toBeUndefined();
    });

    it('the Node class keeps its role, even when its name is a signal word', () => {
        // The binder takes the flows' target type as Node: here a class named like a join.
        const mm = metamodel('JP', 'JoinPoints', [
            cls('JoinPoint'), cls('Task', { supers: ['JoinPoint'] }), cls('Merge', { supers: ['JoinPoint'] }),
            cls('Flow', { attrs: [attr('guard', EXPRESSION)], refs: [ref('source', 'JoinPoint'), ref('target', 'JoinPoint')] }),
        ]);
        const roles = dialogPrefill(mm.lookup, mm.id, 'activityUml', []).roles;
        expect(byName(mm, roles)).toEqual({ Flow: 'transition', JoinPoint: 'node', Merge: 'decision' });
    });

    it('the latest derived viewpoint of Activity (UML) gives its table back, the decision included', () => {
        const mm = configured(FLOWB, 'flowchart');
        const choice = defaultChoice(mm.lookup, mm.id, []);
        const state = derivedViewpointState(mm.lookup, mm.id, choice);
        expect(state[`${DERIVED_ROLE_PREFIX}${mm.classId('Decision')}`]).toBe('decision');
        expect(state.derivedNotation).toBe('activityUml');
        expect(JSON.parse(state.derivedLayout)).toEqual(DERIVED_NOTATIONS.find(n => n.id === 'activityUml')!.layout);
        mm.lookup.vp1 = { className: 'DViewPoint', id: 'vp1', _state: state };
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('activityUml');
        expect(dialogPrefill(mm.lookup, mm.id, 'activityUml', ['vp1'])).toEqual({ roles: choice.classRoles, from: 'derived' });
    });

    it('another notation drops the decision: Flowchart\'s table from the same stored state has none', () => {
        const mm = configured(FLOWB, 'flowchart');
        const state = derivedViewpointState(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
        mm.lookup.vp1 = { className: 'DViewPoint', id: 'vp1', _state: { ...state, derivedNotation: 'flowchart' } };
        expect(Object.values(dialogPrefill(mm.lookup, mm.id, 'flowchart', ['vp1']).roles)).not.toContain('decision');
    });
});

describe('the preselection on the four demos (R-VP-26)', () => {
    it('DemoPEST Statechart (UML), DemoPetri Petri net (classic), DemoESM State machine, DemoFlowB Activity (UML)', () => {
        const got = Object.fromEntries(([
            ['DemoPEST', PEST, 'stateMachine'], ['DemoPetri', PETRI, 'petri'], ['DemoESM', ESM, 'extendedStateMachine'], ['DemoFlowB', FLOWB, 'flowchart'],
        ] as [string, () => Fixture, string][]).map(([name, make, stored]) => {
            const mm = configured(make, stored);
            return [name, defaultChoice(mm.lookup, mm.id, []).notation];
        }));
        expect(got).toEqual({ DemoPEST: 'statechart', DemoPetri: 'petriClassic', DemoESM: 'statechart', DemoFlowB: 'activityUml' });
    });

    it('the exported demos (empty bags) still open on Generic', () => {
        for (const make of [PEST, PETRI, ESM, FLOWB]) {
            const mm = make();
            mm.lookup[mm.id]._state = {};
            expect(initialNotation(mm.lookup, mm.id, []), mm.id).toBe('generic');
        }
    });
});

// ---------------------------------------------------------------------------
// The documents on DemoFlowB
// ---------------------------------------------------------------------------

describe('Activity (UML) — the documents on DemoFlowB', () => {
    const mm = configured(FLOWB, 'flowchart');
    const views = derivedDocuments(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
    const flowchart = derivedWith(mm, 'flowchart');

    it('the initial node: a filled circle in the ink, 20 px, no name', () => {
        const ir = irOf(views, 'InitialNode');
        expect(ir.shape).toEqual({ form: 'circle', fill: INK, border: INK_BORDER, labels: [] });
        expect(ir.defaultSize).toEqual({ width: 20, height: 20 });
    });

    it('an action (the Node role, Activity by inheritance): a rounded rectangle, radius 14, height 44, the name centred 13 px 500', () => {
        for (const name of ['Activity', 'ActivityNode']) {
            const ir = irOf(views, name);
            expect(ir.shape, name).toEqual({
                form: 'rounded', fill: SURFACE, border: INK_BORDER, cornerRadius: 14,
                labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' }, style: { fontSize: 13, fontWeight: 'medium', color: INK } }],
            });
            expect(ir.defaultSize, name).toEqual({ height: 44 });
            expect(ir.fieldCompartments, name).toBeUndefined();
        }
    });

    it('the decision: a hollow diamond 36x36, no name', () => {
        const ir = irOf(views, 'Decision');
        expect(ir.shape).toEqual({ form: 'diamond', fill: SURFACE, border: INK_BORDER, labels: [] });
        expect(ir.defaultSize).toEqual({ width: 36, height: 36 });
    });

    it('fork and join: a filled bar in the ink, 7 px thick in a 120 by 120 box, turned by its neighbours, no name', () => {
        // P-2026-10-01-2215 (Q7, amends R-VP-26 (2); thickness R-VP-36) laid the bar across the layout direction, 120 by 7;
        // Q3 (P-2026-10-03-1304) turns it by its neighbours in a square box, and Auto layout lays it across DOWN still.
        expect(DERIVED_NOTATIONS.find(n => n.id === 'activityUml')!.layout!.direction).toBe('DOWN');
        for (const name of ['Fork', 'Join']) {
            const ir = irOf(views, name);
            expect(ir.shape, name).toEqual({ form: 'bar', fill: INK, border: INK_BORDER, labels: [], barThickness: 7 });
            expect(ir.defaultSize, name).toEqual({ width: 120, height: 120 });
        }
    });

    it('the activity final: a bull\'s-eye, a white circle 24 px in the ink with the large dot (14 px), no name', () => {
        const ir = irOf(views, 'FinalNode');
        // P-2026-09-30-1720: dot-large, 14 px on the 24 px circle; the Flowchart's own bull's-eye keeps dot.
        expect(ir.shape).toEqual({ form: 'circle', fill: SURFACE, border: INK_BORDER, marker: 'dot-large', labels: [] });
        expect(ir.defaultSize).toEqual({ width: 24, height: 24 });
        expect(irOf(flowchart, 'FinalNode').shape.marker).toBe('dot');
    });

    it('a control flow: the Flowchart\'s endpoints and router, 1 px ink, the open arrowhead, no label; a guard in brackets', () => {
        const flows = views.filter(v => v.className === 'ControlFlow');
        expect(flows.map(v => v.ir.label)).toEqual(['View for ControlFlow', 'View for ControlFlow (guard)']);
        const base = { source: '$source.value', target: '$target.value', terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, line: { color: INK, width: 1 } };
        expect(irOf(views, 'ControlFlow', 0).edge).toEqual(base);
        expect(irOf(views, 'ControlFlow', 0).predicate).toBeUndefined();
        expect(irOf(views, 'ControlFlow', 0).priority).toBeUndefined();
        const guarded = irOf(views, 'ControlFlow', 1);
        // P-2026-09-30-1935: the guard in mono 11.5 px, normal, slate-700 (the white patch is the edge's, irActivityRender.test.ts).
        expect(guarded.edge).toEqual({
            ...base,
            labels: { template: [{ from: 'literal', text: '[' }, { from: 'path', expr: '$guard.value' }, { from: 'literal', text: ']' }], style: GUARD_STYLE },
        });
        expect(guarded.predicate).toEqual({ op: 'exists', path: '$guard.value' });
        expect(guarded.priority).toBe(1);
        for (const v of flows) {
            expect('curve' in (v.ir as any).edge).toBe(false);
            expect('routing' in (v.ir as any).edge).toBe(false);
        }
    });

    it('resolved on objects: a guard reads [guard] verbatim, an unset or empty guard draws no label', () => {
        const lookup: Record<string, any> = { ...mm.lookup };
        const guards: [string, unknown[]][] = [['f3', ['model.[count] < 2']], ['f4', ['model.[count] >= 2']], ['f1', []], ['fe', ['']], ['ft', ['true']]];
        for (const [id, values] of guards) {
            lookup[id] = { id, className: 'DObject', name: id, instanceof: mm.classId('ControlFlow'), features: [`${id}.g`] };
            lookup[`${id}.g`] = { id: `${id}.g`, className: 'DValue', instanceof: `${mm.classId('ControlFlow')}.guard`, values };
        }
        const ids = views.map((_, i) => `V${i}`);
        views.forEach((v, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: 'VP', ir: v.ir }; });
        const index = getIRIndex({ viewpoint: 'VP', viewelements: ids, idlookup: lookup }, 'activity_guards')!;
        const ctx = makeDrawReadCtx(lookup);
        const seen = guards.map(([id]) => {
            const cv = resolveObjectAsEdgeView(id, mm.classId('ControlFlow'), index, ctx, lookup)!;
            return [id, cv.labelText ? String(cv.labelText(ctx, id) ?? '') : null, cv.terminations.targetEnd];
        });
        expect(seen).toEqual([
            ['f3', '[model.[count] < 2]', 'openArrow'], ['f4', '[model.[count] >= 2]', 'openArrow'],
            ['f1', null, 'openArrow'], ['fe', null, 'openArrow'], ['ft', '[true]', 'openArrow'],
        ]);
    });

    it('the order, the classes and the endpoints are the Flowchart\'s, one more document per flow class with a guard', () => {
        const flowOrder = flowchart.map(v => v.className);
        const ctrl = flowOrder.indexOf('ControlFlow');
        expect(views.map(v => v.className)).toEqual([...flowOrder.slice(0, ctrl + 1), 'ControlFlow', ...flowOrder.slice(ctrl + 1)]);
        const edges = (vs: AnyDerivedView[]) => vs.filter(v => v.ir.kind === 'edge').map(v => [(v.ir as any).edge.source, (v.ir as any).edge.target]);
        expect(new Set(edges(views).map(e => e.join('>')))).toEqual(new Set(edges(flowchart).map(e => e.join('>'))));
    });

    it('every document passes the validator and carries its provenance; the decision\'s role is written', () => {
        for (const v of views) {
            expect(validateIR(`derived:${v.className}`, v.ir), v.className).toEqual({ ok: true });
            const g = (v.ir as any).generated;
            expect(g.notation, v.className).toBe('activityUml');
            expect(g.hash, v.className).toBe(structuralHash(bare(v.ir)));
        }
        expect(Object.fromEntries(views.map(v => [v.className, (v.ir as any).generated.role ?? null]))).toEqual({
            InitialNode: 'initial', Activity: 'node', Decision: 'decision', Fork: 'fork', Join: 'join', FinalNode: 'terminal',
            ActivityNode: 'node', ControlFlow: 'transition',
        });
    });

    it('no filled arrowhead, no name on the initial, the decision, the bars and the final', () => {
        expect(views.some(v => JSON.stringify(v.ir).includes('closedArrow'))).toBe(false);
        for (const name of ['InitialNode', 'Decision', 'Fork', 'Join', 'FinalNode']) expect(irOf(views, name).shape.labels, name).toEqual([]);
    });
});

describe('Activity (UML) — roles on other metamodels', () => {
    it('Terminal and Activity final are both the bull\'s-eye', () => {
        const mm = metamodel('AF', 'Finals', [
            cls('Node'), cls('Done', { supers: ['Node'] }), cls('Stop', { supers: ['Node'] }),
            cls('Flow', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const table = { 'AF.Node': 'node', 'AF.Done': 'terminal', 'AF.Stop': 'activityFinal', 'AF.Flow': 'transition' } as ClassRoles;
        const views = derivedDocuments(mm.lookup, mm.id, { notation: 'activityUml', classRoles: table });
        expect(bare(irOf(views, 'Done')).shape).toEqual(bare(irOf(views, 'Stop')).shape);
        expect(irOf(views, 'Stop').shape.marker).toBe('dot-large');
        // The size too: the Flowchart's own bull's-eye has the same shape and no default size.
        for (const name of ['Done', 'Stop']) expect(irOf(views, name).defaultSize, name).toEqual({ width: 24, height: 24 });
    });

    it('a class with no role keeps the Flowchart drawing; a flow class with no guard gets one document', () => {
        const mm = metamodel('NR', 'NoRole', [
            cls('Node'), cls('Note'), cls('Flow', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const table = { 'NR.Node': 'node', 'NR.Flow': 'transition' } as ClassRoles;
        const activity = derivedDocuments(mm.lookup, mm.id, { notation: 'activityUml', classRoles: table });
        const flow = derivedDocuments(mm.lookup, mm.id, { notation: 'flowchart', classRoles: table });
        expect(bare(irOf(activity, 'Note'))).toEqual(bare(irOf(flow, 'Note')));
        expect(activity.filter(v => v.className === 'Flow').length).toBe(1);
        expect(irOf(activity, 'Flow').edge.labels).toBeUndefined();
    });

    it('a decision bound by hand to any class draws the diamond, whatever its name', () => {
        const mm = metamodel('DH', 'ByHand', [
            cls('Node'), cls('Gate', { supers: ['Node'] }), cls('Flow', { refs: [ref('source', 'Node'), ref('target', 'Node')] }),
        ]);
        const table = { 'DH.Node': 'node', 'DH.Gate': 'decision', 'DH.Flow': 'transition' } as ClassRoles;
        const views = derivedDocuments(mm.lookup, mm.id, { notation: 'activityUml', classRoles: table });
        expect(irOf(views, 'Gate').shape.form).toBe('diamond');
        expect(irOf(views, 'Gate').generated.role).toBe('decision');
    });

    it('the Flowchart and Flowchart (ISO 5807) documents do not read a decision in the table', () => {
        const mm = configured(FLOWB, 'flowchart');
        const table = defaultChoice(mm.lookup, mm.id, []).classRoles;
        expect(Object.values(table)).toContain('decision');
        for (const notation of ['flowchart', 'flowchartIso'] as DerivedNotationId[]) {
            const withDecision: DeriveChoice = { notation, classRoles: table };
            const own: DeriveChoice = { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles };
            expect(digest(derivedDocuments(mm.lookup, mm.id, withDecision)), notation).toBe(digest(derivedDocuments(mm.lookup, mm.id, own)));
        }
    });
});
