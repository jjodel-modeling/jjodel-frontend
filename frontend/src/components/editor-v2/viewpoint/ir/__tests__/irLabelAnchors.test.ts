/**
 * An outside label takes a side no edge end uses (P-2026-10-03-1920, item 2, A2 amending R-VP-53;
 * docs/discovery/discovery_2026-10-03_petri_ink_ports.md §3.2, docs/lir/lir_2026-10-03_petri_ink_ports.md).
 *
 * - `outsideAnchorFor(declared, ends)`: the declared side when no end holds it, else the opposite, else the two others
 *   (e then w for n and s, s then n for e and w); with none free, the one of those holding the fewest ends.
 * - The synthesis writes the moves on the vertex's node data (`irLabelAnchors`, declared to chosen), only for a moved
 *   label, and drops a map no longer needed.
 */
import { describe, expect, it } from 'vitest';
import { clearCompileCache } from '../irCompile';
import { synthesizeObjectAsEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { resetBarOrientations } from '../barOrientation';
import { makeDrawReadCtx } from '../irReadCtx';
import type { EdgeViewIR, VertexViewIR } from '../irTypes';
import { outsideAnchorFor } from '../../../utils/elkLayout';

describe('outsideAnchorFor: the declared side, else a free one, else the least used', () => {
    it('free: the declared side (mutation: always the opposite)', () => {
        for (const a of ['n', 's', 'e', 'w'] as const) expect(outsideAnchorFor(a, {}), a).toBe(a);
        expect(outsideAnchorFor('s', { top: 1, right: 2 })).toBe('s');
    });

    it('held: the opposite first, then the two others in order (mutation: the order of the fallbacks)', () => {
        expect(outsideAnchorFor('s', { bottom: 1 })).toBe('n');
        expect(outsideAnchorFor('n', { top: 1 })).toBe('s');
        expect(outsideAnchorFor('s', { bottom: 1, top: 1 })).toBe('e');
        expect(outsideAnchorFor('s', { bottom: 1, top: 1, right: 1 })).toBe('w');
        expect(outsideAnchorFor('e', { right: 1 })).toBe('w');
        expect(outsideAnchorFor('w', { left: 2, right: 1 })).toBe('s');
        expect(outsideAnchorFor('e', { right: 1, left: 1, bottom: 1 })).toBe('n');
    });

    it('all four held: the least used, the order breaking a tie (mutation: the declared kept)', () => {
        expect(outsideAnchorFor('s', { bottom: 2, top: 1, right: 1, left: 1 })).toBe('n');
        expect(outsideAnchorFor('s', { bottom: 2, top: 2, right: 3, left: 1 })).toBe('w');
        expect(outsideAnchorFor('s', { bottom: 1, top: 1, right: 1, left: 1 })).toBe('s');
    });
});

describe('the synthesis moves a vertex\'s outside label off the sides its ends take', () => {
    const placeView: VertexViewIR = {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Place'],
        shape: { form: 'circle', labels: [{ position: 'outside', anchor: 's', source: { from: 'intrinsic', prop: 'name' } }] },
    };
    const plainView: VertexViewIR = { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Plain'], shape: { form: 'circle', labels: [] } };
    const arcView: EdgeViewIR = { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Arc'], edge: { source: '$src.value', target: '$tgt.value' } };

    /** p1 above p2 (an arc p1 -> p2 leaves p1's bottom, enters p2's top); q, a plain circle, below p2 (an arc p2 -> q). */
    function run(sig: string, opt: { p1Y?: number; p1Data?: Record<string, unknown> } = {}) {
        resetBarOrientations(sig);
        clearCompileCache();
        const idlookup: Record<string, any> = {
            C_Place: { id: 'C_Place', name: 'Place', extends: [] },
            C_Plain: { id: 'C_Plain', name: 'Plain', extends: [] },
            C_Arc: { id: 'C_Arc', name: 'Arc', extends: [] },
            R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
            R_tgt: { id: 'R_tgt', name: 'tgt', className: 'DReference', composition: false },
            p1: { id: 'p1', name: 'p1', instanceof: 'C_Place', features: [] },
            p2: { id: 'p2', name: 'p2', instanceof: 'C_Place', features: [] },
            q: { id: 'q', name: 'q', instanceof: 'C_Plain', features: [] },
        };
        for (const [a, s, t] of [['a1', 'p1', 'p2'], ['a2', 'p2', 'q']]) {
            idlookup[a] = { id: a, name: a, instanceof: 'C_Arc', features: [`${a}_src`, `${a}_tgt`] };
            idlookup[`${a}_src`] = { id: `${a}_src`, instanceof: 'R_src', values: [s] };
            idlookup[`${a}_tgt`] = { id: `${a}_tgt`, instanceof: 'R_tgt', values: [t] };
        }
        const state = {
            viewpoint: 'VP', viewelements: ['V_arc', 'V_place', 'V_plain'],
            idlookup: { ...idlookup, V_arc: { id: 'V_arc', viewpoint: 'VP', ir: arcView }, V_place: { id: 'V_place', viewpoint: 'VP', ir: placeView }, V_plain: { id: 'V_plain', viewpoint: 'VP', ir: plainView } },
        };
        const node = (id: string, y: number, data: Record<string, unknown> = {}) => ({ id, type: 'objectNode', position: { x: 0, y }, measured: { width: 44, height: 44 }, data });
        const nodes: any[] = [node('V1', opt.p1Y ?? 0, opt.p1Data), node('V2', 300), node('VQ', 600)];
        const index = getIRIndex(state, sig)!;
        const res = synthesizeObjectAsEdges(nodes, [], new Map([['V1', 'p1'], ['V2', 'p2'], ['VQ', 'q']]), new Map([['p1', 'V1'], ['p2', 'V2'], ['q', 'VQ']]),
            index, makeDrawReadCtx(state.idlookup), state.idlookup, undefined, new Map(), new Set(['a1', 'a2']));
        return Object.fromEntries(res.nodes.map(n => [n.id, n]));
    }

    it('p1\'s name below, where its arc leaves: moved above (mutation: the ends not read)', () => {
        expect((run('lab_1').V1.data as any).irLabelAnchors).toEqual({ s: 'n' });
    });

    it('p2, an end above and one below: the name to the east (mutation: only the first end read)', () => {
        expect((run('lab_2').V2.data as any).irLabelAnchors).toEqual({ s: 'e' });
    });

    it('a vertex with no outside label carries no key, whatever its ends (mutation: every vertex written)', () => {
        expect('irLabelAnchors' in ((run('lab_3').VQ.data ?? {}) as any)).toBe(false);
    });

    it('a label whose side is free carries no key, and a map left from before is dropped (mutation: a stale map kept)', () => {
        // p1 moved below p2 (y 450): its arc now leaves its top, its name below is free again.
        const n = run('lab_4', { p1Y: 450, p1Data: { irLabelAnchors: { s: 'n' }, keep: 1 } }).V1;
        expect('irLabelAnchors' in (n.data as any)).toBe(false);
        expect((n.data as any).keep).toBe(1);
    });
});
