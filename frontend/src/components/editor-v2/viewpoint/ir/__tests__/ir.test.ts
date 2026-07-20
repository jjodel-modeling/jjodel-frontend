/**
 * Unit tests for the IR interpreter core (spec v1.2):
 * - PathExpr compile + forbidden constructs
 * - Predicate / Conditional semantics on the draw ReadCtx
 * - dependency set extraction
 * - resolution ordering: priority > specificity (exact > inherited > wildcard) > declaration order
 * - default views (Fase 2a)
 *
 * All fixtures are plain D-layer shapes (idlookup records); no store, no React.
 */
import { describe, it, expect } from 'vitest';
import { compileView, compileEdgeView, clearCompileCache } from '../irCompile';
import { getIREdgeAnchorOverride, hydrateIREdgeAnchorOverrides, irEdgeLayoutFromOverride, setIREdgeAnchorOverride } from '../irEdgeInteraction';
import { getCollapsedSet, hydrateCollapsed } from '../irCollapseState';
import { makeDrawReadCtx, classAncestryNames } from '../irReadCtx';
import { getIRIndex, resolveIRView } from '../irResolveCore';
import { defaultObjectViewIR, isMigratedDefaultView, IR_DEFAULT_OBJECT_VIEW_ID } from '../irDefaults';
import {
    buildContainmentModel,
    computeHidden,
    containmentChildren,
    decorateEdges,
    decorateNodes,
    liftEndpoint,
} from '../irContainment';
import { assignGeometricHandles, decorateReferenceEdges, synthesizeObjectAsEdges } from '../irEdgeViews';
import { applyIRPaletteFilter, deriveIRInteraction } from '../irInteraction';
import type { EdgeViewIR, GraphVertexViewIR, VertexViewIR } from '../irTypes';

/** Build a minimal D-layer world: metamodel classes + objects with slots. */
function world() {
    const idlookup: Record<string, any> = {
        // M2
        C_Named: { id: 'C_Named', name: 'Named', extends: [] },
        C_State: { id: 'C_State', name: 'State', extends: ['C_Named'] },
        C_Final: { id: 'C_Final', name: 'FinalState', extends: ['C_State'] },
        A_name: { id: 'A_name', name: 'name' },
        A_isInitial: { id: 'A_isInitial', name: 'isInitial' },
        A_tags: { id: 'A_tags', name: 'tags' },
        // M1: s1 (State, isInitial=true), s2 (FinalState, isInitial=false), s3 (State, no slots)
        s1: { id: 's1', name: 'obj_s1', instanceof: 'C_State', features: ['v1n', 'v1i', 'v1t'] },
        v1n: { id: 'v1n', instanceof: 'A_name', values: ['idle'] },
        v1i: { id: 'v1i', instanceof: 'A_isInitial', values: [true] },
        v1t: { id: 'v1t', instanceof: 'A_tags', values: ['a', 'b'] },
        s2: { id: 's2', name: 'obj_s2', instanceof: 'C_Final', features: ['v2n', 'v2i'] },
        v2n: { id: 'v2n', instanceof: 'A_name', values: ['done'] },
        v2i: { id: 'v2i', instanceof: 'A_isInitial', values: [false] },
        s3: { id: 's3', name: 'obj_s3', instanceof: 'C_State', features: [] },
    };
    return { idlookup, ctx: makeDrawReadCtx(idlookup) };
}

function vertexIR(over: Partial<VertexViewIR>): VertexViewIR {
    return {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: { form: 'rect' }, ...over,
    } as VertexViewIR;
}

describe('irReadCtx (draw backend)', () => {
    it('reads single values, multi values, name and metaclass', () => {
        const { ctx } = world();
        expect(ctx.getValue('s1', 'name')).toBe('idle');
        expect(ctx.getValues('s1', 'tags')).toEqual(['a', 'b']);
        expect(ctx.getValue('s1', 'missing')).toBeUndefined();
        expect(ctx.getName('s1')).toBe('idle');   // identity slot wins over D-layer name
        expect(ctx.getName('s3')).toBe('obj_s3'); // no name slot → D-layer name
        expect(ctx.getMetaclassName('s2')).toBe('FinalState');
    });
    it('isKindOf walks the extends chain transitively', () => {
        const { ctx } = world();
        expect(ctx.isKindOf('s2', 'FinalState')).toBe(true);
        expect(ctx.isKindOf('s2', 'State')).toBe(true);
        expect(ctx.isKindOf('s2', 'Named')).toBe(true);
        expect(ctx.isKindOf('s1', 'FinalState')).toBe(false);
    });
    it('classAncestryNames is cycle-safe', () => {
        const idlookup: Record<string, any> = {
            A: { id: 'A', name: 'A', extends: ['B'] },
            B: { id: 'B', name: 'B', extends: ['A'] },
        };
        expect(classAncestryNames(idlookup, 'A')).toEqual(['A', 'B']);
    });
});

