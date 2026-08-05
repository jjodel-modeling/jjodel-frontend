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
import { compileView, compileEdgeView, compileRowView, clearCompileCache } from '../irCompile';
import { getIREdgeAnchorOverride, hydrateIREdgeAnchorOverrides, irEdgeLayoutFromOverride, setIREdgeAnchorOverride } from '../irEdgeInteraction';
import { getCollapsedSet, hydrateCollapsed } from '../irCollapseState';
import { makeDrawReadCtx, classAncestryNames, navigateRefHop } from '../irReadCtx';
import { getIRIndex, resolveIRView, resolveRowView } from '../irResolveCore';
import { defaultObjectViewIR, defaultRowViewIR, isMigratedDefaultView, IR_DEFAULT_OBJECT_VIEW_ID } from '../irDefaults';
import {
    buildContainmentModel,
    computeHidden,
    containmentChildren,
    decorateEdges,
    decorateNodes,
    liftEndpoint,
    rowRenderedChildren,
} from '../irContainment';
import { assignGeometricHandles, decorateReferenceEdges, synthesizeObjectAsEdges } from '../irEdgeViews';
import { applyIRPaletteFilter, deriveDroppableChildMetaclasses, deriveIRInteraction, matchConnectRules } from '../irInteraction';
import type { EdgeViewIR, GraphVertexViewIR, RowViewIR, VertexViewIR } from '../irTypes';

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

/**
 * Multi-hop cross-object navigation (spec v1.2 sez. 9). The render accessor and the
 * cross-dep concretization both navigate non-terminal hops through navigateRefHop /
 * ReadCtx.getRef with DRAW semantics (pointer id), so a reference hop resolves the
 * same on both backends. Under lproxy, `.value` on a reference yields a name/proxy
 * (not a pointer id): the discriminating tests below SIMULATE that backend by
 * overriding getValue on a draw ctx — the real lproxy backend imports the joiner and
 * cannot load in node unit tests (same reason the endpoint test "accepts proxy-object
 * endpoints" simulates it). A plain draw ctx would NOT catch the bug (draw already
 * navigates by id today), so these tests exercise the lproxy-like semantics.
 */
