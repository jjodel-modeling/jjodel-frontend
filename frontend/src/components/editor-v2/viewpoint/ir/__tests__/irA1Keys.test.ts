/**
 * Slice A1 (P-2026-09-30-0355, R-VP-22): the two optional IR keys, `ShapeSpec.entry` and
 * `EdgeViewIR.edge.curve`, through the compile, the validator and the edge-view pass.
 *
 * Absent keys are pinned by the C2 tests of ir.test.ts (the irHash of every fixture view and the
 * compiled key lists, measured on the C1 tip): those stay green, so an IR without the keys compiles
 * to what it compiled to. Here: the keys present, their vocabulary, and what irEdgeViews does with
 * `curve` (the edge data, and the two top handles of an arc self-loop).
 */
import { describe, expect, it } from 'vitest';
import { clearCompileCache, compileEdgeView, compileView, irHash } from '../irCompile';
import { validateIR } from '../irValidate';
import { assignGeometricHandles, synthesizeObjectAsEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { makeDrawReadCtx } from '../irReadCtx';
import type { EdgeViewIR, VertexViewIR } from '../irTypes';

const stateBox = (over: Partial<VertexViewIR['shape']> = {}): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
    shape: { form: 'rounded', labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' } }], ...over },
});
const transition = (over: Partial<EdgeViewIR['edge']> = {}): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'],
    edge: { source: '$src.value', target: '$tgt.value', ...over },
});

describe('ShapeSpec.entry — the entry mark (R-VP-22)', () => {
    it('compiles to the value when declared, and is absent from the compile when not', () => {
        clearCompileCache();
        expect(compileView('a1_dot', stateBox({ entry: 'dot' })).entry).toBe('dot');
        expect(compileView('a1_arrow', stateBox({ entry: 'arrow' })).entry).toBe('arrow');
        expect('entry' in compileView('a1_none', stateBox())).toBe(false);
    });

    it('an unknown value renders as absent (permissive render) and is refused by the validator', () => {
        clearCompileCache();
        const bad = stateBox({ entry: 'disc' as never });
        expect('entry' in compileView('a1_bad', bad)).toBe(false);
        const r = validateIR('a1_bad', bad);
        expect(r.ok).toBe(false);
        expect(!r.ok && r.error).toContain('shape.entry must be one of dot | arrow');
        for (const v of ['', 1, null, 'DOT']) expect(validateIR('a1_bad2', stateBox({ entry: v as never })).ok, String(v)).toBe(false);
    });

    it('the validator accepts both values and the absent key', () => {
        for (const v of ['dot', 'arrow', undefined]) expect(validateIR('a1_ok', stateBox(v ? { entry: v as never } : {})), String(v)).toEqual({ ok: true });
    });

    it('round-trips as JSON and moves the irHash (the compile cache keeps the two apart)', () => {
        const ir = stateBox({ entry: 'dot' });
        expect(JSON.parse(JSON.stringify(ir))).toEqual(ir);
        expect(irHash(ir)).not.toBe(irHash(stateBox()));
        expect(irHash(stateBox({ entry: 'arrow' }))).not.toBe(irHash(ir));
    });
});

describe('EdgeViewIR.edge.curve — the arc (R-VP-22)', () => {
    it('compiles to `arc` when declared, and is absent from the compile when not', () => {
        clearCompileCache();
        expect(compileEdgeView('a1_arc', transition({ curve: 'arc' })).curve).toBe('arc');
        expect('curve' in compileEdgeView('a1_plain', transition())).toBe(false);
    });

    it('an unknown value renders as absent and is refused by the validator', () => {
        clearCompileCache();
        const bad = transition({ curve: 'bezier' as never });
        expect('curve' in compileEdgeView('a1_bez', bad)).toBe(false);
        const r = validateIR('a1_bez', bad);
        expect(r.ok).toBe(false);
        expect(!r.ok && r.error).toContain('edge.curve must be arc');
        for (const v of ['', 0, null, 'ARC']) expect(validateIR('a1_bez2', transition({ curve: v as never })).ok, String(v)).toBe(false);
        expect(validateIR('a1_arc_ok', transition({ curve: 'arc' }))).toEqual({ ok: true });
        expect(validateIR('a1_arc_none', transition())).toEqual({ ok: true });
    });

    it('round-trips as JSON and moves the irHash', () => {
        const ir = transition({ curve: 'arc' });
        expect(JSON.parse(JSON.stringify(ir))).toEqual(ir);
        expect(irHash(ir)).not.toBe(irHash(transition()));
    });
});

// ---------------------------------------------------------------------------
// irEdgeViews: the edge data, and the handles of an arc self-loop (C3 causes 1 and 2)
// ---------------------------------------------------------------------------

