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
import type { VertexViewIR } from '../irTypes';

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