describe('irCompile', () => {
    it('compiles labels from paths, literals and intrinsics', () => {
        clearCompileCache();
        const { ctx } = world();
        const cv = compileView('v_lab', vertexIR({
            shape: {
                form: 'rect',
                labels: [
                    { position: 'center', source: { from: 'path', expr: '$name.value' } },
                    { position: 'bottom', source: { from: 'literal', text: 'fixed' } },
                    { position: 'top', source: { from: 'intrinsic', prop: 'qualifiedName' } },
                ],
            },
        }));
        expect(cv.labels[0].text(ctx, 's1')).toBe('idle');
        expect(cv.labels[1].text(ctx, 's1')).toBe('fixed');
        expect(cv.labels[2].text(ctx, 's1')).toBe('idle : State');
        expect(cv.dependencySet).toContain('name');
    });
    it('rejects forbidden PathExpr constructs by skipping compile (throw)', () => {
        expect(() => compileView('v_bad', vertexIR({
            shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'path', expr: '$a?.value' } }] },
        }))).toThrow();
        expect(() => compileView('v_bad2', vertexIR({
            shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'path', expr: '$a.value ? 1 : 2' } }] },
        }))).toThrow();
    });
    it('evaluates predicates: eq / not / exists / empty / isKind', () => {
        clearCompileCache();
        const { ctx } = world();
        const eq = compileView('v_eq', vertexIR({
            predicate: { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } },
        }));
        expect(eq.predicate(ctx, 's1')).toBe(true);
        expect(eq.predicate(ctx, 's2')).toBe(false);

        const ex = compileView('v_ex', vertexIR({ predicate: { op: 'exists', path: '$name.value' } }));
        expect(ex.predicate(ctx, 's1')).toBe(true);
        expect(ex.predicate(ctx, 's3')).toBe(false);

        const em = compileView('v_em', vertexIR({ predicate: { op: 'empty', path: '$tags.values' } }));
        expect(em.predicate(ctx, 's3')).toBe(true);
        expect(em.predicate(ctx, 's1')).toBe(false);

        const ik = compileView('v_ik', vertexIR({ predicate: { op: 'isKind', class: 'FinalState' } }));
        expect(ik.predicate(ctx, 's2')).toBe(true);
        expect(ik.predicate(ctx, 's1')).toBe(false);
    });
    it('resolves Conditional single-rule and cascade forms', () => {
        clearCompileCache();
        const { ctx } = world();
        const cv = compileView('v_cond', vertexIR({
            shape: {
                form: {
                    rules: [
                        { when: { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } }, then: 'ellipse' },
                        { when: { op: 'isKind', class: 'FinalState' }, then: 'rounded' },
                    ],
                    default: 'rect',
                },
            },
        }));
        expect(cv.form(ctx, 's1')).toBe('ellipse');
        expect(cv.form(ctx, 's2')).toBe('rounded');
        expect(cv.form(ctx, 's3')).toBe('rect');
    });
    it('extracts the dependency set from predicates and labels', () => {
        clearCompileCache();
        const cv = compileView('v_deps', vertexIR({
            predicate: { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } },
            shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'path', expr: '$name.value' } }] },
        }));
        expect(new Set(cv.dependencySet)).toEqual(new Set(['isInitial', 'name']));
    });
});

/** Build a fake DState slice for getIRIndex. */
function stateWith(views: { id: string; ir: VertexViewIR }[], extraLookup: Record<string, any>) {
    const idlookup: Record<string, any> = { ...extraLookup };
    const viewelements: string[] = [];
    for (const v of views) {
        idlookup[v.id] = { id: v.id, viewpoint: 'VP', ir: v.ir };
        viewelements.push(v.id);
    }
    return { viewpoint: 'VP', viewelements, idlookup };
}

