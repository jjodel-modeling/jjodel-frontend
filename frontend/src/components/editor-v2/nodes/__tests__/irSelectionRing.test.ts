/**
 * The selection ring of an IR-rendered node paints (P-2026-09-30-1808).
 *
 * The ring and band of a selected IR node live on the shape, `.ir-node-content`
 * (irStyle.ts), 0 to 5 px outside its box. The shape fills the node wrapper, the
 * instance card's `.mm-node.mm-object`, whose `overflow: hidden` (instanceNode.scss)
 * clipped every ring pixel: the computed style carried the ring, the screen did not
 * (discovery 2026-09-30 selection_outline, §0).
 *
 * ── The subject is the pixel ─────────────────────────────────────────────────
 * Same bench as `irCollapsedRender.test.ts`: ObjectNode rendered to markup on its IR
 * branch, the joiner barrel mocked («window is not defined»). The style sheets are the
 * real ones, compiled by `sass` (EditorV2.scss, instanceNode.scss, the light tokens)
 * plus the CSS irStyle.ts injects, and headless Chromium lays the node out. What is
 * read is the colour 4 px outside the shape's top edge, where the ring stands, and the
 * node's box: never the style sheet.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';
import { chromium, type Browser } from '@playwright/test';
import { compile } from 'sass';
import { resolve } from 'node:path';

const state: { idlookup: Record<string, any> } = { idlookup: {} };

vi.mock('../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncIRCollapsedToJjom: () => {},
    syncSetReferenceValue: () => {},
}));
vi.mock('../../hooks/useLayoutAutosave', () => ({
    useLayoutAutosave: () => ({ scheduleLayoutSave: () => {} }),
}));
vi.mock('../../viewpoint/ir/irDemoFixture', () => ({}));

const resolution: { current: any } = { current: null };
vi.mock('../../viewpoint/ir/irResolve', () => ({
    useIRView: () => resolution.current,
    useIRViewpointActive: () => true,
    useIRRowView: () => null,
}));

import ObjectNode from '../ObjectNode';
import { compileView } from '../../viewpoint/ir/irCompile';
import { makeDrawReadCtx } from '../../viewpoint/ir/irReadCtx';
import { ensureViewCss } from '../../viewpoint/ir/irStyle';
import type { NodeViewIR, VertexViewIR } from '../../viewpoint/ir/irTypes';

const LOOKUP: Record<string, any> = {
    cls_A: { id: 'cls_A', className: 'DClass', name: 'Activity' },
    objA: { id: 'objA', className: 'DObject', instanceof: 'cls_A', name: 'work', features: [] },
    v_A: { id: 'v_A', className: 'DVertex', model: 'objA' },
};

function vertexIR(form: 'rounded' | 'rect'): VertexViewIR {
    return {
        irVersion: '1.2', kind: 'vertex', metaclasses: ['Activity'],
        shape: { form, labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' } }] },
    };
}

/** ObjectNode's markup: on its IR branch when `ir` is given, on the native card otherwise. */
function render(ir: NodeViewIR | null, selected: boolean): string {
    state.idlookup = LOOKUP;
    resolution.current = ir
        ? { compiled: compileView('vp_A', ir), objectId: 'objA', readCtx: makeDrawReadCtx(state.idlookup) }
        : null;
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const props = {
        id: 'v_A',
        data: { label: 'work', instanceOfClassId: 'cls_A', className: 'Activity', features: [] },
        selected,
    } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(ReactFlowProvider, { children: createElement(ObjectNode, props) }),
    }));
}

/** The CSS irStyle.ts injects, read through a stand-in `document` (as irCollapsedRender.test.ts). */
function injectedCss(): string {
    const texts: string[] = [];
    const g = globalThis as { document?: unknown };
    const saved = g.document;
    g.document = {
        getElementById: () => null,
        createElement: () => ({ appendChild: (n: { data: string }) => { texts.push(n.data); return n; } }),
        createTextNode: (data: string) => ({ data, remove() { /* stand-in */ } }),
        head: { appendChild: () => undefined },
    };
    try {
        ensureViewCss(`p1808-css-${Date.now()}`, {} as NodeViewIR);
    } finally {
        if (saved === undefined) delete g.document; else g.document = saved;
    }
    return texts[0];
}