describe('IR multi-hop cross-object navigation (spec v1.2 sez. 9)', () => {
    /** tr1 (Transition) --src--> st1 (State){ name='Idle', isInitial=true }; --many--> [st1, st2]; --none--> []. */
    function crossWorld() {
        const idlookup: Record<string, any> = {
            C_State: { id: 'C_State', name: 'State', extends: [] },
            C_Trans: { id: 'C_Trans', name: 'Transition', extends: [] },
            A_name: { id: 'A_name', name: 'name' },
            A_isInitial: { id: 'A_isInitial', name: 'isInitial' },
            R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
            R_many: { id: 'R_many', name: 'many', className: 'DReference', composition: false },
            R_none: { id: 'R_none', name: 'none', className: 'DReference', composition: false },
            st1: { id: 'st1', name: 'S1', instanceof: 'C_State', features: ['vn', 'vi'] },
            vn: { id: 'vn', instanceof: 'A_name', values: ['Idle'] },
            vi: { id: 'vi', instanceof: 'A_isInitial', values: [true] },
            st2: { id: 'st2', name: 'S2', instanceof: 'C_State', features: [] },
            tr1: { id: 'tr1', name: 'go', instanceof: 'C_Trans', features: ['v_src', 'v_many', 'v_none'] },
            v_src: { id: 'v_src', instanceof: 'R_src', values: ['st1'] },
            v_many: { id: 'v_many', instanceof: 'R_many', values: ['st1', 'st2'] },
            v_none: { id: 'v_none', instanceof: 'R_none', values: [] },
        };
        return idlookup;
    }
    /** Draw ctx with getValue overridden to mimic lproxy: a reference slot's `.value`
     *  comes back as a proxy object (with .id), NOT the pointer string. getRef stays
     *  delegated to draw (exactly makeLproxyReadCtx's contract). */
    function lproxyLike(idlookup: Record<string, any>) {
        const base = makeDrawReadCtx(idlookup);
        return {
            ...base,
            getValue: (elementId: string, featureName: string) => {
                const v = base.getValue(elementId, featureName);
                return typeof v === 'string' && idlookup[v] ? { id: v, __mockProxy: true } : v;
            },
        };
    }

    it('navigateRefHop resolves a reference to the target pointer id (draw semantics)', () => {
        const idlookup = crossWorld();
        expect(navigateRefHop(idlookup, 'tr1', 'src', 'value')).toBe('st1');
        expect(navigateRefHop(idlookup, 'tr1', 'many', 0)).toBe('st1');
        expect(navigateRefHop(idlookup, 'tr1', 'many', 1)).toBe('st2');
        expect(navigateRefHop(idlookup, 'tr1', 'many', 'values')).toBeNull(); // whole-array intermediate hop dead-ends
        expect(navigateRefHop(idlookup, 'tr1', 'none', 'value')).toBeNull();  // empty reference
        expect(navigateRefHop(idlookup, 'tr1', 'missing', 'value')).toBeNull(); // absent feature
    });
    it('getRef returns the pointer id on both backends: draw AND lproxy-like (not the proxy .value)', () => {
        const idlookup = crossWorld();
        const draw = makeDrawReadCtx(idlookup);
        expect(draw.getRef('tr1', 'src', 'value')).toBe('st1');
        expect(draw.getRef('tr1', 'none', 'value')).toBeNull();
        const lp = lproxyLike(idlookup);
        expect(lp.getValue('tr1', 'src')).toEqual({ id: 'st1', __mockProxy: true }); // lproxy lies here...
        expect(lp.getRef('tr1', 'src', 'value')).toBe('st1');                         // ...but getRef gives the id
    });
    it('renders a multi-hop label on the lproxy-like backend (was empty before the fix)', () => {
        clearCompileCache();
        const ctx = lproxyLike(crossWorld());
        const cv = compileView('V_cross_lab', vertexIR({
            shape: { form: 'rect', labels: [{ position: 'center', source: { from: 'path', expr: '$src.value.$name.value' } }] },
        }));
        expect(cv.labels[0].text(ctx as any, 'tr1')).toBe('Idle'); // tr1 --src--> st1, read name
    });
    it('evaluates a multi-hop predicate on the lproxy-like backend (F4: multi-hop predicates were undefined before)', () => {
        clearCompileCache();
        const ctx = lproxyLike(crossWorld());
        const cv = compileView('V_cross_pred', vertexIR({
            predicate: { op: 'eq', left: '$src.value.$isInitial.value', right: { kind: 'boolean', value: true } },
        }));
        expect(cv.predicate(ctx as any, 'tr1')).toBe(true);
    });
    it('a multi-hop label over an empty reference degrades to undefined, not a crash', () => {
        clearCompileCache();
        const ctx = lproxyLike(crossWorld());
        const cv = compileView('V_cross_none', vertexIR({
            shape: { form: 'rect', labels: [{ position: 'center', source: { from: 'path', expr: '$none.value.$name.value' } }] },
        }));
        expect(cv.labels[0].text(ctx as any, 'tr1')).toBeUndefined();
    });
    it('single-hop labels are unchanged (never enter the navigation branch)', () => {
        clearCompileCache();
        const idlookup = crossWorld();
        const draw = makeDrawReadCtx(idlookup);
        const ctx = lproxyLike(idlookup);
        const cv = compileView('V_single', vertexIR({
            shape: { form: 'rect', labels: [{ position: 'center', source: { from: 'path', expr: '$name.value' } }] },
        }));
        expect(cv.labels[0].text(draw, 'st1')).toBe('Idle');
        expect(cv.labels[0].text(ctx as any, 'st1')).toBe('Idle'); // lproxy-like identical for a single-hop attribute
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

function rowIR(over: Partial<RowViewIR>): RowViewIR {
    return {
        irVersion: 'ir-1.0', kind: 'row', metaclasses: ['State'],
        template: [{ from: 'intrinsic', prop: 'name' }], ...over,
    } as RowViewIR;
}

describe('irResolveCore row context (Fase R1)', () => {
    /** DState slice over the world() metamodel, sharing viewpoint 'VP', mixing ir kinds. */
    function stateWithIrs(irs: { id: string; ir: any }[]) {
        const { idlookup } = world();
        const lookup: Record<string, any> = { ...idlookup };
        const viewelements: string[] = [];
        for (const v of irs) { lookup[v.id] = { id: v.id, viewpoint: 'VP', ir: v.ir }; viewelements.push(v.id); }
        return { viewpoint: 'VP', viewelements, idlookup: lookup };
    }

    it('routes row views into the row buckets, never into vertex buckets (and vice versa)', () => {
        const state = stateWithIrs([
            { id: 'V_row_state', ir: rowIR({ metaclasses: ['State'] }) },
            { id: 'V_row_wild', ir: rowIR({ metaclasses: '*' }) },
            { id: 'V_vertex', ir: vertexIR({ metaclasses: ['State'] }) },
        ]);
        const index = getIRIndex(state, 'sig_row_buckets')!;
        expect(index.rowByMetaclass.get('State')!.map(e => e.compiled.viewId)).toEqual(['V_row_state']);
        expect(index.rowWildcard.map(e => e.compiled.viewId)).toEqual(['V_row_wild']);
        expect(index.byMetaclass.get('State')!.map(e => e.compiled.viewId)).toEqual(['V_vertex']);
        // cross-context isolation: no row id leaks into vertex buckets, no vertex into row
        expect(index.byMetaclass.get('State')!.some(e => e.compiled.viewId.startsWith('V_row'))).toBe(false);
        expect(index.rowByMetaclass.get('State')!.some(e => e.compiled.viewId === 'V_vertex')).toBe(false);
        // a row resolves only via resolveRowView, a vertex only via resolveIRView
        const ctx = makeDrawReadCtx(state.idlookup);
        expect(resolveRowView('s1', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_row_state');
        expect(resolveIRView('s1', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_vertex');
    });

    it('ignores an unknown kind without throwing (gate drops it silently)', () => {
        const state = stateWithIrs([
            { id: 'V_banana', ir: { irVersion: 'ir-1.0', kind: 'banana', metaclasses: ['State'] } },
            { id: 'V_row', ir: rowIR({ metaclasses: ['State'] }) },
        ]);
        const index = getIRIndex(state, 'sig_row_unknown')!;
        expect(index.viewIds).toEqual(['V_row']);   // banana dropped, no throw
        expect(index.rowByMetaclass.get('State')!.map(e => e.compiled.viewId)).toEqual(['V_row']);
    });

    it('resolves rows with the vertex cascade: exact > inherited > wildcard', () => {
        const state = stateWithIrs([
            { id: 'V_row_named', ir: rowIR({ metaclasses: ['Named'] }) },
            { id: 'V_row_final', ir: rowIR({ metaclasses: ['FinalState'] }) },
            { id: 'V_row_wild', ir: rowIR({ metaclasses: '*' }) },
        ]);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_row_cascade')!;
        expect(resolveRowView('s2', 'C_Final', index, ctx, state.idlookup)!.viewId).toBe('V_row_final'); // exact
        expect(resolveRowView('s1', 'C_State', index, ctx, state.idlookup)!.viewId).toBe('V_row_named'); // inherited beats wildcard
    });

    it('priority beats specificity; declaration order breaks total ties; false predicate falls through', () => {
        const s1 = stateWithIrs([
            { id: 'V_row_named_hi', ir: rowIR({ metaclasses: ['Named'], priority: 10 }) },
            { id: 'V_row_final_lo', ir: rowIR({ metaclasses: ['FinalState'], priority: 0 }) },
        ]);
        const i1 = getIRIndex(s1, 'sig_row_prio')!;
        // s2 FinalState: inherited Named at priority 10 beats exact FinalState at 0
        expect(resolveRowView('s2', 'C_Final', i1, makeDrawReadCtx(s1.idlookup), s1.idlookup)!.viewId).toBe('V_row_named_hi');

        const s2 = stateWithIrs([
            { id: 'V_row_a', ir: rowIR({ metaclasses: ['State'] }) },
            { id: 'V_row_b', ir: rowIR({ metaclasses: ['State'] }) },
        ]);
        const i2 = getIRIndex(s2, 'sig_row_declorder')!;
        expect(resolveRowView('s1', 'C_State', i2, makeDrawReadCtx(s2.idlookup), s2.idlookup)!.viewId).toBe('V_row_a');

        const s3 = stateWithIrs([
            { id: 'V_row_gated', ir: rowIR({ metaclasses: ['State'], priority: 5,
                predicate: { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } } }) },
            { id: 'V_row_fallback', ir: rowIR({ metaclasses: '*' }) },
        ]);
        const i3 = getIRIndex(s3, 'sig_row_pred')!;
        const ctx3 = makeDrawReadCtx(s3.idlookup);
        expect(resolveRowView('s1', 'C_State', i3, ctx3, s3.idlookup)!.viewId).toBe('V_row_gated');    // predicate true
        expect(resolveRowView('s3', 'C_State', i3, ctx3, s3.idlookup)!.viewId).toBe('V_row_fallback'); // predicate false → wildcard
    });

    it('returns null when the viewpoint has no row view for the object (vertex-only)', () => {
        const state = stateWithIrs([{ id: 'V_vertex_only', ir: vertexIR({ metaclasses: ['State'] }) }]);
        const ctx = makeDrawReadCtx(state.idlookup);
        const index = getIRIndex(state, 'sig_row_none')!;
        expect(resolveRowView('s1', 'C_State', index, ctx, state.idlookup)).toBeNull();
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
        // E0 (D1): style is emitted in domain vocabulary onto e.data (consumed by UnifiedEdge),
        // no longer on e.style / RF markers.
        expect((next.data as any).irStroke).toBe('#0ea5e9');
        expect((next.data as any).irStrokeWidth).toBe(2);
        expect((next.data as any).irStrokeDasharray).toBe('6 4');
        expect((next.data as any).irTargetTermination).toBe('closedArrow');
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

describe('matchConnectRules (wiring connect gesture, discovery 2026-07-20)', () => {
    // Minimal MetaclassInfo-shaped fixtures (only the fields the matcher reads).
    const ref = (name: string, targetClassId: string) =>
        ({ id: `R_${name}`, name, targetClassId, targetClassName: '', containment: false }) as any;
    const cls = (id: string, name: string, opts: { isAbstract?: boolean; references?: any[]; concreteSubclasses?: any[] } = {}) =>
        ({ id, name, isAbstract: !!opts.isAbstract, attributes: [], references: opts.references ?? [], concreteSubclasses: opts.concreteSubclasses ?? [] }) as any;

    const state = cls('C_State', 'State');
    const finalState = cls('C_Final', 'FinalState');
    const abstractNode = cls('C_Node', 'Node', { isAbstract: true, concreteSubclasses: [state, finalState] });
    const transition = cls('C_Trans', 'Transition', {
        references: [ref('src', 'C_Node'), ref('tgt', 'C_Node')],
    });
    const allClasses = [state, finalState, abstractNode, transition];
    const planWith = (rules: any[]) => ({ paletteMetaclasses: null, connectRules: rules, dropContainers: [] });
    const rule = { edgeMetaclass: 'Transition', sourceFeature: 'src', targetFeature: 'tgt' };

    it('matches when both endpoints conform via concrete descendants of the declared target', () => {
        const out = matchConnectRules(planWith([rule]), 'C_State', 'C_Final', allClasses);
        expect(out).toHaveLength(1);
        expect(out[0].edgeClass.name).toBe('Transition');
        expect(out[0].sourceRef.name).toBe('src');
        expect(out[0].targetRef.name).toBe('tgt');
    });
    it('matches on direct target id and rejects a non-conforming endpoint', () => {
        const directRule = { edgeMetaclass: 'Transition', sourceFeature: 'src', targetFeature: 'tgt' };
        const trans2 = cls('C_Trans2', 'Transition', { references: [ref('src', 'C_State'), ref('tgt', 'C_State')] });
        const world = [state, finalState, trans2];
        expect(matchConnectRules(planWith([directRule]), 'C_State', 'C_State', world)).toHaveLength(1);
        expect(matchConnectRules(planWith([directRule]), 'C_State', 'C_Final', world)).toHaveLength(0);
    });
    it('skips malformed rules: unknown metaclass, missing feature, null features, abstract edge class', () => {
        const rules = [
            { edgeMetaclass: 'Ghost', sourceFeature: 'src', targetFeature: 'tgt' },
            { edgeMetaclass: 'Transition', sourceFeature: 'nope', targetFeature: 'tgt' },
            { edgeMetaclass: 'Transition', sourceFeature: null, targetFeature: 'tgt' },
            { edgeMetaclass: 'Node', sourceFeature: 'src', targetFeature: 'tgt' },
        ];
        expect(matchConnectRules(planWith(rules), 'C_State', 'C_State', allClasses)).toHaveLength(0);
    });
    it('null plan or empty rules → empty result', () => {
        expect(matchConnectRules(null, 'C_State', 'C_State', allClasses)).toEqual([]);
        expect(matchConnectRules(planWith([]), 'C_State', 'C_State', allClasses)).toEqual([]);
    });
});

describe('deriveDroppableChildMetaclasses (palette extension D4, discovery 2026-07-20)', () => {
    const cref = (name: string, targetClassId: string, containment: boolean) =>
        ({ id: `R_${name}`, name, targetClassId, targetClassName: '', containment }) as any;
    const mcls = (id: string, name: string, opts: { isAbstract?: boolean; references?: any[]; concreteSubclasses?: any[] } = {}) =>
        ({ id, name, isAbstract: !!opts.isAbstract, attributes: [], references: opts.references ?? [], concreteSubclasses: opts.concreteSubclasses ?? [] }) as any;

    const state = mcls('C_State', 'State');
    const finalState = mcls('C_Final', 'FinalState');
    const abstractNode = mcls('C_Node', 'Node', { isAbstract: true, concreteSubclasses: [state, finalState] });
    const transition = mcls('C_Trans', 'Transition');
    const machine = mcls('C_Machine', 'Machine', {
        references: [cref('states', 'C_Node', true), cref('transitions', 'C_Trans', true), cref('linked', 'C_State', false)],
    });
    const allClasses = [state, finalState, abstractNode, transition, machine];
    const planWith = (dropContainers: string[]) => ({ paletteMetaclasses: null, connectRules: [], dropContainers });

    it('collects concrete targets and descendants of containment refs, skipping abstract and non-containment', () => {
        const out = deriveDroppableChildMetaclasses(planWith(['Machine']), allClasses);
        expect(out).toEqual(new Set(['State', 'FinalState', 'Transition']));
    });
    it('unknown container or empty dropContainers → empty set', () => {
        expect(deriveDroppableChildMetaclasses(planWith(['Ghost']), allClasses).size).toBe(0);
        expect(deriveDroppableChildMetaclasses(planWith([]), allClasses).size).toBe(0);
        expect(deriveDroppableChildMetaclasses(null, allClasses).size).toBe(0);
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
    it('marker + authoringMetaclassPins → STILL delegated (the pin is not identity)', () => {
        // Task 1.3: the pin is authoring metadata the resolver never reads. Were it
        // part of the comparison, writing it would silently move every migrated
        // default view off native rendering — a diffuse change with no visible cause.
        const pinned = {
            ...defaultObjectViewIR(),
            migratedFrom: 'classic-default',
            authoringMetaclassPins: { State: 'ptr_B_State' },
        } as unknown as VertexViewIR;
        const cv = compileView('V_mig_pinned', pinned);
        expect(isMigratedDefaultView(cv)).toBe(true);
    });
    it('two migrated defaults differing ONLY by the pin compare equal', () => {
        // The exclusion is inside isMigratedDefaultView (canonicalize is private and
        // stays a pure key-sort), so equality is observable only through it.
        const a = {
            ...defaultObjectViewIR(),
            migratedFrom: 'classic-default',
            authoringMetaclassPins: { State: 'ptr_A_State' },
        } as unknown as VertexViewIR;
        const b = {
            ...defaultObjectViewIR(),
            migratedFrom: 'classic-default',
            authoringMetaclassPins: { State: 'ptr_B_State' },
        } as unknown as VertexViewIR;
        expect(isMigratedDefaultView(compileView('V_pin_a', a))).toBe(true);
        expect(isMigratedDefaultView(compileView('V_pin_b', b))).toBe(true);
    });
    it('marker + pin + a real edit → interpreter, no delegation (the pin does not mask edits)', () => {
        // Guard against over-excluding: the pin must not make an edited view look
        // like the factory.
        const edited = {
            ...defaultObjectViewIR(),
            migratedFrom: 'classic-default',
            authoringMetaclassPins: { State: 'ptr_B_State' },
            priority: 7,
        } as unknown as VertexViewIR;
        const cv = compileView('V_mig_pin_edit', edited);
        expect(isMigratedDefaultView(cv)).toBe(false);
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

describe('rowRenderedChildren + children compartment (Fase R2)', () => {
    /** Class/Feature/Attribute/Operation metamodel; Person owns [name, surname (Attribute), greet (Operation)]. */
    function classWorld() {
        const idlookup: Record<string, any> = {
            C_Named: { id: 'C_Named', name: 'NamedElement', extends: [] },
            C_Class: { id: 'C_Class', name: 'Class', extends: ['C_Named'] },
            C_Feature: { id: 'C_Feature', name: 'Feature', extends: ['C_Named'] },
            C_Attr: { id: 'C_Attr', name: 'Attribute', extends: ['C_Feature'] },
            C_Op: { id: 'C_Op', name: 'Operation', extends: ['C_Feature'] },
            R_owned: { id: 'R_owned', name: 'ownedFeatures', className: 'DReference', composition: true },
            person: { id: 'person', name: 'Person', instanceof: 'C_Class', features: ['v_owned'] },
            v_owned: { id: 'v_owned', instanceof: 'R_owned', values: ['a_name', 'a_surname', 'op_greet'] },
            a_name: { id: 'a_name', name: 'name', instanceof: 'C_Attr', features: [] },
            a_surname: { id: 'a_surname', name: 'surname', instanceof: 'C_Attr', features: [] },
            op_greet: { id: 'op_greet', name: 'greet', instanceof: 'C_Op', features: [] },
        };
        return { idlookup, ctx: makeDrawReadCtx(idlookup) };
    }
    const classIR = (compartments: any[]): VertexViewIR => ({
        irVersion: 'ir-1.0', kind: 'vertex', metaclasses: ['Class'],
        shape: { form: 'rect' }, fieldCompartments: compartments,
    });

    it('returns [] for a view without a children compartment', () => {
        clearCompileCache();
        const { idlookup, ctx } = classWorld();
        const cv = compileView('v_slot', classIR([{ id: 'a', source: { from: 'attributes' }, rowFormat: { segments: [{ kind: 'name' }] } }]));
        expect(rowRenderedChildren(cv, ctx, 'person', idlookup)).toEqual([]);
    });

    it('no filter → all containment children in slot order; childFilter undefined', () => {
        clearCompileCache();
        const { idlookup, ctx } = classWorld();
        const cv = compileView('v_all', classIR([{ id: 'f', source: { from: 'children' }, rowFormat: { segments: [] } }]));
        expect(cv.fieldCompartments[0].source).toBe('children');
        expect(cv.fieldCompartments[0].childFilter).toBeUndefined();
        expect(rowRenderedChildren(cv, ctx, 'person', idlookup)).toEqual(['a_name', 'a_surname', 'op_greet']);
    });

    it('isKind filter on the subtype includes only matching children (Operation excluded)', () => {
        clearCompileCache();
        const { idlookup, ctx } = classWorld();
        const cv = compileView('v_attr', classIR([
            { id: 'f', source: { from: 'children', filter: { op: 'isKind', class: 'Attribute' } }, rowFormat: { segments: [] } },
        ]));
        expect(typeof cv.fieldCompartments[0].childFilter).toBe('function');
        expect(rowRenderedChildren(cv, ctx, 'person', idlookup)).toEqual(['a_name', 'a_surname']);
    });

    it('isKind filter on a superclass includes subtypes (Attribute AND Operation are Features)', () => {
        clearCompileCache();
        const { idlookup, ctx } = classWorld();
        const cv = compileView('v_feat', classIR([
            { id: 'f', source: { from: 'children', filter: { op: 'isKind', class: 'Feature' } }, rowFormat: { segments: [] } },
        ]));
        expect(rowRenderedChildren(cv, ctx, 'person', idlookup)).toEqual(['a_name', 'a_surname', 'op_greet']);
    });

    it('two children compartments union without duplicates, first-occurrence (containment) order', () => {
        clearCompileCache();
        const { idlookup, ctx } = classWorld();
        const cv = compileView('v_two', classIR([
            { id: 'attrs', source: { from: 'children', filter: { op: 'isKind', class: 'Attribute' } }, rowFormat: { segments: [] } },
            { id: 'ops', source: { from: 'children', filter: { op: 'isKind', class: 'Operation' } }, rowFormat: { segments: [] } },
        ]));
        expect(rowRenderedChildren(cv, ctx, 'person', idlookup)).toEqual(['a_name', 'a_surname', 'op_greet']);
    });

    it('empty rowFormat.segments compiles for a children compartment (no throw)', () => {
        clearCompileCache();
        expect(() => compileView('v_empty', classIR([{ id: 'f', source: { from: 'children' }, rowFormat: { segments: [] } }]))).not.toThrow();
    });

    it('fallback: a child with no matching row view resolves null → default row view renders the name', () => {
        clearCompileCache();
        const { idlookup, ctx } = classWorld();
        const state = { viewpoint: 'VP', viewelements: ['V_row_attr'], idlookup: {
            ...idlookup,
            V_row_attr: { id: 'V_row_attr', viewpoint: 'VP', ir: { irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Attribute'], template: [{ from: 'intrinsic', prop: 'name' }] } },
        } };
        const index = getIRIndex(state, 'sig_r2_fallback')!;
        expect(resolveRowView('a_name', 'C_Attr', index, ctx, state.idlookup)!.viewId).toBe('V_row_attr'); // exact row view
        expect(resolveRowView('op_greet', 'C_Op', index, ctx, state.idlookup)).toBeNull();                 // no match → caller falls back
        const def = compileRowView('def_row', defaultRowViewIR());
        expect(def.template).toHaveLength(1);
        expect(def.template[0](ctx, 'op_greet')).toBe('greet'); // intrinsic name fallback
    });
});