/** Two states and three transitions: s1 → s2, s2 → s1, s1 → s1. */
function turnstile() {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        C_Trans: { id: 'C_Trans', name: 'Transition', extends: [] },
        R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
        R_tgt: { id: 'R_tgt', name: 'tgt', className: 'DReference', composition: false },
        s1: { id: 's1', name: 'locked', instanceof: 'C_State', features: [] },
        s2: { id: 's2', name: 'unlocked', instanceof: 'C_State', features: [] },
    };
    const pairs: [string, string, string][] = [['t1', 's1', 's2'], ['t2', 's2', 's1'], ['t3', 's1', 's1']];
    for (const [t, a, b] of pairs) {
        idlookup[t] = { id: t, name: t, instanceof: 'C_Trans', features: [`${t}_src`, `${t}_tgt`] };
        idlookup[`${t}_src`] = { id: `${t}_src`, instanceof: 'R_src', values: [a] };
        idlookup[`${t}_tgt`] = { id: `${t}_tgt`, instanceof: 'R_tgt', values: [b] };
    }
    const nodes: any[] = [
        { id: 'V1', type: 'objectNode', position: { x: 0, y: 0 }, measured: { width: 120, height: 48 }, data: {} },
        { id: 'V2', type: 'objectNode', position: { x: 400, y: 0 }, measured: { width: 120, height: 48 }, data: {} },
    ];
    const objByVertex = new Map([['V1', 's1'], ['V2', 's2']]);
    const vertexByObj = new Map([['s1', 'V1'], ['s2', 'V2']]);
    return { idlookup, nodes, objByVertex, vertexByObj };
}

function synth(view: EdgeViewIR, sig: string) {
    const { idlookup, nodes, objByVertex, vertexByObj } = turnstile();
    const state = { viewpoint: 'VP', viewelements: ['V_t'], idlookup: { ...idlookup, V_t: { id: 'V_t', viewpoint: 'VP', ir: view } } };
    const index = getIRIndex(state, sig)!;
    const walked = new Set(['t1', 't2', 't3']);
    const res = synthesizeObjectAsEdges(nodes, [], objByVertex, vertexByObj, index, makeDrawReadCtx(state.idlookup), state.idlookup, undefined, new Map(), walked);
    return Object.fromEntries(res.edges.map(e => [e.id, e]));
}

describe('irEdgeViews with an arc view', () => {
    it('writes irCurve on the edge data only when the view declares it', () => {
        clearCompileCache();
        const arc = synth(transition({ curve: 'arc' }), 'a1_sig_arc');
        expect(Object.values(arc).map(e => (e.data as any).irCurve)).toEqual(['arc', 'arc', 'arc']);
        const plain = synth(transition(), 'a1_sig_plain');
        expect(Object.values(plain).every(e => !('irCurve' in (e.data as any)))).toBe(true);
    });

    it('an arc self-loop takes two top handles, the ones its loop is drawn on (C3 causes 1 and 2)', () => {
        clearCompileCache();
        const arc = synth(transition({ curve: 'arc' }), 'a1_sig_loop');
        expect([arc.irobj_t3.sourceHandle, arc.irobj_t3.targetHandle]).toEqual(['top-0', 'top-0']);
        // The other two keep the dominant-axis sides, so the right side of s1 holds two ends, not three.
        expect([arc.irobj_t1.sourceHandle, arc.irobj_t1.targetHandle]).toEqual(['right-0', 'left-0']);
        expect([arc.irobj_t2.sourceHandle, arc.irobj_t2.targetHandle]).toEqual(['left-0', 'right-0']);
    });

    it('without the key a self-loop keeps today\'s right → left handles', () => {
        clearCompileCache();
        const plain = synth(transition(), 'a1_sig_loop_plain');
        expect([plain.irobj_t3.sourceHandle, plain.irobj_t3.targetHandle]).toEqual(['right-1', 'left-0']);
    });

    it('assignGeometricHandles reads the key from the edge data, so a lifted arc self-loop is treated alike', () => {
        const nodes = new Map<string, any>([['A', { id: 'A', position: { x: 0, y: 0 }, measured: { width: 100, height: 40 } }]]);
        const placed: any[] = [{ id: 'x', source: 'A', target: 'B', sourceHandle: 'top-0', targetHandle: 'left-0' }];
        const loop = { id: 'l', source: 'A', target: 'A', data: { irCurve: 'arc' } } as any;
        expect(assignGeometricHandles(loop, nodes, placed)).toMatchObject({ sourceHandle: 'top-1', targetHandle: 'top-0' });
        const plain = { id: 'p', source: 'A', target: 'A', data: {} } as any;
        expect(assignGeometricHandles(plain, nodes, placed)).toMatchObject({ sourceHandle: 'right-0', targetHandle: 'left-0' });
    });
});