/** The real style sheets, in the order the app loads them: xyflow, tokens, editor, instance card, IR. */
function styleSheets(): string {
    const here = (p: string) => resolve(__dirname, p);
    const opts = { silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls'] as any[], logger: { warn: () => {}, debug: () => {} } };
    return [
        compile(here('../../../../../node_modules/@xyflow/react/dist/style.css'), opts).css,
        compile(here('../../../../styles/tokens/_colors-light.scss'), opts).css,
        compile(here('../../EditorV2.scss'), opts).css,
        compile(here('../instanceNode.scss'), opts).css,
        injectedCss(),
    ].join('\n');
}

const CANVAS = [241, 245, 249]; // --canvas-bg, light (_themes.scss)

describe('the selection ring of a node on the canvas (laid out in Chromium)', () => {
    let browser: Browser;
    let css = '';
    beforeAll(async () => {
        browser = await chromium.launch();
        css = styleSheets();
    });
    afterAll(async () => { await browser?.close(); });

    /**
     * The node laid out inside a light editor: its box, the painted element's box, and the
     * colour at each point, given as [fraction of the shape's width, css px from its top edge
     * (negative is above), css px added to x]. Default: 4 px above the top edge at 30 % of the width.
     */
    async function paint(html: string, points: Array<[number, number, number?]> = [[0.3, -4]]) {
        const page = await browser.newPage();
        try {
            await page.setContent(`<html data-theme="light"><head><style>${css}</style></head><body style="margin:0">`
                + `<div class="editor-v2 theme-light" style="position:relative;width:480px;height:240px">`
                + `<div class="react-flow__node" style="position:absolute;left:120px;top:80px">${html}</div></div></body></html>`);
            const geo = await page.evaluate(() => {
                const card = document.querySelector('.react-flow__node > .mm-node') as HTMLElement;
                const shape = (card.querySelector(':scope > .ir-node-content') as HTMLElement | null) ?? card;
                const r = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
                return { node: r(document.querySelector('.react-flow__node')!), shape: r(shape) };
            });
            const rgbs: number[][] = [];
            for (const [fx, dy, dx = 0] of points) {
                const x = Math.floor(geo.shape.x + geo.shape.w * fx) + dx;
                const y = Math.floor(geo.shape.y) + dy;
                const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
                rgbs.push(await page.evaluate(async (src: string) => {
                    const im = new Image();
                    im.src = src;
                    await im.decode();
                    const c = document.createElement('canvas');
                    c.width = 1; c.height = 1;
                    const g = c.getContext('2d')!;
                    g.drawImage(im, 0, 0);
                    return Array.from(g.getImageData(0, 0, 1, 1).data.slice(0, 3));
                }, `data:image/png;base64,${png.toString('base64')}`));
            }
            return { ...geo, rgb: rgbs[0], rgbs };
        } finally {
            await page.close();
        }
    }

    it('a selected IR node (rounded) paints the ring 4 px outside its shape', async () => {
        const { rgb } = await paint(render(vertexIR('rounded'), true));
        expect(rgb).not.toEqual(CANVAS);
        // --node-selection-stroke, rgba(56, 189, 248, 0.55) over the canvas: a sky blue, blue channel on top
        expect(rgb[2] - rgb[0], `rgb ${rgb}`).toBeGreaterThan(60);
    });

    it('a selected IR node (rect) paints the ring too', async () => {
        const { rgb } = await paint(render(vertexIR('rect'), true));
        expect(rgb[2] - rgb[0], `rgb ${rgb}`).toBeGreaterThan(60);
    });

    it('an unselected IR node paints nothing outside its shape', async () => {
        const { rgb } = await paint(render(vertexIR('rounded'), false));
        expect(rgb).toEqual(CANVAS);
    });

    it('selecting an IR node moves neither the node box nor the shape box', async () => {
        const idle = await paint(render(vertexIR('rounded'), false));
        const selected = await paint(render(vertexIR('rounded'), true));
        expect(selected.node).toEqual(idle.node);
        expect(selected.shape).toEqual(idle.shape);
    });

    it('control, a selected native object card: its own cyan band, and the box unmoved', async () => {
        const html = render(null, true);
        expect(html).not.toContain('ir-node-content');
        // --color-inode-selected-ring, rgba(6, 182, 212, 0.18), spread 3 px on the card itself
        expect(html).toContain('mm-object__header');
        const selected = await paint(html, [[0.3, -2], [0.3, -5], [0, 1, 1]]);
        const [band, beyond, corner] = selected.rgbs;
        expect(band, `rgb ${band}`).not.toEqual(CANVAS);
        expect(band[0], `rgb ${band}`).toBeLessThan(CANVAS[0]);
        // beyond the band, nothing: the card has no outline (instanceNode.scss, the cyan rule)
        expect(beyond).toEqual(CANVAS);
        // the card still clips its content to its 8 px radius: the pixel at (1, 1), inside the
        // border's box but outside its arc, shows the band and not the header's selected background
        expect(corner, `rgb ${corner}`).toEqual(band);
        expect(selected.node).toEqual((await paint(render(null, false))).node);
    });
});
