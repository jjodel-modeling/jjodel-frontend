/**
 * The collapsed graphVertex renders what its view declares (F3, P-2026-09-29-2122).
 *
 * `containment.collapsed.form`, `.fill` and `.badge` are compiled (irCompile.ts) and,
 * before F3, read nowhere: a collapsed container kept its expanded form, its expanded
 * fill and the count chip, and the declared badge never appeared (discovery
 * 2026-09-29 ir_authoring_freeze, point 2).
 *
 * ── The subject is ObjectNode, rendered ─────────────────────────────────────
 * The chip lives in ObjectNode and the form, fill and badge in IRNodeContent, so the
 * test renders ObjectNode on its IR branch, the path the canvas takes (P11). Same bench
 * as `widgets/__tests__/extendedWidgets.test.ts`: `renderToStaticMarkup` in node with
 * `createElement`, so the file stays a `.ts`. The joiner barrel is mocked because it
 * pulls Monaco at import («window is not defined»); `useIRView` is mocked to hand the
 * node a view compiled by the real `compileView`, read through the real draw ReadCtx.
 * The collapse state is the real module singleton, reset in `beforeEach`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

/** B contains four C through a composition reference, as in the discovery's fixture. */
function fixture(childCount = 4): Record<string, any> {
    const children = ['objC1', 'objC2', 'objC3', 'objC4'].slice(0, childCount);
    const lookup: Record<string, any> = {
        cls_B: { id: 'cls_B', className: 'DClass', name: 'B' },
        cls_C: { id: 'cls_C', className: 'DClass', name: 'C' },
        ref_items: { id: 'ref_items', className: 'DReference', name: 'items', composition: true, type: 'cls_C' },
        val_items: { id: 'val_items', className: 'DValue', instanceof: 'ref_items', values: children },
        objB: { id: 'objB', className: 'DObject', instanceof: 'cls_B', name: 'b1', features: ['val_items'] },
        v_B: { id: 'v_B', className: 'DVertex', model: 'objB' },
    };
    for (const c of children) lookup[c] = { id: c, className: 'DObject', instanceof: 'cls_C', name: c, features: [] };
    return lookup;
}

function graphVertexIR(
    collapsed?: GraphVertexViewIR['containment']['collapsed'],
    collapsible = true,
): GraphVertexViewIR {
    return {
        irVersion: '1.2',
        kind: 'graphVertex',
        metaclasses: ['B'],
        shape: {
            form: 'rounded',
            fill: '#ffffff',
            labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' } }],
        },
        containment: { collapsible, ...(collapsed ? { collapsed } : {}) },
    };
}

const DECLARED = {
    form: 'cylinder' as const,
    fill: '#e2e8f0',
    badge: { icon: 'bi-box-seam', position: 'tr' as const, visible: true },
};

function render(ir: GraphVertexViewIR, childCount = 4): string {
    state.idlookup = fixture(childCount);
    resolution.current = {
        compiled: compileView('vp_B', ir),
        objectId: 'objB',
        readCtx: makeDrawReadCtx(state.idlookup),
    };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const props = {
        id: 'v_B',
        data: { label: 'b1', instanceOfClassId: 'cls_B', features: [] },
        selected: false,
    } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(ReactFlowProvider, { children: createElement(ObjectNode, props) }),
    }));
}

