/**
 * Q3 (P-2026-10-03-1304, docs/lir/lir_2026-10-03_bar_orientation.md): a bar that declares a thickness paints its ink
 * turned inside its square box, and its handles sit on the ink's long sides.
 *
 * ── IRNodeContent, rendered ───────────────────────────────────────────────────
 * The bench of irA1Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the canvas write-back
 * mocked). The ink is `.ir-node-content` itself, so the selection ring and the run's outline, drawn on that element,
 * follow it. «Absent» is measured against `4bd9aa66f`: the digest of a bar without a thickness was taken there,
 * before any edit of IRNodeContent, so a saved bar renders the bytes it rendered, with or without an orientation.
 *
 * ── DynamicHandles, by its pure placement ─────────────────────────────────────
 * The handle pool does not render here (React Flow's node context); its two decisions for a turned bar are
 * exported and checked on numbers: where a handle sits, and which side the pointer hovers.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';

const state: { idlookup: Record<string, any> } = { idlookup: {} };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncSetReferenceValue: () => {},
    syncEdgeRefProperty: () => {},
}));
vi.mock('../irResolve', () => ({ useIRRowView: () => null }));

import IRNodeContent from '../IRNodeContent';
import { barHandlePlacement, barHoverSide } from '../../../components/DynamicHandles';
import { clearCompileCache, compileView } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import type { VertexViewIR } from '../irTypes';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const INK = 'var(--color-inode-name)';

function renderBar(thickness: number | undefined, barOrientation?: 'upright' | 'lying'): string {
    clearCompileCache();
    state.idlookup = {
        cls_T: { id: 'cls_T', className: 'DClass', name: 'Transition', extends: [] },
        t1: { id: 't1', className: 'DObject', instanceof: 'cls_T', name: 't1', features: [] },
    };
    const ir: VertexViewIR = {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Transition'],
        shape: {
            form: 'bar', fill: INK, border: { color: INK, width: 1, style: 'solid' },
            labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' } }],
            ...(thickness !== undefined ? { barThickness: thickness } : {}),
        },
    };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, null, createElement(Provider, {
        store: reduxStore,
        children: createElement(IRNodeContent, {
            compiled: compileView('q3_bar', ir), objectId: 't1', vertexId: 'v_t1', readCtx: makeDrawReadCtx(state.idlookup),
            ...(barOrientation ? { barOrientation } : {}),
        } as any),
    })));
}
const rootOf = (html: string) => html.match(/^<div class="([^"]*)" style="([^"]*)"/);

describe('IRNodeContent: the ink of a bar with a thickness', () => {
    it('without a thickness: the bytes of before, an orientation passed or not', () => {
        const before = renderBar(undefined);
        expect(digest(before)).toBe('b3a66414b90de0cd');
        expect(renderBar(undefined, 'lying')).toBe(before);
        expect(before).not.toContain('ir-bar-ink');
    });

    it('upright: the ink is .ir-node-content, 12 px wide and the box high, centred across', () => {
        const root = rootOf(renderBar(12, 'upright'))!;
        expect(root[1]).toBe('ir-node-content ir-shape--bar ir-bar-ink');
        expect(root[2]).toContain('position:absolute;left:calc(50% - 6px);top:0;width:12px;height:100%');
    });

    it('lying: 12 px high and the box wide, centred along', () => {
        const root = rootOf(renderBar(12, 'lying'))!;
        expect(root[1]).toBe('ir-node-content ir-shape--bar ir-bar-ink');
        expect(root[2]).toContain('position:absolute;top:calc(50% - 6px);left:0;width:100%;height:12px');
    });

    it('a thickness and no orientation yet: upright', () => {
        expect(rootOf(renderBar(7))![2]).toContain('left:calc(50% - 3.5px);top:0;width:7px;height:100%');
    });
});

describe('DynamicHandles: a handle of a turned bar', () => {
    const upright = { orientation: 'upright' as const, thickness: 12 };
    const lying = { orientation: 'lying' as const, thickness: 7 };
    it('on a long side: along the side as before, pulled in onto the ink', () => {
        expect(barHandlePlacement('left', 0.25, upright)).toEqual({ top: '25%', left: 'calc(50% - 6px)' });
        expect(barHandlePlacement('right', 0.5, upright)).toEqual({ top: '50%', right: 'calc(50% - 6px)' });
        expect(barHandlePlacement('bottom', 0.75, lying)).toEqual({ left: '75%', bottom: 'calc(50% - 3.5px)' });
    });
    it('on a short side (an anchor the user pinned there): on the box edge, squeezed onto the ink across', () => {
        expect(barHandlePlacement('top', 0.75, upright)).toEqual({ left: 'calc(50% + 3px)', top: '0%' });
        expect(barHandlePlacement('left', 0.5, lying)).toEqual({ top: 'calc(50% + 0px)', left: '0%' });
    });
});

describe('DynamicHandles: the hovered side of a turned bar is a long side', () => {
    it('upright: left or right of the ink, whatever the height; lying: top or bottom', () => {
        // The pointer 2 px below the top of an upright ink 12 x 56: the top is nearer, the long side wins.
        expect(barHoverSide(4, 2, 12, 56, 'upright', 15)).toBe('left');
        expect(barHoverSide(9, 54, 12, 56, 'upright', 15)).toBe('right');
        expect(barHoverSide(2, 3, 120, 7, 'lying', 15)).toBe('top');
        expect(barHoverSide(118, 5, 120, 7, 'lying', 15)).toBe('bottom');
        // Past the threshold of both long sides: none.
        expect(barHoverSide(30, 20, 60, 56, 'upright', 15)).toBeNull();
    });
});