describe('irResolveCore ordering (spec v1.2 sez. 2)', () => {
    it('priority beats specificity; specificity breaks ties; declaration order last', () => {
        const { idlookup } = world();
        const state = stateWith([
            { id: 'V_wild', ir: vertexIR({ metaclasses: '*', priority: 0 }) },
            { id: 'V_state_a', ir: vertexIR({ metaclasses: ['State'], priority: 0 }) },
            { id: 'V_state_b', ir: vertexIR({ metaclasses: ['State'], priority: 0 }) },
            { id: 'V_final_low', ir: vertexIR({ metaclasses: ['FinalState'], priority: 0 }) },
            { id: 'V_named_hi', ir: vertexIR({ metaclasses: ['Named'], priority: 10 }) },
        ], idlookup);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_order_1')!;
        expect(index).not.toBeNull();

        // s2 is FinalState: priority 10 on inherited Named beats exact FinalState at 0
        expect(resolveIRView('s2', 'C_Final', index, ctx, state.idlookup)!.viewId).toBe('V_named_hi');
        // remove the priority view: exact beats inherited
        const state2 = stateWith([
            { id: 'V_state_a', ir: vertexIR({ metaclasses: ['State'], priority: 0 }) },
            { id: 'V_final_low', ir: vertexIR({ metaclasses: ['FinalState'], priority: 0 }) },
        ], idlookup);
        const index2 = getIRIndex(state2, 'sig_order_2')!;
        expect(resolveIRView('s2', 'C_Final', index2, ctx, state2.idlookup)!.viewId).toBe('V_final_low');
        // two exact matches: declaration order wins
        const state3 = stateWith([
            { id: 'V_state_a', ir: vertexIR({ metaclasses: ['State'] }) },
            { id: 'V_state_b', ir: vertexIR({ metaclasses: ['State'] }) },
        ], idlookup);
        const index3 = getIRIndex(state3, 'sig_order_3')!;
        expect(resolveIRView('s1', 'C_State', index3, ctx, state3.idlookup)!.viewId).toBe('V_state_a');
    });
    it('wildcard applies when nothing else matches; predicate gates candidates', () => {
        const { idlookup } = world();
        const state = stateWith([
            { id: 'V_flag', ir: vertexIR({ metaclasses: ['State'], priority: 5,
                predicate: { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } } }) },
            { id: 'V_wild', ir: vertexIR({ metaclasses: '*' }) },
        ], idlookup);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_wild_1')!;
        // s1: predicate true → flag view; s3: predicate false → wildcard
        expect(resolveIRView('s1', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_flag');
        expect(resolveIRView('s3', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_wild');
    });
    it('a malformed ir never takes the index down', () => {
        const { idlookup } = world();
        const state = stateWith([
            { id: 'V_broken', ir: vertexIR({ shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'path', expr: '$x ?? 1' } }] } }) },
            { id: 'V_ok', ir: vertexIR({ metaclasses: ['State'] }) },
        ], idlookup);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_broken_1')!;
        expect(index.viewIds).toEqual(['V_ok']);
        expect(resolveIRView('s1', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_ok');
    });
});

/**
 * Containment world: Region contains States (composition ref), transitions
 * between states as edges.
 *   r1 (Region) ⊃ { s_a, s_b }   r2 (Region) ⊃ { s_c }
 *   edges: s_a→s_b (internal), s_a→s_c (cross-region), ext→s_b (from outside)
 */
function containmentWorld() {
    const idlookup: Record<string, any> = {
        C_Region: { id: 'C_Region', name: 'Region', extends: [] },
        C_State: { id: 'C_State', name: 'State', extends: [] },
        R_states: { id: 'R_states', name: 'states', className: 'DReference', composition: true },
        R_next: { id: 'R_next', name: 'next', className: 'DReference', composition: false },
        r1: { id: 'r1', name: 'region1', instanceof: 'C_Region', features: ['vr1'] },
        vr1: { id: 'vr1', instanceof: 'R_states', values: ['s_a', 's_b'] },
        r2: { id: 'r2', name: 'region2', instanceof: 'C_Region', features: ['vr2'] },
        vr2: { id: 'vr2', instanceof: 'R_states', values: ['s_c'] },
        s_a: { id: 's_a', name: 'A', instanceof: 'C_State', features: [] },
        s_b: { id: 's_b', name: 'B', instanceof: 'C_State', features: [] },
        s_c: { id: 's_c', name: 'C', instanceof: 'C_State', features: [] },
        ext: { id: 'ext', name: 'EXT', instanceof: 'C_State', features: [] },
        // vertices (vertexId → { model: objectId })
        Vr1: { id: 'Vr1', model: 'r1' }, Vr2: { id: 'Vr2', model: 'r2' },
        Va: { id: 'Va', model: 's_a' }, Vb: { id: 'Vb', model: 's_b' },
        Vc: { id: 'Vc', model: 's_c' }, Vx: { id: 'Vx', model: 'ext' },
    };
    const nodes: any[] = ['Vr1', 'Vr2', 'Va', 'Vb', 'Vc', 'Vx'].map(id => ({
        id, type: 'objectNode', position: { x: 0, y: 0 }, data: {},
    }));
    const edges: any[] = [
        { id: 'e_ab', source: 'Va', target: 'Vb' },
        { id: 'e_ac', source: 'Va', target: 'Vc' },
        { id: 'e_xb', source: 'Vx', target: 'Vb' },
    ];
    const regionView: GraphVertexViewIR = {
        irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Region'],
        shape: { form: 'rect' },
        containment: { collapsible: true },
    };
    const state = { viewpoint: 'VP', viewelements: ['V_region'], idlookup: { ...idlookup, V_region: { id: 'V_region', viewpoint: 'VP', ir: regionView } } };
    const ctx = makeDrawReadCtx(state.idlookup);
    const index = getIRIndex(state, 'sig_cont_' + Math.abs(JSON.stringify(idlookup).length))!;
    const model = buildContainmentModel(nodes as any, state.idlookup, index, ctx);
    return { idlookup: state.idlookup, nodes, edges, model };
}

describe('irContainment (Fase 2b)', () => {
    it('builds the containment model from composition references', () => {
        const { idlookup, model } = containmentWorld();
        expect(containmentChildren(idlookup, 'r1')).toEqual(['s_a', 's_b']);
        expect(model.containers.has('r1')).toBe(true);
        expect(model.containers.has('r2')).toBe(true);
        expect(model.containers.has('s_a')).toBe(false);
        expect(model.parentOf.get('s_c')).toBe('r2');
    });
    it('computeHidden hides whole subtrees of collapsed containers only', () => {
        const { model } = containmentWorld();
        expect(computeHidden(model, new Set()).size).toBe(0);
        const hidden = computeHidden(model, new Set(['r1']));
        expect(hidden).toEqual(new Set(['s_a', 's_b']));
    });
    it('liftEndpoint returns self when visible, nearest rendered ancestor when hidden', () => {
        const { model } = containmentWorld();
        const hidden = computeHidden(model, new Set(['r1']));
        expect(liftEndpoint('s_c', model, hidden)).toBe('s_c');
        expect(liftEndpoint('s_a', model, hidden)).toBe('r1');
    });
    it('decorateNodes hides collapsed subtrees; decorateEdges lifts and suppresses', () => {
        const { nodes, edges, model } = containmentWorld();
        const hidden = computeHidden(model, new Set(['r1']));
        const dn = decorateNodes(nodes as any, model, hidden);
        const hiddenIds = dn.filter(n => n.hidden).map(n => n.id).sort();
        expect(hiddenIds).toEqual(['Va', 'Vb']);

        const de = decorateEdges(edges as any, model, hidden);
        const ids = de.map(e => e.id).sort();
        // e_ab internal to collapsed r1 → suppressed
        expect(ids).not.toContain('e_ab');
        // e_ac lifts source to region1's vertex
        const lifted = de.find(e => e.id === 'e_ac__irlift')!;
        expect(lifted.source).toBe('Vr1');
        expect(lifted.target).toBe('Vc');
        expect((lifted.data as any).irLifted).toBe(true);
        // e_xb lifts target to region1's vertex
        const liftedXb = de.find(e => e.id === 'e_xb__irlift')!;
        expect(liftedXb.source).toBe('Vx');
        expect(liftedXb.target).toBe('Vr1');
    });
    it('is a pass-through when nothing is collapsed', () => {
        const { nodes, edges, model } = containmentWorld();
        const hidden = computeHidden(model, new Set());
        expect(decorateNodes(nodes as any, model, hidden)).toBe(nodes);
        expect(decorateEdges(edges as any, model, hidden)).toBe(edges);
    });
});

/**
 * Edge-view world (Fase 2c): StateMachine with object-as-edge Transitions.
 *   states s1, s2; transition t1 { src -> s1, tgt -> s2 }
 *   M1 reference edges from t1's refs: t1→s1, t1→s2; plus a plain next edge s1→s2.
 */
function edgeWorld() {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        C_Trans: { id: 'C_Trans', name: 'Transition', extends: [] },
        R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
        R_tgt: { id: 'R_tgt', name: 'tgt', className: 'DReference', composition: false },
        R_next: { id: 'R_next', name: 'next', className: 'DReference', composition: false },
        s1: { id: 's1', name: 'S1', instanceof: 'C_State', features: ['v_next'] },
        v_next: { id: 'v_next', instanceof: 'R_next', values: ['s2'] },
        s2: { id: 's2', name: 'S2', instanceof: 'C_State', features: [] },
        t1: { id: 't1', name: 'go', instanceof: 'C_Trans', features: ['v_src', 'v_tgt'] },
        v_src: { id: 'v_src', instanceof: 'R_src', values: ['s1'] },
        v_tgt: { id: 'v_tgt', instanceof: 'R_tgt', values: ['s2'] },
        V1: { id: 'V1', model: 's1' }, V2: { id: 'V2', model: 's2' }, Vt: { id: 'Vt', model: 't1' },
    };
    const nodes: any[] = ['V1', 'V2', 'Vt'].map(id => ({ id, type: 'objectNode', position: { x: 0, y: 0 }, data: {} }));
    const edges: any[] = [
        { id: 'e_t_s1', source: 'Vt', target: 'V1', type: 'instanceRef', data: { referenceName: 'src' } },
        { id: 'e_t_s2', source: 'Vt', target: 'V2', type: 'instanceRef', data: { referenceName: 'tgt' } },
        { id: 'e_next', source: 'V1', target: 'V2', type: 'instanceRef', data: { referenceName: 'next' } },
    ];
    return { idlookup, nodes, edges };
}