/** The class list of the node wrapper, where ObjectNode's own reading of the form shows. */
function wrapperClass(html: string): string {
    return html.match(/class="(mm-node mm-object[^"]*)"/)?.[1] ?? '';
}
/** The class list of the node content, the element that paints the form. */
function contentClass(html: string): string {
    return html.match(/class="(ir-node-content[^"]*)"/)?.[1] ?? '';
}
function contentStyle(html: string): string {
    return html.match(/class="ir-node-content[^"]*"[^>]*style="([^"]*)"/)?.[1] ?? '';
}
/** Inner markup of the collapse chip: its icon and, when shown, the count. */
function chip(html: string): string | null {
    return html.match(/<button[^>]*class="ir-collapse-chip"[^>]*>(.*?)<\/button>/)?.[1] ?? null;
}

beforeEach(() => {
    if (isCollapsed('objB')) toggleCollapsed('objB');
});

describe('collapsed graphVertex, declared collapsed appearance', () => {
    it('collapsed: the declared form, fill and badge replace the expanded ones and the count', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR(DECLARED));
        expect(contentClass(html)).toContain('ir-shape--cylinder');
        expect(contentClass(html)).not.toContain('ir-shape--rounded');
        // ObjectNode reads the same form for resizer and handles: cylinder is resizable, rounded is not
        expect(wrapperClass(html)).toContain('ir-resizable');
        // cylinder is painted by the SVG layer, so the fill goes on its outline
        expect(html).toMatch(/<path[^>]*fill="#e2e8f0"/);
        expect(html).toContain('<span class="ir-badge ir-badge--tr"><i class="bi bi-box-seam"></i></span>');
        // the chip stays as the expand toggle, without the count
        expect(chip(html)).toBe('<i class="bi bi-chevron-expand"></i>');
    });

    it('expanded: the declared collapsed appearance is not painted', () => {
        const html = render(graphVertexIR(DECLARED));
        expect(contentClass(html)).toContain('ir-shape--rounded');
        expect(wrapperClass(html)).not.toContain('ir-resizable');
        expect(contentStyle(html)).toContain('background:#ffffff');
        expect(html).not.toContain('bi-box-seam');
        expect(chip(html)).toBe('<i class="bi bi-chevron-contract"></i>');
    });

    it('collapsed without `collapsed`: unchanged, the expanded form and fill and the count chip', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR());
        expect(contentClass(html)).toContain('ir-shape--rounded');
        expect(contentStyle(html)).toContain('background:#ffffff');
        expect(html).not.toContain('ir-badge');
        expect(chip(html)).toBe('<i class="bi bi-chevron-expand"></i>4');
    });

    it('collapsed with only a fill: the form falls back to the expanded one', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR({ fill: '#e2e8f0' }));
        expect(contentClass(html)).toContain('ir-shape--rounded');
        expect(contentStyle(html)).toContain('background:#e2e8f0');
        expect(chip(html)).toBe('<i class="bi bi-chevron-expand"></i>4');
    });

    it('collapsed with only a form: the fill falls back to the expanded one', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR({ form: 'ellipse' }));
        expect(contentClass(html)).toContain('ir-shape--ellipse');
        expect(contentStyle(html)).toContain('background:#ffffff');
    });

    it('collapsed with a badge declared invisible: the count chip stays', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR({ badge: { ...DECLARED.badge, visible: false } }));
        expect(html).not.toContain('bi-box-seam');
        expect(chip(html)).toBe('<i class="bi bi-chevron-expand"></i>4');
    });

    it('collapsed with a fill conditional that matches nothing: the expanded fill', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR({ fill: { when: { op: 'isKind', class: 'Nope' }, then: '#e2e8f0' } }));
        expect(contentStyle(html)).toContain('background:#ffffff');
    });

    it('in the collapsed set with no children: no chip, and the expanded look', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR(DECLARED), 0);
        expect(chip(html)).toBeNull();
        expect(contentClass(html)).toContain('ir-shape--rounded');
        expect(html).not.toContain('bi-box-seam');
    });

    it('in the collapsed set but not collapsible: no chip, and the expanded look', () => {
        toggleCollapsed('objB');
        const html = render(graphVertexIR(DECLARED, false));
        expect(chip(html)).toBeNull();
        expect(contentClass(html)).toContain('ir-shape--rounded');
        expect(html).not.toContain('bi-box-seam');
    });

    it('collapsed with a badge whose icon resolves empty: no badge, the count chip stays', () => {
        toggleCollapsed('objB');
        const icon = { when: { op: 'isKind' as const, class: 'Nope' }, then: 'bi-box-seam' };
        const html = render(graphVertexIR({ badge: { ...DECLARED.badge, icon } }));
        expect(html).not.toContain('ir-badge');
        expect(chip(html)).toBe('<i class="bi bi-chevron-expand"></i>4');
    });
});
