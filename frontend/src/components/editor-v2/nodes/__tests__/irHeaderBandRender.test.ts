/**
 * The header band of a graphVertex and its `header` label (R-GV-5, spec addendum 2026-10-10 §2.3), and the collapse
 * chip counting a declared children channel (R-GV-1), rendered (P-2026-10-10-0105 S2).
 *
 * Same bench as irCollapsedRender.test.ts: ObjectNode on its IR branch through `renderToStaticMarkup`, the joiner
 * barrel mocked (Monaco at import), `useIRView` handing the node a view compiled by the real `compileView`, read through
 * the real draw ReadCtx.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';

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
import { isCollapsed, toggleCollapsed } from '../../viewpoint/ir/irCollapseState';
import type { GraphVertexViewIR } from '../../viewpoint/ir/irTypes';

/** A lane `L` with four composition children and two of them listed in a plain reference, `refs`. */
function fixture(): Record<string, any> {
    const children = ['c1', 'c2', 'c3', 'c4'];
    const lookup: Record<string, any> = {
        cls_L: { id: 'cls_L', className: 'DClass', name: 'Lane' },
        cls_C: { id: 'cls_C', className: 'DClass', name: 'C' },
        ref_items: { id: 'ref_items', className: 'DReference', name: 'items', composition: true, type: 'cls_C' },
        ref_refs: { id: 'ref_refs', className: 'DReference', name: 'refs', composition: false, type: 'cls_C' },
        val_items: { id: 'val_items', className: 'DValue', instanceof: 'ref_items', values: children },
        val_refs: { id: 'val_refs', className: 'DValue', instanceof: 'ref_refs', values: ['c1', 'c3'] },
        objL: { id: 'objL', className: 'DObject', instanceof: 'cls_L', name: 'Sales', features: ['val_items', 'val_refs'] },
        v_L: { id: 'v_L', className: 'DVertex', model: 'objL' },
    };
    for (const c of children) lookup[c] = { id: c, className: 'DObject', instanceof: 'cls_C', name: c, features: [] };
    return lookup;
}

const name = { from: 'intrinsic', prop: 'name' } as const;
function laneIR(over: Partial<GraphVertexViewIR> = {}, containment: Partial<GraphVertexViewIR['containment']> = {}): GraphVertexViewIR {
    return {
        irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Lane'],
        shape: { form: 'rect', fill: '#ffffff', labels: [{ position: 'header', orientation: 'vertical', source: name }] },
        containment: { collapsible: false, layout: { mode: 'free', header: { side: 'w', size: 30 } }, ...containment },
        ...over,
    };
}

function render(ir: GraphVertexViewIR): string {
    state.idlookup = fixture();
    resolution.current = { compiled: compileView(`vp_L_${JSON.stringify(ir).length}_${Math.random()}`, ir), objectId: 'objL', readCtx: makeDrawReadCtx(state.idlookup) };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const props = { id: 'v_L', data: { label: 'Sales', instanceOfClassId: 'cls_L', features: [] }, selected: false } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(ReactFlowProvider, { children: createElement(ObjectNode, props) }),
    }));
}
const contentClass = (html: string) => html.match(/class="(ir-node-content[^"]*)"/)?.[1] ?? '';
const band = (html: string) => html.match(/<div class="(ir-header-band[^"]*)" style="([^"]*)">(.*?)<\/div>/);
const chip = (html: string) => html.match(/<button[^>]*class="ir-collapse-chip"[^>]*>(.*?)<\/button>/)?.[1] ?? null;

describe('header band (R-GV-5)', () => {
    it('draws the band on the left, 30 px, with the name vertical inside it, and marks the frame', () => {
        const html = render(laneIR());
        const b = band(html);
        expect(b?.[1]).toBe('ir-header-band ir-header-band--w');
        expect(b?.[2]).toBe('width:30px');
        expect(b?.[3]).toBe('<span class="ir-label ir-label--header ir-label--vertical">Sales</span>');
        expect(contentClass(html)).toContain('ir-layout');
        // The header label is drawn once, in the band: no copy in the flow of the box.
        expect(html.match(/>Sales</g)?.length).toBe(1);
        expect(html).not.toContain('ir-label--top');
    });
    it('a band on top takes the height, and its rule line the authored border colour', () => {
        const html = render(laneIR({ shape: { form: 'rect', border: { color: '#334155' }, labels: [{ position: 'header', source: name }] } },
            { layout: { mode: 'free', header: { side: 'n', size: 24 } } }));
        const b = band(html);
        expect(b?.[1]).toBe('ir-header-band ir-header-band--n');
        expect(b?.[2]).toBe('height:24px;border-color:#334155');
        expect(b?.[3]).toBe('<span class="ir-label ir-label--header">Sales</span>');
    });
    it('a header label with no band is drawn as a top label', () => {
        const html = render(laneIR({}, { layout: undefined }));
        expect(band(html)).toBeNull();
        expect(html).toContain('<span class="ir-label ir-label--top">Sales</span>');
        expect(contentClass(html)).not.toContain('ir-layout');
    });
    it('a container that declares a layout without a band is a frame with its labels where they were', () => {
        const html = render(laneIR({ shape: { form: 'rect', labels: [{ position: 'center', source: name }] } }, { layout: { mode: 'partitions' } }));
        expect(band(html)).toBeNull();
        expect(contentClass(html)).toContain('ir-layout');
        expect(html).toContain('<span class="ir-label ir-label--center">Sales</span>');
    });
});

describe('collapse chip on a declared channel (R-GV-1)', () => {
    it('counts the objects the channel yields, not the composition children', () => {
        if (!isCollapsed('objL')) toggleCollapsed('objL');
        try {
            // Collapsed, the chip shows the count: two listed in `refs`, against the four composition children.
            expect(chip(render(laneIR({}, { collapsible: true, children: '$refs.values' })))).toBe('<i class="bi bi-chevron-expand"></i>2');
            expect(chip(render(laneIR({}, { collapsible: true })))).toBe('<i class="bi bi-chevron-expand"></i>4');
            // An empty channel shows no chip although the lane has four composition children.
            expect(chip(render(laneIR({}, { collapsible: true, children: '$nothing.values' })))).toBeNull();
        } finally {
            if (isCollapsed('objL')) toggleCollapsed('objL');
        }
    });
});