describe('irEdgeViews (Fase 2c)', () => {
    it('styles reference-as-edge M1 edges (color, dash, label, markers)', () => {
        const { idlookup, edges } = edgeWorld();
        const nextView: EdgeViewIR = {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['State'], reference: 'next',
            edge: {
                line: { color: '#0ea5e9', width: 2, style: 'dashed' },
                terminations: { targetEnd: 'closedArrow' },
                labels: { center: { from: 'literal', text: 'next' } },
            },
        };
        const state = { viewpoint: 'VP', viewelements: ['V_next'], idlookup: { ...idlookup, V_next: { id: 'V_next', viewpoint: 'VP', ir: nextView } } };
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_edge_1')!;
        const objByVertex = new Map([['V1', 's1'], ['V2', 's2'], ['Vt', 't1']]);
        const de = decorateReferenceEdges(edges as any, objByVertex, index, ctx, state.idlookup);
        const next = de.find(e => e.id === 'e_next')!;
        expect((next.style as any).stroke).toBe('#0ea5e9');
        expect((next.style as any).strokeDasharray).toBe('6 4');
        expect(next.label).toBe('next');
        expect((next.data as any).irEdgeViewId).toBe('V_next');
        // src/tgt edges do not match (reference name differs)
        expect((de.find(e => e.id === 'e_t_s1') as any).data.irEdgeViewId).toBeUndefined();
    });
    it('synthesizes object-as-edge, hides the object node, suppresses its ref edges', () => {
        const { idlookup, nodes, edges } = edgeWorld();
        const transView: EdgeViewIR = {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'],
            edge: {
                source: '$src.value', target: '$tgt.value',
                line: { color: '#334155' },
                labels: { center: { from: 'intrinsic', prop: 'name' } },
            },
        };
        const state = { viewpoint: 'VP', viewelements: ['V_trans'], idlookup: { ...idlookup, V_trans: { id: 'V_trans', viewpoint: 'VP', ir: transView } } };
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_edge_2')!;
        const objByVertex = new Map([['V1', 's1'], ['V2', 's2'], ['Vt', 't1']]);
        const vertexByObj = new Map([['s1', 'V1'], ['s2', 'V2'], ['t1', 'Vt']]);
        const res = synthesizeObjectAsEdges(nodes as any, edges as any, objByVertex, vertexByObj, index, ctx, state.idlookup);
        expect(res.edgeObjects).toEqual(new Set(['t1']));
        const vt = res.nodes.find(n => n.id === 'Vt')!;
        expect(vt.hidden).toBe(true);
        const ids = res.edges.map(e => e.id);
        expect(ids).not.toContain('e_t_s1');
        expect(ids).not.toContain('e_t_s2');
        expect(ids).toContain('e_next');
        const syn = res.edges.find(e => e.id === 'irobj_t1')!;
        expect(syn.source).toBe('V1');
        expect(syn.target).toBe('V2');
        expect(syn.label).toBe('go');
        expect((syn.data as any).irObjectAsEdge).toBe(true);
    });
    it('accepts proxy-object endpoints (lproxy backend resolves reference slots to objects)', () => {
        const { idlookup, nodes, edges } = edgeWorld();
        const transView: EdgeViewIR = {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'],
            edge: { source: '$src.value', target: '$tgt.value' },
        };
        const state = { viewpoint: 'VP', viewelements: ['V_transP'], idlookup: { ...idlookup, V_transP: { id: 'V_transP', viewpoint: 'VP', ir: transView } } as Record<string, any> };
        const base = makeDrawReadCtx(state.idlookup);
        // Simulate the lproxy backend: reference slot values come back as proxy objects with .id
        const proxyCtx = {
            ...base,
            getValue: (elementId: string, featureName: string) => {
                const v = base.getValue(elementId, featureName);
                return typeof v === 'string' && state.idlookup[v] ? { id: v, __mockProxy: true } : v;
            },
        };
        const index = getIRIndex(state, 'sig_edge_proxy')!;
        const objByVertex = new Map([['V1', 's1'], ['V2', 's2'], ['Vt', 't1']]);
        const vertexByObj = new Map([['s1', 'V1'], ['s2', 'V2'], ['t1', 'Vt']]);
        const res = synthesizeObjectAsEdges(nodes as any, edges as any, objByVertex, vertexByObj, index, proxyCtx as any, state.idlookup);
        expect(res.edgeObjects).toEqual(new Set(['t1']));
        const syn = res.edges.find(e => e.id === 'irobj_t1')!;
        expect(syn.source).toBe('V1');
        expect(syn.target).toBe('V2');
    });
    it('assigns geometric handles: dominant axis sides, free index per (node, side, role)', () => {
        const nodesById = new Map<string, any>([
            ['A', { id: 'A', position: { x: 0, y: 0 }, measured: { width: 100, height: 50 } }],
            ['B', { id: 'B', position: { x: 400, y: 0 }, measured: { width: 100, height: 50 } }],
            ['C', { id: 'C', position: { x: 0, y: 400 }, measured: { width: 100, height: 50 } }],
        ]);
        const e1 = assignGeometricHandles({ id: 'e1', source: 'A', target: 'B' } as any, nodesById, []);
        expect(e1.sourceHandle).toBe('right-0');
        expect(e1.targetHandle).toBe('left-0');
        const e2 = assignGeometricHandles({ id: 'e2', source: 'A', target: 'C' } as any, nodesById, [e1]);
        expect(e2.sourceHandle).toBe('bottom-0');
        expect(e2.targetHandle).toBe('top-0');
        // same side reused → next free index
        const e3 = assignGeometricHandles({ id: 'e3', source: 'A', target: 'B' } as any, nodesById, [e1, e2]);
        expect(e3.sourceHandle).toBe('right-1');
        expect(e3.targetHandle).toBe('left-1');
    });
    it('synthetic edges carry geometric handles', () => {
        const { idlookup, nodes, edges } = edgeWorld();
        // spread the endpoint nodes horizontally so sides are deterministic
        (nodes as any[]).find(n => n.id === 'V1').position = { x: 0, y: 0 };
        (nodes as any[]).find(n => n.id === 'V2').position = { x: 500, y: 0 };
        const transView: EdgeViewIR = {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'],
            edge: { source: '$src.value', target: '$tgt.value' },
        };
        const state = { viewpoint: 'VP', viewelements: ['V_transH'], idlookup: { ...idlookup, V_transH: { id: 'V_transH', viewpoint: 'VP', ir: transView } } as Record<string, any> };
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_edge_handles')!;
        const objByVertex = new Map([['V1', 's1'], ['V2', 's2'], ['Vt', 't1']]);
        const vertexByObj = new Map([['s1', 'V1'], ['s2', 'V2'], ['t1', 'Vt']]);
        const res = synthesizeObjectAsEdges(nodes as any, edges as any, objByVertex, vertexByObj, index, ctx, state.idlookup);
        const syn = res.edges.find(e => e.id === 'irobj_t1')!;
        expect(syn.sourceHandle).toBe('right-0');
        expect(syn.targetHandle).toBe('left-0');
    });
    it('unresolvable endpoint keeps the object rendered as a node (explicit fallback)', () => {
        const { idlookup, nodes, edges } = edgeWorld();
        // break the tgt slot
        idlookup.v_tgt = { id: 'v_tgt', instanceof: 'R_tgt', values: [] };
        const transView: EdgeViewIR = {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'],
            edge: { source: '$src.value', target: '$tgt.value' },
        };
        const state = { viewpoint: 'VP', viewelements: ['V_trans2'], idlookup: { ...idlookup, V_trans2: { id: 'V_trans2', viewpoint: 'VP', ir: transView } } };
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_edge_3')!;
        const objByVertex = new Map([['V1', 's1'], ['V2', 's2'], ['Vt', 't1']]);
        const vertexByObj = new Map([['s1', 'V1'], ['s2', 'V2'], ['t1', 'Vt']]);
        const res = synthesizeObjectAsEdges(nodes as any, edges as any, objByVertex, vertexByObj, index, ctx, state.idlookup);
        expect(res.edgeObjects.size).toBe(0);
        expect(res.nodes).toBe(nodes);
        expect(res.edges).toBe(edges);
    });
});

