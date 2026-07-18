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
import { compileView, clearCompileCache } from '../irCompile';
import { makeDrawReadCtx, classAncestryNames } from '../irReadCtx';
import { getIRIndex, resolveIRView } from '../irResolveCore';
import { defaultObjectViewIR } from '../irDefaults';
import {
    buildContainmentModel,
    computeHidden,
    containmentChildren,
    decorateEdges,
    decorateNodes,
    liftEndpoint,
} from '../irContainment';
import type { GraphVertexViewIR, VertexViewIR } from '../irTypes';

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
        expect(ctx.getName('s1')).toBe('obj_s1');
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
        expect(cv.labels[2].text(ctx, 's1')).toBe('obj_s1 : State');
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

describe('irDefaults (Fase 2a)', () => {
    it('default object view compiles, matches any object via wildcard, renders qualified name', () => {
        clearCompileCache();
        const { idlookup } = world();
        const state = stateWith([{ id: 'V_def', ir: defaultObjectViewIR() }], idlookup);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_def_1')!;
        const cv = resolveIRView('s1', 'C_State', index, ctx, state.idlookup)!;
        expect(cv.viewId).toBe('V_def');
        expect(cv.labels[0].text(ctx, 's1')).toBe('obj_s1 : State');
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
