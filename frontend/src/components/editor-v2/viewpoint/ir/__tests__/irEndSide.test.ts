/**
 * The per-form side rule of an edge end (P-2026-10-03-1304, Q2 and Q4 (a),
 * docs/discovery/discovery_2026-10-03_derived_notations_edges.md §3.2 and §3.4, docs/lir/lir_2026-10-03_end_side_rule.md).
 *
 * - A bar takes only its two long sides: left/right when upright, top/bottom when lying, whatever the neighbour.
 * - A diamond takes the side facing the other end that no other end of it holds yet; it shares its best side only when
 *   no free side faces the other end.
 * - Every other form takes the dominant axis, as before (byte for byte without a form).
 * - The synthesis tags an end on a bar or a diamond (`irSourceForm` / `irTargetForm`), and only those.
 */
import { describe, expect, it } from 'vitest';
import { clearCompileCache } from '../irCompile';
import { assignGeometricHandles, endSideFor, synthesizeObjectAsEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { validateIR } from '../irValidate';
import { resetBarOrientations } from '../barOrientation';
import { makeDrawReadCtx } from '../irReadCtx';
import type { EdgeViewIR, VertexViewIR } from '../irTypes';

const UPRIGHT = { width: 12, height: 56 };
const LYING = { width: 120, height: 7 };
const SQUARE = { width: 36, height: 36 };

describe('endSideFor: a bar takes only its long sides', () => {
    it('upright: left or right by where the other end lies across, even when it lies mostly above or below', () => {
        expect(endSideFor('bar', UPRIGHT, { x: 10, y: -300 })).toBe('right');
        expect(endSideFor('bar', UPRIGHT, { x: -10, y: 300 })).toBe('left');
        expect(endSideFor('bar', UPRIGHT, { x: 300, y: 0 })).toBe('right');
    });

    it('lying: top or bottom by where the other end lies along, even when it lies mostly to a side', () => {
        expect(endSideFor('bar', LYING, { x: -800, y: 285 })).toBe('bottom');
        expect(endSideFor('bar', LYING, { x: 800, y: -5 })).toBe('top');
        expect(endSideFor('bar', LYING, { x: 0, y: 100 })).toBe('bottom');
    });

    it('a bar shares a long side rather than take a short one: what is taken does not move it', () => {
        expect(endSideFor('bar', UPRIGHT, { x: 10, y: -300 }, new Set(['right']))).toBe('right');
    });
});

describe('endSideFor: a diamond spreads its ends over its sides', () => {
    it('free: the side facing the other end', () => {
        expect(endSideFor('diamond', SQUARE, { x: 61, y: -112 })).toBe('top');
        expect(endSideFor('diamond', SQUARE, { x: 2, y: 154 })).toBe('bottom');
    });

    it('its best side taken: the next side that still faces the other end (DemoFlowB d1 after the layout: the loop-back on the right)', () => {
        expect(endSideFor('diamond', SQUARE, { x: 61, y: -112 }, new Set(['top']))).toBe('right');
        expect(endSideFor('diamond', SQUARE, { x: -61, y: -112 }, new Set(['top']))).toBe('left');
    });

    it('no free side faces the other end: it shares its best side (DemoFlowB d1 at rest, work straight to the left)', () => {
        expect(endSideFor('diamond', SQUARE, { x: -378, y: 4 }, new Set(['left']))).toBe('left');
    });
});

describe('endSideFor: any other form keeps the dominant axis', () => {
    it('as assignGeometricHandles chose before, the tie to the horizontal side', () => {
        for (const form of [undefined, 'rect', 'rounded', 'circle']) {
            expect(endSideFor(form, SQUARE, { x: 100, y: -40 }), String(form)).toBe('right');
            expect(endSideFor(form, SQUARE, { x: 10, y: -40 }), String(form)).toBe('top');
            expect(endSideFor(form, SQUARE, { x: -50, y: 50 }), String(form)).toBe('left');
            expect(endSideFor(form, SQUARE, { x: 0, y: 0 }), String(form)).toBe('right');
        }
    });
});

describe('assignGeometricHandles with the forms', () => {
    const node = (id: string, x: number, y: number, w: number, h: number) => ({ id, position: { x, y }, measured: { width: w, height: h } });
    const nodes = new Map<string, any>([
        ['P', node('P', 0, 0, 44, 44)], ['T', node('T', 10, 200, 12, 56)], ['D', node('D', 300, 300, 36, 36)], ['W', node('W', 340, 100, 142, 44)],
    ]);
    const formOf = (id: string) => ({ T: 'bar', D: 'diamond' } as Record<string, string>)[id];

    it('a place above an upright bar enters it on a long side; without the forms, on the short top (before)', () => {
        const e = { id: 'a', source: 'P', target: 'T', data: {} } as any;
        // P's centre lies 6 px right of the bar's: the right long side.
        expect(assignGeometricHandles(e, nodes, [], formOf).targetHandle).toBe('right-0');
        expect(assignGeometricHandles(e, nodes, []).targetHandle).toBe('top-0');
    });

    it('two ends from above on a diamond: the second takes the free side facing its other end', () => {
        const into = { id: 'f2', source: 'W', target: 'D', data: {} } as any;
        const back = { id: 'f3', source: 'D', target: 'W', data: {} } as any;
        const first = assignGeometricHandles(into, nodes, [], formOf);
        expect(first.targetHandle).toBe('top-0');
        expect(assignGeometricHandles(back, nodes, [first], formOf).sourceHandle).toBe('right-0');
        // Two entering from above (a merge): the second target takes the free facing side too.
        const into2 = { id: 'f9', source: 'W', target: 'D', data: {} } as any;
        expect(assignGeometricHandles(into2, nodes, [first], formOf).targetHandle).toBe('right-0');
        // Without the forms both took the top, at two slots of one side.
        expect(assignGeometricHandles(back, nodes, [assignGeometricHandles(into, nodes, [])]).sourceHandle).toBe('top-0');
    });
});

describe('synthesizeObjectAsEdges: the sides and the form tags', () => {
    const viewOf = (form: string): VertexViewIR => ({
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: [form === 'bar' ? 'Transition' : 'Place'],
        shape: { form: form as never, labels: [] },
    });
    const arcView: EdgeViewIR = { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Arc'], edge: { source: '$src.value', target: '$tgt.value' } };

    function synth(sig: string) {
        const idlookup: Record<string, any> = {
            C_Place: { id: 'C_Place', name: 'Place', extends: [] },
            C_Trans: { id: 'C_Trans', name: 'Transition', extends: [] },
            C_Arc: { id: 'C_Arc', name: 'Arc', extends: [] },
            R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
            R_tgt: { id: 'R_tgt', name: 'tgt', className: 'DReference', composition: false },
            p1: { id: 'p1', name: 'p1', instanceof: 'C_Place', features: [] },
            p2: { id: 'p2', name: 'p2', instanceof: 'C_Place', features: [] },
            t1: { id: 't1', name: 't1', instanceof: 'C_Trans', features: [] },
        };
        // p1 above t1 (an upright bar), p2 to the right of p1: a1 p1 -> t1, a2 p1 -> p2.
        for (const [a, s, t] of [['a1', 'p1', 't1'], ['a2', 'p1', 'p2']]) {
            idlookup[a] = { id: a, name: a, instanceof: 'C_Arc', features: [`${a}_src`, `${a}_tgt`] };
            idlookup[`${a}_src`] = { id: `${a}_src`, instanceof: 'R_src', values: [s] };
            idlookup[`${a}_tgt`] = { id: `${a}_tgt`, instanceof: 'R_tgt', values: [t] };
        }
        const state = {
            viewpoint: 'VP', viewelements: ['V_arc', 'V_place', 'V_bar'],
            idlookup: {
                ...idlookup,
                V_arc: { id: 'V_arc', viewpoint: 'VP', ir: arcView },
                V_place: { id: 'V_place', viewpoint: 'VP', ir: viewOf('circle') },
                V_bar: { id: 'V_bar', viewpoint: 'VP', ir: viewOf('bar') },
            },
        };
        const nodes: any[] = [
            { id: 'V1', type: 'objectNode', position: { x: 0, y: 0 }, measured: { width: 44, height: 44 }, data: {} },
            { id: 'V2', type: 'objectNode', position: { x: 400, y: 0 }, measured: { width: 44, height: 44 }, data: {} },
            { id: 'VT', type: 'objectNode', position: { x: 10, y: 200 }, measured: { width: 12, height: 56 }, data: {} },
        ];
        const objByVertex = new Map([['V1', 'p1'], ['V2', 'p2'], ['VT', 't1']]);
        const vertexByObj = new Map([['p1', 'V1'], ['p2', 'V2'], ['t1', 'VT']]);
        const index = getIRIndex(state, sig)!;
        const res = synthesizeObjectAsEdges(nodes, [], objByVertex, vertexByObj, index, makeDrawReadCtx(state.idlookup), state.idlookup, undefined, new Map(), new Set(['a1', 'a2']));
        return Object.fromEntries(res.edges.map(e => [e.id, e]));
    }

    it('the arc into the bar enters a long side and carries the bar\'s tag; the arc between two circles carries none', () => {
        clearCompileCache();
        const e = synth('end_side_synth');
        expect(e.irobj_a1.targetHandle).toBe('right-0');
        expect((e.irobj_a1.data as any).irTargetForm).toBe('bar');
        expect('irSourceForm' in (e.irobj_a1.data as any)).toBe(false);
        expect([e.irobj_a2.sourceHandle, e.irobj_a2.targetHandle]).toEqual(['right-0', 'left-0']);
        expect(['irSourceForm', 'irTargetForm'].some(k => k in (e.irobj_a2.data as any))).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Q3 (P-2026-10-03-1304): a bar that declares a thickness turns in its square box
// ---------------------------------------------------------------------------

describe('Q3: the side rule reads the orientation when the box is square', () => {
    const SQUARE_BAR = { width: 56, height: 56 };
    it('upright: left or right, lying: top or bottom, whatever the square box says', () => {
        expect(endSideFor('bar', SQUARE_BAR, { x: 10, y: -300 }, new Set(), 'upright')).toBe('right');
        expect(endSideFor('bar', SQUARE_BAR, { x: 300, y: 10 }, new Set(), 'lying')).toBe('bottom');
        // Without an orientation, the box decides as before (a square reads upright).
        expect(endSideFor('bar', SQUARE_BAR, { x: 10, y: -300 })).toBe('right');
    });
});

describe('Q3: ShapeSpec.barThickness in the validator', () => {
    const bar = (t: unknown): VertexViewIR => ({ irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['T'], shape: { form: 'bar', labels: [], barThickness: t as never } });
    it('a positive number or absent; anything else refused', () => {
        expect(validateIR('q3_ok', bar(12))).toEqual({ ok: true });
        expect(validateIR('q3_abs', { ...bar(1), shape: { form: 'bar', labels: [] } })).toEqual({ ok: true });
        for (const v of [0, -3, '12', null, Number.NaN]) {
            const r = validateIR('q3_bad', bar(v));
            expect(r.ok, String(v)).toBe(false);
            expect(!r.ok && r.error).toContain('barThickness');
        }
    });
});

describe('Q3: the synthesis turns a bar with a thickness, and holds it during a drag', () => {
    function world(placeAt: { x: number; y: number }, thickness: number | undefined, dragging = false) {
        const idlookup: Record<string, any> = {
            C_Place: { id: 'C_Place', name: 'Place', extends: [] },
            C_Trans: { id: 'C_Trans', name: 'Transition', extends: [] },
            C_Arc: { id: 'C_Arc', name: 'Arc', extends: [] },
            R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
            R_tgt: { id: 'R_tgt', name: 'tgt', className: 'DReference', composition: false },
            p1: { id: 'p1', name: 'p1', instanceof: 'C_Place', features: [] },
            t1: { id: 't1', name: 't1', instanceof: 'C_Trans', features: [] },
            a1: { id: 'a1', name: 'a1', instanceof: 'C_Arc', features: ['a1_src', 'a1_tgt'] },
            a1_src: { id: 'a1_src', instanceof: 'R_src', values: ['p1'] },
            a1_tgt: { id: 'a1_tgt', instanceof: 'R_tgt', values: ['t1'] },
        };
        const barView: VertexViewIR = {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Transition'],
            shape: { form: 'bar', labels: [], ...(thickness ? { barThickness: thickness } : {}) },
        };
        const placeView: VertexViewIR = { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Place'], shape: { form: 'circle', labels: [] } };
        const arcView: EdgeViewIR = { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Arc'], edge: { source: '$src.value', target: '$tgt.value' } };
        const state = {
            viewpoint: 'VP', viewelements: ['V_arc', 'V_place', 'V_bar'],
            idlookup: { ...idlookup, V_arc: { id: 'V_arc', viewpoint: 'VP', ir: arcView }, V_place: { id: 'V_place', viewpoint: 'VP', ir: placeView }, V_bar: { id: 'V_bar', viewpoint: 'VP', ir: barView } },
        };
        const nodes: any[] = [
            { id: 'V1', type: 'objectNode', position: placeAt, measured: { width: 44, height: 44 }, data: {}, ...(dragging ? { dragging: true } : {}) },
            { id: 'VT', type: 'objectNode', position: { x: 300, y: 300 }, measured: { width: 56, height: 56 }, data: {} },
        ];
        return { state, nodes, objByVertex: new Map([['V1', 'p1'], ['VT', 't1']]), vertexByObj: new Map([['p1', 'V1'], ['t1', 'VT']]) };
    }
    function run(placeAt: { x: number; y: number }, thickness: number | undefined, sig: string, dragging = false) {
        const { state, nodes, objByVertex, vertexByObj } = world(placeAt, thickness, dragging);
        const index = getIRIndex(state, sig)!;
        const res = synthesizeObjectAsEdges(nodes, [], objByVertex, vertexByObj, index, makeDrawReadCtx(state.idlookup), state.idlookup, undefined, new Map(), new Set(['a1']));
        return { bar: res.nodes.find(n => n.id === 'VT')!, arc: res.edges.find(e => e.id === 'irobj_a1')! };
    }

    it('a place above: the bar lies, its node data says so with the thickness, the arc enters its top', () => {
        resetBarOrientations('q3_synth_1');
        clearCompileCache();
        const { bar, arc } = run({ x: 306, y: 0 }, 12, 'q3_synth_1');
        expect((bar.data as any).irBarOrientation).toBe('lying');
        expect((bar.data as any).irBarThickness).toBe(12);
        expect(arc.targetHandle).toBe('top-0');
    });

    it('a place to the left: the bar stands, the arc enters its left', () => {
        resetBarOrientations('q3_synth_2');
        clearCompileCache();
        const { bar, arc } = run({ x: 0, y: 306 }, 12, 'q3_synth_2');
        expect((bar.data as any).irBarOrientation).toBe('upright');
        expect(arc.targetHandle).toBe('left-0');
    });

    it('while any node is dragged the bar keeps its orientation; released, it turns', () => {
        resetBarOrientations('q3_synth_3');
        clearCompileCache();
        expect((run({ x: 306, y: 0 }, 12, 'q3_synth_3').bar.data as any).irBarOrientation).toBe('lying');
        expect((run({ x: 0, y: 306 }, 12, 'q3_synth_3', true).bar.data as any).irBarOrientation).toBe('lying');
        expect((run({ x: 0, y: 306 }, 12, 'q3_synth_3', false).bar.data as any).irBarOrientation).toBe('upright');
    });

    it('a bar without a thickness (a saved view) is not turned and carries no key', () => {
        resetBarOrientations('q3_synth_4');
        clearCompileCache();
        const { bar } = run({ x: 306, y: 0 }, undefined, 'q3_synth_4');
        expect(['irBarOrientation', 'irBarThickness'].some(k => k in ((bar.data ?? {}) as any))).toBe(false);
    });
});