describe('irInteraction (Fase 3)', () => {
    it('derives palette, connect rules and drop containers from the index', () => {
        const { idlookup } = edgeWorld();
        const stateViews = {
            viewpoint: 'VP',
            viewelements: ['V_state', 'V_region', 'V_trans'],
            idlookup: {
                ...idlookup,
                C_Region: { id: 'C_Region', name: 'Region', extends: [] },
                V_state: { id: 'V_state', viewpoint: 'VP', ir: { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'], shape: { form: 'rect' } } },
                V_region: { id: 'V_region', viewpoint: 'VP', ir: { irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Region'], shape: { form: 'rect' }, containment: {} } },
                V_trans: { id: 'V_trans', viewpoint: 'VP', ir: { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'], edge: { source: '$src.value', target: '$tgt.value' } } },
            },
        };
        const index = getIRIndex(stateViews, 'sig_plan_1')!;
        const plan = deriveIRInteraction(index);
        expect(new Set(plan.paletteMetaclasses!)).toEqual(new Set(['State', 'Region', 'Transition']));
        expect(plan.dropContainers).toEqual(['Region']);
        expect(plan.connectRules).toEqual([
            { edgeMetaclass: 'Transition', sourceFeature: 'src', targetFeature: 'tgt' },
        ]);
    });
    it('wildcard-only viewpoints impose no palette restriction', () => {
        const { idlookup } = world();
        const state = stateWith([{ id: 'V_def', ir: defaultObjectViewIR() }], idlookup);
        const index = getIRIndex(state, 'sig_plan_2')!;
        const plan = deriveIRInteraction(index);
        expect(plan.paletteMetaclasses).toBeNull();
        expect(plan.connectRules).toEqual([]);
    });
});

describe('applyIRPaletteFilter (palette fallback, spec v1.2 sez. 6)', () => {
    const rootable = [{ name: 'State' }, { name: 'Region' }];
    const planFor = (metaclasses: string[]) => ({
        paletteMetaclasses: metaclasses,
        connectRules: [],
        dropContainers: [],
    });

    it('non-empty intersection stays filtered, no fallback', () => {
        const res = applyIRPaletteFilter(rootable, planFor(['State', 'Transition']));
        expect(res.classes).toEqual([{ name: 'State' }]);
        expect(res.fallback).toBe(false);
    });
    it('empty intersection falls back to the full rootable palette with notice flag', () => {
        const res = applyIRPaletteFilter(rootable, planFor(['Transition']));
        expect(res.classes).toEqual(rootable);
        expect(res.fallback).toBe(true);
    });
    it('null plan or null paletteMetaclasses is a pass-through without fallback', () => {
        expect(applyIRPaletteFilter(rootable, null)).toEqual({ classes: rootable, fallback: false });
        const noRestriction = { paletteMetaclasses: null, connectRules: [], dropContainers: [] };
        expect(applyIRPaletteFilter(rootable, noRestriction)).toEqual({ classes: rootable, fallback: false });
    });
    it('no rootable classes at all → empty palette, no fallback notice', () => {
        const res = applyIRPaletteFilter([], planFor(['Transition']));
        expect(res.classes).toEqual([]);
        expect(res.fallback).toBe(false);
    });
});

describe('irDefaults (Fase 2a)', () => {
    it('default object view compiles, matches any object via wildcard, renders qualified name', () => {
        clearCompileCache();
        const { idlookup } = world();
        const state = stateWith([{ id: 'V_def', ir: defaultObjectViewIR() }], idlookup);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_def_1')!;
        const cv = resolveIRView('s1', 'C_State', index, ctx, state.idlookup)!;
        expect(cv.viewId).toBe('V_def');
        expect(cv.labels[0].text(ctx, 's1')).toBe('idle : State');
        expect(cv.fieldCompartments[0].source).toBe('attributes');
    });
    it('any metaclass-declared view beats the default at equal priority', () => {
        const { idlookup } = world();
        const state = stateWith([
            { id: 'V_def', ir: defaultObjectViewIR() },
            { id: 'V_custom', ir: vertexIR({ metaclasses: ['Named'] }) },
        ], idlookup);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_def_2')!;
        expect(resolveIRView('s1', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_custom');
    });
});

describe('isMigratedDefaultView (delegation, spec v1.2 sez. 11)', () => {
    it('marker + factory-identical structure → delegated to native rendering', () => {
        clearCompileCache();
        const ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' } as VertexViewIR;
        const cv = compileView('V_mig_eq', ir);
        expect(isMigratedDefaultView(cv)).toBe(true);
    });
    it('marker + permuted key order → still delegated (canonical comparison)', () => {
        // Persistence round-trips may reorder keys; equality must not depend on it.
        const base = defaultObjectViewIR();
        const permuted = {
            migratedFrom: 'classic-default',
            fieldCompartments: base.fieldCompartments,
            shape: base.shape,
            label: base.label,
            exclusive: base.exclusive,
            priority: base.priority,
            metaclasses: base.metaclasses,
            kind: base.kind,
            irVersion: base.irVersion,
        } as unknown as VertexViewIR;
        const cv = compileView('V_mig_perm', permuted);
        expect(isMigratedDefaultView(cv)).toBe(true);
    });
    it('marker + edited structure (label position changed) → interpreter, no delegation', () => {
        const edited = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' } as VertexViewIR;
        edited.shape = {
            ...edited.shape,
            labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'qualifiedName' } }],
        };
        const cv = compileView('V_mig_edit', edited);
        expect(isMigratedDefaultView(cv)).toBe(false);
    });
    it('factory-identical structure without marker → interpreter, no delegation', () => {
        const cv = compileView('V_nomark', defaultObjectViewIR());
        expect(isMigratedDefaultView(cv)).toBe(false);
    });
    it('IR_DEFAULT_OBJECT_VIEW_ID (built-in default wildcard) → delegated regardless of marker', () => {
        const cv = compileView(IR_DEFAULT_OBJECT_VIEW_ID, defaultObjectViewIR());
        expect(isMigratedDefaultView(cv)).toBe(true);
    });
});

describe('layout persistence (discovery 2026-07-19)', () => {
    const edgeIR = (over: Partial<EdgeViewIR['edge']>): EdgeViewIR => ({
        irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'],
        edge: { source: '$src.value', target: '$tgt.value', ...over },
    });
    it('compileEdgeView: persistWaypoints defaults to true when absent', () => {
        const cv = compileEdgeView('V_pw_default', edgeIR({}));
        expect(cv.persistWaypoints).toBe(true);
    });
    it('compileEdgeView: persistWaypoints false compiles the opt-out', () => {
        const cv = compileEdgeView('V_pw_false', edgeIR({ persistWaypoints: false }));
        expect(cv.persistWaypoints).toBe(false);
    });
    it('irEdgeLayoutFromOverride: explicit handle wins over the side pin and its session-relative index is stripped', () => {
        const layout = irEdgeLayoutFromOverride({
            sourceHandle: 'right-2', sourceSide: 'left', targetSide: 'top',
        });
        expect(layout).toEqual({ sourceSide: 'right', targetSide: 'top' });
    });
    it('irEdgeLayoutFromOverride: filters malformed waypoints; null when nothing persistable remains', () => {
        const layout = irEdgeLayoutFromOverride({
            waypoints: [{ segmentIndex: 1, offset: 24 }, { bogus: true }, null] as unknown[],
        });
        expect(layout).toEqual({ waypoints: [{ segmentIndex: 1, offset: 24 }] });
        expect(irEdgeLayoutFromOverride({})).toBeNull();
        expect(irEdgeLayoutFromOverride({ sourceHandle: 'nonsense' })).toBeNull();
    });
    it('hydration precedence: session override wins, missing keys are seeded', () => {
        setIREdgeAnchorOverride('hydr_objA', { sourceSide: 'left' });
        hydrateIREdgeAnchorOverrides([
            ['hydr_objA', { sourceSide: 'right', waypoints: [{ segmentIndex: 0, offset: 10 }] }],
            ['hydr_objB', { targetSide: 'bottom' }],
        ]);
        expect(getIREdgeAnchorOverride('hydr_objA')).toEqual({ sourceSide: 'left' });
        expect(getIREdgeAnchorOverride('hydr_objB')).toEqual({ targetSide: 'bottom' });
    });
    it('hydrateCollapsed: additive seed, idempotent on already-collapsed ids', () => {
        hydrateCollapsed(['hydr_cont1']);
        hydrateCollapsed(['hydr_cont1', 'hydr_cont2']);
        expect(getCollapsedSet().has('hydr_cont1')).toBe(true);
        expect(getCollapsedSet().has('hydr_cont2')).toBe(true);
    });
});
